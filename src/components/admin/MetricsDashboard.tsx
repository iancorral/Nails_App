"use client";

import { useState, useEffect } from "react";

type Metrics = {
  period: string;
  totalConfirmed: number;
  totalCancelled: number;
  revenue: number;
  topService: { name: string; count: number } | null;
  avgDuration: number;
  cancellationRate: number;
};

export default function MetricsDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [period, setPeriod] = useState<"week" | "month">("week");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/metrics?period=${period}`)
      .then((r) => r.json())
      .then((data) => {
        setMetrics(data);
        setLoading(false);
      });
  }, [period]);

  return (
    <div className="mb-8 animate-in fade-in">
      {/* Selector de periodo */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-black text-salon-olive uppercase tracking-widest">
          Resumen
        </h2>
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-3xl border-2 border-salon-olive/10 p-5 animate-pulse h-28" />
          ))}
        </div>
      ) : metrics ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Ingresos — clickable, links to revenue detail */}
            <a
              href={`/admin/revenue?period=${period}`}
              className="bg-white rounded-3xl border-2 border-salon-olive/20 p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 group block"
            >
              <p className="text-[10px] uppercase tracking-wider text-salon-gray font-bold mb-1">Ingresos</p>
              <p className="text-2xl font-black text-salon-olive">${metrics.revenue.toLocaleString()}</p>
              <p className="text-[10px] text-salon-olive/60 mt-1 font-bold group-hover:text-salon-olive transition-colors">
                ver desglose →
              </p>
            </a>

            {/* Citas confirmadas */}
            <div className="bg-white rounded-3xl border-2 border-salon-brown/20 p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
              <p className="text-[10px] uppercase tracking-wider text-salon-gray font-bold mb-1">Citas</p>
              <p className="text-2xl font-black text-salon-brown">{metrics.totalConfirmed}</p>
              <p className="text-[10px] text-salon-gray mt-1 font-medium">confirmadas</p>
            </div>

            {/* Cancelaciones */}
            <div className="bg-white rounded-3xl border-2 border-salon-terracotta/20 p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
              <p className="text-[10px] uppercase tracking-wider text-salon-gray font-bold mb-1">Canceladas</p>
              <p className="text-2xl font-black text-salon-terracotta">{metrics.cancellationRate}%</p>
              <p className="text-[10px] text-salon-gray mt-1 font-medium">{metrics.totalCancelled} citas</p>
            </div>

            {/* Servicio top */}
            <div className="bg-white rounded-3xl border-2 border-salon-lavender/30 p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
              <p className="text-[10px] uppercase tracking-wider text-salon-gray font-bold mb-1">Top servicio</p>
              {metrics.topService ? (
                <div className="flex flex-col justify-center h-full pb-3">
                  <p className="text-sm font-black text-salon-lavender leading-tight line-clamp-2">{metrics.topService.name}</p>
                  <p className="text-[10px] text-salon-gray mt-1 font-bold">{metrics.topService.count} veces</p>
                </div>
              ) : (
                <p className="text-sm text-salon-gray font-bold mt-2">Sin datos</p>
              )}
            </div>
          </div>

        </>
      ) : null}
    </div>
  );
}
