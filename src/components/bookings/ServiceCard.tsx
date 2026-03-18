// src/components/bookings/ServiceCard.tsx
"use client"; 

import { Service } from "@/types";

interface ServiceCardProps {
  service: Service;
  onSelect: (service: Service) => void; 
  isSelected: boolean;
}

export default function ServiceCard({ service, onSelect, isSelected }: ServiceCardProps) {
  return (
    <div 
      onClick={() => onSelect(service)}
      className="rounded-xl p-5 cursor-pointer h-full"
    >
      <div className="flex justify-between items-start">
        {/* Nombre y Descripción */}
        <div className="pr-4">
          <h3 className={`font-black text-lg tracking-wide uppercase ${isSelected ? 'text-salon-terracotta' : 'text-salon-brown'}`}>
            {service.name}
          </h3>
          <p className="text-salon-gray text-xs mt-2 leading-relaxed font-medium">
            {service.description}
          </p>
        </div>

        {/* Precio y Duración (Columna derecha) */}
        <div className="text-right flex flex-col items-end shrink-0">
          <span className={`font-black text-xl ${isSelected ? 'text-salon-lavender' : 'text-salon-brown'}`}>
            ${service.price}
          </span>
          {/* Etiqueta de duración estilo "sello" */}
          <span className="text-[10px] text-salon-brown mt-2 font-bold bg-salon-yellow/50 px-2 py-1 rounded-sm uppercase tracking-wider">
            {service.duration} min
          </span>
        </div>
      </div>
    </div>
  );
}