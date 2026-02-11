import { ShieldCheck, Menu, X } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

export function Header({ activeTab, isMobileMenuOpen, setIsMobileMenuOpen }: HeaderProps) {
  const getTitle = () => {
    switch (activeTab) {
      case 'students': return 'Gestión de Estudiantes';
      case 'upload': return 'Importación de Datos';
      case 'reports': return 'Reportes y Estadísticas';
      default: return 'Panel de Control';
    }
  };

  return (
    <>
      {/* Mobile Top Bar (Sticky) */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-100">
            <ShieldCheck className="text-white w-5 h-5" />
          </div>
          <p className="text-sm font-black text-gray-900 leading-none tracking-tight">Admin Console</p>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-gray-50 rounded-xl text-gray-500 hover:text-blue-600 transition-all active:scale-95"
          aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Desktop Header content */}
      <header className="hidden md:flex bg-white border-b border-gray-100 px-8 h-20 items-center justify-between sticky top-0 z-30">
        <div>
          <h2 className="text-2xl font-black text-gray-900 leading-tight">
            {getTitle()}
          </h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
            Sistema de Verificación de Certificados
          </p>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="text-right">
             <p className="text-xs font-black text-gray-900">Admin</p>
             <p className="text-[9px] font-bold text-green-500 uppercase">En Línea</p>
           </div>
        </div>
      </header>
    </>
  );
}
