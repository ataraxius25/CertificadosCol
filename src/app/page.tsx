"use client";

import { useState, useRef, useEffect } from 'react';
import { Search, Download, GraduationCap, Loader2, AlertCircle, ChevronDown, Eye, X } from 'lucide-react';
import Image from 'next/image';
import { Student } from '@/types';
import { getDrivePreviewUrl, getDriveDownloadUrl } from '@/lib/utils/drive-helpers';

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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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
            <div className="relative h-full" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
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
              className="flex-1 min-w-0 px-4 md:px-6 bg-transparent text-sm md:text-xl font-medium text-gray-900 placeholder-gray-400 focus:outline-none"
              placeholder="Ejemplo: 12345678"
              value={cedula}
              onChange={(e) => setCedula(e.target.value.replace(/\D/g, ''))}
            />
            
            <button
              type="submit"
              disabled={isSearching}
              className="flex-shrink-0 bg-[#3B82F6] hover:bg-blue-600 active:bg-blue-700 text-white w-14 md:w-24 h-full flex items-center justify-center transition-all disabled:opacity-50 rounded-r-full group"
            >
              {isSearching ? <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" /> : <Search className="h-5 w-5 md:h-6 md:w-6 stroke-[3] group-active:scale-90 transition-transform" />}
            </button>
          </form>

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
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 md:p-10 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                     <GraduationCap size={150} />
                  </div>
                  <div className="relative z-10">
                    <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-2 backdrop-blur-md">
                      Verificación Oficial
                    </span>
                    <h2 className="text-xl md:text-3xl lg:text-4xl font-black uppercase tracking-tight leading-tight">{student.firstName} {student.lastName}</h2>
                    <p className="mt-2 text-blue-100 font-bold opacity-80">{student.cedula}</p>
                  </div>
                </div>
                
                <div className="p-6 md:p-10 bg-gray-50/50">
                  <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 px-1">Certificados Disponibles ({student.certificates?.length || 0})</h3>
                  
                  {student.certificates && student.certificates.length > 0 ? (
                    <div className={`grid gap-5 ${student.certificates.length === 1 ? 'grid-cols-1 max-w-md mx-auto w-full' : 'grid-cols-1 md:grid-cols-2'}`}>
                      {student.certificates.map((cert) => (
                        <div key={cert.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-blue-900/5 hover:-translate-y-1 transition-all group flex flex-col">
                          <div className="flex justify-between items-start mb-5">
                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                              <GraduationCap className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
                            </div>
                            <span className="px-3 py-1 bg-gray-100 rounded-lg text-[10px] font-black uppercase tracking-widest text-gray-500">
                              Año {cert.graduationYear}
                            </span>
                          </div>
                          
                          <h4 className="font-bold text-gray-900 leading-tight mb-6 md:mb-8 text-base md:text-lg min-h-[2.5rem] md:min-h-[3rem] line-clamp-2 px-1">
                            {cert.courseName}
                          </h4>

                          <div className="mt-auto space-y-2">
                            {cert.certificatePath && cert.certificatePath !== '#' ? (
                              <>
                                <button
                                  onClick={() => setPreviewUrl(getDrivePreviewUrl(cert.certificatePath!))}
                                  className="flex items-center justify-center gap-2 w-full py-4 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all"
                                >
                                  <Eye className="w-4 h-4" />
                                  Previsualizar
                                </button>
                                <a
                                  href={getDriveDownloadUrl(cert.certificatePath!)}
                                  download
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-center gap-2 w-full py-4 bg-gray-900 hover:bg-black text-white rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all"
                                >
                                  <Download className="w-4 h-4" />
                                  Descargar
                                </a>
                              </>
                            ) : (
                              <button disabled className="flex items-center justify-center gap-2 w-full py-4 bg-gray-100 text-gray-400 rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest cursor-not-allowed">
                                <AlertCircle className="w-4 h-4" /> Pendiente
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                   ) : (
                      <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-gray-100">
                         <p className="text-gray-400 font-bold px-8 leading-relaxed">No hay certificados registrados para <br /> este número de documento.</p>
                      </div>
                   )}
                   
                   <p className="text-center text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-widest opacity-60 mt-12 mb-2">
                     Consulta generada el {new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
                   </p>
                </div>
              </article>
            )}
          </div>
      </main>

      {/* Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-gray-900/90 backdrop-blur-md" onClick={() => setPreviewUrl(null)} />
           <div className="relative z-10 w-full h-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
              <div className="flex items-center justify-between p-6 md:p-8 border-b border-gray-100 shrink-0">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                       <Eye size={20} />
                    </div>
                    <div>
                       <h3 className="text-sm md:text-base font-black text-gray-900 uppercase tracking-tight">Vista Previa del Certificado</h3>
                       <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Documento oficial verificado</p>
                    </div>
                 </div>
                 <button onClick={() => setPreviewUrl(null)} className="p-4 bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all">
                    <X size={24} />
                 </button>
              </div>
              <div className="flex-1 bg-gray-100 overflow-hidden relative">
                 {/* Escudo invisible para bloquear clics en los controles externos de Google */}
                 <div className="absolute top-0 right-0 w-24 h-24 z-20 bg-transparent cursor-default" />
                 
                 <iframe 
                   src={previewUrl}
                   className="w-full h-full border-0"
                   title="Previsualización de Certificado"
                 />
              </div>
              <div className="p-6 md:p-8 bg-gray-50 flex justify-center shrink-0">
                 <button onClick={() => setPreviewUrl(null)} className="px-10 py-4 bg-black text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-gray-800 transition-all shadow-xl active:scale-95">
                    Cerrar Vista
                 </button>
              </div>
           </div>
        </div>
      )}

      <footer className="bg-white border-t border-gray-100 py-8 mt-auto w-full">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-2">
          <p className="text-gray-400 text-xs font-bold tracking-tight px-4 text-center leading-relaxed">
            &copy; {new Date().getFullYear()} Sistema Central de Certificaciones <br className="md:hidden" /> todos los derechos reservados.
          </p>
          <a 
            href="https://tecnonets.com/" 
            title="Agencia de Diseño y Desarrollo Web - Tecnonets"
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-gray-300 text-[10px] font-black uppercase tracking-widest hover:text-blue-500 transition-colors opacity-30 hover:opacity-100 mt-2"
          >
            Desarrollo Web por Tecnonets
          </a>
        </div>
      </footer>
    </div>
  );
}
