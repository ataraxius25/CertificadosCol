import { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  FileUp, 
  Eye, 
  UploadCloud, 
  Loader2, 
  X, 
  Save, 
  AlertCircle,
  FileX
} from 'lucide-react';
import { useToast } from '@/components/ui/ToastContext';
import { Student } from '@/types';

export function StudentsView() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<number | 'new' | null>(null);
  const [formData, setFormData] = useState({ cedula: '', documentType: 'CC', firstName: '', lastName: '', email: '' });
  
  // Certificate Management State
  const [managingCertificates, setManagingCertificates] = useState<Student | null>(null);
  const [certForm, setCertForm] = useState({ courseName: '', graduationYear: '', file: null as File | null });
  const [isUploadingCert, setIsUploadingCert] = useState(false);
  const [certError, setCertError] = useState('');
  const [editingCertId, setEditingCertId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Filters
  const [filterCourse, setFilterCourse] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterStatus, setFilterStatus] = useState(''); // '' | 'completed' | 'pending'
  const [searchTerm, setSearchTerm] = useState('');
  
  // Course Autocomplete
  const [courseSuggestions, setCourseSuggestions] = useState<string[]>([]);
  const [showCourseSuggestions, setShowCourseSuggestions] = useState(false);

  const handleCourseChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilterCourse(value);
    
    if (value.length > 2) {
      try {
        const res = await fetch(`/api/admin/courses?query=${value}`);
        if (res.ok) {
           const data = await res.json();
           setCourseSuggestions(data);
           setShowCourseSuggestions(true);
        }
      } catch (error) {
        console.error(error);
      }
    } else {
      setShowCourseSuggestions(false);
    }
  };

  const selectCourse = (course: string) => {
    setFilterCourse(course);
    setShowCourseSuggestions(false);
  };

  // Fetch Students
  const fetchStudents = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterCourse) params.append('course', filterCourse);
      if (filterYear) params.append('year', filterYear);
      if (filterStatus) params.append('status', filterStatus);

      const res = await fetch(`/api/admin/students?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
        fetchStudents();
    }, 500); // Debounce
    return () => clearTimeout(timer);
  }, [filterCourse, filterYear, filterStatus, searchTerm]);

  const handleSaveStudent = async () => {
    if (!formData.cedula || !formData.firstName || !formData.lastName) {
      toast('Cédula, Nombres y Apellidos son obligatorios', 'error');
      return;
    }

    try {
      const method = isEditing === 'new' ? 'POST' : 'PUT';
      const url = isEditing === 'new' ? '/api/admin/students' : `/api/admin/students/${isEditing}`;
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsEditing(null);
        setFormData({ cedula: '', documentType: 'CC', firstName: '', lastName: '', email: '' });
        fetchStudents();
        toast(isEditing === 'new' ? 'Estudiante creado exitosamente' : 'Estudiante actualizado exitosamente', 'success');
      } else {
        const err = await res.json();
        toast(err.error || 'Error al guardar', 'error');
      }
    } catch (error) {
      toast('Error de red', 'error');
    }
  };

  const handleAddCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingCertificates) return;
    if (!certForm.courseName || !certForm.graduationYear || !certForm.file) {
      setCertError('Por favor complete todos los campos y seleccione un archivo PDF.');
      return;
    }

    setCertError('');

    setIsUploadingCert(true);
    const formData = new FormData();
    formData.append('studentId', managingCertificates.id.toString());
    formData.append('courseName', certForm.courseName);
    formData.append('graduationYear', certForm.graduationYear);
    formData.append('file', certForm.file);
    if (editingCertId) {
       formData.append('certificateId', editingCertId.toString());
    }

    try {
      const res = await fetch('/api/admin/certificates/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        toast(editingCertId ? 'Certificado actualizado correctamente' : 'Certificado agregado correctamente', 'success');
        setCertForm({ courseName: '', graduationYear: '', file: null });
        if (fileInputRef.current) fileInputRef.current.value = '';
        setEditingCertId(null);
        
        fetchStudents().then(() => {
          // Update managingCertificates with the latest data
          if (managingCertificates) {
            fetch(`/api/admin/students?id=${managingCertificates.id}`).then(async (r) => {
              if (r.ok) {
                const list = await r.json();
                const updated = list.find((s: Student) => s.id === managingCertificates.id);
                if (updated) setManagingCertificates(updated);
              }
            });
          }
        });

      } else {
        const err = await res.json();
        toast(err.error || 'Error al subir certificado', 'error');
      }
    } catch (error) {
      toast('Error de conexión', 'error');
    } finally {
      setIsUploadingCert(false);
    }
  };

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'delete' | 'delete_file' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: () => {},
  });

  const closeConfirm = () => setConfirmModal(prev => ({ ...prev, isOpen: false }));

  const handleResetCertificate = (certId: number) => {
    setConfirmModal({
        isOpen: true,
        title: '¿Quitar archivo del certificado?',
        message: 'Se eliminará el PDF, pero la información del curso permanecerá como "PENDIENTE".',
        type: 'delete_file',
        onConfirm: async () => {
            try {
                const res = await fetch(`/api/admin/certificates/${certId}`, { method: 'PATCH' });
                if (res.ok) {
                    toast('PDF eliminado correctamente', 'success');
                    // Update state locally
                    setManagingCertificates((prev) => {
                        if (!prev || !prev.certificates) return prev;
                        return {
                            ...prev,
                            certificates: prev.certificates.map((c) => 
                                c.id === certId ? { ...c, certificatePath: '#' } : c
                            )
                        };
                    });
                    fetchStudents();
                } else {
                    toast('Error al quitar archivo', 'error');
                }
            } catch (error) {
                toast('Error de red', 'error');
            }
            closeConfirm();
        }
    });
  };

  const handleDeleteCertificate = (certId: number) => {
    setConfirmModal({
        isOpen: true,
        title: '¿Eliminar Registro por Completo?',
        message: 'Se eliminará tanto el archivo como la información del curso para este estudiante. Esta acción no se puede deshacer.',
        type: 'delete',
        onConfirm: async () => {
            try {
                const res = await fetch(`/api/admin/certificates/${certId}`, { method: 'DELETE' });
                if (res.ok) {
                    toast('Registro eliminado', 'success');
                    setManagingCertificates((prev) => {
                        if (!prev || !prev.certificates) return prev;
                        return {
                            ...prev,
                            certificates: prev.certificates.filter((c) => c.id !== certId)
                        };
                    });
                    fetchStudents();
                } else {
                    toast('Error eliminando', 'error');
                }
            } catch (error) {
                toast('Error de red', 'error');
            }
            closeConfirm();
        }
    });
  };

  const handleDeleteStudent = (id: number) => {
    setConfirmModal({
      isOpen: true,
      title: '¿Eliminar Estudiante?',
      message: '¿Estás seguro? Se eliminará este registro y TODOS sus certificados. No podrás recuperarlo.',
      type: 'delete',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/students/${id}`, { method: 'DELETE' });
          if (res.ok) {
            fetchStudents();
            toast('Estudiante eliminado correctamente', 'success');
          }
          else toast('Error al eliminar', 'error');
        } catch (error) {
          toast('Error de red', 'error');
        }
        closeConfirm();
      }
    });
  };

  const startEdit = (student: Student) => {
    setIsEditing(student.id);
    setFormData({
      cedula: student.cedula,
      documentType: student.documentType || 'CC',
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email || '',
    });
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
         <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3 w-full">
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors w-4 h-4" />
                <input 
                  placeholder="Buscar por nombre o cédula..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-100 outline-none text-sm font-bold shadow-sm transition-all" 
                />
            </div>
            
             <div className="relative">
               <input 
                 placeholder="Filtrar por Curso" 
                 value={filterCourse}
                 onChange={handleCourseChange}
                 onFocus={() => filterCourse.length > 2 && setShowCourseSuggestions(true)}
                 onBlur={() => setTimeout(() => setShowCourseSuggestions(false), 200)}
                 className="w-full px-4 py-3 bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-100 outline-none text-sm font-bold shadow-sm transition-all" 
               />
               {showCourseSuggestions && courseSuggestions.length > 0 && (
                 <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden max-h-60 overflow-y-auto">
                   {courseSuggestions.map((course, idx) => (
                     <button
                       key={idx}
                       onClick={() => selectCourse(course)}
                       className="w-full text-left px-4 py-3 hover:bg-blue-50 text-sm font-bold text-gray-700 transition-colors border-b border-gray-50 last:border-0"
                     >
                       {course}
                     </button>
                   ))}
                 </div>
               )}
             </div>

             <input 
               type="number"
               placeholder="Año" 
               value={filterYear}
               onChange={(e) => setFilterYear(e.target.value)}
               className="w-full px-4 py-3 bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-100 outline-none text-sm font-bold shadow-sm transition-all" 
             />

             <select 
               value={filterStatus}
               onChange={(e) => setFilterStatus(e.target.value)}
               className="w-full px-4 py-3 bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-100 outline-none text-sm font-bold shadow-sm transition-all appearance-none cursor-pointer" 
             >
                <option value="">Todos los Estados</option>
                <option value="pending">Pendientes (Faltan PDF)</option>
                <option value="completed">Completados</option>
             </select>
         </div>

        <button 
          onClick={() => { 
            setIsEditing('new'); 
            setFormData({ cedula: '', documentType: 'CC', firstName: '', lastName: '', email: '' });
            setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
          }}
          className="w-full xl:w-auto flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all text-sm shrink-0"
        >
          <Plus size={20} />
          Nuevo Registro
        </button>
      </div>

      {isEditing && (
        <div ref={formRef} className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-xl shadow-blue-50/50 animate-in fade-in slide-in-from-top-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
            <Edit size={120} />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div>
                 <h4 className="text-xl font-black text-gray-900 tracking-tight">
                   {isEditing === 'new' ? 'Nuevo Estudiante' : 'Editar Estudiante'}
                 </h4>
                 <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Información Personal</p>
              </div>
              <button onClick={() => setIsEditing(null)} className="p-2 bg-gray-50 text-gray-400 hover:text-red-500 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-black text-gray-400 ml-1">Tipo Identificación</label>
                <select 
                  value={formData.documentType}
                  onChange={(e) => setFormData({...formData, documentType: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:border-blue-100 focus:ring-4 focus:ring-blue-50 rounded-xl transition-all font-bold text-gray-900 outline-none appearance-none cursor-pointer"
                >
                    <option value="CC">Cédula de Ciudadanía (CC)</option>
                    <option value="CE">Cédula de Extranjería (CE)</option>
                    <option value="PPT">Permiso por Protección Temporal (PPT)</option>
                    <option value="PPN">Pasaporte (PPN)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-black text-gray-400 ml-1">Documento (Cédula)</label>
                <input 
                  value={formData.cedula}
                  onChange={(e) => setFormData({...formData, cedula: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:border-blue-100 focus:ring-4 focus:ring-blue-50 rounded-xl transition-all font-bold text-gray-900 outline-none placeholder:text-gray-300"
                  placeholder="Ej: 1000123456"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-black text-gray-400 ml-1">Nombres</label>
                <input 
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:border-blue-100 focus:ring-4 focus:ring-blue-50 rounded-xl transition-all font-bold text-gray-900 outline-none placeholder:text-gray-300"
                  placeholder="Ej: Juan David"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-black text-gray-400 ml-1">Apellidos</label>
                <input 
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:border-blue-100 focus:ring-4 focus:ring-blue-50 rounded-xl transition-all font-bold text-gray-900 outline-none placeholder:text-gray-300"
                  placeholder="Ej: Pérez López"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-black text-gray-400 ml-1">Email (Opcional)</label>
                <input 
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:border-blue-100 focus:ring-4 focus:ring-blue-50 rounded-xl transition-all font-bold text-gray-900 outline-none placeholder:text-gray-300"
                  placeholder="Ej: juan@ejemplo.com"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-50">
               <button 
                 onClick={() => setIsEditing(null)} 
                 className="px-6 py-3 text-gray-400 font-bold hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-all text-sm"
               >
                 Cancelar
               </button>
               <button 
                 onClick={handleSaveStudent} 
                 className="px-8 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black hover:scale-105 active:scale-95 transition-all shadow-lg shadow-gray-200 text-sm flex items-center gap-2"
               >
                 <Save size={18} />
                 Guardar Cambios
               </button>
            </div>
          </div>
        </div>
      )}

      {managingCertificates && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setManagingCertificates(null); setCertError(''); }} />
              <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden relative z-10 flex flex-col animate-in zoom-in-95 duration-200">
                  <div className="p-8 bg-gray-50 border-b border-gray-100 flex justify-between items-center shrink-0">
                      <div>
                          <h3 className="text-2xl font-black text-gray-900">{managingCertificates.firstName} {managingCertificates.lastName}</h3>
                          <p className="text-sm text-gray-500 font-bold mt-1">Gestión de Certificados • {managingCertificates.cedula}</p>
                      </div>
                      <button onClick={() => { setManagingCertificates(null); setCertError(''); }} className="p-3 bg-white hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all shadow-sm">
                          <X size={24} />
                      </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                          <div className="space-y-6">
                              <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                  <FileUp size={16} /> Certificados Actuales ({managingCertificates.certificates?.length || 0})
                              </h4>
                              
                              <div className="space-y-3">
                                  {managingCertificates.certificates?.map((cert) => {
                                      const isPending = cert.certificatePath === '#' || !cert.certificatePath;
                                      return (
                                          <div key={cert.id} className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-lg hover:shadow-blue-50 hover:border-blue-100 transition-all group flex justify-between items-center">
                                              <div>
                                                  <p className="font-bold text-gray-900">{cert.courseName}</p>
                                                  <p className="text-xs text-gray-500 mt-1">Año: {cert.graduationYear}</p>
                                                  {isPending && (
                                                      <span className="inline-block mt-1 px-2 py-0.5 bg-orange-100 text-orange-600 text-[10px] font-black rounded-lg tracking-widest">
                                                          PENDIENTE
                                                      </span>
                                                  )}
                                              </div>
                                               <div className="flex gap-2">
                                                   {!isPending ? (
                                                       <>
                                                           <a href={cert.certificatePath} target="_blank" rel="noopener noreferrer" className="p-2 bg-white text-blue-600 border border-blue-50 rounded-xl shadow-sm hover:bg-blue-600 hover:text-white transition-all scale-100 hover:scale-105" title="Ver Certificado">
                                                               <Eye size={18} />
                                                           </a>
                                                           <button 
                                                               onClick={() => handleResetCertificate(cert.id)} 
                                                               className="p-2 bg-white text-orange-400 border border-orange-50 rounded-xl shadow-sm hover:bg-orange-500 hover:text-white transition-all scale-100 hover:scale-105" 
                                                               title="Quitar PDF (Mantener registro)"
                                                           >
                                                               <FileX size={18} />
                                                           </button>
                                                       </>
                                                   ) : (
                                                       <button 
                                                           type="button"
                                                           onClick={() => {
                                                               setEditingCertId(cert.id);
                                                               setCertForm({ courseName: cert.courseName, graduationYear: cert.graduationYear.toString(), file: null });
                                                           }}
                                                           className="p-2 bg-blue-50 text-blue-600 rounded-xl shadow-sm cursor-pointer hover:bg-blue-100 transition-all animate-pulse" 
                                                           title="Subir Archivo Pendiente"
                                                       >
                                                           <UploadCloud size={18} />
                                                       </button>
                                                   )}
                                                   <button 
                                                       onClick={() => handleDeleteCertificate(cert.id)} 
                                                       className="p-2 bg-white text-red-300 border border-red-50 rounded-xl shadow-sm hover:bg-red-500 hover:text-white transition-all scale-100 hover:scale-105" 
                                                       title="Eliminar Registro Completo"
                                                   >
                                                       <Trash2 size={18} />
                                                   </button>
                                               </div>
                                          </div>
                                      );
                                  })}
                                  {(!managingCertificates.certificates || managingCertificates.certificates.length === 0) && (
                                      <div className="p-8 border-2 border-dashed border-gray-100 rounded-3xl text-center text-gray-400">
                                          <p className="text-sm font-medium">No hay certificados asignados</p>
                                      </div>
                                  )}
                              </div>
                          </div>

                          <div className="space-y-6">
                              <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                  {editingCertId ? <Edit size={16} /> : <Plus size={16} />} 
                                  {editingCertId ? 'Actualizar Certificado Existente' : 'Agregar Nuevo Certificado'}
                              </h4>
                              
                              <form onSubmit={handleAddCertificate} noValidate className={`p-6 rounded-3xl border space-y-4 ${editingCertId ? 'bg-orange-50/50 border-orange-100' : 'bg-blue-50/50 border-blue-100'}`}>
                                  {certError && (
                                      <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-[10px] font-black uppercase tracking-tight animate-in fade-in slide-in-from-top-1">
                                          <AlertCircle size={14} />
                                          {certError}
                                      </div>
                                  )}

                                  <div>
                                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre del Curso</label>
                                      <input 
                                          value={certForm.courseName}
                                          onChange={e => {
                                              setCertForm({...certForm, courseName: e.target.value});
                                              if (certError) setCertError('');
                                          }}
                                          className={`w-full px-4 py-3 bg-white rounded-xl border ${certError && !certForm.courseName ? 'border-red-200' : 'border-transparent'} focus:ring-4 focus:ring-blue-100 outline-none text-sm font-bold transition-all`}
                                          placeholder="Ej: Bachiller Académico"
                                      />
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Año de Grado</label>
                                      <input 
                                          type="number"
                                          value={certForm.graduationYear}
                                          onChange={e => {
                                              setCertForm({...certForm, graduationYear: e.target.value});
                                              if (certError) setCertError('');
                                          }}
                                          className={`w-full px-4 py-3 bg-white rounded-xl border ${certError && !certForm.graduationYear ? 'border-red-200' : 'border-transparent'} focus:ring-4 focus:ring-blue-100 outline-none text-sm font-bold transition-all`}
                                          placeholder="Ej: 2024"
                                      />
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Archivo PDF</label>
                                      <input 
                                          ref={fileInputRef}
                                          type="file"
                                          accept=".pdf"
                                          onChange={e => {
                                              setCertForm({...certForm, file: e.target.files?.[0] || null});
                                              if (certError) setCertError('');
                                          }}
                                          className={`w-full px-4 py-3 bg-white rounded-xl border ${certError && !certForm.file ? 'border-red-200' : 'border-transparent'} focus:ring-4 focus:ring-blue-100 outline-none text-sm font-bold file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 transition-all`}
                                      />
                                  </div>

                                  <div className="flex gap-2">
                                      {editingCertId && (
                                          <button 
                                              type="button"
                                              onClick={() => {
                                                  setEditingCertId(null);
                                                  setCertForm({ courseName: '', graduationYear: '', file: null });
                                              }}
                                              className="px-4 py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-black transition-all"
                                          >
                                              <X size={20} />
                                          </button>
                                      )}
                                      <button 
                                          type="submit" 
                                          disabled={isUploadingCert}
                                          className={`flex-1 py-4 text-white rounded-xl font-black shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${editingCertId ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}
                                      >
                                          {isUploadingCert ? <Loader2 className="animate-spin" /> : <UploadCloud size={20} />}
                                          {editingCertId ? 'ACTUALIZAR PDF' : 'SUBIR CERTIFICADO'}
                                      </button>
                                  </div>
                              </form>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-600" /></div>
      ) : (
        <>
          <div className="md:hidden space-y-4">
            {students.map((student) => {
              const totalCerts = student.certificates?.length || 0;
              const pendingCerts = student.certificates?.filter((c) => c.certificatePath === '#' || !c.certificatePath).length || 0;
              const validCerts = totalCerts - pendingCerts;

              return (
              <div key={student.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-black text-gray-900 uppercase">{student.firstName} {student.lastName}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[9px] font-black">{student.documentType || 'CC'}</span>
                      <p className="text-xs text-gray-500">{student.cedula}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {validCerts > 0 && <span className="px-3 py-1 rounded-full font-black text-[8px] tracking-widest bg-green-50 text-green-600">{validCerts} LISTOS</span>}
                    {pendingCerts > 0 && <span className="px-3 py-1 rounded-full font-black text-[8px] tracking-widest bg-orange-50 text-orange-600">{pendingCerts} PEND</span>}
                  </div>
                </div>
                
                <div className="flex gap-2 pt-2 border-t border-gray-50 mt-4">
                   <button onClick={() => setManagingCertificates(student)} className="flex-1 py-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"><FileUp size={14} /> Certificados</button>
                   <button onClick={() => startEdit(student)} className="p-3 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100"><Edit size={14} /></button>
                   <button onClick={() => handleDeleteStudent(student.id)} className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100"><Trash2 size={14} /></button>
                </div>
              </div>
              );
            })}

            {students.length === 0 && <p className="text-center text-gray-400">No hay estudiantes registrados.</p>}
          </div>

          <div className="hidden md:block bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Estudiante</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tipo Doc</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Documento</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Certificados</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 uppercase text-xs">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-8 py-5 font-black text-gray-900">{student.firstName} {student.lastName}</td>
                      <td className="px-8 py-5 font-bold">
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-black">
                          {student.documentType || 'CC'}
                        </span>
                      </td>
                      <td className="px-8 py-5 font-bold text-gray-500">{student.cedula}</td>
                      <td className="px-8 py-5 font-bold">
                         <button 
                             onClick={() => setManagingCertificates(student)}
                             className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all"
                         >
                             <FileUp size={14} className="text-gray-400" />
                             <span className="font-black text-[10px] tracking-widest flex gap-2">
                                 {(() => {
                                     const pending = student.certificates?.filter((c) => c.certificatePath === '#' || !c.certificatePath).length || 0;
                                     const total = student.certificates?.length || 0;
                                     const valid = total - pending;
                                     
                                     return (
                                        <>
                                           {valid > 0 && <span className="text-green-600">{valid} LISTOS</span>}
                                           {pending > 0 && <span className="text-orange-600">{pending} PENDIENTES</span>}
                                           {total === 0 && <span className="text-gray-400">SIN REGISTROS</span>}
                                        </>
                                     )
                                 })()}
                             </span>
                         </button>
                      </td>
                      <td className="px-8 py-5 text-right flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => startEdit(student)} className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"><Edit size={16} /></button>
                         <button onClick={() => handleDeleteStudent(student.id)} className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-8 py-10 text-center text-gray-400 font-bold">No se encontraron registros.</td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>
        </>
      )}
      
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeConfirm} />
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-8 relative z-10 animate-in zoom-in-95 duration-200 border border-gray-100">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${confirmModal.type.startsWith('delete') ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-600'}`}>
              {confirmModal.type.startsWith('delete') ? <Trash2 size={28} /> : <AlertCircle size={28} />}
            </div>
            
            <h3 className="text-xl font-black text-gray-900 mb-2">{confirmModal.title}</h3>
            <p className="text-sm font-medium text-gray-500 mb-8 leading-relaxed">
              {confirmModal.message}
            </p>

            <div className="flex gap-3">
              <button 
                onClick={closeConfirm}
                className="flex-1 py-4 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl font-bold text-sm transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmModal.onConfirm}
                className={`flex-1 py-4 rounded-xl font-black text-sm text-white shadow-xl transition-all active:scale-[0.98] ${confirmModal.type.startsWith('delete') ? 'bg-red-500 shadow-red-200 hover:bg-red-600' : 'bg-blue-600 shadow-blue-200 hover:bg-blue-700'}`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
