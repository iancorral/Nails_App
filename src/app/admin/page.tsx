"use client";

import { useState, useEffect, useCallback } from 'react';
import MetricsDashboard from '@/components/admin/MetricsDashboard';
import MuralDecorations from '@/components/layout/MuralDecorations';
import PaymentBadge from '@/components/admin/PaymentBadge';
import WhatsAppIcon from '@/components/icons/WhatsAppIcon';
import { buildReminderUrl } from '@/lib/whatsapp';
import {
  formatChihuahuaTime,
  formatChihuahuaMonthShort,
  getChihuahuaParts,
  chihuahuaDateKey,
} from '@/lib/timezone';

type Service = { id: string; name: string; price: number; duration: number };
type Appointment = {
  id: string;
  date: string | Date;
  endDate: string | Date;
  clientName: string;
  clientPhone: string | null;
  status: string;
  services: Service[];
  paymentStatus: string;
  paymentMethod?: string | null;
  finalPrice?: number | null;
  createdByAdmin?: boolean;
};

type Reminder = {
  id: string; // appointmentId
  clientName: string;
  clientPhone: string;
  date: string; // instante UTC de la cita
  services: { name: string }[];
  reminderSent: boolean;
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
        if (!cancelled && Array.isArray(data)) setReminders(data);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  // Recordatorios que ya se abrieron en WhatsApp en esta sesión (estado local).
  // No se persiste: abrir el chat NO implica que el mensaje se haya enviado, eso
  // solo lo sabe la admin tras pulsar "Enviar" dentro de WhatsApp.
  const [openedIds, setOpenedIds] = useState<Set<string>>(new Set());

  // Persiste el estado "enviado" (o lo deshace) en la bitácora.
  const setReminderSent = useCallback(async (appointmentId: string, sent: boolean) => {
    setReminders(prev =>
      prev.map(r => (r.id === appointmentId ? { ...r, reminderSent: sent } : r))
    );
    await fetch('/api/admin/reminders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointmentId, sent }),
    }).catch(() => {});
  }, []);

  // Abre WhatsApp con el recordatorio listo. NO lo marca como enviado: el envío
  // real ocurre dentro de WhatsApp y la app no puede saber si se completó.
  const openReminder = useCallback((r: Reminder) => {
    const url = buildReminderUrl(r.clientPhone, {
      clientName: r.clientName,
      date: r.date,
      serviceNames: r.services.map(s => s.name),
    });
    window.open(url, '_blank', 'noopener,noreferrer');
    setOpenedIds(prev => new Set(prev).add(r.id));
  }, []);

  const undoSent = useCallback((appointmentId: string) => {
    setOpenedIds(prev => {
      const next = new Set(prev);
      next.delete(appointmentId);
      return next;
    });
    setReminderSent(appointmentId, false);
  }, [setReminderSent]);

  // "Abrir siguiente": WhatsApp solo permite abrir un chat por gesto del usuario.
  // Abre el siguiente recordatorio que aún no se ha abierto ni marcado como enviado.
  const openNextReminder = useCallback(() => {
    const next = reminders.find(r => !r.reminderSent && !openedIds.has(r.id));
    if (next) openReminder(next);
  }, [reminders, openedIds, openReminder]);

  const unopenedCount = reminders.filter(r => !r.reminderSent && !openedIds.has(r.id)).length;

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
            <h1 className="font-title text-2xl sm:text-3xl font-black text-salon-brown uppercase tracking-[0.15em] mb-1">
              Panel de Control
            </h1>
            <div className="flex items-center gap-3 opacity-70">
              <div className="h-[2px] w-8 bg-salon-terracotta"></div>
              <p className="text-xs text-salon-terracotta font-bold tracking-widest uppercase">
                Administración Tangible
              </p>
            </div>
          </div>

          {/* Acciones rápidas: rejilla de 4 a ancho completo en móvil (tarjetas
              alineadas y de igual altura), fila compacta alineada a la derecha en
              escritorio (sin cambios respecto al diseño original). */}
          <div className="grid grid-cols-4 gap-2 w-full md:flex md:w-auto md:gap-3">
            <a href="/admin/calendar" className="flex flex-col items-center justify-center min-w-0 bg-white px-2 py-3 md:px-6 border-2 border-salon-lavender/30 rounded-2xl shadow-sm hover:shadow-md hover:scale-105 transition-all">
              <span className="text-[10px] uppercase text-salon-gray font-bold tracking-wider mb-1">Agenda</span>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </a>
            <a href="/admin/qr" className="flex flex-col items-center justify-center min-w-0 bg-white px-2 py-3 md:px-6 border-2 border-salon-lavender/30 rounded-2xl shadow-sm hover:shadow-md hover:scale-105 transition-all">
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
            <a href="/admin/schedule" className="flex flex-col items-center justify-center min-w-0 bg-white px-2 py-3 md:px-6 border-2 border-salon-terracotta/30 rounded-2xl shadow-sm hover:shadow-md hover:scale-105 transition-all">
              <span className="text-[10px] uppercase text-salon-gray font-bold tracking-wider mb-1">Horario</span>
              <svg className="w-6 h-6 text-salon-terracotta" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </a>
            <button onClick={() => window.location.reload()} className="group flex flex-col items-center justify-center min-w-0 bg-white px-2 py-3 md:px-6 border-2 border-salon-olive/30 rounded-2xl shadow-sm hover:shadow-md hover:scale-105 transition-all">
              <span className="text-[10px] uppercase text-salon-gray font-bold tracking-wider mb-1 text-center leading-tight">Total Citas</span>
              <span className="text-2xl md:text-3xl font-black text-salon-olive group-hover:text-salon-terracotta transition-colors">
                {appointments.length}
              </span>
            </button>
          </div>
        </header>

        <MetricsDashboard />

        {/* RECORDATORIOS — citas de mañana */}
        {reminders.length > 0 && (
          <div className="bg-salon-yellow/10 border border-salon-yellow/40 rounded-3xl p-5 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-3 gap-3">
              <h2 className="text-xs font-black text-salon-brown uppercase tracking-widest">
                Recordatorios para mañana ({reminders.length})
              </h2>
              {unopenedCount > 0 && (
                <button
                  onClick={openNextReminder}
                  className="flex items-center gap-2 px-4 py-2 bg-salon-brown text-salon-yellow rounded-xl text-[11px] font-black uppercase tracking-wider transition-transform hover:scale-[1.03] active:scale-[0.97] shadow-sm shrink-0"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5" />
                  Abrir siguiente ({unopenedCount})
                </button>
              )}
            </div>

            <p className="text-[10px] text-salon-gray font-bold mb-3">
              Se abre WhatsApp con el mensaje listo. Al volver, confirma el envío con &quot;Ya lo envié&quot;
              (la app no puede saber por sí sola si el mensaje se mandó).
            </p>

            <div className="space-y-2">
              {reminders.map((r) => {
                const opened = openedIds.has(r.id);
                return (
                  <div key={r.id} className={`flex items-center justify-between bg-white rounded-2xl px-4 py-3 border transition-all shadow-sm hover:shadow-md ${r.reminderSent ? 'opacity-50 border-gray-100' : opened ? 'border-salon-olive/40' : 'border-salon-yellow/30'}`}>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-salon-brown text-sm truncate">{r.clientName}</span>
                        <span className="text-[10px] font-black text-salon-terracotta bg-salon-terracotta/10 px-2 py-0.5 rounded-full shrink-0">
                          {formatChihuahuaTime(new Date(r.date))}
                        </span>
                      </div>
                      <span className="text-salon-gray text-[10px] font-bold truncate block">
                        {r.services.map(s => s.name).join(', ')}
                      </span>
                    </div>

                    {r.reminderSent ? (
                      // Estado final: enviado. Permite deshacer si se marcó por error.
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <span className="text-xs text-gray-400 font-bold uppercase">Enviado</span>
                        <button
                          onClick={() => undoSent(r.id)}
                          className="text-[10px] text-salon-gray/70 font-bold uppercase underline hover:text-salon-terracotta"
                        >
                          Deshacer
                        </button>
                      </div>
                    ) : opened ? (
                      // Se abrió WhatsApp: la admin confirma manualmente el envío real.
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <button
                          onClick={() => openReminder(r)}
                          className="text-[10px] text-salon-gray font-bold uppercase underline hover:text-salon-brown"
                        >
                          Reabrir
                        </button>
                        <button
                          onClick={() => setReminderSent(r.id, true)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-salon-olive text-white rounded-xl text-xs font-bold uppercase transition-transform hover:scale-[1.05] active:scale-[0.95] shadow-sm"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg>
                          Ya lo envié
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => openReminder(r)} className="flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white rounded-xl text-xs font-bold uppercase transition-transform hover:scale-[1.05] active:scale-[0.95] shadow-sm shrink-0 ml-3">
                        <WhatsAppIcon className="w-3.5 h-3.5" />
                        Enviar
                      </button>
                    )}
                  </div>
                );
              })}
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
              const apptDate = new Date(app.date);
              const dateKey = chihuahuaDateKey(apptDate);
              return (
                <a
                  key={app.id}
                  href={`/admin/calendar?date=${dateKey}`}
                  className={`flex items-center gap-4 bg-white p-4 rounded-2xl border-2 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all ${
                    app.status === 'CANCELLED' ? 'border-gray-100 opacity-60' : 'border-salon-olive/20'
                  }`}
                >
                  <div className="w-14 h-14 rounded-xl flex flex-col items-center justify-center font-bold border-2 border-salon-olive/20 bg-salon-bg text-salon-brown shrink-0">
                    <span className="text-[9px] uppercase tracking-wider">{formatChihuahuaMonthShort(apptDate)}</span>
                    <span className="text-xl font-black">{getChihuahuaParts(apptDate).day}</span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-black text-salon-brown uppercase tracking-wide truncate">{app.clientName}</h3>
                      <span className="text-sm font-black text-salon-brown shrink-0">${price}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-salon-terracotta font-bold">{formatChihuahuaTime(apptDate)}</span>
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