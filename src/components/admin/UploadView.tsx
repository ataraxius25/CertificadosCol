import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ShieldCheck,
  FileUp,
  X,
  Database,
  FileBox,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { useToast } from '@/components/ui/ToastContext';
import { downloadExcelTemplate } from '@/lib/utils/excel-helpers';

interface UploadingFile {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

interface UploadViewProps {
  refreshData: (silent?: boolean) => Promise<void>;
}

export function UploadView({ refreshData }: UploadViewProps) {
  const [activeTab, setActiveTab] = useState<'database' | 'certificates'>('database');
  const [isProcessing, setIsProcessing] = useState(false);
  const [dbFile, setDbFile] = useState<File | null>(null);
  const [pdfFiles, setPdfFiles] = useState<UploadingFile[]>([]);
  const { toast } = useToast();

  // --- LÓGICA DE CARGA DE BASE DE DATOS (EXCEL) ---
  const onDropDB = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) setDbFile(acceptedFiles[0]);
  }, []);

  const { getRootProps: getRootDB, getInputProps: getInputDB, isDragActive: isDragDB } = useDropzone({
    onDrop: onDropDB,
    multiple: false,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    }
  });

  const handleDBUpload = async () => {
    if (!dbFile) return;
    setIsProcessing(true);
    const formData = new FormData();
    formData.append('file', dbFile);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const result = await res.json();
      if (res.ok) {
        toast(`¡Éxito! ${result.synced} de ${result.total} registros sincronizados.`, 'success');
        setDbFile(null);
        refreshData(true);
      } else {
        toast(result.error || 'Error al procesar el Excel', 'error');
      }
    } catch (error) {
      toast('Error de conexión', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // --- LÓGICA DE CARGA DE CERTIFICADOS (PDF) ---
  const onDropPDF = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({ file, status: 'pending' as const }));
    setPdfFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps: getRootPDF, getInputProps: getInputPDF, isDragActive: isDragPDF } = useDropzone({
    onDrop: onDropPDF,
    accept: { 'application/pdf': ['.pdf'] }
  });

  const uploadPDFFiles = async () => {
    if (pdfFiles.length === 0) return;
    const pending = pdfFiles.filter(f => f.status === 'pending');
    if (pending.length === 0) return;

    setIsProcessing(true);

    // PASO 1: Marcar todos como "subiendo"
    setPdfFiles(prev => prev.map(f => f.status === 'pending' ? { ...f, status: 'uploading' } : f));

    try {
      // PASO 2: Convertir TODOS los archivos a base64 localmente (sin llamadas a la API)
      const filesData: { fileName: string; fileBase64: string }[] = [];

      for (const item of pending) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(item.file);
        });
        filesData.push({ fileName: item.file.name, fileBase64: base64 });
      }

      // PASO 3: UNA SOLA llamada a la API con TODOS los archivos
      const res = await fetch('/api/admin/certificates/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'BATCH_UPLOAD', files: filesData }),
      });

      const resData = await res.json().catch(() => ({}));

      if (res.ok || resData.success) {
        // Marcar todos como éxito
        setPdfFiles(prev => prev.map(f => f.status === 'uploading' ? { ...f, status: 'success' } : f));
        toast(`${filesData.length} archivos subidos en una sola operación`, 'success');
        refreshData(true);
      } else {
        setPdfFiles(prev => prev.map(f => f.status === 'uploading' ? { ...f, status: 'error', error: resData.error || 'Error' } : f));
        toast('Error al procesar el lote', 'error');
      }
    } catch {
      setPdfFiles(prev => prev.map(f => f.status === 'uploading' ? { ...f, status: 'error', error: 'Error de red' } : f));
      toast('Error de conexión', 'error');
    }

    setIsProcessing(false);

    // Limpiar la cola automáticamente después de 3 segundos
    setTimeout(() => {
      setPdfFiles([]);
    }, 3000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 text-black">
      {/* Tabs Professional Switch */}
      <div className="flex bg-gray-100 p-1.5 rounded-[2rem] w-full max-w-md mx-auto">
        <button 
          onClick={() => setActiveTab('database')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'database' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <Database size={16} /> Base de Datos
        </button>
        <button 
          onClick={() => setActiveTab('certificates')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'certificates' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <FileBox size={16} /> Archivos PDF
        </button>
      </div>

      {activeTab === 'database' ? (
        <div className="space-y-8">
          <div className="bg-white p-8 md:p-12 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-8">
            <div className="size-20 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 shrink-0">
              <Database size={40} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-gray-900 leading-tight">Cargar Registros de Estudiantes</h2>
              <p className="text-gray-500 font-medium mt-2">Importa tu archivo Excel (.xlsx) para crear o actualizar el registro de graduados en el sistema.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div {...getRootDB()} className={`relative h-80 rounded-[2.5rem] border-4 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center p-8 text-center ${isDragDB ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
              <input {...getInputDB()} />
              <div className="size-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-blue-100">
                 <FileUp size={32} />
              </div>
              <p className="text-lg font-black text-gray-900 leading-tight">{dbFile ? dbFile.name : 'Arrastra tu Excel aquí'}</p>
              <p className="text-xs text-gray-400 font-bold mt-2 uppercase tracking-widest">Formatos admitidos: .xlsx, .xls, .csv</p>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-gray-900 uppercase text-xs tracking-widest">Instrucciones de Carga</h4>
                    <button 
                      onClick={downloadExcelTemplate}
                      className="flex items-center gap-2 text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest transition-all bg-blue-50 px-3 py-1.5 rounded-full"
                    >
                      <FileSpreadsheet size={14} />
                      Bajar Plantilla
                    </button>
                  </div>
                  <ul className="text-sm text-gray-500 space-y-2 font-medium">
                     <li className="flex gap-2"><div className="size-2 bg-blue-500 rounded-full mt-1.5 shrink-0" /> Asegúrate que el Excel tenga los encabezados: Tipo Documento, Documento, Nombres, Apellidos, Correo, Curso, Año.</li>
                     <li className="flex gap-2"><div className="size-2 bg-blue-500 rounded-full mt-1.5 shrink-0" /> El archivo no debe superar los 5MB para una sincronización óptima.</li>
                  </ul>
               </div>
               <button 
                 onClick={handleDBUpload}
                 disabled={!dbFile || isProcessing}
                 className="w-full py-6 mt-8 bg-blue-600 text-white rounded-[1.8rem] font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-blue-100 disabled:opacity-30 transition-all flex items-center justify-center gap-3"
               >
                 {isProcessing ? <Loader2 className="animate-spin" /> : 'Sincronizar Estudiantes'}
               </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white p-8 md:p-12 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-8">
            <div className="size-20 bg-orange-50 rounded-3xl flex items-center justify-center text-orange-600 shrink-0">
              <UploadCloud size={40} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-gray-900 leading-tight">Carga Masiva de Certificados</h2>
              <p className="text-gray-500 font-medium mt-2">Sube los archivos PDF de los certificados. El sistema los vinculará automáticamente a cada graduado.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
             <div className="xl:col-span-1 space-y-4">
                <div {...getRootPDF()} className={`h-80 rounded-[2.5rem] border-4 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center p-8 text-center ${isDragPDF ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                  <input {...getInputPDF()} />
                  <UploadCloud size={48} className="text-orange-500 mb-4" />
                  <p className="font-black text-gray-900 uppercase text-xs tracking-widest">Suelte los PDFs aquí</p>
                </div>
                <button 
                  onClick={uploadPDFFiles}
                  disabled={isProcessing || pdfFiles.filter(f => f.status === 'pending').length === 0}
                  className="w-full py-6 bg-black text-white rounded-[1.8rem] font-black text-xs uppercase tracking-widest shadow-2xl disabled:opacity-30 flex items-center justify-center gap-3"
                >
                  {isProcessing ? <Loader2 className="animate-spin" /> : 'Subir Archivos a Drive'}
                </button>
             </div>

             <div className="xl:col-span-2 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[450px]">
                <div className="p-5 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                   <h3 className="text-[10px] font-black text-gray-400 tracking-widest uppercase">Archivos en cola ({pdfFiles.length})</h3>
                   <button onClick={() => setPdfFiles([])} className="text-red-500 font-black text-[10px] uppercase">Borrar Lista</button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                   {pdfFiles.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-gray-300 font-bold uppercase text-[10px]">Pila de carga vacía</div>
                   ) : (
                      pdfFiles.map((f, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                           <div className="flex items-center gap-3 overflow-hidden">
                              <FileText className="text-gray-400 shrink-0" size={18} />
                              <span className="text-xs font-black text-gray-900 truncate">{f.file.name}</span>
                              {f.status === 'success' && <CheckCircle2 className="text-green-500 shrink-0" size={16} />}
                              {f.status === 'error' && <XCircle className="text-red-500 shrink-0" size={16} />}
                           </div>
                           {f.status === 'uploading' && <Loader2 className="animate-spin text-blue-500" size={16} />}
                        </div>
                      ))
                   )}
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
