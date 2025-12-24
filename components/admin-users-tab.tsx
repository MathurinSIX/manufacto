"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getAllUsers, createUser, addCreditToUser, makeUserAdmin, removeUserAdmin } from "@/app/admin/actions";
import { Plus, Loader2, Coins, Shield, ShieldOff } from "lucide-react";

type User = {
  id: string;
  email: string;
  user_metadata?: {
    first_name?: string;
    last_name?: string;
  };
  app_metadata?: {
    role?: string;
  };
  created_at: string;
  credits?: number;
};

export function AdminUsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [addCreditDialogOpen, setAddCreditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [creditAmount, setCreditAmount] = useState<string>("");
  const [addingCredit, setAddingCredit] = useState(false);
  
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserFirstName, setNewUserFirstName] = useState("");
  const [newUserLastName, setNewUserLastName] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAllUsers();
      if (result.error) {
        setError(result.error);
      } else {
        setUsers(result.users as User[]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur s'est produite");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);

    try {
      const metadata: { first_name?: string; last_name?: string } = {};
      if (newUserFirstName) metadata.first_name = newUserFirstName;
      if (newUserLastName) metadata.last_name = newUserLastName;

      const result = await createUser(
        newUserEmail,
        Object.keys(metadata).length > 0 ? metadata : undefined
      );

      if (result.error) {
        setError(result.error);
      } else {
        setDialogOpen(false);
        setNewUserEmail("");
        setNewUserFirstName("");
        setNewUserLastName("");
        await loadUsers();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur s'est produite");
    } finally {
      setCreating(false);
    }
  };

  const handleAddCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setAddingCredit(true);
    setError(null);

    try {
      const amount = parseFloat(creditAmount);
      
      if (Number.isNaN(amount) || amount <= 0) {
        setError("Le montant doit être un nombre positif");
        setAddingCredit(false);
        return;
      }

      const result = await addCreditToUser(selectedUser.id, amount);

      if (result.error) {
        setError(result.error);
      } else {
        setAddCreditDialogOpen(false);
        setSelectedUser(null);
        setCreditAmount("");
        await loadUsers();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur s'est produite");
    } finally {
      setAddingCredit(false);
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Liste des utilisateurs</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un utilisateur
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreateUser}>
              <DialogHeader>
                <DialogTitle>Nouvel utilisateur</DialogTitle>
                <DialogDescription>
                  Créez un nouveau compte utilisateur. Un email d'invitation sera envoyé pour définir le mot de passe.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input
                    id="firstName"
                    value={newUserFirstName}
                    onChange={(e) => setNewUserFirstName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input
                    id="lastName"
                    value={newUserLastName}
                    onChange={(e) => setNewUserLastName(e.target.value)}
                  />
                </div>
              </div>
              {error && (
                <div className="text-sm text-destructive mb-4">{error}</div>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Création...
                    </>
                  ) : (
                    "Créer"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && !loading && (
        <div className="text-sm text-destructive p-4 bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      <div className="border rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4 font-medium">Email</th>
                <th className="text-left p-4 font-medium">Nom</th>
                <th className="text-left p-4 font-medium">Crédits</th>
                <th className="text-left p-4 font-medium">Rôle</th>
                <th className="text-left p-4 font-medium">Date de création</th>
                <th className="text-right p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-muted-foreground">
                    Aucun utilisateur trouvé
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const name = user.user_metadata?.first_name && user.user_metadata?.last_name
                    ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
                    : user.user_metadata?.first_name || user.user_metadata?.last_name || "-";
                  const isAdmin = user.app_metadata?.role === "admin";
                  
                  return (
                    <tr key={user.id} className="border-b">
                      <td className="p-4">{user.email}</td>
                      <td className="p-4">{name}</td>
                      <td className="p-4 font-medium">
                        {Math.round(user.credits || 0)}
                      </td>
                      <td className="p-4">
                        {isAdmin ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-sm font-medium">
                            <Shield className="h-3 w-3" />
                            Admin
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">Utilisateur</span>
                        )}
                      </td>
                      <td className="p-4">
                        {new Date(user.created_at).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(user);
                              setAddCreditDialogOpen(true);
                              setCreditAmount("");
                              setError(null);
                            }}
                          >
                            <Coins className="h-4 w-4 mr-2" />
                            Crédits
                          </Button>
                          {isAdmin ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                if (!confirm(`Êtes-vous sûr de vouloir retirer le rôle admin de ${user.email} ?`)) {
                                  return;
                                }
                                setError(null);
                                try {
                                  const result = await removeUserAdmin(user.id);
                                  if (result.error) {
                                    setError(result.error);
                                  } else {
                                    await loadUsers();
                                  }
                                } catch (err) {
                                  setError(err instanceof Error ? err.message : "Une erreur s'est produite");
                                }
                              }}
                            >
                              <ShieldOff className="h-4 w-4 mr-2" />
                              Retirer admin
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                if (!confirm(`Êtes-vous sûr de vouloir donner le rôle admin à ${user.email} ?`)) {
                                  return;
                                }
                                setError(null);
                                try {
                                  const result = await makeUserAdmin(user.id);
                                  if (result.error) {
                                    setError(result.error);
                                  } else {
                                    await loadUsers();
                                  }
                                } catch (err) {
                                  setError(err instanceof Error ? err.message : "Une erreur s'est produite");
                                }
                              }}
                            >
                              <Shield className="h-4 w-4 mr-2" />
                              Rendre admin
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Credit Dialog */}
      <Dialog open={addCreditDialogOpen} onOpenChange={setAddCreditDialogOpen}>
        <DialogContent>
          <form onSubmit={handleAddCredit}>
            <DialogHeader>
              <DialogTitle>Ajouter des crédits</DialogTitle>
              <DialogDescription>
                Ajoutez des crédits à {selectedUser?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="creditAmount">Montant *</Label>
                <Input
                  id="creditAmount"
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  required
                  placeholder="Ex: 10"
                />
                <p className="text-xs text-muted-foreground">
                  Entrez le nombre de crédits à ajouter
                </p>
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
                  setAddCreditDialogOpen(false);
                  setSelectedUser(null);
                  setCreditAmount("");
                  setError(null);
                }}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={addingCredit}>
                {addingCredit ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Ajout...
                  </>
                ) : (
                  "Ajouter"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

