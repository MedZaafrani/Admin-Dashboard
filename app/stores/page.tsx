"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { getStores } from "@/lib/services/storeService";
import { Store } from "@/lib/types";
import AdminLayout from "@/components/layout/AdminLayout";
import dynamic from "next/dynamic";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, MapPin, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import CreateStoreForm from "@/components/forms/CreateStoreForm";

// Dynamically import MapComponent with no SSR
const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-[500px]" />,
});

export default function StoresPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [stores, setStores] = useState<Store[]>([]);
  const [filteredStores, setFilteredStores] = useState<Store[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<Store | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    const fetchStores = async () => {
      if (user) {
        try {
          setDataLoading(true);
          const storesData = await getStores();
          setStores(storesData);
          setFilteredStores(storesData);
        } catch (error) {
          console.error("Error fetching stores:", error);
          toast({
            title: "Error",
            description: "Failed to fetch stores data",
            variant: "destructive",
          });
        } finally {
          setDataLoading(false);
        }
      }
    };
    
    fetchStores();
  }, [user, toast]);
  
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredStores(stores);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredStores(
        stores.filter(
          (store) =>
            store.nom.toLowerCase().includes(query) ||
            store.adresse.toLowerCase().includes(query) ||
            store.ville.toLowerCase().includes(query) ||
            store.mail.toLowerCase().includes(query) ||
            store.telephone.includes(query)
        )
      );
    }
  }, [searchQuery, stores]);
  
  const handleViewLocation = (store: Store) => {
    setSelectedStore(store);
    setLocationModalOpen(true);
  };

  const onMarkerClick = (store: Store) => {
    setSelectedMarker(store);
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">Loading...</div>
      </div>
    );
  }
  
  if (!user) {
    return null;
  }
  
  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold">Gestion des magasins</h1>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search stores..."
                className="pl-8 w-full sm:w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un magasin
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="map" className="space-y-4">
          <TabsList>
            <TabsTrigger value="map">Map View</TabsTrigger>
            <TabsTrigger value="table">Table View</TabsTrigger>
            <TabsTrigger value="card">Card View</TabsTrigger>
          </TabsList>

          <TabsContent value="map">
            <Card>
              <CardHeader>
                <CardTitle>Emplacement des magasins</CardTitle>
                <CardDescription>Voir tous les emplacements des magasins sur la carte</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[500px] w-full">
                  <MapComponent 
                    stores={filteredStores}
                    selectedMarker={selectedMarker}
                    onMarkerClick={onMarkerClick}
                    onClosePopup={() => setSelectedMarker(null)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="table">
            <Card>
              <CardHeader>
                <CardTitle>Tous les magasins</CardTitle>
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
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableCaption>A list of all stores in the system</TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Address</TableHead>
                          <TableHead>City</TableHead>
                          <TableHead>Country</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStores.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center">
                              No stores found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredStores.map((store) => (
                            <TableRow key={store.id}>
                              <TableCell className="font-medium">{store.nom}</TableCell>
                              <TableCell>{store.adresse}</TableCell>
                              <TableCell>{store.ville}</TableCell>
                              <TableCell>{store.pays}</TableCell>
                              <TableCell>{store.mail}</TableCell>
                              <TableCell>{store.telephone}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleViewLocation(store)}
                                >
                                  <MapPin className="h-4 w-4" />
                                  <span className="sr-only">View location</span>
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
          </TabsContent>
          
          <TabsContent value="card">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {dataLoading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <Card key={index} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <Skeleton className="h-6 w-24" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
                ))
              ) : filteredStores.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  No stores found
                </div>
              ) : (
                filteredStores.map((store) => (
                  <Card key={store.id} className="overflow-hidden">
                    <CardHeader>
                      <CardTitle>{store.nom}</CardTitle>
                      <CardDescription>{store.ville}, {store.pays}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <div className="text-sm font-medium">Address</div>
                          <div className="text-sm text-muted-foreground">{store.adresse}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">Contact</div>
                          <div className="text-sm text-muted-foreground">{store.telephone}</div>
                          <div className="text-sm text-muted-foreground">{store.mail}</div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => handleViewLocation(store)}
                        >
                          <MapPin className="h-4 w-4 mr-2" />
                          View Location
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      <Dialog open={locationModalOpen} onOpenChange={setLocationModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Store Location</DialogTitle>
            <DialogDescription>
              {selectedStore?.nom} - {selectedStore?.ville}, {selectedStore?.pays}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="h-[300px] w-full">
              {selectedStore && (
                <MapComponent
                  stores={[selectedStore]}
                  selectedMarker={selectedStore}
                  onMarkerClick={() => {}}
                  onClosePopup={() => {}}
                  zoom={15}
                />
              )}
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Full Address</h3>
              <p className="text-sm text-muted-foreground">
                {selectedStore?.adresse}, {selectedStore?.ville}, {selectedStore?.pays}
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Contact Information</h3>
              <p className="text-sm text-muted-foreground">
                Phone: {selectedStore?.telephone}
              </p>
              <p className="text-sm text-muted-foreground">
                Email: {selectedStore?.mail}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Store</DialogTitle>
            <DialogDescription>
              Enter the details for the new store location.
            </DialogDescription>
          </DialogHeader>
          <CreateStoreForm
            onSuccess={() => {
              setCreateModalOpen(false);
              getStores().then(stores => {
                setStores(stores);
                setFilteredStores(stores);
              });
            }}
            onCancel={() => setCreateModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}