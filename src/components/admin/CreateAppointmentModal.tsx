"use client";

import { useState, useEffect, useCallback } from "react";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import AdminTimeGrid, { DayOverviewAppointment } from "@/components/admin/AdminTimeGrid";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import { buildConfirmationMessage, buildWhatsAppUrl } from "@/lib/whatsapp";

type Service = {
  id: string;
  name: string;
  price: number;
  duration: number;
  category: string;
};

type PastAppointment = {
  id: string;
  date: string;
  services: Service[];
  status: string;
  paymentStatus: string;
};

interface Props {
  onClose: () => void;
  onCreated: () => void;
  preselectedDate?: Date; 
  preselectedTime?: string;
}

export default function CreateAppointmentModal({ onClose, onCreated, preselectedDate, preselectedTime}: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Datos clienta
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositPaid, setDepositPaid] = useState(false);
  const [pastAppointments, setPastAppointments] = useState<PastAppointment[]>([]);
  const [searchingClient, setSearchingClient] = useState(false);
  const [pastTotal, setPastTotal] = useState(0);
  const [useDeposit, setUseDeposit] = useState(false);

  // Servicios
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  // Fecha y hora
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState(preselectedTime ?? "");
  
  // B. Nuevos estados para el manejo de disponibilidad y conflictos
  const [dayAppointments, setDayAppointments] = useState<DayOverviewAppointment[]>([]);
  const [conflictWith, setConflictWith] = useState<string | null>(null);
  const [checkingConflict, setCheckingConflict] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Tras crear la cita: resultado para la pantalla de éxito.
  // confirmUrl es null cuando no procede ofrecer WhatsApp (sin teléfono o cita pasada).
  const [result, setResult] = useState<{
    confirmUrl: string | null;
    isPast: boolean;
    hasPhone: boolean;
  } | null>(null);

  // Si viene con fecha preseleccionada, saltar al paso 1 con la fecha lista
  useEffect(() => {
    if (preselectedDate) {
      setSelectedDate(format(preselectedDate, "yyyy-MM-dd"));
    }
    if (preselectedTime) {
      setSelectedTime(preselectedTime);
    }
  }, [preselectedDate, preselectedTime]);

  // Cargar servicios al montar
  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then(setAllServices);
  }, []);

  // Buscar historial cuando el teléfono tiene suficientes dígitos
  const searchClient = useCallback(async (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 7) {
      setPastAppointments([]);
      setPastTotal(0);
      return;
    }
    setSearchingClient(true);
    const res = await fetch(`/api/admin/clients?phone=${digits}`);
    const data = await res.json();
    setPastAppointments(data.appointments ?? []);
    setPastTotal(data.total ?? 0);

    if ((data.appointments ?? []).length > 0 && !clientName) {
      setClientName(data.appointments[0].clientName);
    }
    setSearchingClient(false);
  }, [clientName]);

  useEffect(() => {
    const timeout = setTimeout(() => searchClient(clientPhone), 600);
    return () => clearTimeout(timeout);
  }, [clientPhone, searchClient]);

  // Calcular duración total de servicios seleccionados
  const selectedServices = allServices.filter((s) =>
    selectedServiceIds.includes(s.id)
  );
  const totalDuration = selectedServices.reduce((a, s) => a + s.duration, 0);
  const totalPrice = selectedServices.reduce((a, s) => a + s.price, 0);

  // D. Evaluar conflictos en MODO RÁPIDO (con preselectedTime)
  useEffect(() => {
    if (!preselectedTime || !selectedDate || totalDuration === 0) return;
    setCheckingConflict(true);
    fetch(`/api/admin/day-overview?date=${selectedDate}`)
      .then((r) => r.json())
      .then((d: { appointments: DayOverviewAppointment[] }) => {
        const [h, m] = preselectedTime.split(":").map(Number);
        const newStart = h * 60 + m;
        const newEnd = newStart + totalDuration;
        const hit = d.appointments.find((a) => newStart < a.endMinutes && newEnd > a.startMinutes);
        setConflictWith(hit ? `${hit.clientName} (${hit.startLabel}–${hit.endLabel})` : null);
        setCheckingConflict(false);
      })
      .catch(() => setCheckingConflict(false));
  }, [preselectedTime, selectedDate, totalDuration]);

  // C. Cargar citas del día para el grid en MODO NORMAL
  useEffect(() => {
    if (preselectedTime || !selectedDate) return;
    fetch(`/api/admin/day-overview?date=${selectedDate}`)
      .then((r) => r.json())
      .then((d) => setDayAppointments(d.appointments ?? []));
  }, [selectedDate, preselectedTime]);

  const toggleService = (id: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
    setSelectedTime("");
  };

  const handleSubmit = async () => {
    // Usa preselectedTime como fuente primaria en modo rápido
    const effectiveTime = preselectedTime || selectedTime;

    if (!clientName || selectedServiceIds.length === 0 || !selectedDate || !effectiveTime) {
      setError("Completa todos los campos requeridos.");
      return;
    }

    setSubmitting(true);
    setError("");

    const [h, m] = effectiveTime.split(":").map(Number);
    const [y, mo, d] = selectedDate.split("-").map(Number);
    
    // IMPORTANTE: usa chihuahuaToUTC para conversión correcta
    // (evita depender del timezone del browser)
    const { chihuahuaToUTC } = await import("@/lib/timezone");
    const finalDate = chihuahuaToUTC(y, mo, d, h, m);

    const depositAmountNum = depositAmount !== "" ? parseFloat(depositAmount) : NaN;
    const safeDepositAmount =
      useDeposit && !Number.isNaN(depositAmountNum) ? depositAmountNum : undefined;

    const trimmedPhone = clientPhone.trim();

    const res = await fetch("/api/admin/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientName,
        clientPhone: trimmedPhone || undefined,
        serviceIds: selectedServiceIds,
        date: finalDate.toISOString(),
        adminNotes: adminNotes || undefined,
        depositAmount: safeDepositAmount,
        depositPaid: useDeposit ? depositPaid : false,
      }),
    });

    if (res.ok) {
      // La confirmación por WhatsApp solo aplica a citas futuras con teléfono:
      // no tiene sentido confirmar una cita ya ocurrida (registro histórico).
      const hasPhone = trimmedPhone.length > 0;
      const isPast = finalDate.getTime() < Date.now();

      let confirmUrl: string | null = null;
      if (hasPhone && !isPast) {
        // Mensaje de confirmación con la fecha/hora EXACTA recién agendada
        // (finalDate es el instante UTC real → se formatea en hora de Chihuahua).
        const serviceNames = selectedServices.map((s) => s.name);
        const message = buildConfirmationMessage({
          clientName,
          date: finalDate,
          serviceNames,
        });
        confirmUrl = buildWhatsAppUrl(trimmedPhone, message);
      }

      setResult({ confirmUrl, isPast, hasPhone });
      onCreated(); // refresca el calendario detrás del modal
    } else {
      const data = await res.json();
      const fieldErrors = data?.details
        ? Object.entries(data.details)
            .filter(([k]) => k !== "_errors")
            .map(([field, val]) => {
              const msg = (val as { _errors?: string[] })?._errors?.[0];
              return msg ? `${field}: ${msg}` : null;
            })
            .filter(Boolean)
            .join(" · ")
        : "";
      setError(fieldErrors || data.error || "Error al crear la cita.");
    }

    setSubmitting(false);
  };

  const today = new Date();
  const maxDate = addDays(today, 60);
  const maxDateStr = format(maxDate, "yyyy-MM-dd");

  const categories = Array.from(new Set(allServices.map((s) => s.category)));

  // ── Vista de éxito: cita creada ──
  // La confirmación por WhatsApp solo se ofrece para citas futuras con teléfono.
  // Para citas pasadas (registro histórico) o sin teléfono, solo se confirma el registro.
  if (result) {
    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative z-10 bg-white w-full max-w-lg rounded-3xl border-2 border-salon-olive/30 shadow-xl my-6">
          <div className="p-8 text-center space-y-5">
            <div className="w-16 h-16 mx-auto rounded-full bg-salon-olive/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-salon-olive" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <div>
              <h2 className="font-black text-salon-brown uppercase tracking-wider">
                {result.confirmUrl ? "Cita creada" : "Cita registrada"}
              </h2>
              <p className="text-xs text-salon-gray mt-1">
                {result.confirmUrl ? (
                  <>
                    Envía la confirmación a{" "}
                    <span className="font-bold text-salon-brown">{clientName.split(" ")[0]}</span>{" "}
                    por WhatsApp.
                  </>
                ) : result.isPast ? (
                  "Cita pasada guardada en el historial. No se envía confirmación de una cita ya ocurrida."
                ) : (
                  "Guardada en la agenda. Sin teléfono, la confirmación por WhatsApp no está disponible."
                )}
              </p>
            </div>

            {result.confirmUrl && (
              <a
                href={result.confirmUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-[#25D366] text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:brightness-95 transition-all"
              >
                <WhatsAppIcon className="w-4 h-4" />
                Enviar confirmación
              </a>
            )}

            <button
              onClick={onClose}
              className="w-full py-3 bg-white text-salon-gray border-2 border-salon-gray/20 font-black text-xs uppercase tracking-widest rounded-2xl hover:border-salon-olive/40 transition-all"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 bg-white w-full max-w-lg rounded-3xl border-2 border-salon-olive/30 shadow-xl my-6">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-salon-olive/10">
          <div>
            <h2 className="font-black text-salon-brown uppercase tracking-wider">
              Nueva Cita
            </h2>
            <p className="text-[10px] text-salon-gray uppercase tracking-widest mt-0.5">
              Paso {step} de 3 —{" "}
              {step === 1 ? "Clienta" : step === 2 ? "Servicios" : "Fecha y hora"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-salon-gray hover:text-salon-brown transition-colors font-bold text-xl"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* ── PASO 1: CLIENTA ── */}
          {step === 1 && (
            <>
              <div>
                <label className="block text-[10px] font-bold text-salon-terracotta uppercase tracking-widest mb-2">
                  Teléfono (WhatsApp){" "}
                  <span className="text-salon-gray normal-case tracking-normal font-medium">(opcional)</span>
                </label>
                <input
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="614 123 4567"
                  className="w-full border-2 border-salon-gray/30 rounded-xl px-4 py-3 text-salon-brown font-medium focus:border-salon-olive outline-none"
                />
                {searchingClient ? (
                  <p className="text-[10px] text-salon-gray mt-1 animate-pulse">
                    Buscando historial...
                  </p>
                ) : (
                  <p className="text-[10px] text-salon-gray mt-1">
                    Déjalo vacío para clientas de mostrador o menores sin contacto. Sin teléfono no habrá WhatsApp.
                  </p>
                )}
              </div>

              {/* Historial encontrado */}
              {pastAppointments.length > 0 && (
                <div className="bg-salon-yellow/20 rounded-2xl p-4 border border-salon-yellow/50">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[10px] font-black text-salon-brown uppercase tracking-wider">
                      Clienta recurrente
                    </p>
                    <span className="text-[10px] font-bold text-salon-terracotta bg-salon-terracotta/10 px-2 py-0.5 rounded-full">
                      {pastTotal} cita{pastTotal !== 1 ? 's' : ''} en total
                    </span>
                  </div>
                  <div className="space-y-1">
                    {pastAppointments.map((a) => (
                      <div key={a.id} className="flex justify-between text-xs text-salon-gray">
                        <span>{format(new Date(a.date), "d MMM yyyy", { locale: es })}</span>
                        <span className="font-bold text-salon-brown truncate max-w-[180px]">
                          {a.services.map((s: { name: string }) => s.name).join(", ")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-salon-terracotta uppercase tracking-widest mb-2">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="María García"
                  className="w-full border-2 border-salon-gray/30 rounded-xl px-4 py-3 text-salon-brown font-medium focus:border-salon-olive outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-salon-terracotta uppercase tracking-widest mb-2">
                  Notas internas (no ve la clienta)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Ej: Le gustan las uñas largas, es alérgica al acrílico..."
                  rows={2}
                  className="w-full border-2 border-salon-gray/30 rounded-xl px-4 py-3 text-salon-brown font-medium focus:border-salon-olive outline-none resize-none"
                />
              </div>

              {/* Anticipo */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[10px] font-bold text-salon-terracotta uppercase tracking-widest">
                    Cobrar anticipo
                  </label>
                  <div
                    onClick={() => {
                      setUseDeposit(!useDeposit);
                      if (useDeposit) {
                        setDepositAmount("");
                        setDepositPaid(false);
                      }
                    }}
                    className={`w-10 h-6 rounded-full transition-all cursor-pointer relative ${
                      useDeposit ? "bg-salon-olive" : "bg-gray-200"
                    }`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
                      useDeposit ? "left-5" : "left-1"
                    }`} />
                  </div>
                </div>

                {useDeposit && (
                  <div className="grid grid-cols-2 gap-3 animate-in fade-in">
                    <div>
                      <input
                        type="number"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        placeholder="$150"
                        className="w-full border-2 border-salon-gray/30 rounded-xl px-3 py-2.5 text-salon-brown font-medium focus:border-salon-olive outline-none"
                      />
                      <p className="text-[10px] text-salon-gray mt-1">Monto del anticipo</p>
                    </div>
                    <div className="flex flex-col justify-center">
                      <label
                        onClick={() => setDepositPaid(!depositPaid)}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <div className={`w-10 h-6 rounded-full transition-all relative ${
                          depositPaid ? "bg-salon-olive" : "bg-gray-200"
                        }`}>
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
                            depositPaid ? "left-5" : "left-1"
                          }`} />
                        </div>
                        <span className="text-xs font-bold text-salon-brown">
                          {depositPaid ? "Ya pagó" : "Pendiente"}
                        </span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!clientName}
                className="w-full py-3 bg-salon-olive text-white font-black text-xs uppercase tracking-widest rounded-2xl disabled:opacity-40 hover:bg-salon-olive/90 transition-all"
              >
                Siguiente → Servicios
              </button>
            </>
          )}

          {/* ── PASO 2: SERVICIOS ── */}
          {step === 2 && (
            <>
              <p className="text-xs text-salon-gray font-medium">
                Selecciona uno o más servicios para{" "}
                <span className="font-black text-salon-brown">{clientName}</span>
              </p>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {categories.map((cat) => (
                  <div key={cat}>
                    <p className="text-[10px] font-black text-salon-olive uppercase tracking-widest mb-2">
                      {cat}
                    </p>
                    {allServices
                      .filter((s) => s.category === cat)
                      .map((s) => {
                        const selected = selectedServiceIds.includes(s.id);
                        return (
                          <div
                            key={s.id}
                            onClick={() => toggleService(s.id)}
                            className={`flex justify-between items-center p-3 rounded-xl border-2 cursor-pointer mb-2 transition-all ${
                              selected
                                ? "border-salon-olive bg-salon-olive/10"
                                : "border-salon-gray/20 bg-white hover:border-salon-olive/40"
                            }`}
                          >
                            <div>
                              <p className={`text-sm font-bold ${selected ? "text-salon-olive" : "text-salon-brown"}`}>
                                {s.name}
                              </p>
                              <p className="text-[10px] text-salon-gray">{s.duration} min</p>
                            </div>
                            <div className="text-right">
                              <p className="font-black text-salon-brown">${s.price}</p>
                              {selected && (
                                <div className="w-4 h-4 bg-salon-olive rounded-full flex items-center justify-center ml-auto mt-1">
                                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ))}
              </div>

              {selectedServices.length > 0 && (
                <div className="bg-salon-yellow/20 rounded-xl p-3 border border-salon-yellow/50 flex justify-between">
                  <span className="text-xs font-bold text-salon-brown">
                    {selectedServices.length} servicio(s) · {totalDuration} min
                  </span>
                  <span className="text-xs font-black text-salon-brown">${totalPrice}</span>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 bg-white text-salon-gray border-2 border-salon-gray/20 font-black text-xs uppercase tracking-widest rounded-2xl hover:border-salon-olive/40 transition-all"
                >
                  ← Atrás
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={selectedServiceIds.length === 0}
                  className="flex-1 py-3 bg-salon-olive text-white font-black text-xs uppercase tracking-widest rounded-2xl disabled:opacity-40 hover:bg-salon-olive/90 transition-all"
                >
                  Siguiente → Fecha
                </button>
              </div>
            </>
          )}

          {/* ── PASO 3: FECHA Y HORA ── */}
          {step === 3 && (
            <>
              {preselectedTime ? (
                <>
                  {/* Resumen — modo rápido */}
                  <div className="bg-salon-bg rounded-2xl p-4 border-2 border-salon-olive/20 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-salon-gray font-bold uppercase tracking-wider">Clienta</span>
                      <span className="font-black text-salon-brown">{clientName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-salon-gray font-bold uppercase tracking-wider">Fecha</span>
                      <span className="font-black text-salon-brown">
                        {selectedDate && format(new Date(selectedDate + "T12:00:00"), "d MMM yyyy", { locale: es })} a las {preselectedTime}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-salon-gray font-bold uppercase tracking-wider">Duración</span>
                      <span className="font-black text-salon-brown">{totalDuration} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-salon-gray font-bold uppercase tracking-wider">Total base</span>
                      <span className="font-black text-salon-brown">${totalPrice}</span>
                    </div>
                  </div>

                  {checkingConflict && (
                    <p className="text-[10px] text-salon-gray animate-pulse text-center">
                      Verificando disponibilidad...
                    </p>
                  )}

                  {/* E. Bloque de advertencia actualizado */}
                  {!checkingConflict && conflictWith && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-700 font-bold flex items-start gap-2">
                      <svg className="w-3.5 h-3.5 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                      Esta hora se cruza con la cita de {conflictWith}. Puedes continuar si lo harás así a propósito.
                    </div>
                  )}

                  {error && (
                    <p className="text-xs text-red-500 font-bold text-center bg-red-50 py-2 rounded-xl px-2">
                      {error}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => setStep(2)}
                      className="flex-1 py-3 bg-white text-salon-gray border-2 border-salon-gray/20 font-black text-xs uppercase tracking-widest rounded-2xl hover:border-salon-olive/40 transition-all"
                    >
                      ← Atrás
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="flex-1 py-3 bg-salon-brown text-salon-yellow font-black text-xs uppercase tracking-widest rounded-2xl disabled:opacity-40 hover:bg-salon-brown/90 transition-all"
                    >
                      {submitting ? "Creando..." : "Crear cita"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* G. Date Input sin `min={minDateStr}` */}
                  <div>
                    <label className="block text-[10px] font-bold text-salon-terracotta uppercase tracking-widest mb-2">
                      Fecha de la cita
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        setSelectedTime("");
                      }}
                      max={maxDateStr}
                      className="w-full border-2 border-salon-gray/30 rounded-xl px-4 py-3 text-salon-brown font-medium focus:border-salon-olive outline-none mb-4"
                    />
                  </div>

                  {selectedDate && (
                    <div>
                      <label className="block text-[10px] font-bold text-salon-terracotta uppercase tracking-widest mb-2">
                        Horario disponible
                      </label>
                      
                      {/* F. Grid de horarios reemplazado */}
                      <AdminTimeGrid
                        selectedTime={selectedTime}
                        onSelect={setSelectedTime}
                        dayAppointments={dayAppointments}
                        durationMinutes={totalDuration}
                      />
                    </div>
                  )}

                  {/* Resumen */}
                  {selectedDate && selectedTime && (
                    <div className="bg-salon-bg rounded-2xl p-4 border-2 border-salon-olive/20 text-xs space-y-1 mt-4">
                      <div className="flex justify-between">
                        <span className="text-salon-gray font-bold uppercase tracking-wider">Clienta</span>
                        <span className="font-black text-salon-brown">{clientName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-salon-gray font-bold uppercase tracking-wider">Fecha</span>
                        <span className="font-black text-salon-brown">
                          {format(new Date(selectedDate + "T12:00:00"), "d MMM yyyy", { locale: es })} a las {selectedTime}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-salon-gray font-bold uppercase tracking-wider">Duración</span>
                        <span className="font-black text-salon-brown">{totalDuration} min</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-salon-gray font-bold uppercase tracking-wider">Total base</span>
                        <span className="font-black text-salon-brown">${totalPrice}</span>
                      </div>
                    </div>
                  )}

                  {error && (
                    <p className="text-xs text-red-500 font-bold text-center bg-red-50 py-2 rounded-xl mt-4">
                      {error}
                    </p>
                  )}

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => setStep(2)}
                      className="flex-1 py-3 bg-white text-salon-gray border-2 border-salon-gray/20 font-black text-xs uppercase tracking-widest rounded-2xl hover:border-salon-olive/40 transition-all"
                    >
                      ← Atrás
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={submitting || !selectedDate || !selectedTime}
                      className="flex-1 py-3 bg-salon-brown text-salon-yellow font-black text-xs uppercase tracking-widest rounded-2xl disabled:opacity-40 hover:bg-salon-brown/90 transition-all"
                    >
                      {submitting ? "Creando..." : "Crear cita"}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}