"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import MuralDecorations from "@/components/layout/MuralDecorations";

type Entry = {
  id: string;
  date: string;
  dateLabel: string;
  paymentMethod: string;
  paymentStatus: string;
  amount: number;
};

type RevenueData = {
  period: string;
  periodLabel: string;
  entries: Entry[];
  summary: { CASH: number; TRANSFER: number; CARD: number; PENDING: number };
  grandTotal: number;
};

const METHOD_CONFIG: Record<string, { label: string; color: string; border: string; text: string }> = {
  CASH:     { label: "Efectivo",       color: "bg-emerald-50",  border: "border-emerald-200", text: "text-emerald-700" },
  TRANSFER: { label: "Transferencia",  color: "bg-blue-50",     border: "border-blue-200",    text: "text-blue-700"    },
  CARD:     { label: "Tarjeta",        color: "bg-violet-50",   border: "border-violet-200",  text: "text-violet-700"  },
  PENDING:  { label: "Sin registrar",  color: "bg-amber-50",    border: "border-amber-200",   text: "text-amber-700"   },
};

const STATUS_LABEL: Record<string, string> = {
  PAID:    "Pagado",
  PARTIAL: "Parcial",
  PENDING: "Pendiente",
};

function RevenueContent() {
  const searchParams = useSearchParams();
  const initialPeriod = (searchParams.get("period") ?? "week") as "week" | "month";

  const [period, setPeriod] = useState<"week" | "month">(initialPeriod);
  const [data, setData] = useState<RevenueData | null>(null);

  // Carga derivada: el esqueleto se muestra mientras los datos cargados no
  // correspondan al periodo seleccionado (evita setState síncrono en el efecto).
  const loading = !data || data.period !== period;

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/revenue?period=${period}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setData(d);
      });
    return () => {
      cancelled = true;
    };
  }, [period]);

  const groups = (["CASH", "TRANSFER", "CARD", "PENDING"] as const).map((method) => ({
    method,
    ...METHOD_CONFIG[method],
    entries: data?.entries.filter((e) => e.paymentMethod === method) ?? [],
    total: data?.summary[method] ?? 0,
  }));

  return (
    <main className="min-h-screen p-4 md:p-10 bg-salon-bg relative">
      <MuralDecorations />
      <div className="max-w-2xl mx-auto relative z-10">

        <header className="mb-8">
          <a href="/admin" className="text-xs text-salon-gray font-bold uppercase tracking-wider hover:text-salon-brown mb-4 block">
            ← Volver al panel
          </a>
          <h1 className="font-title text-2xl sm:text-3xl font-black text-salon-brown uppercase tracking-[0.15em] mb-1">
            Ingresos
          </h1>
          <div className="flex items-center gap-3 opacity-70">
            <div className="h-[2px] w-8 bg-salon-terracotta" />
            <p className="text-xs text-salon-terracotta font-bold tracking-widest uppercase">
              Desglose por método de pago
            </p>
          </div>
        </header>

        {/* Period selector */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs text-salon-gray font-bold uppercase tracking-widest">
            {data?.periodLabel}
          </p>
          <div className="flex gap-1 bg-white border-2 border-salon-olive/20 rounded-2xl p-1 shadow-sm">
            <button
              onClick={() => setPeriod("week")}
              className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${period === "week" ? "bg-salon-olive text-white shadow-sm" : "text-salon-gray hover:text-salon-olive"}`}
            >
              Semana
            </button>
            <button
              onClick={() => setPeriod("month")}
              className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${period === "month" ? "bg-salon-olive text-white shadow-sm" : "text-salon-gray hover:text-salon-olive"}`}
            >
              Mes
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border-2 border-salon-olive/10 p-5 animate-pulse h-36" />
            ))}
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {groups.map(({ method, label, color, border, text, entries, total }) => {
                if (entries.length === 0) return null;
                return (
                  <section key={method} className={`rounded-2xl border-2 ${border} ${color} overflow-hidden`}>
                    {/* Group header */}
                    <div className={`flex items-center justify-between px-5 py-3 border-b ${border}`}>
                      <span className={`text-xs font-black uppercase tracking-widest ${text}`}>{label}</span>
                      <span className={`text-base font-black ${text}`}>${total.toLocaleString()}</span>
                    </div>

                    {/* Entries */}
                    <div className="divide-y divide-white/60">
                      {entries.map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between px-5 py-3">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-salon-brown capitalize">{entry.dateLabel}</span>
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              entry.paymentStatus === "PAID"
                                ? "bg-emerald-100 text-emerald-700"
                                : entry.paymentStatus === "PARTIAL"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-gray-100 text-gray-500"
                            }`}>
                              {STATUS_LABEL[entry.paymentStatus] ?? entry.paymentStatus}
                            </span>
                          </div>
                          <span className="text-sm font-black text-salon-brown">${entry.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                );
              })}

              {data?.entries.length === 0 && (
                <div className="text-center py-16 text-salon-gray text-xs uppercase tracking-widest">
                  Sin ingresos en este período
                </div>
              )}
            </div>

            {/* Grand total */}
            {(data?.grandTotal ?? 0) > 0 && (
              <div className="mt-6 bg-white rounded-2xl border-2 border-salon-olive/30 shadow-sm px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-salon-gray">Total general</p>
                  <div className="flex gap-3 mt-1 flex-wrap">
                    {(["CASH", "TRANSFER", "CARD", "PENDING"] as const).map((m) =>
                      (data?.summary[m] ?? 0) > 0 ? (
                        <span key={m} className={`text-[10px] font-bold ${METHOD_CONFIG[m].text}`}>
                          {METHOD_CONFIG[m].label}: ${(data?.summary[m] ?? 0).toLocaleString()}
                        </span>
                      ) : null
                    )}
                  </div>
                </div>
                <p className="text-3xl font-black text-salon-olive">${(data?.grandTotal ?? 0).toLocaleString()}</p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default function RevenuePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-salon-bg" />}>
      <RevenueContent />
    </Suspense>
  );
}
