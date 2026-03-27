"use client";

import { useState, useEffect } from 'react';
import { format, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import MetricsDashboard from '@/components/admin/MetricsDashboard';
import MuralDecorations from '@/components/layout/MuralDecorations';

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

type Reminder = {
  id: string;
  clientName: string;
  clientPhone: string;
  whatsappUrl: string;
  sent: boolean;
};

function ConfirmModal({ 
  clientName, 
  onConfirm, 
  onCancel 
}: { 
  clientName: string;
  onConfirm: () => void; 
  onCancel: () => void; 
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onCancel}
      />
      <div className="relative z-10 bg-white w-full max-w-sm p-8 border-2 border-salon-olive/20 rounded-3xl shadow-lg animate-in fade-in zoom-in">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h3 className="text-center font-black text-salon-brown text-lg uppercase tracking-wider mb-2">
          ¿Cancelar cita?
        </h3>
        <p className="text-center text-salon-gray text-xs font-medium mb-8 leading-relaxed">
          Estás por cancelar la cita de{' '}
          <span className="font-black text-salon-terracotta uppercase">{clientName}</span>
          . Esta acción no se puede deshacer.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            className="w-full py-3 bg-red-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-red-600 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-sm"
          >
            Sí, cancelar cita
          </button>
          <button
            onClick={onCancel}
            className="w-full py-3 bg-white text-salon-gray font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-gray-50 transition-all transform hover:scale-[1.02] active:scale-[0.98] border border-gray-200 shadow-sm"
          >
            No, mantener cita
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<'UPCOMING' | 'HISTORY'>('UPCOMING');
  const [loading, setLoading] = useState(true);
  const [cancelModal, setCancelModal] = useState<{ id: string; clientName: string } | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    fetchAppointments();
    fetchReminders();
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

  const fetchReminders = async () => {
    try {
      const res = await fetch('/api/admin/reminders');
      if (res.ok) {
        const data = await res.json();
        setReminders(data);
      }
    } catch {}
  };

  const handleCancelClick = (id: string, clientName: string) => {
    setCancelModal({ id, clientName });
  };

  const handleCancelConfirm = async () => {
    if (!cancelModal) return;
    const { id } = cancelModal;
    setCancelModal(null);
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' })
      });
      if (res.ok) {
        setAppointments(prev => prev.map(app => 
          app.id === id ? { ...app, status: 'CANCELLED' } : app
        ));
      }
    } catch {}
  };

  const markReminderSent = async (id: string) => {
    await fetch('/api/admin/reminders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setReminders(prev =>
      prev.map(r => r.id === id ? { ...r, sent: true } : r)
    );
  };

  const filteredAppointments = appointments.filter(app => {
    const appDate = new Date(app.endDate);
    const isFinished = isPast(appDate);
    const isCancelled = app.status === 'CANCELLED';
    if (filter === 'UPCOMING') return !isFinished && !isCancelled;
    return isFinished || isCancelled;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <main className="min-h-screen p-6 md:p-10 relative bg-salon-bg">
      <MuralDecorations />

      {cancelModal && (
        <ConfirmModal
          clientName={cancelModal.clientName}
          onConfirm={handleCancelConfirm}
          onCancel={() => setCancelModal(null)}
        />
      )}

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
            <a
              href="/admin/qr"
              className="flex flex-col items-center bg-white px-6 py-3 border-2 border-salon-lavender/30 rounded-2xl shadow-sm hover:shadow-md hover:scale-105 transition-all"
            >
              <span className="text-[10px] uppercase text-salon-gray font-bold tracking-wider mb-1">QR</span>
              <span className="text-2xl font-black text-salon-lavender">▣</span>
            </a>

            <a
              href="/admin/schedule"
              className="flex flex-col items-center bg-white px-6 py-3 border-2 border-salon-terracotta/30 rounded-2xl shadow-sm hover:shadow-md hover:scale-105 transition-all"
            >
              <span className="text-[10px] uppercase text-salon-gray font-bold tracking-wider mb-1">Horario</span>
              <span className="text-2xl font-black text-salon-terracotta">⚙</span>
            </a>

            <button 
              onClick={() => window.location.reload()}
              className="group flex flex-col items-center bg-white px-6 py-3 border-2 border-salon-olive/30 rounded-2xl shadow-sm hover:shadow-md hover:scale-105 transition-all"
            >
              <span className="text-[10px] uppercase text-salon-gray font-bold tracking-wider mb-1">Total Citas</span>
              <span className="text-2xl font-black text-salon-olive group-hover:text-salon-terracotta transition-colors">
                {appointments.length}
              </span>
            </button>
          </div>
        </header>

        {/* MÉTRICAS */}
        <MetricsDashboard />

        {/* RECORDATORIOS DE MAÑANA */}
        {reminders.length > 0 && (
          <div className="bg-salon-yellow/10 border border-salon-yellow/40 rounded-3xl p-5 mb-6 shadow-sm">
            <h2 className="text-xs font-black text-salon-brown uppercase tracking-widest mb-3">
              Recordatorios para mañana ({reminders.length})
            </h2>
            <div className="space-y-2">
              {reminders.map((r) => (
                <div
                  key={r.id}
                  className={`flex items-center justify-between bg-white rounded-2xl px-4 py-3 border transition-all shadow-sm hover:shadow-md ${r.sent ? 'opacity-50 border-gray-100' : 'border-salon-yellow/30'}`}
                >
                  <div>
                    <span className="font-black text-salon-brown text-sm">{r.clientName}</span>
                    <span className="text-salon-gray text-xs ml-2">
                      ...{r.clientPhone.slice(-4)}
                    </span>
                  </div>
                  {!r.sent ? (
                    <a
                      href={r.whatsappUrl}
                      target="_blank"
                      onClick={() => markReminderSent(r.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white rounded-xl text-xs font-bold uppercase transition-transform hover:scale-[1.05] active:scale-[0.95] shadow-sm"
                    >
                      <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.347-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
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

        {/* LISTA DE CITAS */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-20 text-salon-gray animate-pulse font-bold text-xs uppercase tracking-widest">
              Cargando agenda...
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-salon-gray/20 rounded-3xl">
              <p className="text-salon-gray font-bold text-sm uppercase">No hay citas en esta sección</p>
            </div>
          ) : (
            filteredAppointments.map((app) => (
              <div key={app.id} className={`
                bg-white p-6 rounded-3xl border-2 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 flex flex-col md:flex-row justify-between items-start md:items-center gap-6
                ${app.status === 'CANCELLED' ? 'border-gray-100 opacity-60' : 'border-salon-olive/20'}
              `}>
                <div className="flex items-start gap-5 w-full md:w-auto">
                  <div className={`
                    w-20 h-20 rounded-2xl flex flex-col items-center justify-center font-bold border-2 shrink-0
                    ${app.status === 'CANCELLED' 
                      ? 'bg-gray-50 border-gray-100 text-gray-400' 
                      : 'bg-salon-bg border-salon-olive/20 text-salon-brown'
                    }
                  `}>
                    <span className="text-[10px] uppercase tracking-wider">
                      {format(new Date(app.date), 'MMM', { locale: es })}
                    </span>
                    <span className="text-3xl font-black">
                      {format(new Date(app.date), 'd')}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-black text-salon-brown text-lg uppercase tracking-wide">
                      {app.clientName}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs font-bold text-salon-gray">
                      <span className="flex items-center gap-1 text-salon-terracotta bg-salon-terracotta/10 px-2 py-0.5 rounded-lg">
                        <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z"/>
                        </svg>
                        {format(new Date(app.date), 'HH:mm')}
                      </span>
                      <span className="text-salon-gray/30">|</span>
                      <span>{app.services.length} SERVICIO(S)</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-3">
                      {app.services.map(s => (
                        <span key={s.id} className="text-[9px] uppercase tracking-wider border border-salon-gray/20 bg-gray-50 px-2 py-1 rounded-lg text-salon-gray font-bold">
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch gap-2 w-full md:w-auto">
                  <a 
                    href={`https://wa.me/${app.clientPhone.replace(/\D/g,'')}`}
                    target="_blank"
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-[#25D366] text-white rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-[#20bd5a] transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-sm"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.347-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    Contactar
                  </a>

                  {app.status !== 'CANCELLED' && filter === 'UPCOMING' && (
                    <>
                      <a 
                        href={`https://wa.me/${app.clientPhone.replace(/\D/g,'')}?text=${encodeURIComponent(`HOLA ${app.clientName.split(' ')[0].toUpperCase()}, SOY DE TANGIBLE.\n\nTE ESCRIBO PARA AVISARTE QUE LAMENTABLEMENTE TENGO QUE REAGENDAR TU CITA DE HOY POR UN IMPREVISTO.\n\nUNA DISCULPA ENORME. ¿TE PARECE SI BUSCAMOS OTRO HORARIO?`)}`}
                        target="_blank"
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-salon-yellow/20 text-salon-brown rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-salon-yellow/40 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-sm"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M12 2L1 21h22L12 2zm1 16h-2v-2h2v2zm0-4h-2V9h2v5z"/>
                        </svg>
                        Avisar
                      </a>

                      <button 
                        onClick={() => handleCancelClick(app.id, app.clientName)}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-500 rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-red-100 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-sm"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                        Cancelar
                      </button>
                    </>
                  )}

                  {app.status === 'CANCELLED' && (
                    <div className="px-4 py-3 bg-gray-50 text-gray-400 rounded-2xl text-xs font-bold uppercase tracking-wider text-center">
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