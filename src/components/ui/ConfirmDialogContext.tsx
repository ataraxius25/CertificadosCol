"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
}

interface ConfirmDialogContextType {
  confirmDialog: (options: ConfirmDialogOptions) => Promise<boolean>;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextType | undefined>(undefined);

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmDialogOptions | null>(null);
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

  const confirmDialog = useCallback((options: ConfirmDialogOptions) => {
    setOptions(options);
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      setResolvePromise(() => resolve);
    });
  }, []);

  const handleCancel = () => {
    setIsOpen(false);
    if (resolvePromise) resolvePromise(false);
  };

  const handleConfirm = () => {
    setIsOpen(false);
    if (resolvePromise) resolvePromise(true);
  };

  return (
    <ConfirmDialogContext.Provider value={{ confirmDialog }}>
      {children}
      
      {isOpen && options && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" 
            onClick={handleCancel}
          />
          
          {/* Modal */}
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 md:p-10">
              <div className="flex flex-col items-center text-center gap-6">
                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center ${
                  options.variant === 'danger' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-600'
                }`}>
                  <AlertTriangle size={32} />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-gray-900 leading-tight">
                    {options.title}
                  </h3>
                  <p className="text-gray-500 font-bold text-sm leading-relaxed">
                    {options.message}
                  </p>
                </div>
              </div>

              <div className="mt-10 flex flex-col gap-3">
                <button
                  onClick={handleConfirm}
                  className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg ${
                    options.variant === 'danger' 
                      ? 'bg-red-500 text-white shadow-red-100 hover:bg-red-600' 
                      : 'bg-blue-600 text-white shadow-blue-100 hover:bg-blue-700'
                  }`}
                >
                  {options.confirmLabel || 'Aceptar'}
                </button>
                <button
                  onClick={handleCancel}
                  className="w-full py-4 bg-gray-50 text-gray-400 hover:bg-gray-100 rounded-2xl font-black text-sm uppercase tracking-widest transition-all"
                >
                  {options.cancelLabel || 'Cancelar'}
                </button>
              </div>
            </div>

            <button 
              onClick={handleCancel}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:bg-gray-50 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmDialogProvider');
  }
  return context;
}
