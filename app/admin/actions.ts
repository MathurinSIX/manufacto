"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createClient as createAdminClient } from "@supabase/supabase-js";

// Create admin client for admin operations
function getAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  }
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

// Check if user is admin
async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user || user.app_metadata?.role !== "admin") {
    throw new Error("Unauthorized");
  }
  
  return user;
}

// Get all users
export async function getAllUsers() {
  await checkAdmin();
  const adminClient = getAdminClient();
  const supabase = await createClient();
  
  const { data, error } = await adminClient.auth.admin.listUsers();
  
  if (error) {
    console.error("Error fetching users:", error);
    return { error: error.message, users: [] };
  }
  
  // Get credits for all users
  const userIds = data.users?.map(u => u.id) || [];
  const creditsMap: Record<string, number> = {};
  
  if (userIds.length > 0) {
    const { data: creditsData } = await supabase
      .from("credit")
      .select("user_id, amount")
      .in("user_id", userIds);
    
    if (creditsData) {
      creditsData.forEach((credit) => {
        const userId = credit.user_id;
        const amount = typeof credit.amount === "number" 
          ? credit.amount 
          : parseFloat(String(credit.amount)) || 0;
        
        if (!creditsMap[userId]) {
          creditsMap[userId] = 0;
        }
        creditsMap[userId] += amount;
      });
    }
  }
  
  // Add credits to each user
  const usersWithCredits = data.users?.map(user => ({
    ...user,
    credits: creditsMap[user.id] || 0,
  })) || [];
  
  return { users: usersWithCredits, error: null };
}

// Add credit to a user
export async function addCreditToUser(userId: string, amount: number) {
  await checkAdmin();
  const supabase = await createClient();
  
  if (amount <= 0) {
    return { error: "Le montant doit être supérieur à 0", credit: null };
  }
  
  const { data, error } = await supabase
    .from("credit")
    .insert({
      user_id: userId,
      amount: amount,
    })
    .select()
    .maybeSingle();
  
  if (error) {
    console.error("Error adding credit:", error);
    return { error: error.message, credit: null };
  }
  
  if (!data) {
    return { error: "Failed to add credit", credit: null };
  }
  
  revalidatePath("/admin");
  return { credit: data, error: null };
}

// Make a user admin
export async function makeUserAdmin(userId: string) {
  await checkAdmin();
  const adminClient = getAdminClient();
  
  const { data, error } = await adminClient.auth.admin.updateUserById(
    userId,
    {
      app_metadata: {
        role: "admin",
      },
    }
  );
  
  if (error) {
    console.error("Error making user admin:", error);
    return { error: error.message, user: null };
  }
  
  revalidatePath("/admin");
  return { user: data.user, error: null };
}

// Remove admin role from a user
export async function removeUserAdmin(userId: string) {
  await checkAdmin();
  const adminClient = getAdminClient();
  
  const { data, error } = await adminClient.auth.admin.updateUserById(
    userId,
    {
      app_metadata: {
        role: null,
      },
    }
  );
  
  if (error) {
    console.error("Error removing admin role:", error);
    return { error: error.message, user: null };
  }
  
  revalidatePath("/admin");
  return { user: data.user, error: null };
}

// Create a new user
export async function createUser(email: string, metadata?: { first_name?: string; last_name?: string }) {
  await checkAdmin();
  const adminClient = getAdminClient();
  
  // Create user without password - they will receive an invitation email to set their password
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    email_confirm: false, // They need to confirm via invitation
    user_metadata: metadata,
  });
  
  if (error) {
    console.error("Error creating user:", error);
    return { error: error.message, user: null };
  }
  
  // Send invitation email to the user so they can set their password
  if (data.user) {
    const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: metadata,
    });
    
    if (inviteError) {
      console.error("Error sending invitation:", inviteError);
      // User is created but invitation failed - still return success
    }
  }
  
  revalidatePath("/admin");
  return { user: data.user, error: null };
}

