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
  calendarPanel: ReactNode;
  /** Tighter layout when nested (e.g. mon compte). */
  embedded?: boolean;
};

const tabTriggerClassName =
  "rounded-full px-4 py-2.5 text-base font-semibold text-black/60 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm";

export function CoursePageTabs({
  courses,
  calendarPanel,
  embedded = false,
}: CoursePageTabsProps) {
  const [activeTab, setActiveTab] = useState(TAB_CALENDRIER);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash === TAB_OFFRES || hash === TAB_CALENDRIER) {
      setActiveTab(hash);
    }
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const url = new URL(window.location.href);
    url.hash = value;
    window.history.replaceState(
      null,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  };

  return (
    <section
      className={cn(
        "scroll-mt-28",
        embedded ? "mt-0" : "mt-12 md:mt-16",
      )}
    >
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList
          className={cn(
            "mb-8 grid h-auto w-full max-w-lg grid-cols-2 rounded-full bg-[#f2f2f2] p-1",
          )}
        >
          <TabsTrigger value={TAB_CALENDRIER} className={tabTriggerClassName}>
            Calendrier
          </TabsTrigger>
          <TabsTrigger value={TAB_OFFRES} className={tabTriggerClassName}>
            Tous les cours
          </TabsTrigger>
        </TabsList>

        <TabsContent value={TAB_CALENDRIER} id="calendrier" className="mt-0">
          <div
            className={cn(
              "mb-8 max-w-[1196px] space-y-3 leading-normal text-black/75",
              embedded ? "text-base md:text-lg" : "text-xl",
            )}
          >
            <p>Retrouvez notre proposition de cours pour ce mois-ci.</p>
            <p>
              Certains reviennent régulièrement, d&apos;autres sont plus ponctuels.
              Cliquez une discipline pour filtrer, un jour pour le détail — durée,
              crédits, prix et inscription.
            </p>
          </div>
          {calendarPanel}
        </TabsContent>

        <TabsContent value={TAB_OFFRES} id="offres" className="mt-0">
          <CourseListing courses={courses} />
        </TabsContent>
      </Tabs>
    </section>
  );
}
