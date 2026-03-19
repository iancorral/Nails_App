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
    <div className="mb-8">
      {/* Selector de periodo */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-black text-salon-olive uppercase tracking-widest">
          Resumen
        </h2>
        <div className="flex gap-1 bg-white border-2 border-salon-olive/20 rounded-xl p-1">
          <button
            onClick={() => setPeriod("week")}
            className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${period === "week" ? "bg-salon-olive text-white" : "text-salon-gray"}`}
          >
            Semana
          </button>
          <button
            onClick={() => setPeriod("month")}
            className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${period === "month" ? "bg-salon-olive text-white" : "text-salon-gray"}`}
          >
            Mes
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border-2 border-salon-olive/10 p-4 animate-pulse h-24" />
          ))}
        </div>
      ) : metrics ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Ingresos */}
          <div className="bg-white rounded-2xl border-2 border-salon-olive/20 p-4 hand-drawn shadow-folk">
            <p className="text-[10px] uppercase tracking-wider text-salon-gray font-bold mb-1">Ingresos</p>
            <p className="text-2xl font-black text-salon-olive">${metrics.revenue.toLocaleString()}</p>
            <p className="text-[10px] text-salon-gray mt-1">proyectados</p>
          </div>

          {/* Citas confirmadas */}
          <div className="bg-white rounded-2xl border-2 border-salon-olive/20 p-4 hand-drawn shadow-folk">
            <p className="text-[10px] uppercase tracking-wider text-salon-gray font-bold mb-1">Citas</p>
            <p className="text-2xl font-black text-salon-brown">{metrics.totalConfirmed}</p>
            <p className="text-[10px] text-salon-gray mt-1">confirmadas</p>
          </div>

          {/* Cancelaciones */}
          <div className="bg-white rounded-2xl border-2 border-salon-terracotta/20 p-4 hand-drawn shadow-folk">
            <p className="text-[10px] uppercase tracking-wider text-salon-gray font-bold mb-1">Canceladas</p>
            <p className="text-2xl font-black text-salon-terracotta">{metrics.cancellationRate}%</p>
            <p className="text-[10px] text-salon-gray mt-1">{metrics.totalCancelled} citas</p>
          </div>

          {/* Servicio top */}
          <div className="bg-white rounded-2xl border-2 border-salon-lavender/30 p-4 hand-drawn shadow-folk">
            <p className="text-[10px] uppercase tracking-wider text-salon-gray font-bold mb-1">Top servicio</p>
            {metrics.topService ? (
              <>
                <p className="text-sm font-black text-salon-brown leading-tight">{metrics.topService.name}</p>
                <p className="text-[10px] text-salon-gray mt-1">{metrics.topService.count} veces</p>
              </>
            ) : (
              <p className="text-sm text-salon-gray font-bold">Sin datos</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}