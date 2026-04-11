import { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  UploadCloud, 
  Loader2, 
  X, 
  Save, 
  GraduationCap,
  AlertCircle,
  Clock,
  ShieldCheck,
  Download,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/components/ui/ToastContext';
import { useConfirm } from '@/components/ui/ConfirmDialogContext';
import { Student } from '@/types';
import { getDrivePreviewUrl } from '@/lib/utils/drive-helpers';
import { getDriveDownloadUrl } from '@/lib/utils/drive-helpers';

interface StudentsViewProps {
  students: Student[];
  isLoading: boolean;
  lastSync: Date | null;
  refreshData: (silent?: boolean) => Promise<void>;
}

export function StudentsView({ students, isLoading, lastSync, refreshData }: StudentsViewProps) {
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  // const [isLoading, setIsLoading] = useState(true); // Removido: viene por props
  // const [lastSync, setLastSync] = useState<Date>(new Date()); // Removido: viene por props
  
  const [isEditing, setIsEditing] = useState<string | 'new' | null>(null); 
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  const [formData, setFormData] = useState({ 
    cedula: '', 
    documentType: 'CC', 
    firstName: '', 
    lastName: '', 
    email: '',
    courseName: '', 
    graduationYear: '' 
  });
  
  const [uploadingFor, setUploadingFor] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingCedula, setDeletingCedula] = useState<string | null>(null);
  const [deletingCertId, setDeletingCertId] = useState<number | null>(null);
  const [addingCourse, setAddingCourse] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { confirmDialog } = useConfirm();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Removido: fetchStudents ahora es refreshData (prop)
  
  useEffect(() => {
    if (selectedStudent && students) {
       const current = students.find((st: Student) => String(st.cedula) === String(selectedStudent.cedula));
       if (current) setSelectedStudent(current);
    }
  }, [students, selectedStudent]);

  useEffect(() => {
    if (!Array.isArray(students)) {
      setFilteredStudents([]);
      return;
    }

    let result = [...students];
    if (searchTerm) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(s => {
        const cedula = String(s.cedula || '').toLowerCase();
        const firstName = String(s.firstName || '').toLowerCase();
        const lastName = String(s.lastName || '').toLowerCase();
        const fullName = `${firstName} ${lastName}`;
        
        return (
          cedula.includes(term) ||
          firstName.includes(term) ||
          lastName.includes(term) ||
          fullName.includes(term)
        );
      });
    }
    if (filterStatus === 'pending') {
      result = result.filter(s => s.certificates?.some(c => c.certificatePath === '#'));
    } else if (filterStatus === 'completed') {
      result = result.filter(s => s.certificates?.every(c => c.certificatePath !== '#'));
    }
    setFilteredStudents(result);
  }, [searchTerm, filterStatus, students]);

   const handleDeleteCertificate = async (rowId: number) => {
    const ok = await confirmDialog({
      title: '¿Eliminar registro?',
      message: '¿Estás seguro de que deseas eliminar este registro de curso? Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar',
      variant: 'danger'
    });
    if (!ok) return;
    setDeletingCertId(rowId);
    try {
      const res = await fetch(`/api/admin/students/${rowId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast('Registro eliminado correctamente', 'success');
      refreshData(true);
      if (selectedStudent) {
        setSelectedStudent(prev => prev ? {
          ...prev,
          certificates: prev.certificates?.filter(c => c.id !== rowId)
        } : null);
      }
    } catch { toast('Error al eliminar', 'error'); }
    finally { setDeletingCertId(null); }
  };

   const handleDeleteStudent = async (cedula: string) => {
    const ok = await confirmDialog({
      title: '¿Eliminar Estudiante?',
      message: `¿Estás seguro de eliminar al estudiante ${cedula} y todos sus cursos asociados? Esta acción es irreversible.`,
      confirmLabel: 'Eliminar Permanente',
      variant: 'danger'
    });
    if (!ok) return;
    setDeletingCedula(cedula);
    try {
      const res = await fetch(`/api/admin/students?cedula=${cedula}`, { method: 'DELETE' });
      if (res.ok) {
        toast('Estudiante eliminado correctamente', 'success');
        refreshData(true);
      } else {
        toast('Error al eliminar estudiante', 'error');
      }
    } catch { toast('Error de conexión', 'error'); }
    finally { setDeletingCedula(null); }
  };

  const resetForm = () => {
    setFormData({ cedula: '', documentType: 'CC', firstName: '', lastName: '', email: '', courseName: '', graduationYear: '' });
  };

  const handleSaveRecord = async () => {
    if (!formData.cedula || !formData.firstName || !formData.courseName) {
      toast('Completa los campos obligatorios: Documento, Nombres y Curso', 'error');
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error();
      setIsEditing(null);
      resetForm();
      toast('Estudiante registrado correctamente', 'success');
      refreshData(true);
    } catch { toast('Error de comunicación', 'error'); }
    finally { setIsSaving(false); }
  };

  const handleEditStudent = (st: Student) => {
    setFormData({
      cedula: String(st.cedula),
      documentType: String(st.documentType || 'CC'),
      firstName: String(st.firstName || ''),
      lastName: String(st.lastName || ''),
      email: String(st.email || ''),
      courseName: String(st.certificates?.[0]?.courseName || ''),
      graduationYear: String(st.certificates?.[0]?.graduationYear || ''),
    });
    setIsEditing(String(st.cedula));
  };

  const handleUpdateStudent = async () => {
    const target = students.find(s => String(s.cedula) === isEditing);
    if (!target?.certificates?.length) {
      toast('No se encontró el estudiante para actualizar', 'error');
      return;
    }
    setIsSaving(true);
    try {
      for (const cert of target.certificates) {
        const res = await fetch(`/api/admin/students/${cert.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentType: formData.documentType,
            cedula: formData.cedula,
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            courseName: cert.courseName,
            graduationYear: cert.graduationYear,
            oldCedula: String(target.cedula),
            oldCourseName: cert.courseName
          }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Error de servidor');
        }
      }
      setIsEditing(null);
      resetForm();
      toast('Datos actualizados correctamente', 'success');
      refreshData(true);
    } catch (err: any) { 
      toast(err.message || 'Error al actualizar', 'error'); 
    }
    finally { setIsSaving(false); }
  };

  const handleFileUpload = async (rowId: number, file: File, studentCedula: string) => {
    if (!file) return;
    setUploadingFor(rowId);
    
    try {
      const fData = new FormData();
      fData.append('id', rowId.toString());
      fData.append('file', file);

      const res = await fetch('/api/admin/certificates/upload', {
        method: 'POST',
        body: fData,
      });

      const result = await res.json();

      if (res.ok) {
        toast('¡Vínculo exitoso!', 'success');
        refreshData(true);
      } else {
        toast(`Error: ${result.error || 'Falla en la subida'}`, 'error');
      }
    } catch { 
       toast('Error fatal de red', 'error'); 
    } finally { 
       setUploadingFor(null); 
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-black">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
         <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
            <div className="md:col-span-2 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                  placeholder="Buscar por cédula, nombre, apellido..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-50 outline-none font-bold shadow-sm"
                />
            </div>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl outline-none font-bold text-sm">
               <option value="">Todos los Estados</option>
               <option value="pending">Pendientes</option>
               <option value="completed">Listos</option>
            </select>
         </div>

         <div className="flex items-center gap-4 w-full xl:w-auto">
            <div className="hidden lg:flex flex-col items-end gap-1">
               {lastSync && (
                 <div className="flex items-center gap-1.5 text-gray-400 font-bold text-[9px] uppercase tracking-widest whitespace-nowrap">
                    <Clock size={11} />
                    <span>Sincronizado: {lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                 </div>
               )}
               <button 
                 onClick={() => refreshData(false)}
                 disabled={isLoading}
                 className="flex items-center gap-1.5 text-blue-500 hover:text-blue-600 font-black text-[9px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
               >
                 <RefreshCw size={11} className={isLoading ? 'animate-spin' : ''} />
                 Actualizar Ahora
               </button>
            </div>
            <button 
              onClick={() => { resetForm(); setIsEditing('new'); }}
              className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all text-sm uppercase"
            >
              <Plus size={20} /> Nuevo Estudiante
            </button>
         </div>
      </div>

      {isLoading && students.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
           <Loader2 className="animate-spin text-blue-600 size-12" />
           <p className="text-gray-400 font-black tracking-widest uppercase text-xs">Cargando datos...</p>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase hidden sm:table-cell">Tipo</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase">Documento</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase">Estudiante</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase hidden xl:table-cell">Correo</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase text-center">Cursos</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-[11px]">
              {Array.isArray(filteredStudents) && filteredStudents.map((st) => (
                <tr key={String(st.cedula)} className="hover:bg-blue-50/10 group transition-all">
                  <td className="px-6 py-5 font-bold text-gray-400 uppercase hidden sm:table-cell">{st.documentType || 'CC'}</td>
                  <td className="px-6 py-5 font-bold text-gray-500">{String(st.cedula)}</td>
                  <td className="px-6 py-5 font-black text-gray-900 uppercase">{st.firstName} {st.lastName}</td>
                  <td className="px-6 py-5 font-bold text-gray-400 hidden xl:table-cell lowercase">{st.email || '—'}</td>
                  <td className="px-6 py-5 text-center">
                    {(() => {
                      const pendingCount = st.certificates?.filter(c => c.certificatePath === '#').length || 0;
                      const isDone = pendingCount === 0 && (st.certificates?.length || 0) > 0;
                      
                      return (
                        <button 
                          onClick={() => setSelectedStudent(st)} 
                          className={`px-4 py-2 rounded-xl font-black shadow-lg text-[10px] uppercase transition-all flex items-center justify-center gap-2 mx-auto ${isDone ? 'bg-green-600 shadow-green-100' : 'bg-blue-600 shadow-blue-100'} text-white`}
                        >
                          {isDone ? <ShieldCheck size={14} /> : null}
                          {isDone ? 'Listo' : `Gestionar (${pendingCount})`}
                        </button>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleEditStudent(st)} className="p-3 text-blue-500 hover:bg-blue-50 rounded-2xl" title="Editar datos"><Edit size={16} /></button>
                      <button 
                        onClick={() => handleDeleteStudent(String(st.cedula))}
                        disabled={deletingCedula === String(st.cedula)}
                        className="p-3 text-red-500 hover:bg-red-50 rounded-2xl disabled:opacity-40" title="Eliminar"
                      >
                        {deletingCedula === String(st.cedula) ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!filteredStudents || filteredStudents.length === 0) && (
            <div className="py-20 text-center">
               <AlertCircle className="mx-auto text-gray-200 mb-4" size={48} />
               <p className="text-gray-400 font-bold">Sin registros para mostrar.</p>
            </div>
          )}
        </div>
      )}

      {/* ═══ MODAL: Gestionar Certificados ═══ */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in duration-300">
              <div className="bg-gray-900 p-8 text-white flex justify-between items-center">
                 <div>
                    <h3 className="text-2xl font-black leading-none">{selectedStudent.firstName} {selectedStudent.lastName}</h3>
                    <p className="text-blue-400 text-[10px] font-black tracking-widest mt-2 uppercase">{selectedStudent.documentType} {selectedStudent.cedula} · {selectedStudent.email || 'Sin correo'}</p>
                 </div>
                 <div className="flex items-center gap-2">
                    <button onClick={() => handleEditStudent(selectedStudent)} className="p-4 hover:bg-blue-500 rounded-2xl transition-all" title="Editar datos"><Edit size={20} /></button>
                    <button onClick={() => setSelectedStudent(null)} className="p-4 hover:bg-red-500 rounded-2xl transition-all"><X size={24} /></button>
                 </div>
              </div>

              <div className="p-10 overflow-y-auto space-y-10 bg-gray-50/50 flex-1">
                 <div className="space-y-4">
                    {selectedStudent.certificates?.map((cert) => {
                      const inputId = `f-id-${cert.id}`;
                      return (
                        <div key={cert.id} className="flex flex-col md:flex-row items-center justify-between p-7 bg-white border border-gray-100 rounded-[2.5rem] transition-all gap-8">
                           <div className="flex items-center gap-6">
                              <div className="size-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600"><GraduationCap size={32} /></div>
                              <div>
                                 <h6 className="font-black text-gray-900 text-xl uppercase leading-none mb-1">{cert.courseName}</h6>
                                 <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{cert.graduationYear}</p>
                              </div>
                           </div>

                           <div className="flex items-center gap-3 w-full md:w-auto">
                              <input type="file" id={inputId} hidden accept=".pdf" onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(cert.id, file, String(selectedStudent.cedula));
                              }} />
                              
                               {cert.certificatePath === '#' ? (
                                  <label 
                                    htmlFor={inputId}
                                    className={`flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-5 bg-orange-600 text-white rounded-2xl font-black text-[10px] tracking-widest uppercase cursor-pointer hover:bg-orange-700 transition-all ${uploadingFor === cert.id ? 'opacity-50 pointer-events-none' : ''}`}
                                  >
                                    {uploadingFor === cert.id ? <Loader2 className="animate-spin" size={16} /> : <UploadCloud size={16} />}
                                    SUBIR PDF
                                  </label>
                               ) : (
                                  <div className="flex-1 md:flex-none flex items-center gap-3">
                                     <button 
                                       onClick={() => setPreviewUrl(getDrivePreviewUrl(cert.certificatePath!))}
                                       className="flex-1 flex items-center justify-center gap-3 px-8 py-5 bg-green-600 text-white rounded-2xl font-black text-[10px] shadow-lg shadow-green-50 uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95"
                                     >
                                        <Eye size={16} /> Ver
                                     </button>
                                     <a 
                                       href={getDriveDownloadUrl(cert.certificatePath!)} 
                                       target="_blank" 
                                       rel="noreferrer" 
                                       className="p-5 bg-blue-50 text-blue-600 rounded-2xl transition-all hover:bg-blue-100"
                                       title="Descargar PDF"
                                     >
                                        <Download size={18} />
                                     </a>
                                  </div>
                               )}
                               {(selectedStudent.certificates?.length || 0) > 1 && (
                                 <button 
                                   onClick={() => handleDeleteCertificate(cert.id)} 
                                   disabled={deletingCertId === cert.id} 
                                   className="p-5 bg-red-50 text-red-500 rounded-2xl transition-all disabled:opacity-40 hover:bg-red-100"
                                   title="Eliminar este curso"
                                 >
                                   {deletingCertId === cert.id ? <Loader2 className="animate-spin" size={20} /> : <Trash2 size={20} />}
                                 </button>
                               )}
                           </div>
                        </div>
                      );
                    })}
                 </div>

                 <div className="p-8 bg-blue-50/50 rounded-[2.5rem] border border-blue-100 flex flex-col md:flex-row items-end gap-4">
                    <div className="flex-1 w-full space-y-1">
                       <input value={formData.courseName} onChange={e => setFormData({...formData, courseName: e.target.value})} className="w-full px-5 py-4 bg-white rounded-2xl font-bold outline-none text-sm" placeholder="Nombre del Curso" />
                    </div>
                    <div className="w-full md:w-32 space-y-1">
                       <input type="number" value={formData.graduationYear} onChange={e => setFormData({...formData, graduationYear: e.target.value})} className="w-full px-5 py-4 bg-white rounded-2xl font-bold outline-none text-sm" placeholder="Año" />
                    </div>
                    <button 
                      disabled={addingCourse || !formData.courseName}
                      onClick={async () => {
                         setAddingCourse(true);
                         try {
                           const tempData = {
                             ...formData, 
                             cedula: String(selectedStudent.cedula), 
                             documentType: String(selectedStudent.documentType), 
                             firstName: String(selectedStudent.firstName), 
                             lastName: String(selectedStudent.lastName),
                             email: String(selectedStudent.email || '')
                           };
                           const res = await fetch('/api/admin/students', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(tempData)});
                           if (!res.ok) throw new Error('Error de servidor');
                           setFormData(p => ({...p, courseName: '', graduationYear: ''}));
                           toast('Curso añadido correctamente', 'success');
                           refreshData(true);
                         } catch { toast('Error al añadir curso', 'error'); }
                         finally { setAddingCourse(false); }
                      }} 
                      className="px-10 py-4 bg-blue-600 text-white font-black rounded-2xl text-[10px] tracking-widest uppercase shadow-xl shadow-blue-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {addingCourse ? <Loader2 className="animate-spin" size={14} /> : null}
                      {addingCourse ? 'Añadiendo...' : 'Añadir'}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* ═══ MODAL: Nuevo / Editar Estudiante (Todos los campos) ═══ */}
      {isEditing && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-0 md:p-4">
           <div className="bg-white w-full h-full md:h-auto md:max-w-2xl md:rounded-[3.5rem] shadow-2xl p-8 md:p-12 overflow-y-auto animate-in zoom-in duration-300">
              <div className="flex items-center justify-between mb-10">
                 <h4 className="text-2xl md:text-3xl font-black">{isEditing === 'new' ? 'Nuevo Estudiante' : 'Editar Estudiante'}</h4>
                 <button onClick={() => { setIsEditing(null); resetForm(); }} className="p-4 bg-red-50 text-red-500 rounded-3xl"><X size={28} /></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 {/* Tipo Documento */}
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Tipo Documento</label>
                    <select 
                      value={formData.documentType} 
                      onChange={e => setFormData({...formData, documentType: e.target.value})} 
                      className="w-full px-5 py-4 bg-gray-100 rounded-2xl font-bold outline-none text-sm"
                    >
                      <option value="CC">CC - Cédula de Ciudadanía</option>
                      <option value="CE">CE - Cédula de Extranjería</option>
                      <option value="PPT">PPT - Permiso de Protección</option>
                      <option value="PPN">PPN - Pasaporte</option>
                    </select>
                 </div>

                 {/* Documento */}
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Documento *</label>
                    <input 
                      placeholder="Ej: 1098765432" 
                      value={formData.cedula} 
                      onChange={e => setFormData({...formData, cedula: e.target.value})} 
                      className="w-full px-5 py-4 bg-gray-100 rounded-2xl font-bold outline-none text-sm"
                      disabled={isEditing !== 'new'}
                    />
                 </div>

                 {/* Nombres */}
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Nombres *</label>
                    <input 
                      placeholder="Ej: Carlos Andrés" 
                      value={formData.firstName} 
                      onChange={e => setFormData({...formData, firstName: e.target.value})} 
                      className="w-full px-5 py-4 bg-gray-100 rounded-2xl font-bold outline-none text-sm"
                    />
                 </div>

                 {/* Apellidos */}
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Apellidos</label>
                    <input 
                      placeholder="Ej: Ramírez López" 
                      value={formData.lastName} 
                      onChange={e => setFormData({...formData, lastName: e.target.value})} 
                      className="w-full px-5 py-4 bg-gray-100 rounded-2xl font-bold outline-none text-sm"
                    />
                 </div>

                 {/* Correo */}
                 <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Correo Electrónico</label>
                    <input 
                      type="email"
                      placeholder="Ej: carlos@email.com" 
                      value={formData.email} 
                      onChange={e => setFormData({...formData, email: e.target.value})} 
                      className="w-full px-5 py-4 bg-gray-100 rounded-2xl font-bold outline-none text-sm"
                    />
                 </div>

                 {/* Curso */}
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Curso *</label>
                    <input 
                      placeholder="Ej: Matemáticas" 
                      value={formData.courseName} 
                      onChange={e => setFormData({...formData, courseName: e.target.value})} 
                      className="w-full px-5 py-4 bg-gray-100 rounded-2xl font-bold outline-none text-sm"
                      disabled={isEditing !== 'new'}
                    />
                 </div>

                 {/* Año */}
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Año *</label>
                    <input 
                      type="number"
                      placeholder="Ej: 2024" 
                      value={formData.graduationYear} 
                      onChange={e => setFormData({...formData, graduationYear: e.target.value})} 
                      className="w-full px-5 py-4 bg-gray-100 rounded-2xl font-bold outline-none text-sm"
                      disabled={isEditing !== 'new'}
                    />
                 </div>
              </div>

              <div className="mt-10">
                 <button 
                   onClick={isEditing === 'new' ? handleSaveRecord : handleUpdateStudent} 
                   disabled={isSaving}
                   className="w-full py-5 bg-blue-600 text-white font-black rounded-[2rem] shadow-2xl shadow-blue-200 uppercase tracking-widest text-sm hover:bg-blue-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                   {isSaving ? 'Guardando...' : (isEditing === 'new' ? 'Registrar Estudiante' : 'Guardar Cambios')}
                 </button>
              </div>
           </div>
        </div>
      )}
      {/* Preview Modal (Reused from Main page) */}
      {previewUrl && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
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
    </div>
  );
}
