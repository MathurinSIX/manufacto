"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminUsersTab } from "@/components/admin-users-tab";
import { AdminActivitiesTab } from "@/components/admin-activities-tab";
import { AdminAddActivitiesTab } from "@/components/admin-add-activities-tab";
import { AdminActivitiesManagementTab } from "@/components/admin-activities-management-tab";
import { AdminFreePracticeCreditsTab } from "@/components/admin-free-practice-credits-tab";
import { AdminVisitsTab } from "@/components/admin-visits-tab";
import { AdminNewsletterTab } from "@/components/admin-newsletter-tab";
import { AdminSquareTab } from "@/components/admin-square-tab";
import { AdminEmailsTab } from "@/components/admin-emails-tab";
import { AdminTodayTab } from "@/components/admin-today-tab";

const validTabs = [
  "today",
  "users",
  "courses",
  "free-practice",
  "discovery-packs",
  "visits",
  "newsletter",
  "square",
  "emails",
];

type CoursesSubTab = "cours" | "sessions";

type FreePracticeSubTab = "pratique-libre" | "sessions";

const COURSE_ACTIVITY_TYPES = ["cours"];
const FREE_PRACTICE_ACTIVITY_TYPES = [
  "autonomie",
  "autonomie_encadree",
  "accompagnement",
  "cuisson",
];
const FREE_PRACTICE_SESSION_ACTIVITY_TYPES = FREE_PRACTICE_ACTIVITY_TYPES;
const DISCOVERY_PACK_ACTIVITY_TYPES = ["pack_decouverte"];
type SessionArea = "courses" | "free-practice" | "discovery-packs" | "visits";

type AddSessionsContext = {
  weekOffset: number;
  activityId?: string;
};

function parseWeekOffsetParam(value: string | null): number {
  if (value === null || value.trim() === "") return 0;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseCoursesSubTab(subTab: string | null): CoursesSubTab {
  if (subTab === "sessions") return "sessions";
  if (subTab === "catalog") return "cours";
  return "cours";
}

function parseFreePracticeSubTab(subTab: string | null): FreePracticeSubTab {
  if (subTab === "sessions") return "sessions";
  return "pratique-libre";
}

function AdminSessionsPage({
  area,
  activityTypes,
  title,
  allowManualRepeat = false,
}: {
  area: SessionArea;
  activityTypes: string[];
  title: string;
  allowManualRepeat?: boolean;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [calendarRefreshKey, setCalendarRefreshKey] = useState(0);
  const weekOffset = parseWeekOffsetParam(searchParams.get("weekOffset"));
  const activityId = searchParams.get("activityId") ?? undefined;

  const openCopyView = (context?: AddSessionsContext) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("addSessionsFor", area);
    params.set("weekOffset", String(context?.weekOffset ?? weekOffset));
    if (context?.activityId) {
      params.set("activityId", context.activityId);
    } else {
      params.delete("activityId");
    }
    router.replace(`/admin?${params.toString()}`, { scroll: false });
  };

  return (
    <AdminActivitiesTab
      key={calendarRefreshKey}
      activityTypes={activityTypes}
      title={title}
      allowManualRepeat={allowManualRepeat}
      defaultActivityId={activityId}
      onCopyWeeks={openCopyView}
      onSessionsCreated={() => setCalendarRefreshKey((key) => key + 1)}
    />
  );
}

function AdminCopyWeeksPage({
  area,
  activityTypes,
  allowManualRepeat = false,
  onBack,
}: {
  area: SessionArea;
  activityTypes: string[];
  allowManualRepeat?: boolean;
  onBack: () => void;
}) {
  const searchParams = useSearchParams();
  const weekOffset = parseWeekOffsetParam(searchParams.get("weekOffset"));
  const activityId = searchParams.get("activityId") ?? undefined;

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="text-sm font-semibold text-[#4a56dd] hover:underline"
      >
        retour au calendrier
      </button>
      <AdminAddActivitiesTab
        activityTypes={activityTypes}
        allowManualRepeat={allowManualRepeat}
        initialTargetWeekOffset={weekOffset}
        initialActivityId={activityId}
        mode="copy"
      />
    </div>
  );
}

