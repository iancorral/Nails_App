"use client";

import { useState, useEffect } from "react";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { chihuahuaToUTC } from "@/lib/timezone";

interface Props {
  appointmentId: string;
  clientName: string;
  currentDate: string | Date;
  totalDuration: number;
  onClose: () => void;
  onRescheduled: (newDate: string, newEndDate: string) => void;
}

export default function RescheduleModal({
  appointmentId,
  clientName,
  currentDate,
  totalDuration,
  onClose,
  onRescheduled,
}: Props) {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const today    = new Date();
  const maxDate  = addDays(today, 60);
  const minDateStr = format(today, "yyyy-MM-dd");
  const maxDateStr = format(maxDate, "yyyy-MM-dd");

  useEffect(() => {
    if (!selectedDate || totalDuration === 0) return;
    setLoadingTimes(true);
    setAvailableTimes([]);
    setSelectedTime("");

    fetch(`/api/availability?date=${selectedDate}&duration=${totalDuration}`)
      .then((r) => r.json())
      .then((data) => {
        setAvailableTimes(data);
        setLoadingTimes(false);
      });
  }, [selectedDate, totalDuration]);

  const handleSave = async () => {
    if (!selectedDate || !selectedTime) {
      setError("Selecciona fecha y hora.");
      return;
    }

    setSaving(true);
    setError("");

    const [h, m]  = selectedTime.split(":").map(Number);
    const [y, mo, d] = selectedDate.split("-").map(Number);
    const finalDate = chihuahuaToUTC(y, mo, d, h, m);

    const res = await fetch(`/api/admin/appointments/${appointmentId}/reschedule`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: finalDate.toISOString() }),
    });

    if (res.ok) {
      const updated = await res.json();
      onRescheduled(updated.date, updated.endDate);
      onClose();
    } else {
      setError("Error al reagendar. Intenta de nuevo.");
    }

    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 bg-white w-full max-w-sm rounded-3xl border-2 border-salon-olive/20 shadow-xl p-6">
        <div className="flex justify-between items-start mb-5">
          <div>
            <h3 className="font-black text-salon-brown uppercase tracking-wider">
              Reagendar
            </h3>
            <p className="text-[10px] text-salon-gray uppercase tracking-widest mt-0.5">
              {clientName}
            </p>
            <p className="text-xs text-salon-terracotta font-bold mt-1">
              Actual: {format(new Date(currentDate), "d MMM · HH:mm", { locale: es })}
            </p>
          </div>
          <button onClick={onClose} className="text-salon-gray hover:text-salon-brown font-bold text-xl">
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-salon-terracotta uppercase tracking-widest mb-2">
              Nueva fecha
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={minDateStr}
              max={maxDateStr}
              className="w-full border-2 border-salon-gray/30 rounded-xl px-4 py-3 text-salon-brown font-medium focus:border-salon-olive outline-none"
            />
          </div>

          {selectedDate && (
            <div>
              <label className="block text-[10px] font-bold text-salon-terracotta uppercase tracking-widest mb-2">
                Nuevo horario
              </label>
              {loadingTimes ? (
                <p className="text-xs text-salon-gray animate-pulse text-center py-3">
                  Cargando horarios...
                </p>
              ) : availableTimes.length === 0 ? (
                <p className="text-xs text-salon-terracotta text-center py-3 font-bold">
                  Sin horarios disponibles ese día
                </p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {availableTimes.map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedTime(t)}
                      className={`py-2.5 text-sm font-bold rounded-xl border-2 transition-all ${
                        selectedTime === t
                          ? "bg-salon-olive text-white border-salon-olive"
                          : "bg-white text-salon-brown border-salon-gray/20 hover:border-salon-olive"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && (
            <p className="text-xs text-red-500 font-bold text-center bg-red-50 py-2 rounded-xl">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-white text-salon-gray border-2 border-salon-gray/20 font-black text-xs uppercase tracking-widest rounded-2xl"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !selectedDate || !selectedTime}
              className="flex-1 py-3 bg-salon-brown text-salon-yellow font-black text-xs uppercase tracking-widest rounded-2xl disabled:opacity-40 hover:bg-salon-brown/90 transition-all"
            >
              {saving ? "Guardando..." : "Reagendar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}