// Get all activities with sessions
export async function getAllActivitiesWithSessions() {
  await checkAdmin();
  const supabase = await createClient();
  
  const { data: activities, error: activitiesError } = await supabase
    .from("activity")
    .select("id, name, nb_credits")
    .order("name");
  
  if (activitiesError) {
    return { error: activitiesError.message, activities: [] };
  }
  
  // Get all sessions
  const { data: sessions, error: sessionsError } = await supabase
    .from("session")
    .select("id, start_ts, end_ts, activity_id, max_registrations")
    .order("start_ts");
  
  if (sessionsError) {
    return { error: sessionsError.message, activities: [] };
  }
  
  // Get all registrations
  const { data: registrations, error: registrationsError } = await supabase
    .from("registration")
    .select("id, user_id, session_id");
  
  if (registrationsError) {
    return { error: registrationsError.message, activities: [] };
  }
  
  // Get all registration statuses to filter out cancelled ones
  const registrationIds = registrations?.map(r => r.id) || [];
  const activeRegistrationIds = new Set<string>();
  
  if (registrationIds.length > 0) {
    const { data: statuses } = await supabase
      .from("registration_status")
      .select("registration_id, status, created_at")
      .in("registration_id", registrationIds)
      .order("created_at", { ascending: false });
    
    if (statuses) {
      // Get the latest status for each registration
      const seenRegistrations = new Set<string>();
      for (const status of statuses) {
        if (!seenRegistrations.has(status.registration_id)) {
          seenRegistrations.add(status.registration_id);
          // Only include non-cancelled registrations
          if (status.status !== "CANCELLED") {
            activeRegistrationIds.add(status.registration_id);
          }
        }
      }
      
      // Also include registrations that don't have any status (new registrations)
      for (const id of registrationIds) {
        if (!seenRegistrations.has(id)) {
          activeRegistrationIds.add(id);
        }
      }
    } else {
      // If no statuses, include all registrations
      for (const id of registrationIds) {
        activeRegistrationIds.add(id);
      }
    }
  }
  
  // Get user details for registrations
  const adminClient = getAdminClient();
  const { data: usersData } = await adminClient.auth.admin.listUsers();
  const usersMap = new Map(usersData.users.map(u => [u.id, u]));
  
  // Group sessions by activity and date
  const activitiesWithSessions = activities?.map(activity => {
    const activitySessions = sessions?.filter(s => s.activity_id === activity.id) || [];
    
    // Group by date
    const sessionsByDate: Record<string, typeof activitySessions> = {};
    activitySessions.forEach(session => {
      const dateKey = new Date(session.start_ts).toISOString().split('T')[0];
      if (!sessionsByDate[dateKey]) {
        sessionsByDate[dateKey] = [];
      }
      sessionsByDate[dateKey].push(session);
    });
    
    // Add registrations to each session (only non-cancelled)
    const sessionsWithRegistrations = Object.entries(sessionsByDate).map(([date, dateSessions]) => {
      const sessionsWithRegs = dateSessions.map(session => {
        const sessionRegistrations = registrations?.filter(r => 
          r.session_id === session.id && activeRegistrationIds.has(r.id)
        ) || [];
        const registeredUsers = sessionRegistrations.map(reg => {
          const user = usersMap.get(reg.user_id);
          return {
            registrationId: reg.id,
            userId: reg.user_id,
            email: user?.email || "Unknown",
            name: user?.user_metadata?.first_name && user?.user_metadata?.last_name
              ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
              : user?.email || "Unknown",
          };
        });
        
        return {
          ...session,
          registeredUsers,
          max_registrations: session.max_registrations ?? null,
        };
      });
      
      return {
        date,
        sessions: sessionsWithRegs,
      };
    });
    
    return {
      ...activity,
      sessionsByDate: sessionsWithRegistrations,
    };
  }) || [];
  
  return { activities: activitiesWithSessions, error: null };
}

