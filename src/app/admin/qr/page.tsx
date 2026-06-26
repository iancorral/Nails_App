"use client";

import QRCodeSVG from "react-qr-code";
import { useRef } from "react";
import MuralDecorations from '@/components/layout/MuralDecorations';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default function QRPage() {
  const qrRef = useRef<HTMLDivElement>(null);

  const downloadQR = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    canvas.width = 400;
    canvas.height = 400;

    img.onload = () => {
      if (!ctx) return;
      ctx.fillStyle = "#FDFCF8";
      ctx.fillRect(0, 0, 400, 400);
      ctx.drawImage(img, 0, 0, 400, 400);
      const link = document.createElement("a");
      link.download = "tangible-qr.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

    return (
      <main className="min-h-screen p-6 md:p-10 bg-salon-bg relative">
        <MuralDecorations />
        <div className="max-w-sm mx-auto relative z-10">

        <header className="mb-8">
          <a href="/admin" className="text-xs text-salon-gray font-bold uppercase tracking-wider hover:text-salon-brown mb-4 block">
            ← Volver al panel
          </a>
          <h1 className="font-title text-2xl sm:text-3xl font-black text-salon-brown uppercase tracking-[0.15em] mb-1">
            QR Code
          </h1>
          <div className="flex items-center gap-3 opacity-70">
            <div className="h-[2px] w-8 bg-salon-terracotta"></div>
            <p className="text-xs text-salon-terracotta font-bold tracking-widest uppercase">
              Para imprimir en el local
            </p>
          </div>
        </header>

        {/* QR Card */}
        <div className="bg-white rounded-2xl border-2 border-salon-olive/20 shadow-folk p-8 hand-drawn text-center mb-6">
          
          <p className="text-xs font-black text-salon-gray uppercase tracking-widest mb-6">
            Escanea para agendar
          </p>

          <div ref={qrRef} className="flex justify-center mb-6">
            <div className="p-4 bg-white rounded-xl border-2 border-salon-olive/20">
              <QRCodeSVG
                value={APP_URL}
                size={200}
                fgColor="#3E311D"
                bgColor="#FDFCF8"
                level="H"
              />
            </div>
          </div>

          <h2 className="font-title text-2xl font-black text-salon-brown tracking-[0.2em] uppercase mb-1">
            TANGIBLE
          </h2>
          <p className="text-[10px] text-salon-terracotta font-bold uppercase tracking-widest">
            Nails & Art Studio
          </p>
        </div>

        {/* Instrucciones */}
        <div className="bg-salon-yellow/20 border-2 border-salon-yellow rounded-2xl p-5 hand-drawn mb-6">
          <p className="text-xs font-black text-salon-brown uppercase tracking-wider mb-3">
            Cómo usarlo
          </p>
          <div className="space-y-2 text-xs text-salon-gray">
            <p>1. Descarga la imagen con el botón de abajo</p>
            <p>2. Imprímela en tamaño carta o media carta</p>
            <p>3. Colócala en el mostrador, espejo o mesa</p>
            <p>4. Las clientas escanean y agendan directo</p>
          </div>
        </div>

        <button
          onClick={downloadQR}
          className="w-full py-4 bg-salon-brown text-salon-yellow font-black text-xs uppercase tracking-widest rounded-xl hand-drawn border-2 border-salon-brown hover:bg-salon-brown/90 transition-all shadow-folk"
        >
          Descargar QR
        </button>

      </div>
    </main>
  );
}