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
} from "@/app/admin/actions";
import { Loader2, Plus, X, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

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
};

type Activity = {
  id: string;
  name: string;
  nb_credits: number | null;
  sessionsByDate: {
    date: string;
    sessions: SessionWithUsers[];
  }[];
};

export function AdminActivitiesTab() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSession, setSelectedSession] = useState<SessionWithUsers | null>(null);
  const [usersDialogOpen, setUsersDialogOpen] = useState(false);
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedPaymentType, setSelectedPaymentType] = useState<string>("");
  const [adding, setAdding] = useState(false);

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

  // Get all sessions for the selected date, flattened and with activity info
  const sessionsForDate = useMemo(() => {
    const dateKey = selectedDate.toISOString().split('T')[0];
    const allSessions: SessionWithUsers[] = [];
    
    activities.forEach(activity => {
      const dayData = activity.sessionsByDate.find(d => d.date === dateKey);
      if (dayData) {
        dayData.sessions.forEach(session => {
          allSessions.push({
            ...session,
            activity_id: activity.id,
            activity_name: activity.name,
          });
        });
      }
    });
    
    return allSessions.sort((a, b) => 
      new Date(a.start_ts).getTime() - new Date(b.start_ts).getTime()
    );
  }, [activities, selectedDate]);

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
        // Refresh the dialog if it's open
        if (selectedSession) {
          const updatedSession = sessionsForDate.find(s => s.id === selectedSession.id);
          if (updatedSession) {
            setSelectedSession(updatedSession);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur s'est produite");
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
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
      </div>

      {error && (
        <div className="text-sm text-destructive p-4 bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      {/* Day Navigation */}
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

      {/* Hourly Calendar View */}
      {sessionsForDate.length === 0 ? (
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
      )}

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
