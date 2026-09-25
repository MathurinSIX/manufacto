"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getAllActivitiesWithSessions,
  addUserToSession,
  removeUserFromSession,
  moveRegistrationToSession,
  getAllUsers,
  updateSession,
  deleteSession,
  deleteSessions,
} from "@/app/admin/actions";
import { Loader2, Plus, X, ChevronLeft, ChevronRight, Users, Pencil, Calendar, Trash2, Search } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getActivityColorClass } from "@/components/admin-week-calendar";
import {
  COURSE_DISCIPLINE_OPTIONS,
  inferPracticeDiscipline,
} from "@/lib/course-disciplines";
import {
  addParisCalendarDays,
  formatParisDate,
  formatParisTime,
  getParisHour,
  getParisWeekOffset,
  getParisWeekMonday,
  isSameParisDay,
  PARIS_TIMEZONE,
  parseParisDateTime,
} from "@/lib/paris-time";
import { cn } from "@/lib/utils";
import { AdminWeekNavigator } from "@/components/admin-week-navigator";
import { AdminWeekTimeGrid } from "@/components/admin-week-time-grid";
import type { AdminWeekCalendarSession } from "@/components/admin-week-calendar";
import { useAdminManualSessionCreate } from "@/components/admin-manual-session-create-dialog";
import {
  countRegistrationsOverlappingHour,
  getPracticeCapacitySummary,
  type PracticeReservationSlot,
} from "@/lib/practice-capacity";

const PRACTICE_ACTIVITY_FILTER_ALL = "__all__";

type RegistrationPresenceFilter = "all" | "with" | "without";

const REGISTRATION_PRESENCE_OPTIONS: {
  value: RegistrationPresenceFilter;
  label: string;
}[] = [
  { value: "all", label: "Tous les créneaux" },
  { value: "with", label: "Avec inscrits" },
  { value: "without", label: "Sans inscrits" },
];

function parseWeekOffsetParam(value: string | null): number {
  if (value === null || value.trim() === "") return 0;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseSelectedDateParam(value: string | null): string {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  return formatParisDate(new Date());
}

type User = {
  id: string;
  email?: string;
  credits?: number;
  user_metadata?: {
    first_name?: string;
    last_name?: string;
  };
};

type RegisteredUser = {
  registrationId: string;
  userId: string;
  email: string;
  name: string;
  reservedStartTs?: string | null;
  reservedEndTs?: string | null;
  participantCount?: number;
  companionFirstNames?: string[];
};

type PublicRegisteredUser = {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
  participantCount?: number;
  companionFirstNames?: string[];
};

type SessionWithUsers = {
  id: string;
  start_ts: string;
  end_ts: string;
  max_registrations: number | null;
  registeredUsers: RegisteredUser[];
  publicRegisteredUsers?: PublicRegisteredUser[];
  activity_id: string;
  activity_name: string;
  activity_type: string | null;
};

function getSessionParticipantTotal(session: SessionWithUsers) {
  const registeredTotal = (session.registeredUsers ?? []).reduce(
    (sum, user) => sum + (user.participantCount ?? 1),
    0,
  );
  const publicTotal = (session.publicRegisteredUsers ?? []).reduce(
    (sum, user) => sum + (user.participantCount ?? 1),
    0,
  );
  return registeredTotal + publicTotal;
}

function sessionHasRegistrations(session: SessionWithUsers) {
  return getSessionParticipantTotal(session) > 0;
}

function matchesRegistrationPresenceFilter(
  session: SessionWithUsers,
  filter: RegistrationPresenceFilter,
) {
  if (filter === "all") return true;
  const hasRegistrations = sessionHasRegistrations(session);
  return filter === "with" ? hasRegistrations : !hasRegistrations;
}

function toPracticeReservationSlots(
  users: RegisteredUser[],
): PracticeReservationSlot[] {
  return users.map((user) => ({
    reservedStartTs: user.reservedStartTs,
    reservedEndTs: user.reservedEndTs,
    participantCount: user.participantCount ?? 1,
  }));
}

function getEnrollmentRequiredCredits(
  nbCredits: number | null | undefined,
  startTs: string,
  endTs: string,
  isPracticeActivity: boolean,
): number {
  const normalizedCredits = Number(nbCredits ?? 0);
  if (!Number.isFinite(normalizedCredits) || normalizedCredits <= 0) {
    return 0;
  }

  if (!isPracticeActivity) {
    return normalizedCredits;
  }

  const durationHours =
    (new Date(endTs).getTime() - new Date(startTs).getTime()) / (60 * 60 * 1000);

  if (durationHours <= 0) {
    return 0;
  }

  return normalizedCredits * durationHours;
}

function normalizeSearchValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getUserSearchText(user: User): string {
  const firstName = user.user_metadata?.first_name ?? "";
  const lastName = user.user_metadata?.last_name ?? "";
  return `${firstName} ${lastName} ${getUserDisplayName(user)} ${user.email}`.trim();
}

function getUserDisplayName(user: User): string {
  const firstName = user.user_metadata?.first_name?.trim();
  const lastName = user.user_metadata?.last_name?.trim();

  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }

  return firstName || lastName || user.email;
}

function isSessionFinished(session: Pick<SessionWithUsers, "end_ts">): boolean {
  return new Date(session.end_ts).getTime() <= Date.now();
}

function canAdminAddUserToSession(
  session: SessionWithUsers,
  isPracticeView: boolean,
): boolean {
  if (isSessionFinished(session) && isSameParisDay(session.start_ts)) {
    return true;
  }

  if (session.max_registrations == null) {
    return true;
  }

  if (isPracticeView) {
    return !getPracticeSessionCapacity(session).areAllHoursFull;
  }

  return getSessionParticipantTotal(session) < session.max_registrations;
}

function getPracticeSessionCapacity(session: SessionWithUsers) {
  return getPracticeCapacitySummary(
    new Date(session.start_ts),
    new Date(session.end_ts),
    toPracticeReservationSlots(session.registeredUsers ?? []),
    session.max_registrations,
  );
}

type Activity = {
  id: string;
  name: string;
  nb_credits: number | null;
  type: string | null;
  discipline: string | null;
  square_product_id?: string | null;
  sessionsByDate: {
    date: string;
    sessions: SessionWithUsers[];
  }[];
};

interface WeekViewSessionsProps {
  sessionsByDate: Map<string, SessionWithUsers[]>;
  weekOffset: number;
  isPracticeView: boolean;
  onSessionClick: (session: SessionWithUsers) => void;
  onEditSession: (session: SessionWithUsers) => void;
  onDeleteSession: (session: SessionWithUsers) => void;
}

