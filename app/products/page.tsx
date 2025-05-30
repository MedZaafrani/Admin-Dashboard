"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { getProducts, getProductCategories, getStoresWithProducts } from "@/lib/services/productService";
import { Product } from "@/lib/types";
import { formatDate } from "@/lib/utils/date";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Search, Filter, History } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useToast } from "@/hooks/use-toast";

interface PriceHistoryPoint {
  date: string;
  price: number;
}

export default function ProductsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [stores, setStores] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [storeFilter, setStoreFilter] = useState<string>("all");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [priceHistoryModalOpen, setPriceHistoryModalOpen] = useState(false);
  
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    const fetchProductsData = async () => {
      if (user) {
        try {
          setDataLoading(true);
          
          // Fetch products, categories, and stores in parallel
          const [productsData, categoriesData, storesData] = await Promise.all([
            getProducts(),
            getProductCategories(),
            getStoresWithProducts()
          ]);
          
          setProducts(productsData);
          setFilteredProducts(productsData);
          
          // Extract unique categories and brands
          setCategories(Array.from(new Set(categoriesData.map(cat => cat.name))));
          setStores(storesData);
          
          const uniqueBrands = Array.from(
            new Set(productsData.map(product => product.marque))
          );
          setBrands(uniqueBrands);
          
        } catch (error) {
          console.error("Error fetching products data:", error);
          toast({
            title: "Error",
            description: "Échec de la récupération des données des produits",
            variant: "destructive",
          });
        } finally {
          setDataLoading(false);
        }
      }
    };
    
    fetchProductsData();
  }, [user, toast]);
  
  useEffect(() => {
    let filtered = [...products];
    
    // Apply search filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.nom.toLowerCase().includes(query) ||
          product.marque.toLowerCase().includes(query) ||
          product.categorie.toLowerCase().includes(query)
      );
    }
    
    // Apply category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((product) => product.categorie === categoryFilter);
    }
    
    // Apply store filter
    if (storeFilter !== "all") {
      filtered = filtered.filter((product) => 
        Object.keys(product.produits).includes(storeFilter)
      );
    }
    
    // Apply brand filter
    if (brandFilter !== "all") {
      filtered = filtered.filter((product) => product.marque === brandFilter);
    }
    
    setFilteredProducts(filtered);
  }, [searchQuery, categoryFilter, storeFilter, brandFilter, products]);
  
  const handleViewPriceHistory = (product: Product) => {
    setSelectedProduct(product);
    setPriceHistoryModalOpen(true);
  };
  
  const getPriceHistoryForStore = (product: Product, storeName: string): PriceHistoryPoint[] => {
    if (!product || !product.produits || !product.produits[storeName]) {
      return [];
    }
    
    // In a real implementation, we'd have historical data
    // For now, we'll simulate with the current price and date
    const storeProduct = product.produits[storeName];
    return [
      {
        date: formatDate(storeProduct.date_maj),
        price: parseFloat(storeProduct.prix.toString())
      }
    ];
  };
  
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND'
    }).format(price);
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
  
  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold">Gestion des produits</h1>
          
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher des produits..."
              className="pl-8 w-full sm:w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filtrer par: </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              value={categoryFilter}
              onValueChange={setCategoryFilter}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filtrer par categorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories </SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category || "uncategorized"}>
                    {category || "Uncategorized"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select
              value={storeFilter}
              onValueChange={setStoreFilter}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filtrer par magasin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les magasins</SelectItem>
                {stores.map((store) => (
                  <SelectItem key={store} value={store || "Inconnu"}>
                    {store || "Magasin Inconnu"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select
              value={brandFilter}
              onValueChange={setBrandFilter}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filtrer par marque" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les marques</SelectItem>
                {brands.map((brand) => (
                  <SelectItem key={brand} value={brand || "sans marque"}>
                    {brand || "sans marque"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Tous les produits</CardTitle>
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
                  <TableCaption>Liste de tous les produits du système</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead>Marque</TableHead>
                      <TableHead>Prix moyen</TableHead>
                      <TableHead>Créé le</TableHead>
                      {stores.length > 0 && stores.map((store) => (
                        <TableHead key={store}>Prix {store} </TableHead>
                      ))}
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6 + stores.length} className="text-center">
                          Aucun produit trouvé
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.nom}</TableCell>
                          <TableCell>{product.categorie}</TableCell>
                          <TableCell>{product.marque}</TableCell>
                          <TableCell>{formatPrice(product.prix)}</TableCell>
                          <TableCell>{formatDate(product.created_at)}</TableCell>
                          {stores.length > 0 && stores.map((store) => (
                            <TableCell key={`${product.id}-${store}`}>
                              {product.produits[store]
                                ? formatPrice(parseFloat(product.produits[store].prix.toString()))
                                : "N/A"}
                            </TableCell>
                          ))}
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewPriceHistory(product)}
                            >
                              <History className="h-4 w-4" />
                              <span className="sr-only">Afficher l\historique des prix</span>
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
      
      {/* Price History Modal */}
      <Dialog open={priceHistoryModalOpen} onOpenChange={setPriceHistoryModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Historique des prix</DialogTitle>
            <DialogDescription>
              {selectedProduct?.nom} - {selectedProduct?.marque}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Prix moyen actuel :</span>
              <span className="font-semibold">
                {selectedProduct ? formatPrice(selectedProduct.prix) : "N/A"}
              </span>
            </div>
            
            <div className="space-y-4">
              {selectedProduct && stores.map((store) => {
                if (!selectedProduct.produits[store]) return null;
                
                return (
                  <div key={store} className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-2">{store}</h3>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-muted-foreground">Prix actuel :</span>
                      <span className="font-medium">
                        {formatPrice(parseFloat(selectedProduct.produits[store].prix.toString()))}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Dernière mise à jour :</span>
                      <span className="text-sm">
                        {formatDate(selectedProduct.produits[store].date_maj)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">Comparaison des prix</h3>
              </div>
              
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      labelStyle={{ color: 'hsl(var(--card-foreground))' }}
                    />
                    
                    {selectedProduct && stores.map((store, index) => {
                      if (!selectedProduct.produits[store]) return null;
                      
                      const data = [
                        {
                          date: formatDate(selectedProduct.produits[store].date_maj),
                          price: parseFloat(selectedProduct.produits[store].prix.toString())
                        }
                      ];
                      
                      return (
                        <Line
                          key={store}
                          type="monotone"
                          data={data}
                          dataKey="price"
                          name={store}
                          stroke={`hsl(var(--chart-${(index % 5) + 1}))`}
                          strokeWidth={2}
                          dot={{ r: 4 }}
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="text-xs text-muted-foreground mt-2 text-center">
                  Remarque : Données historiques complètes non disponibles dans cette version de démonstration
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}