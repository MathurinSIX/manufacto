"use client";

import { useEffect, useState, type ReactNode } from "react";

import type { Course } from "@/app/cours/course-data";
import { CourseListing } from "@/components/course-listing";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const TAB_CALENDRIER = "calendrier";
const TAB_OFFRES = "offres";

type CoursePageTabsProps = {
  courses: Course[];
  isLoggedIn: boolean;
  interestedActivityIds: string[];
  calendarPanel: ReactNode;
};

const tabTriggerClassName =
  "rounded-full px-4 py-2.5 text-base font-semibold text-black/60 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm";

export function CoursePageTabs({
  courses,
  isLoggedIn,
  interestedActivityIds,
  calendarPanel,
}: CoursePageTabsProps) {
  const [activeTab, setActiveTab] = useState(TAB_OFFRES);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash === TAB_OFFRES || hash === TAB_CALENDRIER) {
      setActiveTab(hash);
    }
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    window.history.replaceState(null, "", `${window.location.pathname}#${value}`);
  };

  return (
    <section className="mt-[92px] scroll-mt-28">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList
          className={cn(
            "mb-8 grid h-auto w-full max-w-lg grid-cols-2 rounded-full bg-[#f2f2f2] p-1",
          )}
        >
          <TabsTrigger value={TAB_OFFRES} className={tabTriggerClassName}>
            découvrir nos offres
          </TabsTrigger>
          <TabsTrigger value={TAB_CALENDRIER} className={tabTriggerClassName}>
            calendrier des cours
          </TabsTrigger>
        </TabsList>

        <TabsContent value={TAB_OFFRES} id="offres" className="mt-0">
          <CourseListing
            courses={courses}
            isLoggedIn={isLoggedIn}
            interestedActivityIds={interestedActivityIds}
          />
        </TabsContent>

        <TabsContent value={TAB_CALENDRIER} id="calendrier" className="mt-0">
          <div className="mb-8 max-w-[1196px] text-xl leading-normal text-black/75">
            <p>Retrouvez notre proposition de cours pour ce mois-ci.</p>
            <p className="mt-5">
              Certains reviennent régulièrement, d&apos;autres sont plus ponctuels.
            </p>
          </div>
          {calendarPanel}
        </TabsContent>
      </Tabs>
    </section>
  );
}
