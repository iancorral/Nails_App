// src/types/index.ts

// Definition of the Service object coming from the API
// Definición del objeto Servicio que viene de la API
export interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  description?: string;
  category?: string;
  isActive: boolean;
}