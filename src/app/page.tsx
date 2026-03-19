// src/app/page.tsx
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Service } from '@/types';
// Asegúrate de que este componente exista en tu carpeta layout
import MuralDecorations from '@/components/layout/MuralDecorations';
import ServiceCard from '@/components/bookings/ServiceCard';
import BookingCalendar from '@/components/bookings/BookingCalendar';
import ClientForm from '@/components/bookings/ClientForm';

export default function Home() {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]); 
  const [bookingDate, setBookingDate] = useState<{date: Date, time: string} | null>(null);
  const [showClientForm, setShowClientForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  const totalPrice = selectedServices.reduce((acc, s) => acc + s.price, 0);
  const totalDuration = selectedServices.reduce((acc, s) => acc + s.duration, 0);

  useEffect(() => {
    fetch('/api/services')
      .then((res) => res.json())
      .then((data) => {
        setServices(data);
        setLoading(false);
      })
      .catch((error) => console.error("Error:", error));
  }, []);

  const toggleService = (service: Service) => {
    setSelectedServices(prev => {
      const exists = prev.find(s => s.id === service.id);
      if (exists) {
        return prev.filter(s => s.id !== service.id);
      } else {
        return [...prev, service];
      }
    });
    setBookingDate(null); 
    setShowClientForm(false);
  };

  const handleFinalBooking = async (clientName: string, clientPhone: string, websiteUrl?: string) => {
    if (selectedServices.length === 0 || !bookingDate) return;
    setIsSubmitting(true);

    const [hours, minutes] = bookingDate.time.split(':');
    const finalDate = new Date(bookingDate.date);
    finalDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceIds: selectedServices.map(s => s.id),
          date: finalDate,
          clientName,
          clientPhone,
          website_url: websiteUrl || "" 
        })
      });

      if (response.ok) setBookingSuccess(true);
      else alert("Error al agendar.");
    } catch (error) {
      console.error(error);
      alert("Error de conexión.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- PANTALLA DE ÉXITO (CORREGIDA: MENSAJE SIN EMOJIS) ---
  if (bookingSuccess && bookingDate) {
    const dateStr = bookingDate.date.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
    const timeStr = bookingDate.time;
    const servicesStr = selectedServices.map(s => s.name).join(', ');
    const salonPhone = "526144602066"; 

    // CORRECCIÓN AQUÍ: Usamos etiquetas de texto puro (FECHA:, SERVICIOS:) en lugar de emojis.
    // Esto evita los signos de interrogación y se ve más elegante.
    const message = `HOLA TANGIBLE.\n\nSoy *una clienta nueva* (reservé en la web).\n\nFECHA: ${dateStr} a las ${timeStr}\nSERVICIOS: ${servicesStr}\nDURACIÓN: ${totalDuration} min\n\n¿Queda confirmada mi cita?`;
    
    const whatsappUrl = `https://wa.me/${salonPhone}?text=${encodeURIComponent(message)}`;

    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
        {/* Decoración de fondo */}
        <MuralDecorations />
        
        {/* Tarjeta de Confirmación Estilo Alebrije */}
        <div className="z-10 bg-white/90 backdrop-blur-sm p-8 rounded-3xl border-2 border-salon-olive shadow-folk max-w-sm hand-drawn animate-in fade-in zoom-in">
            {/* Ícono Vectorial (Estrella) */}
            <div className="w-20 h-20 bg-salon-yellow rounded-full flex items-center justify-center mb-4 mx-auto border-2 border-salon-brown">
              <svg className="w-10 h-10 text-salon-brown" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            </div>
            
            <h1 className="text-2xl font-black text-salon-brown mb-2 uppercase tracking-wider">¡Cita Apartada!</h1>
            <p className="text-salon-gray mb-6 text-xs font-bold uppercase tracking-widest leading-relaxed">
              Para finalizar, es necesario enviar el mensaje de confirmación.
            </p>

            <a 
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#25D366] text-white px-6 py-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-3 hover:bg-[#20bd5a] transition-all transform hover:scale-105 hand-drawn border-2 border-transparent"
            >
              {/* Logo de WhatsApp Vectorial */}
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-8.68-2.031-.967-.272-.297-.471-.446-.917-.446-.446 0-.967.174-1.488.744-.521.57-1.984 1.933-1.984 4.71s2.032 4.164 2.305 4.536c.273.371 3.967 6.059 9.61 8.463 3.939 1.678 4.735 1.344 5.578 1.268.843-.075 1.835-.744 2.096-1.463.261-.718.261-1.338.186-1.462z"/></svg>
              <span>CONFIRMAR EN WHATSAPP</span>
            </a>
            
            <button onClick={() => window.location.reload()} className="text-[10px] uppercase tracking-wider text-salon-gray underline mt-6 block mx-auto font-bold hover:text-salon-brown">
              Volver al inicio
            </button>
        </div>
      </main>
    );
  }

  // --- VISTA PRINCIPAL ---
  return (
    <main className="min-h-screen p-6 md:p-8 max-w-md mx-auto relative">
        
        {/* Fondo Muralista */}
        <MuralDecorations />

        {/* HEADER LIMPIO */}
        <header className="mb-8 text-center mt-6 fade-in flex flex-col items-center relative z-10">
          <div className="w-36 h-36 relative mb-2 filter drop-shadow-sm hover:rotate-2 transition-transform duration-500">
            <Image 
              src="/logo-tangible.png" 
              alt="Tangible Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          
          <h1 className="text-2xl font-black text-salon-brown tracking-[0.3em] uppercase mb-2">
            TANGIBLE
          </h1>
          {/* Separadores sin emojis */}
          <div className="flex items-center gap-3 opacity-70">
            <div className="h-[2px] w-6 bg-salon-terracotta rounded-full"></div>
            <p className="text-salon-terracotta text-[10px] uppercase tracking-[0.2em] font-bold">
              Nails & Art Studio
            </p>
            <div className="h-[2px] w-6 bg-salon-terracotta rounded-full"></div>
          </div>
        </header>

        {/* PASO 1: SERVICIOS */}
        <section className={`relative z-10 ${showClientForm ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="flex justify-between items-center mb-4 px-2">
            <h2 className="text-xs font-black text-salon-olive uppercase tracking-[0.1em] bg-white/80 px-3 py-2 rounded-xl backdrop-blur-sm border border-salon-olive/20">
              1. Elige tu arte
            </h2>
            {selectedServices.length > 0 && (
               <span className="text-xs font-black text-white bg-salon-lavender px-3 py-1 rounded-full shadow-sm animate-pulse border-2 border-white">
                 {selectedServices.length}
               </span>
            )}
          </div>
          
          {loading ? <div className="text-center py-10 animate-pulse text-salon-gray font-medium">Cargando menú...</div> : (
            <div className="space-y-6"> {/* Más espacio para que respire */}
              {services.map((service) => (
                <div key={service.id} className={`${selectedServices.some(s => s.id === service.id) ? 'transform scale-[1.02]' : ''} transition-all duration-300`}>
                    {/* ENVOLTURA PARA ESTILO ALEBRIJE */}
                    <div className={`
                        p-1 transition-all duration-300 bg-white
                        hand-drawn
                        ${selectedServices.some(s => s.id === service.id) 
                          ? 'shadow-folk-purple border-2 border-salon-lavender' /* Seleccionada */
                          : 'shadow-folk border-2 border-salon-olive/50 hover:border-salon-olive' /* Normal */
                        }
                    `}>
                        <ServiceCard 
                          service={service}
                          onSelect={() => toggleService(service)}
                          isSelected={selectedServices.some(s => s.id === service.id)}
                        />
                    </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* PASO 2: CALENDARIO */}
        {selectedServices.length > 0 && (
          <section className={`mt-10 relative z-10 ${showClientForm ? 'opacity-50 pointer-events-none' : 'animate-in fade-in'}`}>
            <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border-2 border-salon-olive/30 hand-drawn shadow-sm">
                <h2 className="text-xs font-black text-salon-olive uppercase tracking-[0.1em] mb-5">
                  2. Tu espacio
                </h2>
                
                <div className="flex items-center justify-between mb-6 bg-salon-yellow/20 p-4 rounded-2xl border border-salon-yellow hand-drawn">
                  <span className="text-xs text-salon-brown font-bold uppercase tracking-wider">Duración total:</span>
                  <span className="font-black text-xl text-salon-brown">{totalDuration} min</span>
                </div>
                
                <BookingCalendar 
                  onDateTimeSelect={(d, t) => { setBookingDate({date: d, time: t}); setShowClientForm(false); }} 
                  totalDuration={totalDuration} 
                />
            </div>
          </section>
        )}

        {/* PASO 3: FORMULARIO */}
        {selectedServices.length > 0 && bookingDate && showClientForm && (
           <section className="mt-8 animate-in fade-in slide-in-from-bottom-4 relative z-20">
             <div className="hand-drawn bg-white shadow-folk border-2 border-salon-brown overflow-hidden">
                <ClientForm 
                  onSubmit={handleFinalBooking} 
                  isSubmitting={isSubmitting}
                  onGoBack={() => {
                    setShowClientForm(false);
                    setBookingDate(null);
                  }}
                />
             </div>
           </section>
        )}

        <div className="h-48 w-full"></div>

        {/* BARRA FLOTANTE */}
        {selectedServices.length > 0 && !showClientForm && (
          <div className="fixed bottom-4 left-0 w-full z-50 px-4">
            <div className="max-w-md mx-auto">
              <button 
                disabled={!bookingDate}
                onClick={() => {
                   setShowClientForm(true);
                   setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
                }}
                className={`
                  w-full py-4 px-6 flex justify-between items-center transition-all duration-300 hand-drawn shadow-folk border-2 border-salon-brown
                  ${bookingDate 
                    ? 'bg-salon-brown text-salon-yellow hover:scale-[1.02] active:scale-[0.98]' 
                    : 'bg-white text-salon-gray border-salon-gray/30 cursor-not-allowed opacity-90'
                  }
                `}
              >
                <div className="text-left">
                  <span className="block text-[10px] uppercase tracking-widest mb-1 font-bold">
                    {bookingDate ? 'CONTINUAR' : 'ELIGE HORA'}
                  </span>
                  <span className="font-black text-xl">${totalPrice}</span>
                </div>
                {bookingDate && (
                  // Flecha Vectorial
                  <svg className="w-8 h-8 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                  </svg>
                )}
              </button>
            </div>
          </div>
        )}
    </main>
  );
}