"use client";

import { useState, useRef, useEffect } from 'react';
import { Search, Download, GraduationCap, Loader2, AlertCircle, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { Student } from '@/types';

const DOC_TYPES = [
  { id: 'CC', label: 'Cédula de Ciudadanía (CC)' },
  { id: 'CE', label: 'Cédula de Extranjería (CE)' },
  { id: 'PPT', label: 'Permiso por Protección Temporal (PPT)' },
  { id: 'PPN', label: 'Pasaporte (PPN)' },
];

export default function StudentSearch() {
  const [cedula, setCedula] = useState('');
  const [docType, setDocType] = useState(DOC_TYPES[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [student, setStudent] = useState<Student | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cedula) return;

    setIsSearching(true);
    setNotFound(false);
    setStudent(null);

    try {
      const res = await fetch(`/api/students/search?cedula=${cedula}&documentType=${docType.id}`);
      if (res.ok) {
        const data = await res.json();
        setStudent(data);
      } else {
        setNotFound(true);
      }
    } catch (error) {
      console.error(error);
      alert('Error técnico. Por favor intente más tarde.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
      <header className="w-full max-w-4xl px-4 pt-8 md:pt-20 flex flex-col items-center">
        {/* Hero Section: Icon + Text - ULTRA MOBILE FIRST */}
        <div className="flex flex-col items-center md:flex-row md:items-center gap-6 md:gap-12 mb-10 md:mb-16 w-full max-w-2xl">
          <div className="flex-shrink-0 w-32 h-32 md:w-56 md:h-56 relative group">
            <div className="absolute inset-0 bg-blue-50 rounded-[2.5rem] md:rounded-[3rem] blur-2xl opacity-40 group-hover:opacity-80 transition-opacity" />
            <div className="relative z-10 w-full h-full bg-white rounded-[2.5rem] md:rounded-[3rem] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.08)] border border-gray-100 p-4 flex items-center justify-center overflow-hidden">
              <Image 
                src="/certificate-icon.png" 
                alt="Logo del Sistema de Certificados" 
                width={200} 
                height={200} 
                className="w-full h-full object-contain scale-110"
                priority
              />
            </div>
          </div>
          
          <div className="text-center md:text-left space-y-3 md:space-y-4 flex-grow">
            <h1 className="text-3xl md:text-5xl font-black text-[#111827] leading-[1.1] tracking-tight px-2 md:px-0">
              Verifica tus <br className="hidden md:block" /> Estudios
            </h1>
            <p className="text-base md:text-xl text-gray-600 font-medium leading-snug px-4 md:px-0">
              Verifica tu certificado con tu <span className="font-bold text-gray-900 underline decoration-blue-500 decoration-2 underline-offset-4">{docType.label}</span>
            </p>
            <p className="text-xs md:text-base text-gray-500 px-6 md:px-0 leading-relaxed max-w-sm md:max-w-none mx-auto">
              Digite su <span className="font-bold">número de documento</span> sin puntos ni comas para verificar el <span className="font-bold text-green-600 uppercase tracking-widest text-[10px] md:text-xs">estado de su certificado.</span>
            </p>
          </div>
        </div>
      </header>

      <main className="w-full max-w-2xl mx-auto relative px-4 pb-20">
          <form onSubmit={handleSearch} className="flex items-center w-full h-14 md:h-16 bg-[#F3F4F6] rounded-full border border-gray-200 shadow-[0_4px_15px_-3px_rgba(0,0,0,0.04)] focus-within:ring-4 focus-within:ring-blue-100 transition-all focus-within:bg-white focus-within:border-blue-200">
            
            {/* Custom Dropdown */}
            <div className="relative h-full" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                aria-haspopup="listbox"
                aria-expanded={isDropdownOpen}
                aria-label={`Seleccionar tipo de documento. Actual: ${docType.label}`}
                className="flex items-center px-4 md:px-6 h-full border-r border-gray-300 bg-transparent gap-1 md:gap-2 min-w-[70px] hover:bg-gray-200/50 transition-colors rounded-l-full"
              >
                <span className="text-sm font-black text-gray-800">{docType.id}</span>
                <ChevronDown className={`w-3 h-3 md:w-4 md:h-4 text-gray-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div role="listbox" className="absolute left-0 top-full mt-2 w-64 md:w-80 bg-white border border-gray-100 rounded-[1.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="p-2">
                    {DOC_TYPES.map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        role="option"
                        aria-selected={docType.id === type.id}
                        aria-current={docType.id === type.id ? 'page' : undefined}
                        onClick={() => {
                          setDocType(type);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm font-semibold transition-all rounded-xl flex justify-between items-center mb-1 last:mb-0 ${docType.id === type.id ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}
                      >
                        {type.label}
                        {docType.id === type.id && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              aria-label="Número de documento"
              className="flex-1 min-w-0 px-4 md:px-6 bg-transparent text-sm md:text-xl font-medium text-gray-900 placeholder-gray-400 focus:outline-none"
              placeholder="Ejemplo: 12345678"
              value={cedula}
              onChange={(e) => setCedula(e.target.value.replace(/\D/g, ''))}
            />
            
            <button
              type="submit"
              disabled={isSearching}
              aria-label="Buscar certificados"
              className="flex-shrink-0 bg-[#3B82F6] hover:bg-blue-600 active:bg-blue-700 text-white w-14 md:w-24 h-full flex items-center justify-center transition-all disabled:opacity-50 rounded-r-full group"
            >
              {isSearching ? (
                <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" />
              ) : (
                <Search className="h-5 w-5 md:h-6 md:w-6 stroke-[3] group-active:scale-90 transition-transform" />
              )}
            </button>
          </form>

          {/* Results Area */}
          <div className="mt-8 md:mt-12">
            {notFound && (
              <div className="p-5 md:p-6 bg-red-50 border border-red-100 rounded-[1.5rem] md:rounded-[2rem] flex items-start gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="p-2 bg-red-100 rounded-full">
                   <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                </div>
                <div>
                  <p className="font-bold text-red-900 text-sm md:text-base">Documento no encontrado</p>
                  <p className="text-xs md:text-sm text-red-700 mt-0.5">No hay certificados para este número de {docType.id}.</p>
                </div>
              </div>
            )}

            {student && (
              <article className="bg-white rounded-[2rem] md:rounded-[2.5rem] border border-gray-100 shadow-[0_25px_60px_-15px_rgba(59,130,246,0.15)] overflow-hidden animate-in fade-in zoom-in-[0.98] duration-500">
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 md:p-10 text-white">
                  <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 backdrop-blur-md">
                    Verificación Oficial
                  </span>
                  <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight leading-tight">{student.firstName} {student.lastName}</h2>
                  <p className="mt-2 text-blue-100 font-bold opacity-80">{student.cedula}</p>
                </div>
                
                <div className="p-6 md:p-10 bg-gray-50/50">
                  <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Certificados Disponibles ({student.certificates?.length || 0})</h3>
                  
                  {student.certificates && student.certificates.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {student.certificates.map((cert) => (
                        <div key={cert.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-blue-50/50 hover:-translate-y-1 transition-all group">
                          <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                              <GraduationCap className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
                            </div>
                            <span className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-500">
                              Año {cert.graduationYear}
                            </span>
                          </div>
                          
                          <h4 className="font-bold text-gray-900 leading-tight mb-6 min-h-[3rem] line-clamp-2">
                            {cert.courseName}
                          </h4>

                          {cert.certificatePath && cert.certificatePath !== '#' ? (
                            <a
                              href={cert.certificatePath}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-2 w-full py-3 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-sm transition-all"
                            >
                              <Download className="w-4 h-4" />
                              DESCARGAR CERTIFICADO
                            </a>
                          ) : (
                            <button
                              disabled
                              className="flex items-center justify-center gap-2 w-full py-3 bg-gray-100 text-gray-400 rounded-xl font-bold text-sm cursor-not-allowed"
                            >
                              <AlertCircle className="w-4 h-4" />
                              PENDIENTE
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                   ) : (
                      <div className="text-center py-10 bg-white rounded-3xl border-2 border-dashed border-gray-100">
                         <p className="text-gray-400 font-bold">No hay certificados registrados para este estudiante.</p>
                      </div>
                   )}
                   
                   <p className="text-center text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-widest opacity-60 mt-8">
                     Consulta oficial generada el {new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
                   </p>
                </div>
              </article>
            )}
          </div>
      </main>

      {/* Modern Compact Footer */}
      <footer className="bg-white border-t border-gray-100 py-6 md:py-8 mt-auto w-full">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col items-center gap-2">
          <p className="text-gray-400 text-xs md:text-sm font-bold tracking-tight">
            &copy; {new Date().getFullYear()}
          </p>
          <a 
            href="https://www.tecnonets.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-300 text-[10px] md:text-xs font-black uppercase tracking-widest hover:text-blue-500 transition-colors opacity-20 hover:opacity-100"
          >
            Desarrollo Web
          </a>
        </div>
      </footer>
    </div>
  );
}
