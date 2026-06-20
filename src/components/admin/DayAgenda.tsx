"use client";

import { useMemo } from "react";
import {
  utcDateToChihuahuaMinutes,
  minutesToTimeLabel,
  CHIHUAHUA_UTC_OFFSET,
} from "@/lib/timezone";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import { METHOD_LABELS } from "@/components/admin/PaymentBadge";

type Service = { id: string; name: string; price: number; duration: number; category: string };

export type AgendaAppointment = {
  id: string;
  date: string | Date;
  endDate: string | Date;
  clientName: string;
  clientPhone: string;
  status: string;
  paymentStatus: string;
  paymentMethod?: string | null;
  finalPrice?: number | null;
  depositPaid?: boolean;
  depositAmount?: number | null;
  adminNotes?: string | null;
  services: Service[];
};

interface Props {
  appointments: AgendaAppointment[];
  schedule: { startTime: string; endTime: string; isDayOff: boolean } | null;
  loading: boolean;
  isPast: boolean;
  isCurrentDay: boolean;          // ← nuevo: hoy vs. otro día
  moveModeId: string | null;
  onSlotClick: (time: string) => void;
  onAppointmentClick: (app: AgendaAppointment) => void;
  onPaymentClick: (app: AgendaAppointment) => void;
  onStartMove: (app: AgendaAppointment) => void;
  onDropMove: (time: string) => void;
  onCancelMove: () => void;
}

const SLOT_MINUTES = 30;
const ADMIN_START = 6 * 60;   // 06:00
const ADMIN_END = 22 * 60;    // 22:00

