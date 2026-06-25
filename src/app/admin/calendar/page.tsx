"use client";

import { Suspense, useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameMonth, isSameDay, isToday, isBefore, startOfDay,
  addMonths, subMonths, getDay,
} from "date-fns";
import { es } from "date-fns/locale";
import MuralDecorations from "@/components/layout/MuralDecorations";
import CreateAppointmentModal from "@/components/admin/CreateAppointmentModal";
import EditAppointmentModal from "@/components/admin/EditAppointmentModal";
import PaymentModal from "@/components/admin/PaymentModal";
import DayAgenda, { AgendaAppointment } from "@/components/admin/DayAgenda";
import { chihuahuaToUTC, chihuahuaDateKey } from "@/lib/timezone";

type DaySchedule = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isDayOff: boolean;
};

const DAY_HEADERS = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"];

function CalendarContent() {
  const searchParams = useSearchParams();

  const [currentMonth, setCurrentMonth]   = useState(new Date());
  const [selectedDate,  setSelectedDate]  = useState(new Date());
  const [appointments,  setAppointments]  = useState<AgendaAppointment[]>([]);
  const [weekSchedule,  setWeekSchedule]  = useState<DaySchedule[]>([]);
  const [loading,       setLoading]       = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [quickTime,        setQuickTime]       = useState<string | undefined>(undefined);
  const [editModal,        setEditModal]        = useState<AgendaAppointment | null>(null);
  const [paymentModal,     setPaymentModal]     = useState<AgendaAppointment | null>(null);
  const [moveModeId,       setMoveModeId]       = useState<string | null>(null);

  // Deep-link desde el panel: /admin/calendar?date=2026-06-15
  useEffect(() => {
    const p = searchParams.get("date");
    if (p && /^\d{4}-\d{2}-\d{2}$/.test(p)) {
      const [y, m, d] = p.split("-").map(Number);
      const date = new Date(y, m - 1, d);
      setSelectedDate(date);
      setCurrentMonth(date);
    }
  }, [searchParams]);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/appointments");
      if (res.ok) setAppointments(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
    fetch("/api/admin/schedule").then((r) => r.json()).then(setWeekSchedule);
  }, [fetchAppointments]);

  // ── Calendario mensual ──
  const monthStart   = startOfMonth(currentMonth);
  const monthEnd     = endOfMonth(currentMonth);
  const days         = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = getDay(monthStart);

  const appointmentsByDay = useMemo(() => {
    const map: Record<string, AgendaAppointment[]> = {};
    appointments.forEach((a) => {
      // Agrupar por día de calendario de Chihuahua (no por la zona del navegador).
      const key = chihuahuaDateKey(new Date(a.date));
      if (!map[key]) map[key] = [];
      map[key].push(a);
    });
    return map;
  }, [appointments]);

  const confirmedOnDay = (day: Date) =>
    (appointmentsByDay[format(day, "yyyy-MM-dd")] ?? []).filter(
      (a) => a.status !== "CANCELLED"
    );

  // ── Agenda del día seleccionado ──
  const selectedDayAppointments = useMemo(
    () =>
      appointments
        .filter(
          (a) =>
            chihuahuaDateKey(new Date(a.date)) ===
            format(selectedDate, "yyyy-MM-dd")
        )
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [appointments, selectedDate]
  );

  const selectedSchedule =
    weekSchedule.find((s) => s.dayOfWeek === getDay(selectedDate)) ?? null;

  const isSelectedPast  = isBefore(selectedDate, startOfDay(new Date()));
  const isSelectedToday = isToday(selectedDate);

  // ── Handlers ──
  const handleSlotClick = (time: string) => {
    setQuickTime(time);
    setShowCreateModal(true);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  /** Mueve la cita al día seleccionado en el calendario + la hora del slot */
  const handleDropMove = async (id: string, time: string) => {
    const [h, m] = time.split(":").map(Number);
    const newDate = chihuahuaToUTC(
      selectedDate.getFullYear(),
      selectedDate.getMonth() + 1,
      selectedDate.getDate(),
      h,
      m
    );

    const res = await fetch(`/api/admin/appointments/${id}/reschedule`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: newDate.toISOString() }),
    });

    if (res.ok) {
      const updated = await res.json();
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === id
            ? { ...a, date: updated.date, endDate: updated.endDate }
            : a
        )
      );
    } else {
      const err = await res.json().catch(() => ({}));
      alert((err as { error?: string }).error ?? "No se pudo mover la cita.");
    }

    setMoveModeId(null);
  };

  const handleAppointmentUpdated = (
    id: string,
    data: Partial<AgendaAppointment>
  ) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...data } : a))
    );
  };

  return (
    <main className="min-h-screen bg-salon-bg relative">
      <MuralDecorations />

      <div className="max-w-5xl mx-auto p-4 md:p-8 relative z-10">
        {/* HEADER */}
        <header className="flex items-center justify-between mb-6">
          <div>
            <a
              href="/admin"
              className="text-[10px] text-salon-gray font-bold uppercase tracking-wider hover:text-salon-brown mb-2 block"
            >
              ← Panel
            </a>
            <h1 className="text-2xl font-black text-salon-brown uppercase tracking-[0.15em]">
              Calendario
            </h1>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* CALENDARIO MENSUAL */}
          <div className="lg:col-span-2 bg-white rounded-3xl border-2 border-salon-olive/20 shadow-sm p-5">
            <div className="flex items-center justify-between mb-5">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="w-9 h-9 rounded-xl border-2 border-salon-olive/20 flex items-center justify-center text-salon-brown hover:border-salon-olive transition-all font-black"
              >
                ‹
              </button>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-salon-brown uppercase tracking-wider text-sm">
                  {format(currentMonth, "MMMM yyyy", { locale: es })}
                </h2>
                {!isToday(selectedDate) && (
                  <button
                    onClick={goToToday}
                    className="text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg border-2 border-salon-olive/30 text-salon-olive hover:bg-salon-olive hover:text-white transition-all"
                  >
                    Hoy
                  </button>
                )}
              </div>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="w-9 h-9 rounded-xl border-2 border-salon-olive/20 flex items-center justify-center text-salon-brown hover:border-salon-olive transition-all font-black"
              >
                ›
              </button>
            </div>

            <div className="grid grid-cols-7 mb-2">
              {DAY_HEADERS.map((d) => (
                <div
                  key={d}
                  className="text-center text-[10px] font-black text-salon-gray uppercase tracking-widest py-1"
                >
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: startPadding }).map((_, i) => (
                <div key={`pad-${i}`} />
              ))}

              {days.map((day) => {
                const confirmed  = confirmedOnDay(day);
                const selected   = isSameDay(day, selectedDate);
                const current    = isToday(day);
                const inMonth    = isSameMonth(day, currentMonth);
                const hasApps    = confirmed.length > 0;
                const past       = isBefore(day, startOfDay(new Date()));

                return (
                  <button
                    key={day.toString()}
                    onClick={() => setSelectedDate(day)}
                    className={`
                      relative aspect-square flex flex-col items-center justify-start pt-1.5
                      rounded-xl transition-all text-sm font-bold border-2
                      ${!inMonth ? "opacity-30" : ""}
                      ${past
                        ? "text-gray-300 border-transparent hover:bg-gray-50"
                        : selected
                        ? "bg-salon-brown text-white border-salon-brown shadow-md scale-105"
                        : current
                        ? "border-salon-terracotta text-salon-terracotta bg-salon-terracotta/5"
                        : hasApps
                        ? "border-salon-olive/30 bg-salon-olive/5 hover:border-salon-olive"
                        : "border-transparent hover:border-salon-gray/20 hover:bg-gray-50"
                      }
                    `}
                  >
                    <span className="text-xs leading-none">{format(day, "d")}</span>

                    {hasApps && (
                      <div className="flex gap-0.5 mt-1 flex-wrap justify-center px-0.5">
                        {confirmed.slice(0, 3).map((a) => (
                          <span
                            key={a.id}
                            className={`w-1.5 h-1.5 rounded-full ${
                              past
                                ? "bg-gray-200"
                                : a.paymentStatus === "PAID"
                                ? "bg-green-500"
                                : a.paymentStatus === "PARTIAL"
                                ? "bg-blue-400"
                                : "bg-amber-400"
                            }`}
                          />
                        ))}
                        {confirmed.length > 3 && (
                          <span className="text-[8px] text-salon-gray font-bold leading-none">
                            +{confirmed.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-4 mt-4 pt-4 border-t border-salon-gray/10">
              {[
                { color: "bg-amber-400", label: "Pendiente" },
                { color: "bg-blue-400",  label: "Anticipo" },
                { color: "bg-green-500", label: "Pagado" },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${l.color}`} />
                  <span className="text-[10px] text-salon-gray font-bold uppercase tracking-wider">
                    {l.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* AGENDA DEL DÍA */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl border-2 border-salon-olive/20 shadow-sm overflow-hidden">
              <div className={`p-4 ${isSelectedPast ? "bg-salon-gray/40" : "bg-salon-brown"}`}>
                <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest">
                  {format(selectedDate, "EEEE", { locale: es })}
                </p>
                <p className="text-xl font-black text-white">
                  {format(selectedDate, "d 'de' MMMM", { locale: es })}
                </p>
                {isSelectedPast && (
                  <p className="text-[10px] text-white/70 font-bold mt-1">
                    Fecha pasada — registro manual para historial
                  </p>
                )}
              </div>

              <DayAgenda
                appointments={selectedDayAppointments}
                schedule={selectedSchedule}
                loading={loading}
                isPast={isSelectedPast}
                isCurrentDay={isSelectedToday}
                moveModeId={moveModeId}
                onSlotClick={handleSlotClick}
                onAppointmentClick={(app) => setEditModal(app)}
                onPaymentClick={(app) => setPaymentModal(app)}
                onStartMove={(app) => setMoveModeId(app.id)}
                onDropMove={(time) => {
                  if (moveModeId) handleDropMove(moveModeId, time);
                }}
                onCancelMove={() => setMoveModeId(null)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modal: nueva cita */}
      {showCreateModal && (
        <CreateAppointmentModal
          onClose={() => {
            setShowCreateModal(false);
            setQuickTime(undefined);
          }}
          onCreated={() => {
            // Solo refrescamos; el modal muestra el paso de confirmación y se
            // cierra con su propio botón (onClose).
            fetchAppointments();
          }}
          preselectedDate={selectedDate}
          preselectedTime={quickTime}
        />
      )}

      {/* Modal: editar cita (servicios + clienta, sin fecha) */}
      {editModal && (
        <EditAppointmentModal
          appointment={editModal}
          onClose={() => setEditModal(null)}
          onUpdated={(data) => {
            handleAppointmentUpdated(editModal.id, data);
            setEditModal(null);
          }}
        />
      )}

      {/* Modal: pago */}
      {paymentModal && (
        <PaymentModal
          appointmentId={paymentModal.id}
          clientName={paymentModal.clientName}
          currentPaymentStatus={
            (paymentModal.paymentStatus as "PENDING" | "PARTIAL" | "PAID") ?? "PENDING"
          }
          currentPaymentMethod={paymentModal.paymentMethod}
          currentFinalPrice={paymentModal.finalPrice}
          currentDepositPaid={paymentModal.depositPaid}
          currentDepositAmount={paymentModal.depositAmount}
          services={paymentModal.services}
          onClose={() => setPaymentModal(null)}
          onUpdated={(data) => {
            handleAppointmentUpdated(paymentModal.id, data);
            setPaymentModal(null);
          }}
        />
      )}
    </main>
  );
}

export default function CalendarPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-salon-bg" />}>
      <CalendarContent />
    </Suspense>
  );
}