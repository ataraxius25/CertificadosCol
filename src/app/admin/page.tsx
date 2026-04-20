"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError('Por favor complete todos los campos.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        router.refresh(); // Refrescar para que el middleware detecte la cookie
        router.push('/admin/dashboard');
      } else {
        setError('Credenciales inválidas. Por favor intente de nuevo.');
      }
    } catch {
      setError('Error de conexión con el servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-gray-100 p-8 md:p-12 space-y-8 animate-in fade-in zoom-in-95 duration-500">
        
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-50 rounded-3xl mb-4">
            <Lock className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Acceso Administrativo</h1>
          <p className="text-gray-500 font-medium">Panel de Gestión de Certificados</p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-700 text-sm font-bold animate-in fade-in slide-in-from-top-1 duration-300">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} noValidate className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-4">Usuario</label>
            <div className="relative group">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                className={`w-full pl-14 pr-6 py-4 bg-gray-50 border ${error && !username ? 'border-red-200 bg-red-50/10' : 'border-transparent'} rounded-2xl focus:bg-white focus:border-blue-500 focus:outline-none transition-all font-medium text-gray-900`}
                placeholder="Usuario"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (error) setError('');
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-4">Contraseña</label>
            <div className="relative group">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-blue-500 transition-colors" />
              <input
                type={showPassword ? "text" : "password"}
                className={`w-full pl-14 pr-14 py-4 bg-gray-50 border ${error && !password ? 'border-red-200 bg-red-50/10' : 'border-transparent'} rounded-2xl focus:bg-white focus:border-blue-500 focus:outline-none transition-all font-medium text-gray-900`}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-3 disabled:opacity-70"
          >
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'ENTRAR AL PANEL'}
          </button>
        </form>

        <div className="pt-4 text-center">
          <button 
            type="button"
            onClick={() => router.push('/')}
            className="text-gray-400 hover:text-gray-600 text-sm font-bold tracking-tight transition-colors"
          >
            &larr; Volver
          </button>
        </div>
      </div>
    </div>
  );
}
