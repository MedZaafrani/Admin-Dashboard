import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy 
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Product } from "@/lib/types";

export const getProducts = async (): Promise<Product[]> => {
  try {
    const productsCol = collection(db, "InfoProduit");
    const productsSnapshot = await getDocs(productsCol);
    
    return productsSnapshot.docs.map(doc => {
      const data = doc.data();
      
      // Calculate average price from all stores
      let totalPrice = 0;
      let storeCount = 0;
      const produits = data.produits || {};
      
      Object.values(produits).forEach((store: any) => {
        if (store.prix) {
          totalPrice += parseFloat(store.prix);
          storeCount++;
        }
      });
      
      const avgPrice = storeCount > 0 ? totalPrice / storeCount : 0;
      
      return {
        id: doc.id,
        nom: data.nom || "",
        categorie: data.categorie || "",
        marque: data.marque || "",
        prix: avgPrice,
        created_at: data.created_at?.toDate() || new Date(),
        produits: data.produits || {}
      };
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
};

export const getProductById = async (id: string): Promise<Product | null> => {
  try {
    const productDoc = doc(db, "InfoProduit", id);
    const productSnapshot = await getDoc(productDoc);
    
    if (!productSnapshot.exists()) {
      return null;
    }
    
    const data = productSnapshot.data();
    
    // Calculate average price from all stores
    let totalPrice = 0;
    let storeCount = 0;
    const produits = data.produits || {};
    
    Object.values(produits).forEach((store: any) => {
      if (store.prix) {
        totalPrice += parseFloat(store.prix);
        storeCount++;
      }
    });
    
    const avgPrice = storeCount > 0 ? totalPrice / storeCount : 0;
    
    return {
      id: productSnapshot.id,
      nom: data.nom || "",
      categorie: data.categories || "",
      marque: data.marque || "",
      prix: avgPrice,
      created_at: data.cree_le?.toDate() || new Date(),
      produits: data.produits || {}
    };
  } catch (error) {
    console.error("Error fetching product:", error);
    throw error;
  }
};

export const getProductCategories = async (): Promise<{ name: string; value: number }[]> => {
  try {
    const productsCol = collection(db, "InfoProduit");
    const productsSnapshot = await getDocs(productsCol);
    
    const categories: { [key: string]: number } = {};
    
    productsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const category = data.categories || "Non catégorisé";
      categories[category] = (categories[category] || 0) + 1;
    });
    
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  } catch (error) {
    console.error("Error fetching product categories:", error);
    throw error;
  }
};

export const getProductsCount = async (): Promise<number> => {
  try {
    const productsCol = collection(db, "InfoProduit");
    const productsSnapshot = await getDocs(productsCol);
    return productsSnapshot.size;
  } catch (error) {
    console.error("Error fetching products count:", error);
    throw error;
  }
};

export const getStoresWithProducts = async (): Promise<string[]> => {
  try {
    const productsCol = collection(db, "InfoProduit");
    const productsSnapshot = await getDocs(productsCol);
    
    const storeNames = new Set<string>();
    
    productsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const produits = data.produits || {};
      
      Object.keys(produits).forEach(storeName => {
        storeNames.add(storeName);
      });
    });
    
    return Array.from(storeNames);
  } catch (error) {
    console.error("Error fetching stores with products:", error);
    throw error;
  }
};

export const getProductsByCategory = async (category: string): Promise<Product[]> => {
  try {
    const productsCol = collection(db, "InfoProduit");
    const productsQuery = query(productsCol, where("categories", "==", category));
    const productsSnapshot = await getDocs(productsQuery);
    
    return productsSnapshot.docs.map(doc => {
      const data = doc.data();
      
      // Calculate average price from all stores
      let totalPrice = 0;
      let storeCount = 0;
      const produits = data.produits || {};
      
      Object.values(produits).forEach((store: any) => {
        if (store.prix) {
          totalPrice += parseFloat(store.prix);
          storeCount++;
        }
      });
      
      const avgPrice = storeCount > 0 ? totalPrice / storeCount : 0;
      
      return {
        id: doc.id,
        nom: data.nom || "",
        categorie: data.categorie || "",
        marque: data.marque || "",
        prix: avgPrice,
        created_at: data.created_at?.toDate() || new Date(),
        produits: data.produits || {}
      };
    });
  } catch (error) {
    console.error("Error fetching products by category:", error);
    throw error;
  }
};