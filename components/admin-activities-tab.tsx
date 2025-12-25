"use client";

import { useEffect, useState, useMemo } from "react";
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
  getAllUsers,
  updateSession,
  deleteSession,
} from "@/app/admin/actions";
import { Loader2, Plus, X, ChevronLeft, ChevronRight, Users, Pencil, Calendar, Trash2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const PARIS_TIMEZONE = "Europe/Paris";

// Helper function to get current date/time in Paris timezone
function getNowInParis(): Date {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("fr-FR", {
    timeZone: PARIS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const year = parseInt(parts.find(p => p.type === "year")!.value);
  const month = parseInt(parts.find(p => p.type === "month")!.value) - 1;
  const day = parseInt(parts.find(p => p.type === "day")!.value);
  const hour = parseInt(parts.find(p => p.type === "hour")!.value);
  const minute = parseInt(parts.find(p => p.type === "minute")!.value);
  const second = parseInt(parts.find(p => p.type === "second")!.value);
  return new Date(year, month, day, hour, minute, second);
}

// Helper function to get Monday of a week in Paris timezone
function getMondayInParis(date: Date): Date {
  const formatter = new Intl.DateTimeFormat("fr-FR", {
    timeZone: PARIS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const year = parseInt(parts.find(p => p.type === "year")!.value);
  const month = parseInt(parts.find(p => p.type === "month")!.value) - 1;
  const day = parseInt(parts.find(p => p.type === "day")!.value);
  const d = new Date(year, month, day);
  const dayOfWeek = d.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  d.setDate(d.getDate() - daysFromMonday);
  d.setHours(0, 0, 0, 0);
  return d;
}

type User = {
  id: string;
  email: string;
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
};

type SessionWithUsers = {
  id: string;
  start_ts: string;
  end_ts: string;
  max_registrations: number | null;
  registeredUsers: RegisteredUser[];
  activity_id: string;
  activity_name: string;
  activity_type: string | null;
};

type Activity = {
  id: string;
  name: string;
  nb_credits: number | null;
  type: string | null;
  sessionsByDate: {
    date: string;
    sessions: SessionWithUsers[];
  }[];
};

interface WeekViewSessionsProps {
  sessionsByDate: Map<string, SessionWithUsers[]>;
  weekOffset: number;
  onSessionClick: (session: SessionWithUsers) => void;
  onEditSession: (session: SessionWithUsers) => void;
  onDeleteSession: (session: SessionWithUsers) => void;
}

function WeekViewSessions({ sessionsByDate, weekOffset, onSessionClick, onEditSession, onDeleteSession }: WeekViewSessionsProps) {
  const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  
  // Calculate the Monday of the selected week in Paris timezone
  const weekDays = useMemo(() => {
    const now = getNowInParis();
    const currentMonday = getMondayInParis(now);
    
    const selectedWeekMonday = new Date(currentMonday);
    selectedWeekMonday.setDate(currentMonday.getDate() + weekOffset * 7);
    
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(selectedWeekMonday);
      date.setDate(selectedWeekMonday.getDate() + i);
      return date;
    });
  }, [weekOffset]);

  const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

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

  const formatDayLabel = (date: Date) => {
    return dateFormatter.format(date);
  };

  const formatTime = (dateString: string) => {
    return timeFormatter.format(new Date(dateString));
  };

  const hasAnySessions = Array.from(sessionsByDate.values()).some(sessions => sessions.length > 0);

  return (
    <div className="border rounded-lg p-4 bg-background">
      <div className="grid grid-cols-7 gap-2 items-start">
        {WEEKDAY_LABELS.map((label, index) => {
          const day = weekDays[index];
          const dateKey = formatDateKey(day);
          const daySessions = sessionsByDate.get(dateKey) || [];
          const isToday = formatDateKey(getNowInParis()) === dateKey;

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
                  {formatDayLabel(day)}
                </p>
              </div>
              <div className="space-y-1 w-full">
                {daySessions.length > 0 ? (
                  daySessions.map((session) => {
                    const registeredCount = session.registeredUsers?.length || 0;
                    const maxReg = session.max_registrations ?? null;
                    const isFull = maxReg !== null && registeredCount >= maxReg;
                    const available = maxReg !== null ? maxReg - registeredCount : null;

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
                              {registeredCount}{maxReg !== null && `/${maxReg}`}
                              {available !== null && available > 0 && !isFull && <span className="text-green-300"> ({available})</span>}
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

export function AdminActivitiesTab() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => getNowInParis());
  const [selectedSession, setSelectedSession] = useState<SessionWithUsers | null>(null);
  const [usersDialogOpen, setUsersDialogOpen] = useState(false);
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedPaymentType, setSelectedPaymentType] = useState<string>("");
  const [adding, setAdding] = useState(false);
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
  const [viewMode, setViewMode] = useState<"day" | "week">("day");
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);

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
        setActivities(activitiesResult.activities);
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

  // Get all activities for filtering
  const availableActivities = useMemo(() => {
    return activities.map(activity => ({
      id: activity.id,
      name: activity.name,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [activities]);

  // Get all sessions for the selected date, flattened and with activity info
  const sessionsForDate = useMemo(() => {
    const dateKey = selectedDate.toISOString().split('T')[0];
    const allSessions: SessionWithUsers[] = [];
    
    activities.forEach(activity => {
      // Filter by activity if filter is active
      if (selectedActivities.length > 0 && !selectedActivities.includes(activity.id)) {
        return;
      }
      
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
    
    return allSessions.sort((a, b) => 
      new Date(a.start_ts).getTime() - new Date(b.start_ts).getTime()
    );
  }, [activities, selectedDate, selectedActivities]);

  // Get all sessions for the selected week
  const sessionsForWeek = useMemo(() => {
    const now = getNowInParis();
    const currentMonday = getMondayInParis(now);
    
    const selectedWeekMonday = new Date(currentMonday);
    selectedWeekMonday.setDate(currentMonday.getDate() + weekOffset * 7);
    
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(selectedWeekMonday);
      date.setDate(selectedWeekMonday.getDate() + i);
      return date.toISOString().split('T')[0];
    });
    
    const weekSessions: Map<string, SessionWithUsers[]> = new Map();
    
    weekDays.forEach(dateKey => {
      const daySessions: SessionWithUsers[] = [];
      activities.forEach(activity => {
        // Filter by activity if filter is active
        if (selectedActivities.length > 0 && !selectedActivities.includes(activity.id)) {
          return;
        }
        
        const dayData = activity.sessionsByDate.find(d => d.date === dateKey);
        if (dayData) {
          dayData.sessions.forEach(session => {
            daySessions.push({
              ...session,
              activity_id: activity.id,
              activity_name: activity.name,
              activity_type: activity.type,
            });
          });
        }
      });
      weekSessions.set(dateKey, daySessions.sort((a, b) => 
        new Date(a.start_ts).getTime() - new Date(b.start_ts).getTime()
      ));
    });
    
    return weekSessions;
  }, [activities, weekOffset, selectedActivities]);

  // Update selectedSession when activities data changes (after add/remove user)
  useEffect(() => {
    if (selectedSession && usersDialogOpen) {
      // Find updated session from both day and week views
      const dateKey = new Date(selectedSession.start_ts).toISOString().split('T')[0];
      let updatedSession = sessionsForDate.find(s => s.id === selectedSession.id);
      
      // If not found in day view, try week view
      if (!updatedSession) {
        const weekSessions = sessionsForWeek.get(dateKey);
        updatedSession = weekSessions?.find(s => s.id === selectedSession.id);
      }
      
      if (updatedSession && updatedSession.registeredUsers.length !== selectedSession.registeredUsers.length) {
        setSelectedSession(updatedSession);
      }
    }
  }, [activities, selectedSession?.id, usersDialogOpen, sessionsForDate, sessionsForWeek]);

  // Group sessions by hour for calendar view
  const sessionsByHour = useMemo(() => {
    const grouped: Record<number, SessionWithUsers[]> = {};
    
    sessionsForDate.forEach(session => {
      const hour = new Date(session.start_ts).getHours();
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
    
    // Format date as YYYY-MM-DD
    const dateStr = startDate.toISOString().split('T')[0];
    setEditDate(dateStr);
    
    // Format time as HH:MM
    const startTimeStr = `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`;
    setEditStartTime(startTimeStr);
    
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
      const startDateTime = new Date(`${editDate}T${editStartTime}:00`);
      
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

  const handleAddUser = async () => {
    if (!selectedSession || !selectedUserId || !selectedPaymentType) return;

    setAdding(true);
    setError(null);

    try {
      const result = await addUserToSession(selectedSession.id, selectedUserId, selectedPaymentType);
      if (result.error) {
        setError(result.error);
      } else {
        setAddUserDialogOpen(false);
        setSelectedUserId("");
        setSelectedPaymentType("free");
        await loadData();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur s'est produite");
    } finally {
      setAdding(false);
    }
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
        await loadData();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur s'est produite");
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

  const fullDateFormatter = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: PARIS_TIMEZONE,
  });

  const shortDateFormatter = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
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

  const formatDate = (date: Date) => {
    return fullDateFormatter.format(date);
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setWeekOffset(prev => prev + (direction === 'next' ? 1 : -1));
  };

  const goToToday = () => {
    setSelectedDate(getNowInParis());
    setWeekOffset(0);
  };

  const getWeekLabel = (offset: number): string => {
    const now = getNowInParis();
    const currentMonday = getMondayInParis(now);
    
    const selectedWeekMonday = new Date(currentMonday);
    selectedWeekMonday.setDate(currentMonday.getDate() + offset * 7);
    
    const selectedWeekSunday = new Date(selectedWeekMonday);
    selectedWeekSunday.setDate(selectedWeekMonday.getDate() + 6);
    
    const formatDate = (date: Date) => {
      return shortDateFormatter.format(date);
    };
    
    if (offset === 0) {
      return `Cette semaine (${formatDate(selectedWeekMonday)} - ${formatDate(selectedWeekSunday)})`;
    } else if (offset === -1) {
      return `Semaine précédente (${formatDate(selectedWeekMonday)} - ${formatDate(selectedWeekSunday)})`;
    } else if (offset > 0) {
      return `Dans ${offset} semaine${offset > 1 ? "s" : ""} (${formatDate(selectedWeekMonday)} - ${formatDate(selectedWeekSunday)})`;
    } else {
      return `${Math.abs(offset)} semaines précédentes (${formatDate(selectedWeekMonday)} - ${formatDate(selectedWeekSunday)})`;
    }
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
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Sessions</h3>
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "day" | "week")}>
          <TabsList>
            <TabsTrigger value="day">
              <Calendar className="h-4 w-4 mr-2" />
              Jour
            </TabsTrigger>
            <TabsTrigger value="week">
              <Calendar className="h-4 w-4 mr-2" />
              Semaine
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {error && (
        <div className="text-sm text-destructive p-4 bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      {/* Activity Filter */}
      {availableActivities.length > 0 && (
        <div className="flex items-center gap-4 border rounded-lg p-4 bg-muted/50">
          <Label className="text-sm font-medium">Filtrer par activité:</Label>
          <div className="flex flex-wrap gap-2">
            {availableActivities.map((activity) => (
              <Button
                key={activity.id}
                variant={selectedActivities.includes(activity.id) ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedActivities(prev =>
                    prev.includes(activity.id)
                      ? prev.filter(id => id !== activity.id)
                      : [...prev, activity.id]
                  );
                }}
              >
                {activity.name}
              </Button>
            ))}
            {selectedActivities.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedActivities([])}
                className="text-xs"
              >
                Réinitialiser
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Day Navigation */}
      {viewMode === "day" && (
        <div className="flex items-center justify-between border rounded-lg p-4 bg-muted/50">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateDay('prev')}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Jour précédent
          </Button>
          <div className="text-center">
            <p className="font-semibold capitalize">{formatDate(selectedDate)}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToToday}
              className="text-xs text-muted-foreground"
            >
              Aujourd'hui
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateDay('next')}
          >
            Jour suivant
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}

      {/* Week Navigation */}
      {viewMode === "week" && (
        <div className="flex items-center justify-between border rounded-lg p-4 bg-muted/50">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateWeek('prev')}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Semaine précédente
          </Button>
          <div className="text-center">
            <p className="font-semibold">{getWeekLabel(weekOffset)}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToToday}
              className="text-xs text-muted-foreground"
            >
              Cette semaine
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateWeek('next')}
          >
            Semaine suivante
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}

      {/* Day View - Hourly Calendar */}
      {viewMode === "day" && (
        sessionsForDate.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border rounded-lg">
            <p>Aucune session prévue pour ce jour</p>
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
                          const registeredCount = session.registeredUsers?.length || 0;
                          const maxReg = session.max_registrations ?? null;
                          const isFull = maxReg !== null && registeredCount >= maxReg;
                          const available = maxReg !== null ? maxReg - registeredCount : null;

                          return (
                            <div
                              key={session.id}
                              className="flex items-center justify-between p-3 border rounded-md bg-background hover:shadow-sm transition-shadow"
                            >
                              <div className="flex-1">
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
                                    {maxReg !== null && ` / ${maxReg}`}
                                    {available !== null && available > 0 && (
                                      <span className="text-green-600">({available} disponible{available > 1 ? "s" : ""})</span>
                                    )}
                                    {isFull && <span className="text-red-600">(Complet)</span>}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-2">
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
        <WeekViewSessions 
          sessionsByDate={sessionsForWeek} 
          weekOffset={weekOffset}
          onSessionClick={(session) => {
            setSelectedSession(session);
            setUsersDialogOpen(true);
          }}
          onEditSession={handleEditSession}
          onDeleteSession={handleDeleteSession}
        />
      )}

      {/* Edit Session Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la session</DialogTitle>
            <DialogDescription>
              Modifiez les détails de la session
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
                        const startDateTime = new Date(`${editDate}T${editStartTime}:00`);
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
              <Label htmlFor="edit-max-registrations">Nombre maximum d'inscriptions</Label>
              <Input
                id="edit-max-registrations"
                type="number"
                min="0"
                value={editMaxRegistrations}
                onChange={(e) => setEditMaxRegistrations(e.target.value)}
                placeholder="Illimité si vide"
              />
              <p className="text-xs text-muted-foreground">
                Laissez vide pour un nombre illimité d'inscriptions
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
              Gérer les utilisateurs inscrits à cette session
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {selectedSession?.registeredUsers?.length || 0} inscrit{selectedSession && (selectedSession.registeredUsers?.length || 0) > 1 ? "s" : ""}
                {selectedSession?.max_registrations !== null && selectedSession?.max_registrations !== undefined && ` / ${selectedSession.max_registrations} max`}
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedPaymentType("free");
                  setAddUserDialogOpen(true);
                }}
                disabled={selectedSession?.max_registrations !== null && selectedSession?.max_registrations !== undefined && (selectedSession?.registeredUsers?.length || 0) >= (selectedSession.max_registrations || 0)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un utilisateur
              </Button>
            </div>

            {selectedSession && (selectedSession.registeredUsers?.length || 0) > 0 ? (
              <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
                {selectedSession.registeredUsers.map((user) => (
                  <div
                    key={user.registrationId}
                    className="flex items-center justify-between p-3 hover:bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveUser(user.registrationId)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground border rounded-lg">
                Aucun utilisateur inscrit
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un utilisateur à la session</DialogTitle>
            <DialogDescription>
              Sélectionnez un utilisateur à ajouter à cette session
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="user">Utilisateur *</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un utilisateur" />
                </SelectTrigger>
                <SelectContent>
                  {allUsers
                    .filter(
                      (user) =>
                        !selectedSession?.registeredUsers.some(
                          (ru) => ru.userId === user.id
                        )
                    )
                    .map((user) => {
                      const name =
                        user.user_metadata?.first_name && user.user_metadata?.last_name
                          ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
                          : user.user_metadata?.first_name ||
                            user.user_metadata?.last_name ||
                            user.email;
                      return (
                        <SelectItem key={user.id} value={user.id}>
                          {name} ({user.email})
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="paymentType">Type de paiement *</Label>
              <Select value={selectedPaymentType} onValueChange={setSelectedPaymentType} required>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type de paiement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Gratuit</SelectItem>
                  <SelectItem value="credit">Crédits</SelectItem>
                  <SelectItem value="stripe">Stripe</SelectItem>
                  <SelectItem value="cash">Espèces</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {error && (
            <div className="text-sm text-destructive mb-4">{error}</div>
          )}
          <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setAddUserDialogOpen(false);
                  setSelectedUserId("");
                  setSelectedPaymentType("free");
                }}
              >
              Annuler
            </Button>
            <Button onClick={handleAddUser} disabled={adding || !selectedUserId || !selectedPaymentType}>
              {adding ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Ajout...
                </>
              ) : (
                "Ajouter"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
