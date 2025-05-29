export interface User {
  id: string;
  nom: string;
  email: string;
  telephone: string;
  localisation: string;
  date_inscription: Date;
  derniere_modification: Date;
  isBlocked: boolean;
}

export interface Reclamation {
  id: string;
  expediteur: string;
  recepteur: string;
  message: string;
  date: Date | string;
  resolved: boolean;
  userId: string;
}

export interface Product {
  id: string;
  nom: string;
  categorie: string;
  marque: string;
  prix: number;
  created_at: Date | string;
  produits: {
    [storeName: string]: {
      prix: number;
      date_maj: Date | string;
    };
  };
}

export interface Store {
  id: string;
  nom: string;
  adresse: string;
  ville: string;
  pays: string;
  mail: string;
  telephone: string;
  latitude: number;
  longitude: number;
}

export interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalReclamations: number;
}

export interface TimeSeriesData {
  date: string;
  value: number;
}

export interface CategoryDistribution {
  name: string;
  value: number;
}