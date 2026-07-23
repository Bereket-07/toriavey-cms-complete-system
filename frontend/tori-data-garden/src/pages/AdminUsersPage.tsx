import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Shield,
  UserPlus,
  Trash2,
  Mail,
  CheckCircle2,
  Search,
  User as UserIcon,
  X,
  Loader2,
  Ban,
  Unlock,
} from "lucide-react";
import { apiGet, apiPost, apiDelete, apiPatch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { PageHero } from "@/components/studio";

type AuthorizedUser = {
  id: number;
  email: string;
  name?: string;
  role: string;
  is_active: boolean;
};

export default function AdminUsersPage() {
  const { auth, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [users, setUsers] = useState<AuthorizedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
      return;
    }
    if (!auth.user?.isSuperAdmin) {
      navigate("/cms/dashboard");
      toast({
        title: "Access Denied",
        description: "You do not have permission to view this page.",
        variant: "destructive",
      });
      return;
    }
    fetchUsers();
  }, [auth, navigate]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const data = await apiGet("/api/admin/users");
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users", error);
      toast({
        title: "Error",
        description: "Failed to load users list",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail) return;

    try {
      setIsSubmitting(true);
      await apiPost("/api/admin/users", { email: newUserEmail });
      toast({
        title: "User Added",
        description: `${newUserEmail} has been granted access.`,
      });
      setIsAddModalOpen(false);
      setNewUserEmail("");
      fetchUsers();
    } catch (error) {
      toast({
        title: "Failed to add user",
        description: "Email might be invalid or already exists.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: number, email: string) => {
    if (!confirm(`Are you sure you want to remove access for ${email}?`))
      return;

    try {
      await apiDelete(`/api/admin/users/${userId}`);
      toast({
        title: "Access Revoked",
        description: `User ${email} has been removed.`,
      });
      setUsers(users.filter((u) => u.id !== userId));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove user",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (user: AuthorizedUser) => {
    const newStatus = !user.is_active;
    const action = newStatus ? "Unblocked" : "Blocked";

    try {
      const updatedUser = await apiPatch<AuthorizedUser>(
        `/api/admin/users/${user.id}/status`,
        { is_active: newStatus },
      );

      setUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));
      toast({
        title: `User ${action}`,
        description: `${user.email} is now ${newStatus ? "Active" : "Inactive"}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action.toLowerCase()} user`,
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.name &&
        user.name.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-muted/40/50">
        <Loader2 className="h-8 w-8 animate-spin text-[#A9542F]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40/30 p-8">
      <div className="space-y-8 animate-in fade-in duration-500 pb-8">
        <PageHero
          eyebrow="Access Control"
          title="User Management"
          subtitle="Manage who has access to the Tori Avey CMS."
          icon={Shield}
          actions={
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="gap-2 bg-white text-[#6D28D9] hover:bg-white/90"
            >
              <UserPlus className="h-4 w-4" /> Add user
            </Button>
          }
        />

        {/* Content Card */}
        <Card className="border border-border bg-card overflow-hidden rounded-2xl shadow-[var(--shadow-sm)]">
          <CardContent className="p-0">
            {/* Toolbar */}
            <div className="p-6 border-b border-border bg-card/50 flex items-center gap-4">
              <div className="relative flex-1 max-w-md group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-[#B85C3C] transition-colors" />
                <input
                  type="text"
                  placeholder="Search users by email..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-muted/40 border-none ring-1 border-border focus:ring-2 focus:ring-[#B85C3C]/20 focus:bg-card transition-all outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {users.length}
                </span>{" "}
                Authorized Users
              </div>
            </div>

            {/* Users List */}
            <div className="overflow-x-auto">
              {filteredUsers.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 text-muted-foreground">
                    <UserIcon className="h-8 w-8" />
                  </div>
                  <p className="text-lg font-medium text-foreground">
                    No users found
                  </p>
                  <p className="max-w-xs mx-auto mt-2">
                    Try adjusting your search or add a new user to the system.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead className="bg-muted/40/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="group hover:bg-[#FBF1EA]/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#F3DECF] to-[#E8EDD8] flex items-center justify-center text-[#8A3F26] font-bold border border-white shadow-sm ring-2 ring-transparent group-hover:ring-[#E8C4B2] transition-all">
                              {user.email.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-foreground flex items-center gap-2">
                                {user.email}
                                {auth.user?.email === user.email && (
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px] h-4 px-1.5"
                                  >
                                    YOU
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                Added via Admin
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            variant="outline"
                            className={`capitalize ${user.role === "super_admin" || user.role === "admin" ? "bg-[#F3DECF] text-[#8A3F26] border-none" : "bg-muted text-muted-foreground border-none"}`}
                          >
                            {user.role}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div
                            className={`flex items-center gap-1.5 text-sm font-medium ${user.is_active ? "text-[#16A34A]" : "text-[#DC2626]"}`}
                          >
                            {user.is_active ? (
                              <>
                                <CheckCircle2 className="h-4 w-4" /> Active
                              </>
                            ) : (
                              <>
                                <Ban className="h-4 w-4" /> Inactive
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {auth.user?.email !== user.email && (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className={
                                  user.is_active
                                    ? "text-muted-foreground hover:text-orange-600 hover:bg-orange-50"
                                    : "text-muted-foreground hover:text-green-600 hover:bg-green-50"
                                }
                                onClick={() => handleToggleStatus(user)}
                                title={
                                  user.is_active ? "Block User" : "Unblock User"
                                }
                              >
                                {user.is_active ? (
                                  <Ban className="h-4 w-4" />
                                ) : (
                                  <Unlock className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:text-red-600 hover:bg-red-50"
                                onClick={() =>
                                  handleDeleteUser(user.id, user.email)
                                }
                                title="Delete User"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-in fade-in"
            onClick={() => setIsAddModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-card rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 p-1 hover:bg-muted rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>

            <div className="mb-6">
              <div className="h-12 w-12 bg-[#F3DECF] rounded-full flex items-center justify-center mb-4 text-[#A9542F]">
                <UserPlus className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-foreground">
                Add Authorized User
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Grant access to a new team member via email.
              </p>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground ml-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    placeholder="colleague@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border focus:border-[#B85C3C] focus:ring-4 focus:ring-[#B85C3C]/10 outline-none transition-all"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 rounded-xl h-11"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-[#A9542F] hover:bg-[#8A3F26] text-white rounded-xl h-11"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Grant Access
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
