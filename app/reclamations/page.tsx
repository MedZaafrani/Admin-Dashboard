"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { getAllReclamations, markReclamationResolved, deleteReclamation } from "@/lib/services/reclamationService";
import { Reclamation } from "@/lib/types";
import { formatDateTime } from "@/lib/utils/date";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Trash2, Lock, Unlock, Search, Filter, BarChart, PieChart } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { useToast } from "@/hooks/use-toast";

export default function ReclamationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [reclamations, setReclamations] = useState<Reclamation[]>([]);
  const [filteredReclamations, setFilteredReclamations] = useState<Reclamation[]>([]);
  const [senders, setSenders] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [senderFilter, setSenderFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedReclamation, setSelectedReclamation] = useState<Reclamation | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statsModalOpen, setStatsModalOpen] = useState(false);

  // Chart colors
  const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];
  
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    const fetchReclamations = async () => {
      if (user) {
        try {
          setDataLoading(true);
          const reclamationsData = await getAllReclamations();
          setReclamations(reclamationsData);
          setFilteredReclamations(reclamationsData);
          
          // Extract unique senders
          const uniqueSenders = Array.from(
            new Set(reclamationsData.map((r) => r.expediteur))
          ).filter(sender => sender && sender.trim() !== "");
          
          setSenders(uniqueSenders);
        } catch (error) {
          console.error("Error fetching reclamations:", error);
          toast({
            title: "Error",
            description: "Échec de la récupération des données de réclamation",
            variant: "destructive",
          });
        } finally {
          setDataLoading(false);
        }
      }
    };
    
    fetchReclamations();
  }, [user, toast]);
  
  useEffect(() => {
    let filtered = [...reclamations];
    
    // Apply search filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (reclamation) =>
          reclamation.expediteur.toLowerCase().includes(query) ||
          reclamation.recepteur.toLowerCase().includes(query) ||
          reclamation.message.toLowerCase().includes(query)
      );
    }
    
    // Apply sender filter
    if (senderFilter !== "all") {
      filtered = filtered.filter((reclamation) => reclamation.expediteur === senderFilter);
    }
    
    // Apply status filter
    if (statusFilter !== "all") {
      const isResolved = statusFilter === "resolved";
      filtered = filtered.filter((reclamation) => reclamation.resolved === isResolved);
    }
    
    setFilteredReclamations(filtered);
  }, [searchQuery, senderFilter, statusFilter, reclamations]);

  // Calculate statistics for charts
  const getChartData = () => {
    // Status distribution
    const statusData = [
      { name: "Resolved", value: reclamations.filter(r => r.resolved).length },
      { name: "Pending", value: reclamations.filter(r => !r.resolved).length }
    ];

    // Reclamations by sender
    const senderData = Array.from(
      reclamations.reduce((acc, rec) => {
        const sender = rec.expediteur || "Unknown";
        acc.set(sender, (acc.get(sender) || 0) + 1);
        return acc;
      }, new Map())
    ).map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

    // Reclamations over time
    const timeData = Array.from(
      reclamations.reduce((acc, rec) => {
        const date = new Date(rec.date).toLocaleDateString();
        acc.set(date, (acc.get(date) || 0) + 1);
        return acc;
      }, new Map())
    ).map(([date, value]) => ({ date, value }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return { statusData, senderData, timeData };
  };
  
  const handleMarkResolved = async (reclamation: Reclamation) => {
    try {
      await markReclamationResolved(reclamation.userId, reclamation.id, !reclamation.resolved);
      
      // Update local state
      const updatedReclamations = reclamations.map((r) =>
        r.id === reclamation.id ? { ...r, resolved: !reclamation.resolved } : r
      );
      setReclamations(updatedReclamations);
      
      toast({
        title: "Success",
        description: `Récupération marquée comme ${!reclamation.resolved ? "resolved" : "unresolved"}`,
      });
    } catch (error) {
      console.error("Error updating reclamation status:", error);
      toast({
        title: "Error",
        description: "Échec de la mise à jour du statut de réclamation",
        variant: "destructive",
      });
    }
  };
  
  const handleDeleteReclamation = (reclamation: Reclamation) => {
    setSelectedReclamation(reclamation);
    setDeleteDialogOpen(true);
  };
  
  const confirmDeleteReclamation = async () => {
    if (!selectedReclamation) return;
    
    try {
      await deleteReclamation(selectedReclamation.userId, selectedReclamation.id);
      
      // Update local state
      setReclamations(reclamations.filter((r) => r.id !== selectedReclamation.id));
      
      toast({
        title: "Success",
        description: "Récupération supprimée avec succès",
      });
      
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting reclamation:", error);
      toast({
        title: "Error",
        description: "Échec de la suppression de la réclamation",
        variant: "destructive",
      });
    }
  };
  
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

  const { statusData, senderData, timeData } = getChartData();
  
  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold">Reclamations</h1>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search reclamations..."
                className="pl-8 w-full sm:w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setStatsModalOpen(true)}
            >
              <BarChart className="h-4 w-4" />
              <span className="sr-only">View statistics</span>
            </Button>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filter by:</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              value={senderFilter}
              onValueChange={setSenderFilter}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by sender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Senders</SelectItem>
                {senders.map((sender) => (
                  <SelectItem key={sender} value={sender || "unknown"}>
                    {sender || "Unknown Sender"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="unresolved">Unresolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>All Reclamations</CardTitle>
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
                  <TableCaption>A list of all reclamations in the system</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sender</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReclamations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
                          No reclamations found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredReclamations.map((reclamation) => (
                        <TableRow key={reclamation.id}>
                          <TableCell className="font-medium">{reclamation.expediteur}</TableCell>
                          <TableCell>{reclamation.recepteur}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {reclamation.message}
                          </TableCell>
                          <TableCell>{formatDateTime(reclamation.date)}</TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                reclamation.resolved
                                  ? "bg-green-100 text-green-600 dark:bg-green-800/20 dark:text-green-400"
                                  : "bg-amber-100 text-amber-600 dark:bg-amber-800/20 dark:text-amber-400"
                              }`}
                            >
                              {reclamation.resolved ? "Resolved" : "Pending"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleMarkResolved(reclamation)}
                            >
                              {reclamation.resolved ? (
                                <Unlock className="h-4 w-4" />
                              ) : (
                                <Lock className="h-4 w-4" />
                              )}
                              <span className="sr-only">
                                {reclamation.resolved ? "Mark as unresolved" : "Mark as resolved"}
                              </span>
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteReclamation(reclamation)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                              <span className="sr-only">Delete reclamation</span>
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
      
      {/* Delete Reclamation Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this reclamation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDeleteReclamation}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Statistics Modal */}
      <Dialog open={statsModalOpen} onOpenChange={setStatsModalOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Reclamations Statistics</DialogTitle>
            <DialogDescription>
              Detailed analysis of reclamations data
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="status" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="status">Status Distribution</TabsTrigger>
              <TabsTrigger value="top-senders">Top Senders</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="status">
              <Card>
                <CardHeader>
                  <CardTitle>Status Distribution</CardTitle>
                  <CardDescription>
                    Distribution of resolved vs pending reclamations
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={150}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="top-senders">
              <Card>
                <CardHeader>
                  <CardTitle>Top Senders</CardTitle>
                  <CardDescription>
                    Users with the most reclamations
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={senderData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill={COLORS[0]} />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline">
              <Card>
                <CardHeader>
                  <CardTitle>Reclamations Timeline</CardTitle>
                  <CardDescription>
                    Number of reclamations over time
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke={COLORS[0]}
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}