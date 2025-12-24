"use client";

import { useEffect, useState, startTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminUsersTab } from "@/components/admin-users-tab";
import { AdminActivitiesTab } from "@/components/admin-activities-tab";
import { AdminAddActivitiesTab } from "@/components/admin-add-activities-tab";
import { AdminActivitiesManagementTab } from "@/components/admin-activities-management-tab";

const validTabs = ["users", "activities", "sessions", "add-sessions"];

export function AdminTabsWrapper() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Initialize from URL or default to "users"
  const getInitialTab = () => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl && validTabs.includes(tabFromUrl)) {
      return tabFromUrl;
    }
    return "users";
  };
  
  const [activeTab, setActiveTab] = useState<string>(getInitialTab);

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl && validTabs.includes(tabFromUrl) && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    // Update state immediately - this will update the tab highlight instantly
    setActiveTab(value);
    
    // Update URL asynchronously without blocking UI
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    
    // Use setTimeout with 0 delay to ensure state update happens first
    setTimeout(() => {
      router.replace(`/admin?${params.toString()}`, { scroll: false });
    }, 0);
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="users">Utilisateurs</TabsTrigger>
        <TabsTrigger value="activities">Activités</TabsTrigger>
        <TabsTrigger value="sessions">Sessions</TabsTrigger>
        <TabsTrigger value="add-sessions">Ajouter des sessions</TabsTrigger>
      </TabsList>
      <TabsContent value="users" className="mt-4">
        <AdminUsersTab />
      </TabsContent>
      <TabsContent value="activities" className="mt-4">
        <AdminActivitiesManagementTab />
      </TabsContent>
      <TabsContent value="sessions" className="mt-4">
        <AdminActivitiesTab />
      </TabsContent>
      <TabsContent value="add-sessions" className="mt-4">
        <AdminAddActivitiesTab />
      </TabsContent>
    </Tabs>
  );
}

