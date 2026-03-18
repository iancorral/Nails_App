// src/types/index.ts

// Definition of the Service object coming from the API
// Definición del objeto Servicio que viene de la API
export interface Service {
  id: string;
  name: string;
  duration: number; // in minutes
  price: number;
  description?: string; // Optional (?)
  isActive: boolean;
}