function WeekViewSessions({
  sessionsByDate,
  weekOffset,
  isPracticeView,
  onSessionClick,
  onEditSession,
  onDeleteSession,
}: WeekViewSessionsProps) {
  const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  
  const weekDays = useMemo(() => {
    const weekMonday = getParisWeekMonday(weekOffset);
    return Array.from({ length: 7 }, (_, index) =>
      addParisCalendarDays(weekMonday, index),
    );
  }, [weekOffset]);

  const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    timeZone: PARIS_TIMEZONE,
  });

  const timeFormatter = new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: PARIS_TIMEZONE,
  });

  const formatDayLabel = (dateKey: string) => {
    return dateFormatter.format(parseParisDateTime(dateKey, "12:00"));
  };

  const formatTime = (dateString: string) => {
    return timeFormatter.format(new Date(dateString));
  };

  return (
    <div className="border rounded-lg p-4 bg-background">
      <div className="grid grid-cols-7 gap-2 items-start">
        {WEEKDAY_LABELS.map((label, index) => {
          const dateKey = weekDays[index];
          const daySessions = sessionsByDate.get(dateKey) || [];
          const isToday = formatParisDate(new Date()) === dateKey;

          return (
            <div
              key={index}
              className={cn(
                "flex flex-col w-full rounded-md border p-2 text-sm transition-colors",
                isToday && "ring-2 ring-primary bg-primary/5",
                daySessions.length > 0 && "bg-primary/5 border-primary/20",
                daySessions.length === 0 && "bg-muted/30"
              )}
            >
              <div className="mb-2 border-b pb-1 flex-shrink-0">
                <p className="text-xs font-semibold text-muted-foreground uppercase">
                  {label}
                </p>
                <p className="text-sm font-medium">
                  {formatDayLabel(dateKey)}
                </p>
              </div>
              <div className="space-y-1 w-full">
                {daySessions.length > 0 ? (
                  daySessions.map((session) => {
                    const publicCount = session.publicRegisteredUsers?.length || 0;
                    const maxReg = session.max_registrations ?? null;
                    const practiceCapacity = isPracticeView
                      ? getPracticeSessionCapacity(session)
                      : null;
                    const registeredCount = isPracticeView
                      ? (practiceCapacity?.peakHourCount ?? 0) + publicCount
                      : getSessionParticipantTotal(session);
                    const isFull = isPracticeView
                      ? (practiceCapacity?.isAnyHourFull ?? false)
                      : maxReg !== null && registeredCount >= maxReg;
                    const available =
                      maxReg !== null && !isPracticeView
                        ? maxReg - registeredCount
                        : maxReg !== null && practiceCapacity
                          ? maxReg - practiceCapacity.peakHourCount
                          : null;

                    return (
                      <div
                        key={session.id}
                        className="text-xs bg-primary/20 text-primary-foreground rounded px-2 py-1.5 border border-primary/30 w-full cursor-pointer hover:bg-primary/30 transition-colors"
                        onClick={() => onSessionClick(session)}
                      >
                        <p className="font-medium">
                          {formatTime(session.start_ts)} - {formatTime(session.end_ts)}
                        </p>
                        <p className="text-[10px] font-semibold mt-0.5 truncate">
                          {session.activity_name}
                        </p>
                        <div className="flex items-center justify-between gap-1 mt-1.5">
                          <div className="flex items-center gap-1 min-w-0 flex-1">
                            <Users className="h-4 w-4 flex-shrink-0" />
                            <span className={`text-sm font-bold truncate ${isFull ? 'text-red-300' : ''}`}>
                              {registeredCount}
                              {maxReg !== null && `/${maxReg}${isPracticeView ? "/h" : ""}`}
                              {available !== null && available > 0 && !isFull && (
                                <span className="text-green-300"> ({available})</span>
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-0.5 flex-shrink-0">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-4 w-4 p-0 min-w-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditSession(session);
                              }}
                            >
                              <Pencil className="h-2 w-2" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-4 w-4 p-0 min-w-0 text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteSession(session);
                              }}
                            >
                              <Trash2 className="h-2 w-2" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-muted-foreground/50 italic">Aucune session</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface AdminActivitiesTabProps {
  activityTypes?: string[];
  title?: string;
  allowManualRepeat?: boolean;
  defaultActivityId?: string;
  onCopyWeeks?: (context: { weekOffset: number; activityId?: string }) => void;
  onSessionsCreated?: () => void;
}

const PRACTICE_ACTIVITY_TYPES = new Set([
  "autonomie",
  "autonomie_encadree",
  "accompagnement",
  "cuisson",
]);

export function AdminActivitiesTab({
  activityTypes,
  title = "Sessions",
  allowManualRepeat = false,
  defaultActivityId,
  onCopyWeeks,
  onSessionsCreated,
}: AdminActivitiesTabProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedDate, setSelectedDate] = useState(() =>
    parseSelectedDateParam(searchParams.get("selectedDate")),
  );
  const [selectedSession, setSelectedSession] = useState<SessionWithUsers | null>(null);
  const [usersDialogOpen, setUsersDialogOpen] = useState(false);
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [creditDeductionDialogOpen, setCreditDeductionDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [movingRegistrationId, setMovingRegistrationId] = useState<string | null>(null);
  const [moveTargetSessionId, setMoveTargetSessionId] = useState<string>("");
  const [moving, setMoving] = useState(false);
  const [addParticipantCount, setAddParticipantCount] = useState(1);
  const [addCompanionName, setAddCompanionName] = useState("");
  const [moveCompanionName, setMoveCompanionName] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editDate, setEditDate] = useState<string>("");
  const [editStartTime, setEditStartTime] = useState<string>("");
  const [editDuration, setEditDuration] = useState<string>("60"); // Duration in minutes
  const [editMaxRegistrations, setEditMaxRegistrations] = useState<string>("");
  
  // Helper functions to parse and format time for edit form
  const getTimeParts = (timeString: string) => {
    if (!timeString || !timeString.includes(':')) {
      return { hour: "00", minute: "00" };
    }
    const [hour, minute] = timeString.split(':');
    return { hour: hour || "00", minute: minute || "00" };
  };
  
  const setStartTimeFromParts = (hour: string, minute: string) => {
    setEditStartTime(`${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`);
  };
  const [viewMode, setViewMode] = useState<"day" | "week">("week");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedSessionIds, setSelectedSessionIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [weekOffset, setWeekOffset] = useState(() => {
    const fromUrl = searchParams.get("weekOffset");
    if (fromUrl !== null && fromUrl.trim() !== "") {
      return parseWeekOffsetParam(fromUrl);
    }
    const dateFromUrl = searchParams.get("selectedDate");
    if (dateFromUrl && /^\d{4}-\d{2}-\d{2}$/.test(dateFromUrl)) {
      return getParisWeekOffset(dateFromUrl);
    }
    return 0;
  });
  const [selectedPracticeActivityId, setSelectedPracticeActivityId] = useState(
    PRACTICE_ACTIVITY_FILTER_ALL,
  );
  const [registrationPresenceFilter, setRegistrationPresenceFilter] =
    useState<RegistrationPresenceFilter>("all");
  const isPracticeView = activityTypes?.some((type) =>
    PRACTICE_ACTIVITY_TYPES.has(type),
  ) ?? false;

  const syncCalendarToUrl = useCallback(
    (nextWeekOffset: number, nextSelectedDate: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (nextWeekOffset === 0) {
        params.delete("weekOffset");
      } else {
        params.set("weekOffset", String(nextWeekOffset));
      }
      if (nextSelectedDate === formatParisDate(new Date())) {
        params.delete("selectedDate");
      } else {
        params.set("selectedDate", nextSelectedDate);
      }
      setTimeout(() => {
        router.replace(`/admin?${params.toString()}`, { scroll: false });
      }, 0);
    },
    [router, searchParams],
  );

  const handleWeekOffsetChange = useCallback(
    (nextOffset: number) => {
      setWeekOffset(nextOffset);
      setSelectedSessionIds(new Set());
      const weekMonday = getParisWeekMonday(nextOffset);
      const weekSunday = addParisCalendarDays(weekMonday, 6);
      const nextSelectedDate =
        selectedDate >= weekMonday && selectedDate <= weekSunday
          ? selectedDate
          : weekMonday;
      setSelectedDate(nextSelectedDate);
      syncCalendarToUrl(nextOffset, nextSelectedDate);
    },
    [selectedDate, syncCalendarToUrl],
  );

  const handleSelectedDateChange = useCallback(
    (nextDate: string) => {
      setSelectedDate(nextDate);
      setSelectedSessionIds(new Set());
      const nextWeekOffset = getParisWeekOffset(nextDate);
      setWeekOffset(nextWeekOffset);
      syncCalendarToUrl(nextWeekOffset, nextDate);
    },
    [syncCalendarToUrl],
  );

  useEffect(() => {
    const urlWeek = searchParams.get("weekOffset");
    const urlDate = searchParams.get("selectedDate");
    if (urlWeek !== null && urlWeek.trim() !== "") {
      setWeekOffset(parseWeekOffsetParam(urlWeek));
    }
    if (urlDate && /^\d{4}-\d{2}-\d{2}$/.test(urlDate)) {
      setSelectedDate(urlDate);
    }
  }, [searchParams]);

  const visibleActivities = useMemo(() => {
    if (!isPracticeView || selectedPracticeActivityId === PRACTICE_ACTIVITY_FILTER_ALL) {
      return activities;
    }
    return activities.filter((activity) => activity.id === selectedPracticeActivityId);
  }, [activities, isPracticeView, selectedPracticeActivityId]);

  const practiceActivityFilterGroups = useMemo(() => {
    if (!isPracticeView) return [];

    const byDiscipline = new Map(
      COURSE_DISCIPLINE_OPTIONS.map((option) => [option.value, [] as Activity[]]),
    );

    for (const activity of activities) {
      const discipline = inferPracticeDiscipline(activity.name, activity.discipline);
      if (!discipline) continue;
      byDiscipline.get(discipline)?.push(activity);
    }

    return COURSE_DISCIPLINE_OPTIONS.map((option) => ({
      ...option,
      activities: (byDiscipline.get(option.value) ?? []).sort((a, b) =>
        a.name.localeCompare(b.name, "fr"),
      ),
    })).filter((group) => group.activities.length > 0);
  }, [activities, isPracticeView]);

  const selectedActivity = useMemo(() => {
    if (!selectedSession) {
      return null;
    }
    return activities.find((activity) => activity.id === selectedSession.activity_id) ?? null;
  }, [activities, selectedSession]);

  const selectedUser = useMemo(
    () => allUsers.find((user) => user.id === selectedUserId) ?? null,
    [allUsers, selectedUserId],
  );

  const requiredCredits = useMemo(() => {
    if (!selectedSession || !selectedActivity) {
      return 0;
    }

    return (
      getEnrollmentRequiredCredits(
        selectedActivity.nb_credits,
        selectedSession.start_ts,
        selectedSession.end_ts,
        PRACTICE_ACTIVITY_TYPES.has(selectedActivity.type ?? ""),
      ) * Math.max(1, addParticipantCount)
    );
  }, [addParticipantCount, selectedActivity, selectedSession]);

  const availableUsersForSession = useMemo(() => {
    if (!selectedSession) {
      return allUsers;
    }

    return allUsers.filter(
      (user) =>
        !selectedSession.registeredUsers.some((registeredUser) => registeredUser.userId === user.id),
    );
  }, [allUsers, selectedSession]);

  const filteredUsersForAdd = useMemo(() => {
    const normalizedQuery = normalizeSearchValue(userSearchQuery);
    if (!normalizedQuery) {
      return availableUsersForSession;
    }

    return availableUsersForSession.filter((user) =>
      normalizeSearchValue(getUserSearchText(user)).includes(normalizedQuery),
    );
  }, [availableUsersForSession, userSearchQuery]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [activitiesResult, usersResult] = await Promise.all([
        getAllActivitiesWithSessions(),
        getAllUsers(),
      ]);

      if (activitiesResult.error) {
        setError(activitiesResult.error);
      } else {
        const filteredActivities = activitiesResult.activities.filter((activity) => {
          if (activity.type === "cours") {
            return activityTypes?.includes("cours") ?? false;
          }

          return activityTypes?.length
            ? activity.type ? activityTypes.includes(activity.type) : false
            : true;
        });
        setActivities(filteredActivities);
      }

      if (usersResult.users) {
        setAllUsers(usersResult.users);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur s'est produite");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Get all sessions for the selected date, flattened and with activity info
  const sessionsForDate = useMemo(() => {
    const dateKey = selectedDate;
    const allSessions: SessionWithUsers[] = [];
    
    visibleActivities.forEach(activity => {
      const dayData = activity.sessionsByDate.find(d => d.date === dateKey);
      if (dayData) {
        dayData.sessions.forEach(session => {
          allSessions.push({
            ...session,
            activity_id: activity.id,
            activity_name: activity.name,
            activity_type: activity.type,
          });
        });
      }
    });
    
    return allSessions
      .filter((session) =>
        matchesRegistrationPresenceFilter(session, registrationPresenceFilter),
      )
      .sort((a, b) => 
        new Date(a.start_ts).getTime() - new Date(b.start_ts).getTime()
      );
  }, [visibleActivities, selectedDate, registrationPresenceFilter]);

  // Get all sessions for the selected week
  const sessionsForWeek = useMemo(() => {
    const weekMonday = getParisWeekMonday(weekOffset);
    const weekDays = Array.from({ length: 7 }, (_, index) =>
      addParisCalendarDays(weekMonday, index),
    );
    
    const weekSessions: Map<string, SessionWithUsers[]> = new Map();
    
    weekDays.forEach(dateKey => {
      const daySessions: SessionWithUsers[] = [];
      visibleActivities.forEach(activity => {
        const dayData = activity.sessionsByDate.find(d => d.date === dateKey);
        if (dayData) {
          dayData.sessions.forEach(session => {
            const withActivity = {
              ...session,
              activity_id: activity.id,
              activity_name: activity.name,
              activity_type: activity.type,
            };
            if (
              !matchesRegistrationPresenceFilter(
                withActivity,
                registrationPresenceFilter,
              )
            ) {
              return;
            }
            daySessions.push(withActivity);
          });
        }
      });
      weekSessions.set(dateKey, daySessions.sort((a, b) => 
        new Date(a.start_ts).getTime() - new Date(b.start_ts).getTime()
      ));
    });
    
    return weekSessions;
  }, [visibleActivities, weekOffset, registrationPresenceFilter]);

  const practiceWeekCalendarSessions = useMemo((): AdminWeekCalendarSession[] => {
    const sessions: AdminWeekCalendarSession[] = [];
    sessionsForWeek.forEach((daySessions, dateKey) => {
      for (const session of daySessions) {
        const publicCount = session.publicRegisteredUsers?.length || 0;
        const practiceCapacity = isPracticeView
          ? getPracticeSessionCapacity(session)
          : null;
        const registrationCount = isPracticeView
          ? (practiceCapacity?.peakHourCount ?? 0) + publicCount
          : getSessionParticipantTotal(session);

        sessions.push({
          id: session.id,
          date: dateKey,
          start: formatParisTime(new Date(session.start_ts)),
          end: formatParisTime(new Date(session.end_ts)),
          activity_id: session.activity_id,
          activity_name: session.activity_name,
          max_registrations: session.max_registrations,
          registrationCount,
        });
      }
    });
    return sessions;
  }, [sessionsForWeek, isPracticeView]);

  const weekSessionById = useMemo(() => {
    const map = new Map<string, SessionWithUsers>();
    sessionsForWeek.forEach((daySessions) => {
      for (const session of daySessions) {
        map.set(session.id, session);
      }
    });
    return map;
  }, [sessionsForWeek]);

  const weekActivityColorIds = useMemo(
    () => activities.map((activity) => activity.id),
    [activities],
  );

  const manualActivities = useMemo(
    () => activities.map((activity) => ({ id: activity.id, name: activity.name })),
    [activities],
  );

  const effectiveDefaultActivityId =
    isPracticeView && selectedPracticeActivityId !== PRACTICE_ACTIVITY_FILTER_ALL
      ? selectedPracticeActivityId
      : defaultActivityId;

  const manualCreate = useAdminManualSessionCreate({
    activities: manualActivities,
    weekOffset,
    allowManualRepeat,
    isPracticeMode: isPracticeView,
    defaultActivityId: effectiveDefaultActivityId,
    onCreated: () => {
      loadData();
      onSessionsCreated?.();
    },
  });

  const handleCopyWeeksClick = () => {
    if (!onCopyWeeks) return;
    onCopyWeeks({
      weekOffset,
      activityId: effectiveDefaultActivityId,
    });
  };

  // Update selectedSession when activities data changes (after add/remove user)
  useEffect(() => {
    if (selectedSession && usersDialogOpen) {
      // Find updated session from both day and week views
      const dateKey = formatParisDate(new Date(selectedSession.start_ts));
      let updatedSession = sessionsForDate.find(s => s.id === selectedSession.id);
      
      // If not found in day view, try week view
      if (!updatedSession) {
        const weekSessions = sessionsForWeek.get(dateKey);
        updatedSession = weekSessions?.find(s => s.id === selectedSession.id);
      }
      
      const updatedCount =
        (updatedSession?.registeredUsers.length || 0) +
        (updatedSession?.publicRegisteredUsers?.length || 0);
      const selectedCount =
        selectedSession.registeredUsers.length +
        (selectedSession.publicRegisteredUsers?.length || 0);
      if (updatedSession && updatedCount !== selectedCount) {
        setSelectedSession(updatedSession);
      }
    }
  }, [activities, selectedSession, usersDialogOpen, sessionsForDate, sessionsForWeek]);

  // Group sessions by hour for calendar view
  const sessionsByHour = useMemo(() => {
    const grouped: Record<number, SessionWithUsers[]> = {};
    
    sessionsForDate.forEach(session => {
      const hour = getParisHour(new Date(session.start_ts));
      if (!grouped[hour]) {
        grouped[hour] = [];
      }
      grouped[hour].push(session);
    });
    
    return grouped;
  }, [sessionsForDate]);

  // Generate hours array (6 AM to 11 PM)
  const hours = Array.from({ length: 18 }, (_, i) => i + 6);

  const handleEditSession = (session: SessionWithUsers) => {
    setSelectedSession(session);
    const startDate = new Date(session.start_ts);
    const endDate = new Date(session.end_ts);

    setEditDate(formatParisDate(startDate));
    setEditStartTime(formatParisTime(startDate));
    
    // Calculate duration in minutes
    const durationMs = endDate.getTime() - startDate.getTime();
    const durationMinutes = Math.round(durationMs / (1000 * 60));
    setEditDuration(durationMinutes.toString());
    
    setEditMaxRegistrations(session.max_registrations?.toString() || "");
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedSession || !editDate || !editStartTime || !editDuration) return;
    
    setEditing(true);
    setError(null);
    
    try {
      // Combine date and time into ISO string for start
      const startDateTime = parseParisDateTime(editDate, editStartTime);
      
      // Calculate end time from start time + duration
      const durationMinutes = parseInt(editDuration) || 60;
      if (Number.isNaN(durationMinutes) || durationMinutes <= 0) {
        setError("La durée doit être un nombre positif");
        setEditing(false);
        return;
      }
      
      const endDateTime = new Date(startDateTime);
      endDateTime.setMinutes(endDateTime.getMinutes() + durationMinutes);
      
      const maxReg = editMaxRegistrations.trim() === "" ? null : parseInt(editMaxRegistrations);
      if (maxReg !== null && (Number.isNaN(maxReg) || maxReg < 0)) {
        setError("Le nombre maximum d'inscriptions doit être un nombre positif");
        setEditing(false);
        return;
      }
      
      const result = await updateSession(
        selectedSession.id,
        startDateTime.toISOString(),
        endDateTime.toISOString(),
        maxReg
      );
      
      if (result.error) {
        setError(result.error);
      } else {
        setEditDialogOpen(false);
        await loadData();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur s'est produite");
    } finally {
      setEditing(false);
    }
  };

  const resetAddUserFlow = () => {
    setAddUserDialogOpen(false);
    setCreditDeductionDialogOpen(false);
    setSelectedUserId("");
    setUserSearchQuery("");
    setAddParticipantCount(1);
    setAddCompanionName("");
  };

  const handleAddUser = async (deductCredits: boolean) => {
    if (!selectedSession || !selectedUserId) return;
    if (addParticipantCount > 1 && !addCompanionName.trim()) {
      setError("Indiquez le nom de la seconde personne.");
      return;
    }

    setAdding(true);
    setError(null);

    try {
      const result = await addUserToSession(
        selectedSession.id,
        selectedUserId,
        deductCredits,
        {
          participantCount: addParticipantCount,
          companionName: addCompanionName,
        },
      );
      if (result.error) {
        setError(result.error);
      } else {
        resetAddUserFlow();
        await loadData();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur s'est produite");
    } finally {
      setAdding(false);
    }
  };

  const handlePrepareAddUser = () => {
    if (!selectedSession || !selectedUserId) return;

    if (requiredCredits > 0) {
      setCreditDeductionDialogOpen(true);
      return;
    }

    void handleAddUser(false);
  };

  const handleOpenAddUser = (session: SessionWithUsers) => {
    setSelectedSession(session);
    setSelectedUserId("");
    setUserSearchQuery("");
    setError(null);
    setAddUserDialogOpen(true);
  };

  const handleDeleteSession = async (session: SessionWithUsers) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer cette session ?\n\n${session.activity_name}\n${formatTime(session.start_ts)} - ${formatTime(session.end_ts)}\n\nCette action est irréversible.`)) {
      return;
    }

    setError(null);
    try {
      const result = await deleteSession(session.id);
      if (result.error) {
        setError(result.error);
      } else {
        setSelectedSessionIds((prev) => {
          if (!prev.has(session.id)) return prev;
          const next = new Set(prev);
          next.delete(session.id);
          return next;
        });
        await loadData();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur s'est produite");
    }
  };

  const toggleSessionSelection = useCallback((sessionId: string) => {
    setSelectedSessionIds((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) {
        next.delete(sessionId);
      } else {
        next.add(sessionId);
      }
      return next;
    });
  }, []);

  const daySessionIds = useMemo(
    () => sessionsForDate.map((session) => session.id),
    [sessionsForDate],
  );

  const weekSessionIds = useMemo(() => {
    const ids: string[] = [];
    sessionsForWeek.forEach((daySessions) => {
      for (const session of daySessions) {
        ids.push(session.id);
      }
    });
    return ids;
  }, [sessionsForWeek]);

  const selectableSessionIds =
    viewMode === "day" ? daySessionIds : weekSessionIds;

  const allVisibleSelected =
    selectableSessionIds.length > 0 &&
    selectableSessionIds.every((id) => selectedSessionIds.has(id));

  const someVisibleSelected =
    selectableSessionIds.some((id) => selectedSessionIds.has(id)) &&
    !allVisibleSelected;

  const toggleSelectAllVisible = () => {
    setSelectedSessionIds((prev) => {
      if (allVisibleSelected) {
        const next = new Set(prev);
        for (const id of selectableSessionIds) {
          next.delete(id);
        }
        return next;
      }
      const next = new Set(prev);
      for (const id of selectableSessionIds) {
        next.add(id);
      }
      return next;
    });
  };

  const handleBulkDeleteSessions = async () => {
    const ids = [...selectedSessionIds];
    if (ids.length === 0) return;

    if (
      !confirm(
        `Supprimer ${ids.length} créneau${ids.length > 1 ? "x" : ""} sélectionné${ids.length > 1 ? "s" : ""} ?\n\nLes créneaux qui ont déjà des inscriptions seront ignorés.\nCette action est irréversible.`,
      )
    ) {
      return;
    }

    setBulkDeleting(true);
    setError(null);
    try {
      const result = await deleteSessions(ids);
      if (result.deleted > 0) {
        await loadData();
      }

      const remaining = new Set(
        result.failures.map((failure) => failure.sessionId),
      );
      setSelectedSessionIds(remaining);

      if (result.error && result.deleted === 0) {
        setError(result.error);
      } else if (result.failures.length > 0) {
        setError(
          `${result.deleted} supprimé${result.deleted > 1 ? "s" : ""}, ${result.failures.length} non supprimé${result.failures.length > 1 ? "s" : ""} (inscriptions présentes).`,
        );
      } else {
        setSelectionMode(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur s'est produite");
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleRemoveUser = async (registrationId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir retirer cet utilisateur de cette session ?")) {
      return;
    }

    setError(null);
    try {
      const result = await removeUserFromSession(registrationId);
      if (result.error) {
        setError(result.error);
      } else {
        await loadData();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur s'est produite");
    }
  };

  const moveTargetSessions = useMemo(() => {
    if (!selectedSession || !movingRegistrationId) return [];
    const activity = activities.find((entry) => entry.id === selectedSession.activity_id);
    if (!activity) return [];
    return activity.sessionsByDate
      .flatMap((day) => day.sessions)
      .filter((session) => session.id !== selectedSession.id)
      .filter((session) => {
        const end = new Date(session.end_ts).getTime();
        return end > Date.now() - 15 * 60 * 1000 || isSameParisDay(session.start_ts);
      })
      .sort(
        (left, right) =>
          new Date(left.start_ts).getTime() - new Date(right.start_ts).getTime(),
      );
  }, [activities, movingRegistrationId, selectedSession]);

  const handleMoveUser = async () => {
    if (!movingRegistrationId || !moveTargetSessionId) return;
    setMoving(true);
    setError(null);
    try {
      const result = await moveRegistrationToSession(
        movingRegistrationId,
        moveTargetSessionId,
        { companionName: moveCompanionName },
      );
      if (result.error) {
        setError(result.error);
        return;
      }
      setMovingRegistrationId(null);
      setMoveTargetSessionId("");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur s'est produite");
    } finally {
      setMoving(false);
    }
  };

  const fullDateFormatter = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: PARIS_TIMEZONE,
  });

  const timeFormatter = new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: PARIS_TIMEZONE,
  });

  const formatTime = (dateString: string) => {
    return timeFormatter.format(new Date(dateString));
  };

  const formatDate = (dateKey: string) => {
    return fullDateFormatter.format(parseParisDateTime(dateKey, "12:00"));
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    handleSelectedDateChange(
      addParisCalendarDays(selectedDate, direction === "next" ? 1 : -1),
    );
  };

  const goToToday = () => {
    handleSelectedDateChange(formatParisDate(new Date()));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
          <Button
            type="button"
            size="sm"
            onClick={() => manualCreate.openManualCreate(selectedDate)}
          >
            <Plus className="mr-2 h-4 w-4" />
            {isPracticeView ? "Ajouter des créneaux" : "Ajouter des sessions"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={selectionMode || selectedSessionIds.size > 0 ? "default" : "outline"}
            onClick={() => {
              setSelectionMode((prev) => {
                if (prev) {
                  setSelectedSessionIds(new Set());
                }
                return !prev;
              });
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {selectionMode ? "Annuler la sélection" : "Sélectionner"}
          </Button>
          {onCopyWeeks ? (
            <button
              type="button"
              onClick={handleCopyWeeksClick}
              className="text-sm font-semibold text-[#4a56dd] hover:underline text-left"
            >
              Recopier des semaines complètes
            </button>
          ) : null}
          <Tabs
            value={viewMode}
            onValueChange={(v) => {
              setViewMode(v as "day" | "week");
              setSelectedSessionIds(new Set());
              setSelectionMode(false);
            }}
          >
            <TabsList>
              <TabsTrigger value="day">
                <Calendar className="h-4 w-4 mr-2" />
                jour
              </TabsTrigger>
              <TabsTrigger value="week">
                <Calendar className="h-4 w-4 mr-2" />
                semaine
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {(selectionMode || selectedSessionIds.size > 0) && (
        <div className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm">
              <Checkbox
                checked={
                  allVisibleSelected
                    ? true
                    : someVisibleSelected
                      ? "indeterminate"
                      : false
                }
                onCheckedChange={() => toggleSelectAllVisible()}
              />
              <span>
                {selectedSessionIds.size > 0
                  ? `${selectedSessionIds.size} créneau${selectedSessionIds.size > 1 ? "x" : ""} sélectionné${selectedSessionIds.size > 1 ? "s" : ""}`
                  : viewMode === "day"
                    ? "Tout sélectionner (jour)"
                    : "Tout sélectionner (semaine)"}
              </span>
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedSessionIds(new Set());
                setSelectionMode(false);
              }}
            >
              Effacer
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={selectedSessionIds.size === 0 || bulkDeleting}
              onClick={() => void handleBulkDeleteSessions()}
            >
              {bulkDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Supprimer la sélection
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="text-sm text-destructive p-4 bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-2 rounded-lg border bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Filtrer par inscriptions
        </p>
        <div className="flex flex-wrap gap-2">
          {REGISTRATION_PRESENCE_OPTIONS.map((option) => {
            const isActive = registrationPresenceFilter === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setRegistrationPresenceFilter(option.value);
                  setSelectedSessionIds(new Set());
                }}
                className={cn(
                  "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-foreground opacity-80 hover:opacity-100",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {isPracticeView ? (
        <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mr-1">
              Offres
            </p>
            <button
              type="button"
              onClick={() => setSelectedPracticeActivityId(PRACTICE_ACTIVITY_FILTER_ALL)}
              className={cn(
                "inline-flex items-center rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium transition-colors",
                selectedPracticeActivityId === PRACTICE_ACTIVITY_FILTER_ALL
                  ? "ring-2 ring-primary ring-offset-1"
                  : "opacity-70 hover:opacity-100",
              )}
            >
              Toutes
            </button>
          </div>
          {practiceActivityFilterGroups.map((group) => (
            <div key={group.value}>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {group.label}
              </p>
              <div className="flex flex-wrap gap-2">
                {group.activities.map((activity) => {
                  const isSelected = selectedPracticeActivityId === activity.id;
                  const colorClass = getActivityColorClass(
                    activity.id,
                    weekActivityColorIds,
                  );
                  return (
                    <button
                      key={activity.id}
                      type="button"
                      onClick={() =>
                        setSelectedPracticeActivityId(
                          isSelected ? PRACTICE_ACTIVITY_FILTER_ALL : activity.id,
                        )
                      }
                      className={cn(
                        "inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-xs transition-opacity",
                        colorClass,
                        isSelected
                          ? "ring-2 ring-primary ring-offset-1 opacity-100"
                          : "opacity-60 hover:opacity-100",
                      )}
                    >
                      <span className="truncate">{activity.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Day Navigation */}
      {viewMode === "day" && (
        <div className="flex items-center justify-between border rounded-lg p-4 bg-muted/50">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateDay('prev')}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            jour précédent
          </Button>
          <div className="text-center">
            <p className="font-semibold capitalize">{formatDate(selectedDate)}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToToday}
              className="text-xs text-muted-foreground"
            >
              Aujourd&apos;hui
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateDay('next')}
          >
            jour suivant
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}

      {/* Week Navigation */}
      {viewMode === "week" && (
        <AdminWeekNavigator
          weekOffset={weekOffset}
          onWeekOffsetChange={handleWeekOffsetChange}
        />
      )}

      {/* Day View - Hourly Calendar */}
      {viewMode === "day" && (
        sessionsForDate.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border rounded-lg">
            <p>
              {isPracticeView
                ? registrationPresenceFilter === "with"
                  ? "Aucun créneau avec inscrits pour ce jour"
                  : registrationPresenceFilter === "without"
                    ? "Aucun créneau sans inscrits pour ce jour"
                    : "Aucun créneau d'ouverture prévu pour ce jour"
                : registrationPresenceFilter === "with"
                  ? "Aucune session avec inscrits pour ce jour"
                  : registrationPresenceFilter === "without"
                    ? "Aucune session sans inscrits pour ce jour"
                    : "Aucune session prévue pour ce jour"}
            </p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <div className="divide-y">
              {hours.map((hour) => {
                const hourSessions = sessionsByHour[hour] || [];
                if (hourSessions.length === 0) return null;

                return (
                  <div key={hour} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="w-16 text-sm font-medium text-muted-foreground">
                        {hour.toString().padStart(2, '0')}:00
                      </div>
                      <div className="flex-1 grid gap-3">
                        {hourSessions.map((session) => {
                          if (!session) return null;
                          const publicCount = session.publicRegisteredUsers?.length || 0;
                          const maxReg = session.max_registrations ?? null;
                          const hourStart = parseParisDateTime(
                            selectedDate,
                            `${hour.toString().padStart(2, "0")}:00`,
                          );
                          const hourCount = isPracticeView
                            ? countRegistrationsOverlappingHour(
                                toPracticeReservationSlots(session.registeredUsers ?? []),
                                hourStart.getTime(),
                              )
                            : getSessionParticipantTotal(session);
                          const registeredCount = isPracticeView ? hourCount + publicCount : hourCount;
                          const isFull = isPracticeView
                            ? maxReg !== null && hourCount >= maxReg
                            : maxReg !== null && registeredCount >= maxReg;
                          const available =
                            maxReg !== null ? maxReg - (isPracticeView ? hourCount : registeredCount) : null;
                          const sessionColorClass =
                            isPracticeView && session.activity_id
                              ? getActivityColorClass(
                                  session.activity_id,
                                  weekActivityColorIds,
                                )
                              : "bg-background";

                          return (
                            <div
                              key={session.id}
                              className={cn(
                                "flex items-center justify-between gap-3 p-3 border rounded-md hover:shadow-sm transition-shadow",
                                sessionColorClass,
                                selectedSessionIds.has(session.id) &&
                                  "ring-2 ring-destructive/60",
                              )}
                            >
                              <div className="flex min-w-0 flex-1 items-start gap-3">
                                <Checkbox
                                  checked={selectedSessionIds.has(session.id)}
                                  onCheckedChange={() => {
                                    setSelectionMode(true);
                                    toggleSessionSelection(session.id);
                                  }}
                                  aria-label={`Sélectionner ${session.activity_name}`}
                                  className="mt-1"
                                />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium">{session.activity_name}</span>
                                  <span className="text-sm text-muted-foreground">
                                    {formatTime(session.start_ts)} - {formatTime(session.end_ts)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {registeredCount} inscrit{registeredCount > 1 ? "s" : ""}
                                    {maxReg !== null &&
                                      ` / ${maxReg}${isPracticeView ? " max/h" : ""}`}
                                    {available !== null && available > 0 && (
                                      <span className="text-green-600">({available} disponible{available > 1 ? "s" : ""})</span>
                                    )}
                                    {isFull && <span className="text-red-600">(Complet)</span>}
                                  </span>
                                </div>
                              </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenAddUser(session)}
                                  disabled={!canAdminAddUserToSession(session, isPracticeView)}
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Ajouter un inscrit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedSession(session);
                                    setUsersDialogOpen(true);
                                  }}
                                >
                                  Voir les inscrits
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditSession(session)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteSession(session)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      )}

      {/* Week View - Calendar Grid */}
      {viewMode === "week" && (
        <>
          <AdminWeekTimeGrid
            weekOffset={weekOffset}
            existingSessions={practiceWeekCalendarSessions}
            previewSessions={manualCreate.previewSessions}
            activityColorIds={weekActivityColorIds}
            selectedDays={manualCreate.selectedDays}
            onToggleDay={manualCreate.onToggleDay}
            selectable={!selectionMode}
            onSelectSlot={selectionMode ? undefined : manualCreate.onSelectSlot}
            selectionMode={selectionMode}
            selectedSessionIds={selectedSessionIds}
            onToggleSessionSelection={toggleSessionSelection}
            onExistingSessionClick={(session) => {
              const fullSession = session.id ? weekSessionById.get(session.id) : undefined;
              if (fullSession) {
                setSelectedSession(fullSession);
                setUsersDialogOpen(true);
              }
            }}
          />
          {manualCreate.dialog}
        </>
      )}

      {/* Keep create dialog mounted in day view too */}
      {viewMode === "day" ? manualCreate.dialog : null}

      {/* Edit Session Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
          <DialogTitle>
            {isPracticeView ? "Modifier le créneau" : "Modifier la session"}
          </DialogTitle>
            <DialogDescription>
              {isPracticeView
                ? "Modifiez les détails du créneau d'ouverture"
                : "Modifiez les détails de la session"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-date">Date</Label>
              <Input
                id="edit-date"
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4 items-start">
              <div className="grid gap-2">
                <Label htmlFor="edit-start-time">Heure de début</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={getTimeParts(editStartTime).hour}
                    onValueChange={(hour) => {
                      const currentMinute = getTimeParts(editStartTime).minute;
                      setStartTimeFromParts(hour, currentMinute);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Heure" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                        <SelectItem key={hour} value={hour.toString().padStart(2, '0')}>
                          {hour.toString().padStart(2, '0')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={getTimeParts(editStartTime).minute}
                    onValueChange={(minute) => {
                      const currentHour = getTimeParts(editStartTime).hour;
                      setStartTimeFromParts(currentHour, minute);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Minute" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                        <SelectItem key={minute} value={minute.toString().padStart(2, '0')}>
                          {minute.toString().padStart(2, '0')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-duration">Durée (minutes)</Label>
                <Input
                  id="edit-duration"
                  type="number"
                  min="15"
                  step="15"
                  value={editDuration}
                  onChange={(e) => setEditDuration(e.target.value)}
                  required
                />
                {editDate && editStartTime && editDuration && (
                  <p className="text-xs text-muted-foreground">
                    Fin: {(() => {
                      try {
                        const startDateTime = parseParisDateTime(editDate, editStartTime);
                        const durationMinutes = parseInt(editDuration) || 60;
                        const endDateTime = new Date(startDateTime);
                        endDateTime.setMinutes(endDateTime.getMinutes() + durationMinutes);
                        return timeFormatter.format(endDateTime);
                      } catch {
                        return "-";
                      }
                    })()}
                  </p>
                )}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-max-registrations">
                {isPracticeView
                  ? "Nombre maximum de personnes par heure"
                  : "Nombre maximum d'inscriptions"}
              </Label>
              <Input
                id="edit-max-registrations"
                type="number"
                min="0"
                value={editMaxRegistrations}
                onChange={(e) => setEditMaxRegistrations(e.target.value)}
                placeholder="Illimité si vide"
              />
              <p className="text-xs text-muted-foreground">
                {isPracticeView
                  ? "Laissez vide pour un nombre illimité de personnes par heure"
                  : "Laissez vide pour un nombre illimité d'inscriptions"}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false);
                setEditDate("");
                setEditStartTime("");
                setEditDuration("60");
                setEditMaxRegistrations("");
              }}
            >
              Annuler
            </Button>
            <Button onClick={handleSaveEdit} disabled={editing || !editDate || !editStartTime || !editDuration}>
              {editing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                "Enregistrer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Users List Dialog */}
      <Dialog open={usersDialogOpen} onOpenChange={setUsersDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedSession?.activity_name} - {selectedSession && formatTime(selectedSession.start_ts)} - {selectedSession && formatTime(selectedSession.end_ts)}
            </DialogTitle>
            <DialogDescription>
              {isPracticeView
                ? "gérer les utilisateurs inscrits sur ce créneau d'ouverture"
                : "gérer les utilisateurs inscrits à cette session"}
              {selectedSession && isSessionFinished(selectedSession) && isSameParisDay(selectedSession.start_ts) ? (
                <span className="mt-2 block text-amber-700 dark:text-amber-400">
                  Session terminée — vous pouvez encore ajouter un participant oublié aujourd&apos;hui et déduire ses crédits.
                </span>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {(() => {
                  const publicCount = selectedSession?.publicRegisteredUsers?.length || 0;
                  const reservationCount = selectedSession
                    ? getSessionParticipantTotal(selectedSession) - publicCount
                    : 0;
                  const totalCount = selectedSession
                    ? getSessionParticipantTotal(selectedSession)
                    : 0;
                  const maxReg = selectedSession?.max_registrations;

                  if (isPracticeView && selectedSession) {
                    const practiceStats = getPracticeSessionCapacity(selectedSession);
                    return (
                      <>
                        {totalCount} réservation{totalCount > 1 ? "s" : ""}
                        {maxReg != null &&
                          ` · pic ${practiceStats.peakHourCount}/${maxReg} par heure`}
                      </>
                    );
                  }

                  return (
                    <>
                      {totalCount} inscrit{totalCount > 1 ? "s" : ""}
                      {maxReg != null && ` / ${maxReg} max`}
                    </>
                  );
                })()}
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedUserId("");
                  setUserSearchQuery("");
                  setAddParticipantCount(1);
                  setAddCompanionName("");
                  setAddUserDialogOpen(true);
                }}
                disabled={
                  selectedSession
                    ? !canAdminAddUserToSession(selectedSession, isPracticeView)
                    : true
                }
              >
                <Plus className="h-4 w-4 mr-2" />
                ajouter un utilisateur
              </Button>
            </div>

            {selectedSession && ((selectedSession.registeredUsers?.length || 0) > 0 || (selectedSession.publicRegisteredUsers?.length || 0) > 0) ? (
              <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
                {selectedSession.publicRegisteredUsers?.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 hover:bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {user.phone}
                      </p>
                      {(user.participantCount ?? 1) > 1 ? (
                        <p className="text-xs text-muted-foreground">
                          {(user.participantCount ?? 1)} inscriptions
                          {user.companionFirstNames?.length
                            ? ` · avec ${user.companionFirstNames.join(", ")}`
                            : ""}
                        </p>
                      ) : null}
                    </div>
                    <span className="rounded-full bg-[#fff8f0] px-2.5 py-1 text-xs font-medium text-[#f56800]">
                      Nom + téléphone
                    </span>
                  </div>
                ))}
                {selectedSession.registeredUsers.map((user) => (
                  <div
                    key={user.registrationId}
                    className="flex items-center justify-between p-3 hover:bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    {user.reservedStartTs && user.reservedEndTs ? (
                      <p className="text-xs text-muted-foreground">
                        Réservé: {formatTime(user.reservedStartTs)} -{" "}
                        {formatTime(user.reservedEndTs)}
                      </p>
                    ) : null}
                    {(user.participantCount ?? 1) > 1 ? (
                      <p className="text-xs font-medium text-[#4a56dd]">
                        {(user.participantCount ?? 1)} inscriptions
                        {user.companionFirstNames?.length
                          ? ` · avec ${user.companionFirstNames.join(", ")}`
                          : ""}
                      </p>
                    ) : null}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setMovingRegistrationId(user.registrationId);
                          setMoveTargetSessionId("");
                          setMoveCompanionName(user.companionFirstNames?.[0] ?? "");
                        }}
                        title="Déplacer vers une autre session"
                      >
                        Déplacer
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveUser(user.registrationId)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground border rounded-lg">
                Aucun utilisateur inscrit
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (selectedSession) {
                  setUsersDialogOpen(false);
                  handleEditSession(selectedSession);
                }
              }}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Modifier
            </Button>
            <Button
              type="button"
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => {
                if (selectedSession) {
                  setUsersDialogOpen(false);
                  handleDeleteSession(selectedSession);
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog
        open={addUserDialogOpen}
        onOpenChange={(open) => {
          setAddUserDialogOpen(open);
          if (!open) {
            setSelectedUserId("");
            setUserSearchQuery("");
            setError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
          <DialogTitle>
            {isPracticeView
              ? "ajouter un utilisateur au créneau"
              : "ajouter un utilisateur à la session"}
          </DialogTitle>
            <DialogDescription>
              {isPracticeView
                ? "L'ajout manuel inscrit l'utilisateur sur tout le créneau d'ouverture."
                : "Sélectionnez un utilisateur à ajouter à cette session"}
              {selectedSession && isSessionFinished(selectedSession) && isSameParisDay(selectedSession.start_ts) ? (
                <span className="mt-2 block text-amber-700 dark:text-amber-400">
                  Ajout rétroactif autorisé aujourd&apos;hui, même si la session est terminée ou complète.
                </span>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="user-search">Utilisateur *</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="user-search"
                  value={userSearchQuery}
                  onChange={(event) => setUserSearchQuery(event.target.value)}
                  placeholder="Rechercher par nom ou e-mail..."
                  className="pl-9"
                  autoComplete="off"
                />
              </div>
              <div className="max-h-56 overflow-y-auto rounded-md border">
                {filteredUsersForAdd.length > 0 ? (
                  filteredUsersForAdd.map((user) => {
                    const name = getUserDisplayName(user);
                    const creditsLabel =
                      typeof user.credits === "number"
                        ? `${user.credits} crédit${user.credits !== 1 ? "s" : ""}`
                        : null;

                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => setSelectedUserId(user.id)}
                        className={cn(
                          "flex w-full flex-col items-start gap-0.5 border-b px-3 py-2 text-left text-sm transition-colors last:border-b-0 hover:bg-muted/50",
                          selectedUserId === user.id && "bg-primary/10",
                        )}
                      >
                        <span className="font-medium">{name}</span>
                        <span className="text-xs text-muted-foreground">
                          {user.email}
                          {creditsLabel ? ` · ${creditsLabel}` : ""}
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                    {userSearchQuery
                      ? "Aucun utilisateur ne correspond à cette recherche"
                      : "Aucun utilisateur disponible"}
                  </p>
                )}
              </div>
            </div>
            {requiredCredits > 0 ? (
              <p className="text-sm text-muted-foreground">
                Cette session coûte {requiredCredits} crédit{requiredCredits !== 1 ? "s" : ""}
                {addParticipantCount > 1 ? ` pour ${addParticipantCount} personnes` : ""}.
                Vous pourrez choisir de les déduire ou non à l&apos;étape suivante.
              </p>
            ) : null}
            {!isPracticeView ? (
              <div className="grid gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="add-participant-count">Nombre de personnes</Label>
                  <Select
                    value={String(addParticipantCount)}
                    onValueChange={(value) => {
                      const next = Number(value);
                      setAddParticipantCount(next);
                      if (next < 2) setAddCompanionName("");
                    }}
                  >
                    <SelectTrigger id="add-participant-count">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 personne</SelectItem>
                      <SelectItem value="2">2 personnes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {addParticipantCount > 1 ? (
                  <div className="grid gap-2">
                    <Label htmlFor="add-companion-name">Seconde personne</Label>
                    <Input
                      id="add-companion-name"
                      value={addCompanionName}
                      onChange={(event) => setAddCompanionName(event.target.value)}
                      placeholder="Prénom et nom"
                    />
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
          {error && !creditDeductionDialogOpen ? (
            <div className="text-sm text-destructive mb-4">{error}</div>
          ) : null}
          <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={resetAddUserFlow}
              >
              Annuler
            </Button>
            <Button
              onClick={handlePrepareAddUser}
              disabled={
                adding ||
                !selectedUserId ||
                (addParticipantCount > 1 && !addCompanionName.trim())
              }
            >
              {adding ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Ajout...
                </>
              ) : (
                "Continuer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credit Deduction Dialog */}
      <Dialog
        open={creditDeductionDialogOpen}
        onOpenChange={(open) => {
          setCreditDeductionDialogOpen(open);
          if (!open) {
            setError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Déduire les crédits ?</DialogTitle>
            <DialogDescription>
              {selectedUser
                ? `Inscription de ${getUserDisplayName(selectedUser)} à ${selectedSession?.activity_name ?? "cette session"}.`
                : "Choisissez si les crédits doivent être déduits du compte utilisateur."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-lg border p-4 space-y-2">
              <p className="text-sm">
                Coût de la session :{" "}
                <span className="font-medium">
                  {requiredCredits} crédit{requiredCredits !== 1 ? "s" : ""}
                </span>
              </p>
              <p className="text-sm">
                Solde de l&apos;utilisateur :{" "}
                <span className="font-medium">
                  {selectedUser?.credits ?? 0} crédit
                  {(selectedUser?.credits ?? 0) !== 1 ? "s" : ""}
                </span>
              </p>
            </div>
            {error ? (
              <div className="text-sm text-destructive">{error}</div>
            ) : null}
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
            <Button
              onClick={() => handleAddUser(true)}
              disabled={
                adding ||
                (selectedUser?.credits ?? 0) < requiredCredits
              }
              className="w-full"
            >
              {adding ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Inscription...
                </>
              ) : (
                `Déduire ${requiredCredits} crédit${requiredCredits !== 1 ? "s" : ""}`
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleAddUser(false)}
              disabled={adding}
              className="w-full"
            >
              Inscrire sans déduire
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setCreditDeductionDialogOpen(false);
                setError(null);
              }}
              disabled={adding}
              className="w-full"
            >
              Retour
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(movingRegistrationId)}
        onOpenChange={(open) => {
          if (!open) {
            setMovingRegistrationId(null);
            setMoveTargetSessionId("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Déplacer l&apos;inscription</DialogTitle>
            <DialogDescription>
              Déplace vers une autre date du même cours, et conserve ou ajoute la
              seconde personne.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid gap-2">
              <Label htmlFor="move-companion-name">Seconde personne</Label>
              <Input
                id="move-companion-name"
                value={moveCompanionName}
                onChange={(event) => setMoveCompanionName(event.target.value)}
                placeholder="Prénom et nom — laisser vide pour une seule personne"
              />
            </div>
            {moveTargetSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune autre session disponible pour cette activité.
              </p>
            ) : (
              <div className="grid gap-2">
                <Label htmlFor="move-target-session">Session cible</Label>
                <Select
                  value={moveTargetSessionId || undefined}
                  onValueChange={setMoveTargetSessionId}
                >
                  <SelectTrigger id="move-target-session">
                    <SelectValue placeholder="Choisir une session" />
                  </SelectTrigger>
                  <SelectContent>
                    {moveTargetSessions.map((session) => (
                      <SelectItem key={session.id} value={session.id}>
                        {formatDate(formatParisDate(new Date(session.start_ts)))}{" "}
                        · {formatTime(session.start_ts)} -{" "}
                        {formatTime(session.end_ts)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setMovingRegistrationId(null);
                setMoveTargetSessionId("");
              }}
              disabled={moving}
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={() => void handleMoveUser()}
              disabled={moving || !moveTargetSessionId}
            >
              {moving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Déplacement...
                </>
              ) : (
                "Déplacer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