// Add user to activity session
export async function addUserToSession(sessionId: string, userId: string, paymentType: string) {
  await checkAdmin();
  const supabase = await createClient();
  
  // Check if registration already exists
  const { data: existing } = await supabase
    .from("registration")
    .select("id")
    .eq("session_id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();
  
  if (existing) {
    return { error: "User already registered for this session", registration: null };
  }
  
  if (!paymentType) {
    return { error: "Le type de paiement est requis", registration: null };
  }
  
  const { data, error } = await supabase
    .from("registration")
    .insert({
      session_id: sessionId,
      user_id: userId,
      payment_type: paymentType,
    })
    .select()
    .maybeSingle();
  
  if (error) {
    console.error("Error adding user to session:", error);
    return { error: error.message, registration: null };
  }
  
  if (!data) {
    return { error: "Failed to create registration", registration: null };
  }
  
  // Create initial registration status
  await supabase
    .from("registration_status")
    .insert({
      registration_id: data.id,
      status: "CONFIRMED",
    });
  
  revalidatePath("/admin");
  return { registration: data, error: null };
}

// Remove user from activity session
export async function removeUserFromSession(registrationId: string) {
  await checkAdmin();
  const supabase = await createClient();
  
  // Cancel the registration by adding a CANCELLED status
  const { error } = await supabase
    .from("registration_status")
    .insert({
      registration_id: registrationId,
      status: "CANCELLED",
    });
  
  if (error) {
    console.error("Error removing user from session:", error);
    return { error: error.message };
  }
  
  revalidatePath("/admin");
  return { error: null };
}

// Get sessions from previous week for batch creation
export async function getPreviousWeekSessions(activityId: string, weekOffset: number = -1) {
  await checkAdmin();
  const supabase = await createClient();
  
  const now = new Date();
  
  // Get the Monday of the current week
  const currentDay = now.getDay();
  const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1; // Sunday = 0, so 6 days from Monday
  const currentMonday = new Date(now);
  currentMonday.setDate(now.getDate() - daysFromMonday);
  currentMonday.setHours(0, 0, 0, 0);
  
  // Calculate the Monday of the selected week
  // weekOffset: -1 = previous week, -2 = 2 weeks ago, 0 = current week, etc.
  const selectedWeekMonday = new Date(currentMonday);
  selectedWeekMonday.setDate(currentMonday.getDate() + weekOffset * 7);
  
  // Calculate the Sunday of the selected week (end of week)
  const selectedWeekSunday = new Date(selectedWeekMonday);
  selectedWeekSunday.setDate(selectedWeekMonday.getDate() + 7);
  selectedWeekSunday.setHours(23, 59, 59, 999);
  
  const { data: sessions, error } = await supabase
    .from("session")
    .select("id, start_ts, end_ts, activity_id, max_registrations")
    .eq("activity_id", activityId)
    .gte("start_ts", selectedWeekMonday.toISOString())
    .lt("start_ts", selectedWeekSunday.toISOString())
    .order("start_ts");
  
  if (error) {
    return { error: error.message, sessions: [] };
  }
  
  return { sessions: sessions || [], error: null };
}

// Create a single session
export async function createSession(
  activityId: string,
  start_ts: string,
  end_ts: string,
  max_registrations: number | null
) {
  await checkAdmin();
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("session")
    .insert({
      activity_id: activityId,
      start_ts,
      end_ts,
      max_registrations,
    })
    .select()
    .single();
  
  if (error) {
    console.error("Error creating session:", error);
    return { error: error.message, session: null };
  }
  
  revalidatePath("/admin");
  return { session: data, error: null };
}

// Create activities by batch based on previous week
export async function createActivitiesBatch(activityId: string, weekOffset: number = -1, targetWeekOffset: number = 0) {
  await checkAdmin();
  const supabase = await createClient();
  
  // Get sessions from selected week
  const { sessions, error: fetchError } = await getPreviousWeekSessions(activityId, weekOffset);
  
  if (fetchError || !sessions || sessions.length === 0) {
    return { error: "No sessions found in selected week to duplicate", created: 0 };
  }
  
  // Calculate how many weeks ahead to create the new sessions
  // targetWeekOffset - weekOffset gives us the difference
  const weeksAhead = targetWeekOffset - weekOffset;
  
  // Create new sessions the specified number of weeks later
  const newSessions = sessions.map(session => {
    const oldStart = new Date(session.start_ts);
    const oldEnd = new Date(session.end_ts);
    const weekInMs = weeksAhead * 7 * 24 * 60 * 60 * 1000;
    
    return {
      activity_id: activityId,
      start_ts: new Date(oldStart.getTime() + weekInMs).toISOString(),
      end_ts: new Date(oldEnd.getTime() + weekInMs).toISOString(),
      max_registrations: session.max_registrations,
    };
  });
  
  const { data, error } = await supabase
    .from("session")
    .insert(newSessions)
    .select();
  
  if (error) {
    console.error("Error creating batch sessions:", error);
    return { error: error.message, created: 0 };
  }
  
  revalidatePath("/admin");
  return { created: data?.length || 0, error: null };
}

// Get all activities
export async function getAllActivities() {
  await checkAdmin();
  const supabase = await createClient();
  
  const { data: activities, error } = await supabase
    .from("activity")
    .select("id, name, nb_credits, type, price, description")
    .order("type, name");
  
  if (error) {
    console.error("Error fetching activities:", error);
    return { error: error.message, activities: [] };
  }
  
  return { activities: activities || [], error: null };
}

// Create a new activity
export async function createActivity(
  name: string,
  nb_credits: number | null,
  type: string,
  price: number | null,
  description: string | null
) {
  await checkAdmin();
  const supabase = await createClient();
  
  if (!type) {
    return { error: "Le type est requis", activity: null };
  }
  
  const { data, error } = await supabase
    .from("activity")
    .insert({
      name,
      nb_credits,
      type,
      price: price || null,
      description: description || null,
    })
    .select()
    .maybeSingle();
  
  if (error) {
    console.error("Error creating activity:", error);
    return { error: error.message, activity: null };
  }
  
  if (!data) {
    return { error: "Failed to create activity", activity: null };
  }
  
  revalidatePath("/admin");
  return { activity: data, error: null };
}

// Update an activity
export async function updateActivity(
  id: string,
  name: string,
  nb_credits: number | null,
  type: string,
  price: number | null,
  description: string | null
) {
  await checkAdmin();
  const supabase = await createClient();
  
  if (!type) {
    return { error: "Le type est requis", activity: null };
  }
  
  const { data, error } = await supabase
    .from("activity")
    .update({
      name,
      nb_credits,
      type,
      price: price || null,
      description: description || null,
    })
    .eq("id", id)
    .select();
  
  if (error) {
    console.error("Error updating activity:", error);
    return { error: error.message, activity: null };
  }
  
  if (!data || data.length === 0) {
    return { error: "Activity not found", activity: null };
  }
  
  revalidatePath("/admin");
  return { activity: data[0], error: null };
}

// Update a session
export async function updateSession(
  sessionId: string,
  start_ts: string,
  end_ts: string,
  max_registrations: number | null
) {
  await checkAdmin();
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("session")
    .update({
      start_ts,
      end_ts,
      max_registrations,
    })
    .eq("id", sessionId)
    .select()
    .single();
  
  if (error) {
    console.error("Error updating session:", error);
    return { error: error.message, session: null };
  }
  
  revalidatePath("/admin");
  return { session: data, error: null };
}

// Delete an activity
export async function deleteActivity(id: string) {
  await checkAdmin();
  const supabase = await createClient();
  
  // Check if there are any sessions for this activity
  const { data: sessions, error: sessionsError } = await supabase
    .from("session")
    .select("id")
    .eq("activity_id", id)
    .limit(1);
  
  if (sessionsError) {
    return { error: sessionsError.message };
  }
  
  if (sessions && sessions.length > 0) {
    return { error: "Impossible de supprimer une activité qui a des sessions associées" };
  }
  
  const { error } = await supabase
    .from("activity")
    .delete()
    .eq("id", id);
  
  if (error) {
    console.error("Error deleting activity:", error);
    return { error: error.message };
  }
  
  revalidatePath("/admin");
  return { error: null };
}

