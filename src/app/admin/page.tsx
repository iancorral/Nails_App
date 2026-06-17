"use client";

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import MetricsDashboard from '@/components/admin/MetricsDashboard';
import MuralDecorations from '@/components/layout/MuralDecorations';
import PaymentBadge from '@/components/admin/PaymentBadge';

type Service = { id: string; name: string; price: number; duration: number };
type Appointment = {
  id: string;
  date: string | Date;
  endDate: string | Date;
  clientName: string;
  clientPhone: string;
  status: string;
  services: Service[];
  paymentStatus: string;
  paymentMethod?: string | null;
  finalPrice?: number | null;
  createdByAdmin?: boolean;
};

type Reminder = {
  id: string;
  clientName: string;
  clientPhone: string;
  whatsappUrl: string;
  sent: boolean;
};

export default function AdminDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<'UPCOMING' | 'HISTORY'>('UPCOMING');
  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/appointments')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setAppointments(data);
        setLoading(false);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error(error);
        setLoading(false);
      });

    fetch('/api/admin/reminders')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setReminders(data);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const markReminderSent = async (id: string) => {
    await fetch('/api/admin/reminders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setReminders(prev => prev.map(r => r.id === id ? { ...r, sent: true } : r));
  };

  const filteredAppointments = appointments.filter(app => {
    const appDate = new Date(app.endDate);
    const now = new Date();
    const isFinished = appDate < now;
    const isCancelled = app.status === 'CANCELLED';
    if (filter === 'UPCOMING') return !isFinished && !isCancelled;
    return isFinished || isCancelled;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <main className="min-h-screen p-6 md:p-10 relative bg-salon-bg">
      <MuralDecorations />

      <div className="max-w-5xl mx-auto relative z-10">

        {/* HEADER */}
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

          <div className="flex gap-3">
            <a href="/admin/calendar" className="flex flex-col items-center bg-white px-6 py-3 border-2 border-salon-lavender/30 rounded-2xl shadow-sm hover:shadow-md hover:scale-105 transition-all">
              <span className="text-[10px] uppercase text-salon-gray font-bold tracking-wider mb-1">Agenda</span>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </a>
            <a href="/admin/qr" className="flex flex-col items-center bg-white px-6 py-3 border-2 border-salon-lavender/30 rounded-2xl shadow-sm hover:shadow-md hover:scale-105 transition-all">
              <span className="text-[10px] uppercase text-salon-gray font-bold tracking-wider mb-1">QR</span>
              <svg className="w-6 h-6 text-salon-lavender" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <rect x="3" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="3" height="3"/>
                <rect x="18" y="14" width="3" height="3"/>
                <rect x="14" y="18" width="3" height="3"/>
                <rect x="18" y="18" width="3" height="3"/>
              </svg>
            </a>
            <a href="/admin/schedule" className="flex flex-col items-center bg-white px-6 py-3 border-2 border-salon-terracotta/30 rounded-2xl shadow-sm hover:shadow-md hover:scale-105 transition-all">
              <span className="text-[10px] uppercase text-salon-gray font-bold tracking-wider mb-1">Horario</span>
              <svg className="w-6 h-6 text-salon-terracotta" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </a>
            <button onClick={() => window.location.reload()} className="group flex flex-col items-center bg-white px-6 py-3 border-2 border-salon-olive/30 rounded-2xl shadow-sm hover:shadow-md hover:scale-105 transition-all">
              <span className="text-[10px] uppercase text-salon-gray font-bold tracking-wider mb-1">Total Citas</span>
              <span className="text-2xl font-black text-salon-olive group-hover:text-salon-terracotta transition-colors">
                {appointments.length}
              </span>
            </button>
          </div>
        </header>

        <MetricsDashboard />

        {/* RECORDATORIOS — tareas de hoy */}
        {reminders.length > 0 && (
          <div className="bg-salon-yellow/10 border border-salon-yellow/40 rounded-3xl p-5 mb-6 shadow-sm">
            <h2 className="text-xs font-black text-salon-brown uppercase tracking-widest mb-3">
              Recordatorios para mañana ({reminders.length})
            </h2>
            <div className="space-y-2">
              {reminders.map((r) => (
                <div key={r.id} className={`flex items-center justify-between bg-white rounded-2xl px-4 py-3 border transition-all shadow-sm hover:shadow-md ${r.sent ? 'opacity-50 border-gray-100' : 'border-salon-yellow/30'}`}>
                  <div>
                    <span className="font-black text-salon-brown text-sm">{r.clientName}</span>
                    <span className="text-salon-gray text-xs ml-2">...{r.clientPhone.slice(-4)}</span>
                  </div>
                  {!r.sent ? (
                    <a href={r.whatsappUrl} target="_blank" rel="noopener noreferrer" onClick={() => markReminderSent(r.id)} className="flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white rounded-xl text-xs font-bold uppercase transition-transform hover:scale-[1.05] active:scale-[0.95] shadow-sm">
                      Enviar
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400 font-bold uppercase">Enviado</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TABS */}
        <div className="flex gap-6 mb-3 border-b-2 border-salon-olive/10 pb-1">
          <button onClick={() => setFilter('UPCOMING')} className={`pb-2 text-xs font-black uppercase tracking-widest transition-all border-b-4 ${filter === 'UPCOMING' ? 'text-salon-olive border-salon-olive' : 'text-salon-gray border-transparent hover:text-salon-brown'}`}>
            Próximas
          </button>
          <button onClick={() => setFilter('HISTORY')} className={`pb-2 text-xs font-black uppercase tracking-widest transition-all border-b-4 ${filter === 'HISTORY' ? 'text-salon-terracotta border-salon-terracotta' : 'text-salon-gray border-transparent hover:text-salon-brown'}`}>
            Historial / Canceladas
          </button>
        </div>

        <p className="text-[10px] text-salon-gray font-bold uppercase tracking-wider mb-3">
          Toca una cita para administrarla en la Agenda
        </p>

        {/* LISTA — solo informativa */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-20 text-salon-gray animate-pulse font-bold text-xs uppercase tracking-widest">
              Cargando agenda...
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-salon-gray/20 rounded-3xl">
              <p className="text-salon-gray font-bold text-sm uppercase">No hay citas en esta sección</p>
            </div>
          ) : (
            filteredAppointments.map((app) => {
              const price = app.finalPrice ?? app.services.reduce((a, s) => a + s.price, 0);
              const dateKey = format(new Date(app.date), 'yyyy-MM-dd');
              return (
                <a
                  key={app.id}
                  href={`/admin/calendar?date=${dateKey}`}
                  className={`flex items-center gap-4 bg-white p-4 rounded-2xl border-2 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all ${
                    app.status === 'CANCELLED' ? 'border-gray-100 opacity-60' : 'border-salon-olive/20'
                  }`}
                >
                  <div className="w-14 h-14 rounded-xl flex flex-col items-center justify-center font-bold border-2 border-salon-olive/20 bg-salon-bg text-salon-brown shrink-0">
                    <span className="text-[9px] uppercase tracking-wider">{format(new Date(app.date), 'MMM', { locale: es })}</span>
                    <span className="text-xl font-black">{format(new Date(app.date), 'd')}</span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-black text-salon-brown uppercase tracking-wide truncate">{app.clientName}</h3>
                      <span className="text-sm font-black text-salon-brown shrink-0">${price}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-salon-terracotta font-bold">{format(new Date(app.date), 'HH:mm')}</span>
                      <span className="text-[10px] text-salon-gray">·</span>
                      <span className="text-[10px] text-salon-gray font-bold truncate">
                        {app.services.map(s => s.name).join(', ')}
                      </span>
                    </div>
                    <div className="mt-1.5">
                      <PaymentBadge
                        paymentStatus={(app.paymentStatus as 'PENDING' | 'PARTIAL' | 'PAID') ?? 'PENDING'}
                        appStatus={(app.status as 'CONFIRMED' | 'CANCELLED')}
                        createdByAdmin={app.createdByAdmin}
                        paymentMethod={app.paymentMethod}
                      />
                    </div>
                  </div>

                  <span className="text-salon-gray text-lg shrink-0">›</span>
                </a>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}