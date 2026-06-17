"use client";

import { useState, useEffect } from "react";

type Service = {
  id: string;
  name: string;
  price: number;
  duration: number;
  category: string;
};

interface AppointmentData {
  id: string;
  clientName: string;
  clientPhone: string;
  adminNotes?: string | null;
  services: Service[];
  finalPrice?: number | null;
}

interface Props {
  appointment: AppointmentData;
  onClose: () => void;
  onUpdated: (data: {
    services: Service[];
    clientName: string;
    clientPhone: string;
    adminNotes?: string | null;
    finalPrice?: number | null;
  }) => void;
}

export default function EditAppointmentModal({ appointment, onClose, onUpdated }: Props) {
  const [step, setStep] = useState<1 | 2>(1);

  // Paso 1: Clienta
  const [clientName,  setClientName]  = useState(appointment.clientName);
  const [clientPhone, setClientPhone] = useState(appointment.clientPhone);
  const [adminNotes,  setAdminNotes]  = useState(appointment.adminNotes ?? "");
  const [finalPrice,  setFinalPrice]  = useState(
    appointment.finalPrice != null ? String(appointment.finalPrice) : ""
  );

  // Paso 2: Servicios
  const [allServices,        setAllServices]        = useState<Service[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(
    appointment.services.map((s) => s.id)
  );

  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");

  useEffect(() => {
    fetch("/api/services").then((r) => r.json()).then(setAllServices);
  }, []);

  const selectedServices = allServices.filter((s) => selectedServiceIds.includes(s.id));
  const totalDuration    = selectedServices.reduce((a, s) => a + s.duration, 0);
  const basePrice        = selectedServices.reduce((a, s) => a + s.price, 0);

  const toggleService = (id: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!clientName || !clientPhone || selectedServiceIds.length === 0) {
      setError("Completa nombre, teléfono y al menos un servicio.");
      return;
    }

    setSubmitting(true);
    setError("");

    const payload: Record<string, unknown> = {
      clientName,
      clientPhone,
      serviceIds: selectedServiceIds,
      adminNotes: adminNotes || null,
    };

    const finalPriceNum = parseFloat(finalPrice);
    if (finalPrice !== "" && !Number.isNaN(finalPriceNum)) {
      payload.finalPrice = finalPriceNum;
    }

    const res = await fetch(`/api/admin/appointments/${appointment.id}/edit`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const updated = await res.json();
      onUpdated({
        services:    updated.services,
        clientName:  updated.clientName,
        clientPhone: updated.clientPhone,
        adminNotes:  updated.adminNotes,
        finalPrice:  updated.finalPrice,
      });
      onClose();
    } else {
      const data = await res.json().catch(() => ({}));
      setError((data as { error?: string }).error ?? "Error al guardar los cambios.");
    }

    setSubmitting(false);
  };

  const categories = Array.from(new Set(allServices.map((s) => s.category)));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 bg-white w-full max-w-lg rounded-3xl border-2 border-salon-olive/30 shadow-xl my-6">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-salon-olive/10">
          <div>
            <h2 className="font-black text-salon-brown uppercase tracking-wider">
              Editar Cita
            </h2>
            <p className="text-[10px] text-salon-gray uppercase tracking-widest mt-0.5">
              Paso {step} de 2 — {step === 1 ? "Clienta" : "Servicios"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-salon-gray hover:text-salon-brown font-bold text-xl"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* ── PASO 1: CLIENTA ── */}
          {step === 1 && (
            <>
              <p className="text-[10px] text-salon-gray font-bold uppercase tracking-widest">
                Para cambiar fecha u hora: usa el botón &quot;↕ Mover&quot; en la agenda.
              </p>

              <div>
                <label className="block text-[10px] font-bold text-salon-terracotta uppercase tracking-widest mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full border-2 border-salon-gray/30 rounded-xl px-4 py-3 text-salon-brown font-medium focus:border-salon-olive outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-salon-terracotta uppercase tracking-widest mb-2">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full border-2 border-salon-gray/30 rounded-xl px-4 py-3 text-salon-brown font-medium focus:border-salon-olive outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-salon-terracotta uppercase tracking-widest mb-2">
                  Precio final (base: ${basePrice})
                </label>
                <input
                  type="number"
                  value={finalPrice}
                  onChange={(e) => setFinalPrice(e.target.value)}
                  placeholder={`${basePrice} (dejar vacío = precio base)`}
                  className="w-full border-2 border-salon-gray/30 rounded-xl px-4 py-3 text-salon-brown font-medium focus:border-salon-olive outline-none"
                />
                <p className="text-[10px] text-salon-gray mt-1">
                  Ajusta si el diseño fue más complejo o hubo descuento.
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-salon-terracotta uppercase tracking-widest mb-2">
                  Notas internas
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={2}
                  className="w-full border-2 border-salon-gray/30 rounded-xl px-4 py-3 text-salon-brown font-medium focus:border-salon-olive outline-none resize-none"
                />
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!clientName || !clientPhone}
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
                Agrega, quita o cambia los servicios de{" "}
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
                  <span className="text-xs font-black text-salon-brown">${basePrice}</span>
                </div>
              )}

              {error && (
                <p className="text-xs text-red-500 font-bold text-center bg-red-50 py-2 rounded-xl">
                  {error}
                </p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 bg-white text-salon-gray border-2 border-salon-gray/20 font-black text-xs uppercase tracking-widest rounded-2xl hover:border-salon-olive/40 transition-all"
                >
                  ← Atrás
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || selectedServiceIds.length === 0}
                  className="flex-1 py-3 bg-salon-brown text-salon-yellow font-black text-xs uppercase tracking-widest rounded-2xl disabled:opacity-40 hover:bg-salon-brown/90 transition-all"
                >
                  {submitting ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}