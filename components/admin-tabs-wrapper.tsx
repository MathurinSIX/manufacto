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

const validTabs = [
  "users",
  "courses",
  "free-practice",
  "visits",
  "newsletter",
  "square",
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
type SessionArea = "courses" | "free-practice";

function parseCoursesSubTab(subTab: string | null): CoursesSubTab {
  if (subTab === "sessions") return "sessions";
  if (subTab === "catalog") return "cours";
  return "cours";
}

function parseFreePracticeSubTab(subTab: string | null): FreePracticeSubTab {
  if (subTab === "sessions") return "sessions";
  return "pratique-libre";
}

export function AdminTabsWrapper() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const getAddSessionsArea = useCallback((): SessionArea | null => {
    const addSessionsForParam = searchParams.get("addSessionsFor");
    if (addSessionsForParam === "courses" || addSessionsForParam === "free-practice") {
      return addSessionsForParam;
    }
    if (searchParams.get("tab") === "add-sessions") {
      return "free-practice";
    }
    return null;
  }, [searchParams]);

  const resolveFromUrl = useCallback(() => {
    const addSessionsArea = getAddSessionsArea();
    if (addSessionsArea === "courses") {
      return {
        tab: "courses",
        coursesSubTab: "sessions" as CoursesSubTab,
        freePracticeSubTab: "pratique-libre" as FreePracticeSubTab,
      };
    }
    if (addSessionsArea === "free-practice") {
      return {
        tab: "free-practice",
        coursesSubTab: "cours" as CoursesSubTab,
        freePracticeSubTab: "sessions" as FreePracticeSubTab,
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
  }, [getAddSessionsArea, searchParams]);

  const initial = resolveFromUrl();
  const [activeTab, setActiveTab] = useState<string>(initial.tab);
  const [coursesSubTab, setCoursesSubTab] = useState<CoursesSubTab>(initial.coursesSubTab);
  const [freePracticeSubTab, setFreePracticeSubTab] = useState<FreePracticeSubTab>(
    initial.freePracticeSubTab,
  );
  const [addSessionsFor, setAddSessionsFor] = useState<SessionArea | null>(getAddSessionsArea);

  useEffect(() => {
    const addSessionsArea = getAddSessionsArea();
    if (addSessionsArea) {
      setAddSessionsFor(addSessionsArea);
      if (addSessionsArea === "courses") {
        setActiveTab((current) => current === "courses" ? current : "courses");
        setCoursesSubTab((current) => current === "sessions" ? current : "sessions");
      } else {
        setActiveTab((current) =>
          current === "free-practice" ? current : "free-practice",
        );
        setFreePracticeSubTab((current) =>
          current === "sessions" ? current : "sessions",
        );
      }
      return;
    }

    const resolved = resolveFromUrl();
    setAddSessionsFor(null);
    setActiveTab((current) => current === resolved.tab ? current : resolved.tab);
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
  }, [getAddSessionsArea, resolveFromUrl]);

  const syncUrl = (params: URLSearchParams) => {
    setTimeout(() => {
      router.replace(`/admin?${params.toString()}`, { scroll: false });
    }, 0);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setAddSessionsFor(null);

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

    syncUrl(params);
  };

  const handleCoursesSubTabChange = (value: string) => {
    const subTab = parseCoursesSubTab(value);
    setCoursesSubTab(subTab);
    setAddSessionsFor(null);

    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "courses");
    params.set("subTab", subTab);
    params.delete("addSessionsFor");

    syncUrl(params);
  };

  const handleFreePracticeSubTabChange = (value: string) => {
    const subTab = parseFreePracticeSubTab(value);
    setFreePracticeSubTab(subTab);
    setAddSessionsFor(null);

    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "free-practice");
    params.set("subTab", subTab);
    params.delete("addSessionsFor");

    syncUrl(params);
  };

  const handleAddSessions = (area: SessionArea) => {
    setAddSessionsFor(area);

    const params = new URLSearchParams(searchParams.toString());
    params.set("addSessionsFor", area);

    if (area === "courses") {
      setActiveTab("courses");
      setCoursesSubTab("sessions");
      params.set("tab", "courses");
      params.set("subTab", "sessions");
    } else {
      setActiveTab("free-practice");
      setFreePracticeSubTab("sessions");
      params.set("tab", "free-practice");
      params.set("subTab", "sessions");
    }

    syncUrl(params);
  };

  const handleBackToSessions = () => {
    const area = addSessionsFor ?? "free-practice";
    setAddSessionsFor(null);

    const params = new URLSearchParams(searchParams.toString());
    params.delete("addSessionsFor");

    if (area === "courses") {
      params.set("tab", "courses");
      params.set("subTab", "sessions");
    } else {
      params.set("tab", "free-practice");
      params.set("subTab", "sessions");
    }

    syncUrl(params);
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid h-auto w-full grid-cols-2 rounded-[14px] bg-[#f2f2f2] p-1 text-black/60 md:grid-cols-3 lg:grid-cols-6">
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
      </TabsList>
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
              <div className="space-y-6">
                <button
                  type="button"
                  onClick={handleBackToSessions}
                  className="text-sm font-semibold text-[#4a56dd] hover:underline"
                >
                  retour aux sessions
                </button>
                <AdminAddActivitiesTab activityTypes={COURSE_ACTIVITY_TYPES} />
              </div>
            ) : (
              <AdminActivitiesTab
                activityTypes={COURSE_ACTIVITY_TYPES}
                title="sessions des cours"
                onAddSessions={() => handleAddSessions("courses")}
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
              <div className="space-y-6">
                <button
                  type="button"
                  onClick={handleBackToSessions}
                  className="text-sm font-semibold text-[#4a56dd] hover:underline"
                >
                  retour aux créneaux
                </button>
                <AdminAddActivitiesTab
                  activityTypes={FREE_PRACTICE_SESSION_ACTIVITY_TYPES}
                  allowManualRepeat
                />
              </div>
            ) : (
              <AdminActivitiesTab
                activityTypes={FREE_PRACTICE_SESSION_ACTIVITY_TYPES}
                title="créneaux d'ouverture de pratique libre"
                onAddSessions={() => handleAddSessions("free-practice")}
              />
            )}
          </TabsContent>
        </Tabs>
      </TabsContent>
      <TabsContent value="visits" className="mt-6">
        <AdminVisitsTab />
      </TabsContent>
      <TabsContent value="newsletter" className="mt-6">
        <AdminNewsletterTab />
      </TabsContent>
      <TabsContent value="square" className="mt-6">
        <AdminSquareTab />
      </TabsContent>
    </Tabs>
  );
}
