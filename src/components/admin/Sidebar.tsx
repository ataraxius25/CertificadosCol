import { Users, FileUp, BarChart3, ShieldCheck, ChevronRight, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/ToastContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

export function Sidebar({ activeTab, setActiveTab, isMobileMenuOpen, setIsMobileMenuOpen }: SidebarProps) {
  const router = useRouter();
  const { toast } = useToast();

  const menuItems = [
    { id: 'students', label: 'Estudiantes', icon: <Users size={20} aria-hidden="true" /> },
    { id: 'upload', label: 'Cargar Archivos', icon: <FileUp size={20} aria-hidden="true" /> },
    { id: 'reports', label: 'Ver Reportes', icon: <BarChart3 size={20} aria-hidden="true" /> },
  ];

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/admin/auth', { method: 'DELETE' });
      if (res.ok) {
        toast('Sesión cerrada correctamente', 'success');
        router.push('/admin');
        router.refresh();
      }
    } catch (error) {
      toast('Error al cerrar sesión', 'error');
    }
  };

  return (
    <>
      {/* Sidebar - Overlay on Mobile */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-100 transform transition-transform duration-300 md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
        <div className="p-8 h-full flex flex-col">
          <div className="hidden md:flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <ShieldCheck className="text-white w-6 h-6" />
            </div>
            <div>
              <p className="text-lg font-black text-gray-900 leading-none">Panel Administrativo</p>
            </div>
          </div>

          <nav className="space-y-2 flex-1 overflow-y-auto pr-2" role="navigation" aria-label="Menú principal">
            {menuItems.map((item) => (
              <SidebarItem 
                key={item.id}
                icon={item.icon} 
                label={item.label} 
                active={activeTab === item.id} 
                onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }} 
              />
            ))}
          </nav>
          <div className="mt-auto pt-8 border-t border-gray-100">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 w-full p-4 text-red-500 hover:bg-red-50 rounded-2xl transition-all font-bold text-sm"
              aria-label="Cerrar sesión administrativa"
            >
              <LogOut size={20} aria-hidden="true" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop for Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/10 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center justify-between w-full p-4 rounded-2xl transition-all group ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-gray-500 hover:bg-gray-50'}`}
    >
      <div className="flex items-center gap-3 font-bold text-sm">
        {icon}
        {label}
      </div>
      {active && <ChevronRight size={16} />}
    </button>
  );
}
