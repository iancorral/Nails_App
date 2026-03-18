// src/app/admin/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { format, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
// Definimos los tipos manualmente para evitar errores si no tienes el cliente de Prisma generado en el front
type Service = { id: string; name: string; price: number; duration: number };
type Appointment = { 
  id: string; 
  date: string | Date; 
  endDate: string | Date; 
  clientName: string; 
  clientPhone: string; 
  status: string; 
  services: Service[] 
};

export default function AdminDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<'UPCOMING' | 'HISTORY'>('UPCOMING');
  const [loading, setLoading] = useState(true);

  // Cargar citas al iniciar
  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await fetch('/api/appointments'); 
      const data = await res.json();
      setAppointments(data);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  // Función para Cancelar Cita
  const handleCancel = async (id: string) => {
    if (!confirm("¿Seguro que quieres cancelar esta cita?")) return;

    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' })
      });

      if (res.ok) {
        // Actualizar la lista localmente
        setAppointments(prev => prev.map(app => 
          app.id === id ? { ...app, status: 'CANCELLED' } : app
        ));
      }
    } catch (error) {
      alert("Error al cancelar");
    }
  };

  // Filtrar las citas
  const filteredAppointments = appointments.filter(app => {
    const appDate = new Date(app.endDate);
    const isFinished = isPast(appDate);
    const isCancelled = app.status === 'CANCELLED';

    if (filter === 'UPCOMING') {
      return !isFinished && !isCancelled;
    } else {
      return isFinished || isCancelled;
    }
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <main className="min-h-screen p-6 md:p-10 relative bg-salon-bg">
      {/* Fondo decorativo sutil */}
      <div className="fixed inset-0 pointer-events-none opacity-5">
         <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0 0 L100 0 L100 100 L0 100 Z" fill="var(--color-salon-terracotta)"/>
         </svg>
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        
        {/* --- HEADER --- */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
          <div>
            <h1 className="text-3xl font-black text-salon-brown uppercase tracking-[0.15em] mb-1">
              Panel de Control
            </h1>
            <div className="flex items-center gap-3 opacity-70">
              <div className="h-[2px] w-8 bg-salon-terracotta"></div>
              <p className="text-xs text-salon-terracotta font-bold tracking-widest uppercase">
                Administración Tangible
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => window.location.reload()}
            className="group flex flex-col items-center bg-white px-6 py-3 border-2 border-salon-olive shadow-folk hand-drawn hover:scale-105 transition-transform"
          >
            <span className="text-[10px] uppercase text-salon-gray font-bold tracking-wider mb-1">Total Citas</span>
            <span className="text-2xl font-black text-salon-olive group-hover:text-salon-terracotta transition-colors">
              {appointments.length}
            </span>
          </button>
        </header>

        {/* --- PESTAÑAS (TABS) --- */}
        <div className="flex gap-6 mb-8 border-b-2 border-salon-olive/10 pb-1">
          <button 
            onClick={() => setFilter('UPCOMING')}
            className={`pb-2 text-xs font-black uppercase tracking-widest transition-all border-b-4 
              ${filter === 'UPCOMING' 
                ? 'text-salon-olive border-salon-olive' 
                : 'text-salon-gray border-transparent hover:text-salon-brown'
              }`}
          >
            Próximas
          </button>
          <button 
            onClick={() => setFilter('HISTORY')}
            className={`pb-2 text-xs font-black uppercase tracking-widest transition-all border-b-4 
              ${filter === 'HISTORY' 
                ? 'text-salon-terracotta border-salon-terracotta' 
                : 'text-salon-gray border-transparent hover:text-salon-brown'
              }`}
          >
            Historial / Canceladas
          </button>
        </div>

        {/* --- LISTA DE TARJETAS --- */}
        <div className="space-y-4">
          {loading ? (
             <div className="text-center py-20 text-salon-gray animate-pulse font-bold text-xs uppercase tracking-widest">
               Cargando agenda...
             </div>
          ) : filteredAppointments.length === 0 ? (
             <div className="text-center py-20 border-2 border-dashed border-salon-gray/20 rounded-xl">
               <p className="text-salon-gray font-bold text-sm uppercase">No hay citas en esta sección</p>
             </div>
          ) : (
            filteredAppointments.map((app) => (
              <div key={app.id} className={`
                bg-white p-6 rounded-xl border-l-4 shadow-sm transition-all hover:shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hand-drawn
                ${app.status === 'CANCELLED' ? 'border-l-salon-gray opacity-60' : 'border-l-salon-olive'}
              `}>
                
                {/* INFO FECHA Y CLIENTE */}
                <div className="flex items-start gap-5 w-full md:w-auto">
                  {/* Caja de Fecha */}
                  <div className={`
                    w-20 h-20 rounded-lg flex flex-col items-center justify-center font-bold border-2 shrink-0
                    ${app.status === 'CANCELLED' 
                      ? 'bg-gray-50 border-gray-200 text-gray-400' 
                      : 'bg-salon-bg border-salon-olive text-salon-brown'
                    }
                  `}>
                    <span className="text-[10px] uppercase tracking-wider">
                      {format(new Date(app.date), 'MMM', { locale: es })}
                    </span>
                    <span className="text-3xl font-black">
                      {format(new Date(app.date), 'd')}
                    </span>
                  </div>

                  {/* Detalles */}
                  <div>
                    <h3 className="font-black text-salon-brown text-lg uppercase tracking-wide">
                      {app.clientName}
                    </h3>
                    
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs font-bold text-salon-gray">
                       <span className="flex items-center gap-1 text-salon-terracotta bg-salon-terracotta/10 px-2 py-0.5 rounded-md">
                         {/* Icono Reloj */}
                         <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z"/></svg>
                         {format(new Date(app.date), 'HH:mm')}
                       </span>
                       <span className="text-salon-gray/40">|</span>
                       <span>{app.services.length} SERVICIO(S)</span>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-3">
                      {app.services.map(s => (
                        <span key={s.id} className="text-[9px] uppercase tracking-wider border border-salon-brown/20 px-2 py-0.5 rounded-full text-salon-brown">
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* BOTONES DE ACCIÓN */}
                <div className="flex flex-col sm:flex-row items-stretch gap-2 w-full md:w-auto">
                  
                  {/* 1. WHATSAPP (Siempre visible) */}
                  <a 
                    href={`https://wa.me/${app.clientPhone.replace(/\D/g,'')}`}
                    target="_blank"
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-[#25D366] text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#20bd5a] transition-colors"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-8.68-2.031-.967-.272-.297-.471-.446-.917-.446-.446 0-.967.174-1.488.744-.521.57-1.984 1.933-1.984 4.71s2.032 4.164 2.305 4.536c.273.371 3.967 6.059 9.61 8.463 3.939 1.678 4.735 1.344 5.578 1.268.843-.075 1.835-.744 2.096-1.463.261-.718.261-1.338.186-1.462z"/></svg>
                    Contactar
                  </a>

                  {/* ACCIONES SOLO PARA PRÓXIMAS */}
                  {app.status !== 'CANCELLED' && filter === 'UPCOMING' && (
                    <>
                      {/* 2. AVISAR CANCELACIÓN (Sin emojis en el mensaje) */}
                      <a 
                        href={`https://wa.me/${app.clientPhone.replace(/\D/g,'')}?text=${encodeURIComponent(`HOLA ${app.clientName.split(' ')[0].toUpperCase()}, SOY DE TANGIBLE.\n\nTE ESCRIBO PARA AVISARTE QUE LAMENTABLEMENTE TENGO QUE REAGENDAR TU CITA DE HOY POR UN IMPREVISTO.\n\nUNA DISCULPA ENORME. ¿TE PARECE SI BUSCAMOS OTRO HORARIO?`)}`}
                        target="_blank"
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-salon-yellow text-salon-brown rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#fadd70] transition-colors"
                        title="Enviar mensaje de cancelación"
                      >
                        {/* Icono Alerta */}
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2L1 21h22L12 2zm1 16h-2v-2h2v2zm0-4h-2V9h2v5z"/></svg>
                        Avisar
                      </a>

                      {/* 3. CANCELAR SISTEMA */}
                      <button 
                        onClick={() => handleCancel(app.id)}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-red-200 text-red-500 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-red-50 transition-colors"
                      >
                        {/* Icono X */}
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                        Cancelar
                      </button>
                    </>
                  )}

                  {/* ETIQUETA DE ESTADO */}
                  {app.status === 'CANCELLED' && (
                    <div className="px-4 py-3 bg-gray-100 text-gray-400 border border-gray-200 rounded-lg text-xs font-bold uppercase tracking-wider text-center">
                      Cancelada
                    </div>
                  )}
                </div>

              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}