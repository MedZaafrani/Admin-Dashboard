"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { getUsers, updateUser, deleteUser} from "@/lib/services/userService";
import { User } from "@/lib/types";
import { formatDate } from "@/lib/utils/date";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Trash2, Lock, Unlock, Search, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import CreateUserForm from "@/components/forms/CreateUserForm";

const userSchema = z.object({
  nom: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  telephone: z.string().min(8, "Phone number is invalid"),
  localisation: z.string().min(3, "Location must be at least 3 characters"),
});

type UserFormValues = z.infer<typeof userSchema>;

export default function UsersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      nom: "",
      email: "",
      telephone: "",
      localisation: "",
    },
  });
  
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    const fetchUsers = async () => {
      if (user) {
        try {
          setDataLoading(true);
          const usersData = await getUsers();
          setUsers(usersData);
          setFilteredUsers(usersData);
        } catch (error) {
          console.error("Error fetching users:", error);
          toast({
            title: "Error",
            description: "Échec de la récupération des données des utilisateurs",
            variant: "destructive",
          });
        } finally {
          setDataLoading(false);
        }
      }
    };
    
    fetchUsers();
  }, [user, toast]);
  
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredUsers(
        users.filter(
          (user) =>
            user.nom.toLowerCase().includes(query) ||
            user.email.toLowerCase().includes(query) ||
            user.telephone.includes(query) ||
            user.localisation.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, users]);
  
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    form.reset({
      nom: user.nom,
      email: user.email,
      telephone: user.telephone,
      localisation: user.localisation,
    });
    setEditModalOpen(true);
  };
  
  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };
  
  const onSubmitEdit = async (data: UserFormValues) => {
    if (!selectedUser) return;
    
    try {
      await updateUser(selectedUser.id, data);
      
      // Update local state
      const updatedUsers = users.map((u) =>
        u.id === selectedUser.id ? { ...u, ...data } : u
      );
      setUsers(updatedUsers);
      
      toast({
        title: "Success",
        description: "L'utilisateur a été mis à jour avec succès",
      });
      
      setEditModalOpen(false);
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        title: "Error",
        description: "Échec de la mise à jour de l'utilisateur",
        variant: "destructive",
      });
    }
  };
  
  const confirmDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      await deleteUser(selectedUser.id);
      
      // Update local state
      setUsers(users.filter((u) => u.id !== selectedUser.id));
      
      toast({
        title: "Success",
        description: "Utilisateur supprimé avec succès",
      });
      
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: "Échec de la suppression de l'utilisateur",
        variant: "destructive",
      });
    }
  };
  
  // const handleToggleBlock = async (userId: string, currentStatus: boolean) => {
  //   try {
  //     await toggleUserBlock(userId, !currentStatus);
      
  //     // Update local state
  //     const updatedUsers = users.map((u) =>
  //       u.id === userId ? { ...u, isBlocked: !currentStatus } : u
  //     );
  //     setUsers(updatedUsers);
      
  //     toast({
  //       title: "Success",
  //       description: `User ${!currentStatus ? "blocked" : "unblocked"} successfully`,
  //     });
  //   } catch (error) {
  //     console.error("Error toggling user block status:", error);
  //     toast({
  //       title: "Error",
  //       description: "Failed to update user status",
  //       variant: "destructive",
  //     });
  //   }
  // };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">Loading...</div>
      </div>
    );
  }
  
  if (!user) {
    return null; // Will be redirected to login
  }
  
  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold">Gestion des utilisateurs</h1>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Rechercher un utilisateur..."
                className="pl-8 w-full sm:w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un utilisateur
            </Button>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Les utilisateurs</CardTitle>
          </CardHeader>
          <CardContent>
            {dataLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableCaption>Tous les utilisateurs enregistrés dans le système</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Telephone</TableHead>
                      <TableHead>Localisation</TableHead>
                      <TableHead>Rejoint</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">
                          No users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.nom}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.telephone}</TableCell>
                          <TableCell>{user.localisation}</TableCell>
                          <TableCell>{formatDate(user.date_inscription)}</TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                user.isBlocked
                                  ? "bg-destructive/20 text-destructive"
                                  : "bg-green-100 text-green-600 dark:bg-green-800/20 dark:text-green-400"
                              }`}
                            >
                              {user.isBlocked ? "Blocked" : "Active"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditUser(user)}
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit user</span>
                            </Button>
                            
                            {/* <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleBlock(user.id, user.isBlocked || false)}
                            >
                              {user.isBlocked ? (
                                <Unlock className="h-4 w-4" />
                              ) : (
                                <Lock className="h-4 w-4" />
                              )}
                              <span className="sr-only">
                                {user.isBlocked ? "Unblock user" : "Block user"}
                              </span>
                            </Button> */}
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteUser(user)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                              <span className="sr-only">Delete user</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Edit User Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={form.handleSubmit(onSubmitEdit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Name</Label>
              <Input
                id="nom"
                {...form.register("nom")}
              />
              {form.formState.errors.nom && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.nom.message}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="telephone">Phone</Label>
              <Input
                id="telephone"
                {...form.register("telephone")}
              />
              {form.formState.errors.telephone && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.telephone.message}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="localisation">Location</Label>
              <Input
                id="localisation"
                {...form.register("localisation")}
              />
              {form.formState.errors.localisation && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.localisation.message}
                </p>
              )}
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete User Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              <span className="font-semibold">{selectedUser?.nom}</span>'s account and all associated
              data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDeleteUser}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add User Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Enter the details for the new user account.
            </DialogDescription>
          </DialogHeader>
          <CreateUserForm
            onSuccess={() => {
              setCreateModalOpen(false);
              // Refresh users list
              getUsers().then(users => {
                setUsers(users);
                setFilteredUsers(users);
              });
            }}
            onCancel={() => setCreateModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}