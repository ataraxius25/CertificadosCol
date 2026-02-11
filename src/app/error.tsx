"use client";

import { useEffect } from 'react';
import { RefreshCcw, Home, AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mb-8">
        <AlertTriangle className="text-red-600 w-10 h-10" />
      </div>

      <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 tracking-tight">
        Algo salió mal
      </h1>
      <p className="text-gray-500 font-medium max-w-md mx-auto mb-10">
        Ha ocurrido un error inesperado en el sistema. Hemos notificado al equipo técnico.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => reset()}
          className="flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black transition-all hover:bg-blue-700 active:scale-95 shadow-lg shadow-blue-100"
        >
          <RefreshCcw size={20} />
          REINTENTAR
        </button>
        <a 
          href="/" 
          className="flex items-center justify-center gap-2 px-8 py-4 bg-white text-gray-900 rounded-2xl font-black transition-all hover:bg-gray-50 active:scale-95 border border-gray-100 shadow-sm"
        >
          <Home size={20} />
          VOLVER AL INICIO
        </a>
      </div>
    </div>
  );
}
