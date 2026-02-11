"use client";

import Link from 'next/link';
import { Search, Home, AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 text-center">
      <div className="w-24 h-24 bg-blue-50 rounded-[2rem] flex items-center justify-center mb-8 animate-bounce">
        <span className="text-4xl font-black text-blue-600">404</span>
      </div>
      
      <h1 className="text-3xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
        Página no encontrada
      </h1>
      <p className="text-gray-500 font-medium max-w-md mx-auto mb-10">
        Lo sentimos, la página que buscas no existe o ha sido movida. 
        Puedes volver al buscador para intentar de nuevo.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link 
          href="/" 
          className="flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black transition-all hover:bg-blue-700 active:scale-95 shadow-lg shadow-blue-100"
        >
          <Search size={20} />
          IR AL BUSCADOR
        </Link>
        <Link 
          href="/" 
          className="flex items-center justify-center gap-2 px-8 py-4 bg-gray-50 text-gray-900 rounded-2xl font-black transition-all hover:bg-gray-100 active:scale-95 border border-gray-100"
        >
          <Home size={20} />
          INICIO
        </Link>
      </div>

      <div className="mt-20 opacity-20 flex items-center gap-2 grayscale">
        <AlertCircle size={16} />
        <p className="text-[10px] font-black uppercase tracking-widest">Sistema de Verificación Digital</p>
      </div>
    </div>
  );
}