const PAYMENT_META: Record<string, { label: string; classes: string }> = {
  PENDING: { label: "Pendiente", classes: "bg-amber-50 border-amber-200 text-amber-800" },
  PARTIAL: { label: "Anticipo",  classes: "bg-blue-50 border-blue-200 text-blue-800" },
  PAID:    { label: "Pagado",    classes: "bg-green-50 border-green-200 text-green-800" },
};

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export default function DayAgenda({
  appointments, schedule, loading, isPast, isCurrentDay, moveModeId,
  onSlotClick, onAppointmentClick, onPaymentClick, onStartMove, onDropMove, onCancelMove,
}: Props) {

  // Calcular desde qué hora comenzar (hoy: omitir horas ya pasadas)
  const effectiveStart = useMemo(() => {
    if (!isCurrentDay) return ADMIN_START;
    const now = new Date();
    const chihuahuaHour = (now.getUTCHours() - CHIHUAHUA_UTC_OFFSET + 24) % 24;
    const chihuahuaMin = now.getUTCMinutes();
    const currentMin = chihuahuaHour * 60 + chihuahuaMin;
    // Redondear al siguiente slot de 30 min
    const nextSlot = Math.ceil(currentMin / SLOT_MINUTES) * SLOT_MINUTES;
    return Math.max(ADMIN_START, nextSlot);
  }, [isCurrentDay]);

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-salon-gray animate-pulse uppercase tracking-widest">
        Cargando agenda...
      </div>
    );
  }

  const confirmedApps = appointments.filter((a) => a.status !== "CANCELLED");
  const publicStart = schedule ? timeToMinutes(schedule.startTime) : null;
  const publicEnd   = schedule ? timeToMinutes(schedule.endTime)   : null;
  const isDayOff    = schedule?.isDayOff ?? false;

  const appsByStart = new Map<number, AgendaAppointment>();
  confirmedApps.forEach((app) => {
    appsByStart.set(utcDateToChihuahuaMinutes(new Date(app.date)), app);
  });

  const rendered = new Set<string>();
  const rows: React.ReactNode[] = [];
  let t = effectiveStart; // ← usa effectiveStart, no ADMIN_START

  while (t < ADMIN_END) {
    const app = appsByStart.get(t);
    const inPublicHours =
      publicStart !== null && publicEnd !== null && t >= publicStart && t < publicEnd;

    if (app) {
      const appStart = utcDateToChihuahuaMinutes(new Date(app.date));
      const appEnd   = utcDateToChihuahuaMinutes(new Date(app.endDate));
      const durationMin = appEnd > appStart ? appEnd - appStart : appEnd + 1440 - appStart;
      const slotsSpan = Math.max(1, Math.ceil(durationMin / SLOT_MINUTES));

      rendered.add(app.id);
      rows.push(
        <AppointmentCard
          key={`app-${app.id}`}
          app={app}
          isMoving={moveModeId === app.id}
          dimmed={moveModeId !== null && moveModeId !== app.id}
          onClick={() => onAppointmentClick(app)}
          onPaymentClick={() => onPaymentClick(app)}
          onMoveClick={() => onStartMove(app)}
          onCancelMove={onCancelMove}
        />
      );

      t += slotsSpan * SLOT_MINUTES;
      continue;
    }

    const label = minutesToTimeLabel(t);
    const isDropTarget = moveModeId !== null;

    rows.push(
      <button
        key={`slot-${t}`}
        onClick={() => {
          if (isPast) return;
          if (isDropTarget) onDropMove(label);
          else onSlotClick(label);
        }}
        disabled={isPast}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl border transition-all text-left group ${
          isPast
            ? "border-gray-100 border-dashed cursor-not-allowed"
            : isDropTarget
            ? "border-2 border-dashed border-blue-400 bg-blue-50 hover:bg-blue-100"
            : "border-dashed border-salon-gray/15 hover:border-salon-olive hover:bg-salon-olive/5"
        }`}
      >
        <span className={`text-[11px] font-black uppercase tracking-wider w-12 shrink-0 ${
          isPast
            ? "text-gray-300"
            : isDropTarget
            ? "text-blue-600"
            : !inPublicHours
            ? "text-salon-gray/40"
            : "text-salon-gray"
        }`}>
          {label}
        </span>
        {!isPast && (
          <span className={`text-[10px] font-bold transition-opacity ${
            isDropTarget
              ? "text-blue-600"
              : "text-salon-olive opacity-0 group-hover:opacity-100"
          }`}>
            {isDropTarget
              ? "Soltar aquí"
              : !inPublicHours
              ? "+ Agregar (fuera de horario)"
              : "+ Agregar cita"}
          </span>
        )}
      </button>
    );

    t += SLOT_MINUTES;
  }

  // Citas fuera de la cuadrícula (horario anterior al efectivo u otras)
  const extras = confirmedApps.filter((a) => !rendered.has(a.id));

  return (
    <div className="p-2 space-y-1.5 max-h-[560px] overflow-y-auto">
      {isDayOff && (
        <div className="bg-salon-yellow/15 border border-salon-yellow/40 rounded-xl px-3 py-2 text-[10px] text-salon-brown font-bold text-center mb-1">
          Día cerrado al público — puedes agendar manualmente
        </div>
      )}

      {moveModeId && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 mb-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-blue-700 font-bold">
              Toca un slot libre para mover la cita.
            </span>
            <button
              onClick={onCancelMove}
              className="text-[10px] text-blue-700 font-black underline ml-2 shrink-0"
            >
              Cancelar
            </button>
          </div>
          <p className="text-[9px] text-blue-500 font-bold mt-0.5">
            Tip: navega a otro día en el calendario para mover entre días.
          </p>
        </div>
      )}

      {rows}

      {extras.length > 0 && (
        <>
          <p className="text-[9px] font-black text-salon-gray uppercase tracking-widest px-3 pt-2">
            Otras citas del día
          </p>
          {extras.map((app) => (
            <AppointmentCard
              key={`extra-${app.id}`}
              app={app}
              isMoving={moveModeId === app.id}
              dimmed={moveModeId !== null && moveModeId !== app.id}
              onClick={() => onAppointmentClick(app)}
              onPaymentClick={() => onPaymentClick(app)}
              onMoveClick={() => onStartMove(app)}
              onCancelMove={onCancelMove}
            />
          ))}
        </>
      )}
    </div>
  );
}

function AppointmentCard({
  app, isMoving, dimmed, onClick, onPaymentClick, onMoveClick, onCancelMove,
}: {
  app: AgendaAppointment;
  isMoving: boolean;
  dimmed: boolean;
  onClick: () => void;
  onPaymentClick: () => void;
  onMoveClick: () => void;
  onCancelMove: () => void;
}) {
  const startMin   = utcDateToChihuahuaMinutes(new Date(app.date));
  const endMin     = utcDateToChihuahuaMinutes(new Date(app.endDate));
  const startLabel = minutesToTimeLabel(startMin);
  const endLabel   = minutesToTimeLabel(endMin);
  const durationMin = endMin > startMin ? endMin - startMin : endMin + 1440 - startMin;
  const payment    = PAYMENT_META[app.paymentStatus] ?? PAYMENT_META.PENDING;
  const price      = app.finalPrice ?? app.services.reduce((a, s) => a + s.price, 0);

  return (
    <div className={`w-full rounded-2xl border-2 p-3 transition-all ${payment.classes} ${
      isMoving ? "ring-2 ring-blue-400 ring-offset-2" : ""
    } ${dimmed ? "opacity-40 pointer-events-none" : ""}`}>
      <button onClick={onClick} className="w-full text-left">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-black text-sm truncate">{app.clientName}</p>
            <p className="text-[10px] font-bold opacity-70 mt-0.5">{startLabel} – {endLabel} · {durationMin} min</p>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {app.services.map((s) => (
                <span key={s.id} className="text-[9px] px-1.5 py-0.5 bg-white/60 rounded-md font-bold">
                  {s.name}
                </span>
              ))}
            </div>
          </div>
          <span className="text-xs font-black shrink-0">${price}</span>
        </div>
      </button>

      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-current/10">
        {/* Pill de pago — clickeable */}
        <button
          onClick={(e) => { e.stopPropagation(); onPaymentClick(); }}
          className="text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg bg-white/70 hover:bg-white transition-all"
        >
          {payment.label}
          {app.paymentStatus === "PAID" && app.paymentMethod && METHOD_LABELS[app.paymentMethod]
            ? ` · ${METHOD_LABELS[app.paymentMethod]}`
            : ""}
        </button>

        {/* Botón mover — al estar moviendo, actúa como cancelar */}
        <button
          onClick={(e) => { e.stopPropagation(); if (isMoving) onCancelMove(); else onMoveClick(); }}
          className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg transition-all ${
            isMoving
              ? "bg-red-100 text-red-700 hover:bg-red-200"
              : "bg-white/70 hover:bg-white"
          }`}
        >
          {isMoving ? "✕ Cancelar" : "↕ Mover"}
        </button>

        {/* WhatsApp */}

        <a
          href={`https://wa.me/${app.clientPhone.replace(/\D/g, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="ml-auto w-7 h-7 bg-[#25D366] rounded-lg flex items-center justify-center hover:scale-110 transition-all shrink-0"
        >
          <WhatsAppIcon className="w-3.5 h-3.5 text-white" />
        </a>
      </div>
    </div>
  );
}