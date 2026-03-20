"use client";

import { useState, useEffect } from "react";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import MuralDecorations from '@/components/layout/MuralDecorations';

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

type DaySchedule = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isDayOff: boolean;
};

type BlockedDate = {
  id: string;
  date: string;
  reason?: string;
};

export default function SchedulePage() {
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newBlockDate, setNewBlockDate] = useState("");
  const [newBlockReason, setNewBlockReason] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/schedule").then((r) => r.json()),
      fetch("/api/admin/blocked-dates").then((r) => r.json()),
    ]).then(([sched, blocked]) => {
      setSchedule(sched);
      setBlockedDates(blocked);
      setLoadingSchedule(false);
    });
  }, []);

  const updateDay = (dayOfWeek: number, field: keyof DaySchedule, value: string | boolean) => {
    setSchedule((prev) =>
      prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, [field]: value } : d))
    );
  };

  const saveSchedule = async () => {
    setSaving(true);
    await fetch("/api/admin/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(schedule),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addBlockedDate = async () => {
    if (!newBlockDate) return;
    const res = await fetch("/api/admin/blocked-dates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: newBlockDate, reason: newBlockReason }),
    });
    if (res.ok) {
      const created = await res.json();
      setBlockedDates((prev) => [...prev, created]);
      setNewBlockDate("");
      setNewBlockReason("");
    }
  };

  const removeBlockedDate = async (id: string) => {
    await fetch("/api/admin/blocked-dates", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setBlockedDates((prev) => prev.filter((d) => d.id !== id));
  };

  return (
  <main className="min-h-screen p-6 md:p-10 bg-salon-bg relative">
    <MuralDecorations />
    <div className="max-w-2xl mx-auto relative z-10">

        {/* Header */}
        <header className="mb-8">
          <a href="/admin" className="text-xs text-salon-gray font-bold uppercase tracking-wider hover:text-salon-brown mb-4 block">
            ← Volver al panel
          </a>
          <h1 className="text-3xl font-black text-salon-brown uppercase tracking-[0.15em] mb-1">
            Mi Horario
          </h1>
          <div className="flex items-center gap-3 opacity-70">
            <div className="h-[2px] w-8 bg-salon-terracotta"></div>
            <p className="text-xs text-salon-terracotta font-bold tracking-widest uppercase">
              Configura tu disponibilidad
            </p>
          </div>
        </header>

        {/* Horario semanal */}
        <section className="bg-white rounded-2xl border-2 border-salon-olive/20 shadow-folk p-6 mb-6 hand-drawn">
          <h2 className="text-xs font-black text-salon-olive uppercase tracking-widest mb-5">
            Horario semanal
          </h2>

            {loadingSchedule ? (
              <div className="text-center py-8 text-salon-gray animate-pulse text-xs uppercase tracking-widest">
                Cargando horario...
              </div>
            ) : (
              <div className="space-y-3">
                {schedule.map((day) => (
                  <div key={day.dayOfWeek} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${day.isDayOff ? "bg-gray-50 border-gray-200 opacity-60" : "bg-salon-bg border-salon-olive/20"}`}>
                    {/* Toggle día libre */}
                    <button
                      onClick={() => updateDay(day.dayOfWeek, "isDayOff", !day.isDayOff)}
                      className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-xs font-black transition-all shrink-0 ${day.isDayOff ? "bg-gray-100 border-gray-300 text-gray-400" : "bg-salon-olive border-salon-olive text-white"}`}
                    >
                      {day.isDayOff ? "✕" : "✓"}
                    </button>

                    <span className={`font-black uppercase tracking-wide text-sm w-24 shrink-0 ${day.isDayOff ? "text-gray-400" : "text-salon-brown"}`}>
                      {DAYS[day.dayOfWeek]}
                    </span>

                    {!day.isDayOff ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="time"
                          value={day.startTime}
                          onChange={(e) => updateDay(day.dayOfWeek, "startTime", e.target.value)}
                          className="border-2 border-salon-olive/30 rounded-lg px-2 py-1 text-sm text-salon-brown font-bold focus:border-salon-olive outline-none bg-white"
                        />
                        <span className="text-salon-gray text-xs font-bold">a</span>
                        <input
                          type="time"
                          value={day.endTime}
                          onChange={(e) => updateDay(day.dayOfWeek, "endTime", e.target.value)}
                          className="border-2 border-salon-olive/30 rounded-lg px-2 py-1 text-sm text-salon-brown font-bold focus:border-salon-olive outline-none bg-white"
                        />
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Día libre</span>
                    )}
                  </div>
                ))}
              </div>
            )}

          <button
            onClick={saveSchedule}
            disabled={saving}
            className="mt-6 w-full py-3 bg-salon-brown text-salon-yellow font-black text-xs uppercase tracking-widest rounded-xl hand-drawn border-2 border-salon-brown hover:bg-salon-brown/90 transition-all disabled:opacity-50"
          >
            {saving ? "Guardando..." : saved ? "¡Guardado!" : "Guardar horario"}
          </button>
        </section>

        {/* Días bloqueados */}
        <section className="bg-white rounded-2xl border-2 border-salon-terracotta/20 shadow-folk p-6 hand-drawn">
          <h2 className="text-xs font-black text-salon-terracotta uppercase tracking-widest mb-5">
            Días bloqueados
          </h2>
          <p className="text-xs text-salon-gray mb-4">Vacaciones, permisos, imprevistos — estos días no aparecerán disponibles para las clientas.</p>

          {/* Agregar nuevo */}
          <div className="flex gap-2 mb-4">
            <input
              type="date"
              value={newBlockDate}
              onChange={(e) => setNewBlockDate(e.target.value)}
              min={(() => {
                const d = new Date();
                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
              })()}
              className="border-2 border-salon-terracotta/30 rounded-lg px-3 py-2 text-sm text-salon-brown font-bold focus:border-salon-terracotta outline-none bg-white flex-1"
            />
            <input
              type="text"
              value={newBlockReason}
              onChange={(e) => setNewBlockReason(e.target.value)}
              placeholder="Razón (opcional)"
              className="border-2 border-salon-terracotta/30 rounded-lg px-3 py-2 text-sm text-salon-brown focus:border-salon-terracotta outline-none bg-white flex-1"
            />
            <button
              onClick={addBlockedDate}
              className="px-4 py-2 bg-salon-terracotta text-white font-black text-xs uppercase rounded-lg hover:bg-salon-terracotta/80 transition-colors"
            >
              +
            </button>
          </div>

          {/* Lista de días bloqueados */}
          {blockedDates.length === 0 ? (
            <p className="text-center text-salon-gray text-xs py-4 uppercase tracking-wider">Sin días bloqueados</p>
          ) : (
            <div className="space-y-2">
              {blockedDates.map((bd) => (
                <div key={bd.id} className="flex items-center justify-between bg-salon-bg rounded-lg px-3 py-2 border border-salon-terracotta/20">
                  <div>
                    <span className="font-black text-salon-brown text-sm">
                      {format(new Date(bd.date), "EEEE d 'de' MMMM", { locale: es })}
                    </span>
                    {bd.reason && (
                      <span className="text-salon-gray text-xs ml-2">— {bd.reason}</span>
                    )}
                  </div>
                  <button
                    onClick={() => removeBlockedDate(bd.id)}
                    className="text-red-400 hover:text-red-600 font-black text-sm ml-3"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}