export function AdminTabsWrapper() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const resolveFromUrl = useCallback(() => {
    const addSessionsForParam = searchParams.get("addSessionsFor");
    if (addSessionsForParam === "courses") {
      return {
        tab: "courses",
        coursesSubTab: "sessions" as CoursesSubTab,
        freePracticeSubTab: "pratique-libre" as FreePracticeSubTab,
      };
    }
    if (addSessionsForParam === "free-practice") {
      return {
        tab: "free-practice",
        coursesSubTab: "cours" as CoursesSubTab,
        freePracticeSubTab: "sessions" as FreePracticeSubTab,
      };
    }
    if (addSessionsForParam === "discovery-packs") {
      return {
        tab: "discovery-packs",
        coursesSubTab: "cours" as CoursesSubTab,
        freePracticeSubTab: "pratique-libre" as FreePracticeSubTab,
      };
    }
    if (addSessionsForParam === "visits") {
      return {
        tab: "visits",
        coursesSubTab: "cours" as CoursesSubTab,
        freePracticeSubTab: "pratique-libre" as FreePracticeSubTab,
      };
    }

    const tabFromUrl = searchParams.get("tab");
    const subTabFromUrl = searchParams.get("subTab");

    if (tabFromUrl === "sessions" || tabFromUrl === "add-sessions") {
      return {
        tab: "courses",
        coursesSubTab: "sessions" as CoursesSubTab,
        freePracticeSubTab: "pratique-libre" as FreePracticeSubTab,
      };
    }
    if (tabFromUrl === "activities") {
      return {
        tab: "courses",
        coursesSubTab: "cours" as CoursesSubTab,
        freePracticeSubTab: "pratique-libre" as FreePracticeSubTab,
      };
    }
    if (tabFromUrl === "courses") {
      return {
        tab: "courses",
        coursesSubTab: parseCoursesSubTab(subTabFromUrl),
        freePracticeSubTab: "pratique-libre" as FreePracticeSubTab,
      };
    }
    if (tabFromUrl === "free-practice") {
      return {
        tab: "free-practice",
        coursesSubTab: "cours" as CoursesSubTab,
        freePracticeSubTab: parseFreePracticeSubTab(subTabFromUrl),
      };
    }
    if (tabFromUrl && validTabs.includes(tabFromUrl)) {
      return {
        tab: tabFromUrl,
        coursesSubTab: "cours" as CoursesSubTab,
        freePracticeSubTab: "pratique-libre" as FreePracticeSubTab,
      };
    }
    return {
      tab: "users",
      coursesSubTab: "cours" as CoursesSubTab,
      freePracticeSubTab: "pratique-libre" as FreePracticeSubTab,
    };
  }, [searchParams]);

  const initial = resolveFromUrl();
  const [activeTab, setActiveTab] = useState<string>(initial.tab);
  const [coursesSubTab, setCoursesSubTab] = useState<CoursesSubTab>(initial.coursesSubTab);
  const [freePracticeSubTab, setFreePracticeSubTab] = useState<FreePracticeSubTab>(
    initial.freePracticeSubTab,
  );
  const addSessionsFor = searchParams.get("addSessionsFor") as SessionArea | null;

  const handleBackToCalendar = (area: SessionArea) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("addSessionsFor");
    if (area === "courses") {
      params.set("tab", "courses");
      params.set("subTab", "sessions");
    } else if (area === "free-practice") {
      params.set("tab", "free-practice");
      params.set("subTab", "sessions");
    } else if (area === "discovery-packs") {
      params.set("tab", "discovery-packs");
      params.delete("subTab");
    } else if (area === "visits") {
      params.set("tab", "visits");
      params.delete("subTab");
    }
    router.replace(`/admin?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    const resolved = resolveFromUrl();
    setActiveTab((current) => (current === resolved.tab ? current : resolved.tab));
    if (resolved.tab === "courses") {
      setCoursesSubTab((current) =>
        current === resolved.coursesSubTab ? current : resolved.coursesSubTab,
      );
    }
    if (resolved.tab === "free-practice") {
      setFreePracticeSubTab((current) =>
        current === resolved.freePracticeSubTab ? current : resolved.freePracticeSubTab,
      );
    }
  }, [resolveFromUrl]);

  const syncUrl = (params: URLSearchParams) => {
    setTimeout(() => {
      router.replace(`/admin?${params.toString()}`, { scroll: false });
    }, 0);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);

    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    params.delete("addSessionsFor");

    if (value === "courses") {
      params.set("subTab", coursesSubTab);
    } else if (value === "free-practice") {
      params.set("subTab", freePracticeSubTab);
    } else {
      params.delete("subTab");
    }

    if (value !== "today") {
      params.delete("date");
    }

    syncUrl(params);
  };

  const handleCoursesSubTabChange = (value: string) => {
    const subTab = parseCoursesSubTab(value);
    setCoursesSubTab(subTab);

    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "courses");
    params.set("subTab", subTab);
    params.delete("addSessionsFor");

    syncUrl(params);
  };

  const handleFreePracticeSubTabChange = (value: string) => {
    const subTab = parseFreePracticeSubTab(value);
    setFreePracticeSubTab(subTab);

    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "free-practice");
    params.set("subTab", subTab);
    params.delete("addSessionsFor");

    syncUrl(params);
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid h-auto w-full grid-cols-2 rounded-[14px] bg-[#f2f2f2] p-1 text-black/60 md:grid-cols-3 lg:grid-cols-9">
        <TabsTrigger
          value="today"
          className="rounded-[11px] py-2 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-[#4a56dd] data-[state=active]:shadow-sm"
        >
          aujourd&apos;hui
        </TabsTrigger>
        <TabsTrigger
          value="users"
          className="rounded-[11px] py-2 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-[#4a56dd] data-[state=active]:shadow-sm"
        >
          utilisateurs
        </TabsTrigger>
        <TabsTrigger
          value="courses"
          className="rounded-[11px] py-2 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-[#4a56dd] data-[state=active]:shadow-sm"
        >
          cours
        </TabsTrigger>
        <TabsTrigger
          value="free-practice"
          className="rounded-[11px] py-2 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-[#4a56dd] data-[state=active]:shadow-sm"
        >
          pratique libre
        </TabsTrigger>
        <TabsTrigger
          value="discovery-packs"
          className="rounded-[11px] py-2 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-[#4a56dd] data-[state=active]:shadow-sm"
        >
          packs découverte
        </TabsTrigger>
        <TabsTrigger
          value="visits"
          className="rounded-[11px] py-2 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-[#4a56dd] data-[state=active]:shadow-sm"
        >
          visites
        </TabsTrigger>
        <TabsTrigger
          value="newsletter"
          className="rounded-[11px] py-2 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-[#4a56dd] data-[state=active]:shadow-sm"
        >
          newsletter
        </TabsTrigger>
        <TabsTrigger
          value="square"
          className="rounded-[11px] py-2 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-[#4a56dd] data-[state=active]:shadow-sm"
        >
          square
        </TabsTrigger>
        <TabsTrigger
          value="emails"
          className="rounded-[11px] py-2 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-[#4a56dd] data-[state=active]:shadow-sm"
        >
          e-mails
        </TabsTrigger>
      </TabsList>
      <TabsContent value="today" className="mt-6">
        <AdminTodayTab />
      </TabsContent>
      <TabsContent value="users" className="mt-6">
        <AdminUsersTab />
      </TabsContent>
      <TabsContent value="courses" className="mt-6">
        <Tabs value={coursesSubTab} onValueChange={handleCoursesSubTabChange} className="w-full">
          <TabsList className="mb-6 grid h-auto w-full max-w-md grid-cols-2 rounded-[14px] bg-[#f2f2f2] p-1 text-black/60">
            <TabsTrigger
              value="cours"
              className="rounded-[11px] py-2 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-[#4a56dd] data-[state=active]:shadow-sm"
            >
              cours
            </TabsTrigger>
            <TabsTrigger
              value="sessions"
              className="rounded-[11px] py-2 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-[#4a56dd] data-[state=active]:shadow-sm"
            >
              sessions
            </TabsTrigger>
          </TabsList>
          <TabsContent value="cours" className="mt-0">
            <AdminActivitiesManagementTab activityTypes={COURSE_ACTIVITY_TYPES} />
          </TabsContent>
          <TabsContent value="sessions" className="mt-0">
            {addSessionsFor === "courses" ? (
              <AdminCopyWeeksPage
                area="courses"
                activityTypes={COURSE_ACTIVITY_TYPES}
                onBack={() => handleBackToCalendar("courses")}
              />
            ) : (
              <AdminSessionsPage
                area="courses"
                activityTypes={COURSE_ACTIVITY_TYPES}
                title="sessions des cours"
              />
            )}
          </TabsContent>
        </Tabs>
      </TabsContent>
      <TabsContent value="free-practice" className="mt-6">
        <Tabs
          value={freePracticeSubTab}
          onValueChange={handleFreePracticeSubTabChange}
          className="w-full"
        >
          <TabsList className="mb-6 grid h-auto w-full max-w-md grid-cols-2 rounded-[14px] bg-[#f2f2f2] p-1 text-black/60">
            <TabsTrigger
              value="pratique-libre"
              className="rounded-[11px] py-2 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-[#4a56dd] data-[state=active]:shadow-sm"
            >
              pratique libre
            </TabsTrigger>
            <TabsTrigger
              value="sessions"
              className="rounded-[11px] py-2 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-[#4a56dd] data-[state=active]:shadow-sm"
            >
              sessions
            </TabsTrigger>
          </TabsList>
          <TabsContent value="pratique-libre" className="mt-0">
            <AdminFreePracticeCreditsTab activityTypes={FREE_PRACTICE_ACTIVITY_TYPES} />
          </TabsContent>
          <TabsContent value="sessions" className="mt-0">
            {addSessionsFor === "free-practice" ? (
              <AdminCopyWeeksPage
                area="free-practice"
                activityTypes={FREE_PRACTICE_SESSION_ACTIVITY_TYPES}
                allowManualRepeat
                onBack={() => handleBackToCalendar("free-practice")}
              />
            ) : (
              <AdminSessionsPage
                area="free-practice"
                activityTypes={FREE_PRACTICE_SESSION_ACTIVITY_TYPES}
                title="créneaux d'ouverture de pratique libre"
                allowManualRepeat
              />
            )}
          </TabsContent>
        </Tabs>
      </TabsContent>
      <TabsContent value="discovery-packs" className="mt-6">
        {addSessionsFor === "discovery-packs" ? (
          <AdminCopyWeeksPage
            area="discovery-packs"
            activityTypes={DISCOVERY_PACK_ACTIVITY_TYPES}
            allowManualRepeat
            onBack={() => handleBackToCalendar("discovery-packs")}
          />
        ) : (
          <AdminSessionsPage
            area="discovery-packs"
            activityTypes={DISCOVERY_PACK_ACTIVITY_TYPES}
            title="sessions des packs découverte"
            allowManualRepeat
          />
        )}
      </TabsContent>
      <TabsContent value="visits" className="mt-6">
        <AdminVisitsTab copyMode={addSessionsFor === "visits"} />
      </TabsContent>
      <TabsContent value="newsletter" className="mt-6">
        <AdminNewsletterTab />
      </TabsContent>
      <TabsContent value="square" className="mt-6">
        <AdminSquareTab />
      </TabsContent>
      <TabsContent value="emails" className="mt-6">
        <AdminEmailsTab />
      </TabsContent>
    </Tabs>
  );
}
