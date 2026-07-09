"use client";

import { useState } from "react";
import { Service } from "@/types";

interface ServiceCardProps {
  service: Service;
  onSelect: (service: Service) => void;
  isSelected: boolean;
}

export function ServiceCardItem({ service, onSelect, isSelected }: ServiceCardProps) {
  return (
    <div
      onClick={() => onSelect(service)}
      className="rounded-xl p-4 cursor-pointer h-full"
    >
      <div className="flex justify-between items-start">
        <div className="pr-4">
          <h3 className={`font-black text-base tracking-wide uppercase leading-tight ${isSelected ? 'text-salon-terracotta' : 'text-salon-brown'}`}>
            {service.name}
          </h3>
          {service.description && (
            <p className="text-salon-gray text-xs mt-1 leading-relaxed font-medium">
              {service.description}
            </p>
          )}
        </div>
        <div className="text-right flex flex-col items-end shrink-0">
          <span className={`font-black text-xl ${isSelected ? 'text-salon-lavender' : 'text-salon-brown'}`}>
            ${service.price}
          </span>
          <span className="text-[10px] text-salon-brown mt-1 font-bold bg-salon-yellow/50 px-2 py-1 rounded-sm uppercase tracking-wider">
            {service.duration} min
          </span>
        </div>
      </div>
    </div>
  );
}

const CATEGORY_COLORS: Record<string, { border: string; bg: string; text: string; dot: string }> = {
  'Uñas':                { border: 'border-salon-lavender', bg: 'bg-salon-lavender/10', text: 'text-salon-lavender', dot: 'bg-salon-lavender' },
  'Extras':              { border: 'border-salon-yellow',   bg: 'bg-salon-yellow/20',   text: 'text-salon-brown',   dot: 'bg-salon-yellow' },
  'Manicura y Pedicura': { border: 'border-salon-terracotta', bg: 'bg-salon-terracotta/10', text: 'text-salon-terracotta', dot: 'bg-salon-terracotta' },
  'Maquillaje y Peinado':{ border: 'border-salon-olive',    bg: 'bg-salon-olive/10',    text: 'text-salon-olive',   dot: 'bg-salon-olive' },
  'Cejas':               { border: 'border-salon-brown',    bg: 'bg-salon-brown/10',    text: 'text-salon-brown',   dot: 'bg-salon-brown' },
  'General':             { border: 'border-salon-gray/30',  bg: 'bg-salon-bg',          text: 'text-salon-gray',    dot: 'bg-salon-gray' },
};

interface CategoryAccordionProps {
  category: string;
  services: Service[];
  selectedServices: Service[];
  onSelect: (service: Service) => void;
}

export function CategoryAccordion({ category, services, selectedServices, onSelect }: CategoryAccordionProps) {
  const [open, setOpen] = useState(false);
  const colors = CATEGORY_COLORS[category] ?? CATEGORY_COLORS['General'];
  const selectedCount = services.filter(s => selectedServices.some(sel => sel.id === s.id)).length;

  return (
    <div className={`border-2 ${colors.border} rounded-2xl overflow-hidden transition-all duration-300 bg-white shadow-folk`}>

      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-5 py-4 ${open ? colors.bg : 'bg-white'} transition-all`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${colors.dot}`} />
          <span className={`font-black uppercase tracking-wider text-sm ${colors.text}`}>
            {category}
          </span>
          <span className="text-[10px] text-salon-gray font-bold">
            ({services.length})
          </span>
        </div>
        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
            <span className="text-[10px] font-black text-white bg-salon-lavender px-2 py-0.5 rounded-full">
              {selectedCount} sel.
            </span>
          )}
          <svg
            className={`w-4 h-4 text-salon-gray transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="p-3 space-y-3 bg-salon-bg/30">
          {services.map((service) => {
            const isSelected = selectedServices.some(s => s.id === service.id);
            return (
              <div
                key={service.id}
                className={`
                  p-1 transition-all duration-300 bg-white card-hover border-2 rounded-xl
                  ${isSelected 
                    ? 'shadow-folk-purple border-salon-lavender' 
                    : 'shadow-folk border-salon-olive/50 hover:border-salon-olive'
                  }
                `}
              >
                <ServiceCardItem
                  service={service}
                  onSelect={onSelect}
                  isSelected={isSelected}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ServiceCard({ service, onSelect, isSelected }: ServiceCardProps) {
  return <ServiceCardItem service={service} onSelect={onSelect} isSelected={isSelected} />;
}