import { useState, useRef } from 'react';
import { 
  FileSpreadsheet, 
  FileUp, 
  Check, 
  Database, 
  ShieldCheck, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';
import { useToast } from '@/components/ui/ToastContext';

export function UploadView() {
  const { toast } = useToast();
  const [syncStatus, setSyncStatus] = useState<{
    totalStudents: number;
    synced: number;
    errors: { row: number; error: string; data: Record<string, unknown> }[];
  } | null>(null);
  const [pdfStatus, setPdfStatus] = useState<{
    processed: number;
    errors: string[];
  } | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPdfFiles, setSelectedPdfFiles] = useState<FileList | null>(null);

  const excelInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setSelectedPdfFiles(null);
      setSyncStatus(null);
      setPdfStatus(null);
      if (pdfInputRef.current) pdfInputRef.current.value = '';
    }
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedPdfFiles(e.target.files);
      setSelectedFile(null);
      setPdfStatus(null);
      setSyncStatus(null);
      if (excelInputRef.current) excelInputRef.current.value = '';
    }
  };

  const handleProcess = async () => {
    if (!selectedFile && !selectedPdfFiles) {
      toast('Seleccione un archivo Excel o Certificados PDF.', 'error');
      return;
    }

    setIsProcessing(true);
    setSyncStatus(null);
    setPdfStatus(null);

    // --- EXCEL UPLOAD ---
    if (selectedFile) {
      const formData = new FormData();
      formData.append('file', selectedFile);

      try {
        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          setSyncStatus({
            totalStudents: data.total,
            synced: data.synced,
            errors: data.errors
          });
          if (data.synced > 0) toast(`Se importaron ${data.synced} estudiantes correctamente.`, 'success');
          
          setSelectedFile(null);
          if (excelInputRef.current) excelInputRef.current.value = '';
          
        } else {
          const err = await res.json();
          toast(err.error || 'Error en la carga de Excel', 'error');
        }
      } catch (error) {
        toast('Error de conexión enviando Excel', 'error');
      }
    } 
    
    // --- PDF UPLOAD ---
    else if (selectedPdfFiles) {
      const formData = new FormData();
      for (let i = 0; i < selectedPdfFiles.length; i++) {
        formData.append('files', selectedPdfFiles[i]);
      }

      try {
        const res = await fetch('/api/admin/upload-pdf', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          setPdfStatus({
            processed: data.processed,
            errors: data.errors
          });
          toast(`Proceso finalizado: ${data.processed} certificados subidos.`, 'success');

          setSelectedPdfFiles(null);
          if (pdfInputRef.current) pdfInputRef.current.value = '';

        } else {
          const err = await res.json();
          toast(err.error || 'Error subiendo PDFs', 'error');
        }
      } catch (error) {
        toast('Error de conexión subiendo PDFs', 'error');
      }
    }

    setIsProcessing(false);
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      {/* Excel & Template Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-sm">
        <div className="hidden lg:block">
          <h4 className="text-xl font-black text-gray-900">Preparación de Datos</h4>
          <p className="text-sm text-gray-500 font-medium">Use nuestra plantilla oficial con columna de Tipo Documento (CC, CE, PPT, PPN).</p>
        </div>
        <a 
          href="/template.xlsx" 
          download
          style={{ backgroundColor: '#3B82F6' }}
          className="w-full lg:w-auto flex items-center justify-center gap-3 px-8 py-4 text-white rounded-2xl font-black text-xs md:text-sm hover:bg-blue-700 active:scale-95 transition-all shadow-xl shadow-blue-200 uppercase tracking-widest no-underline"
        >
          <FileSpreadsheet size={18} className="text-white" />
          <span className="text-white">DESCARGAR PLANTILLA</span>
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Excel Upload */}
        <div className={`bg-white p-6 md:p-8 rounded-[2rem] border transition-all space-y-6 shadow-sm ${selectedFile ? 'border-green-500 ring-2 ring-green-100' : 'border-gray-100'}`}>
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-green-50 rounded-2xl flex items-center justify-center">
              <FileSpreadsheet className="text-green-600 w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h4 className="text-base md:text-lg font-black text-gray-900">Datos (.xlsx)</h4>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Paso 1: Lista de alumnos</p>
            </div>
          </div>
          
          <label className="block w-full border-2 border-dashed border-gray-100 rounded-[2rem] p-8 md:p-12 text-center cursor-pointer hover:bg-green-50/30 hover:border-green-100 transition-all relative">
            <input 
              ref={excelInputRef}
              type="file" 
              className="hidden" 
              accept=".xlsx, .xls" 
              onChange={handleFileChange} 
            />
            {selectedFile ? (
              <div className="animate-in fade-in zoom-in">
                <Check className="w-10 h-10 md:w-12 md:h-12 text-green-500 mx-auto mb-4" />
                <p className="text-sm font-bold text-gray-900">{selectedFile.name}</p>
                <p className="text-[10px] md:text-xs text-green-600 font-bold mt-1">Listo para subir</p>
              </div>
            ) : (
              <>
                <FileUp className="w-10 h-10 md:w-12 md:h-12 text-gray-200 mx-auto mb-4" />
                <p className="text-sm font-bold text-gray-900">Subir .xlsx</p>
                <p className="text-[10px] md:text-xs text-gray-400 font-medium mt-1">Arrastre o haga clic</p>
              </>
            )}
          </label>
        </div>

        {/* PDF Upload */}
        <div className={`bg-white p-6 md:p-8 rounded-[2rem] border transition-all space-y-6 shadow-sm ${selectedPdfFiles ? 'border-orange-500 ring-2 ring-orange-100' : 'border-gray-100'}`}>
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-50 rounded-2xl flex items-center justify-center">
              <FileUp className="text-orange-600 w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h4 className="text-base md:text-lg font-black text-gray-900">Certificados (.pdf)</h4>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Paso 2: Carga masiva PDF</p>
            </div>
          </div>
          
          <label className="block w-full border-2 border-dashed border-gray-100 rounded-[2rem] p-8 md:p-12 text-center cursor-pointer hover:bg-orange-50/30 hover:border-orange-100 transition-all relative">
            <input 
              ref={pdfInputRef}
              type="file" 
              className="hidden" 
              multiple 
              accept=".pdf" 
              onChange={handlePdfChange} 
            />
            {selectedPdfFiles && selectedPdfFiles.length > 0 ? (
              <div className="animate-in fade-in zoom-in">
                <Check className="w-10 h-10 md:w-12 md:h-12 text-orange-500 mx-auto mb-4" />
                <p className="text-sm font-bold text-gray-900">{selectedPdfFiles.length} Archivos</p>
                <p className="text-[10px] md:text-xs text-orange-600 font-bold mt-1">Listos para subir</p>
              </div>
            ) : (
              <>
                <Database className="w-10 h-10 md:w-12 md:h-12 text-gray-200 mx-auto mb-4" />
                <p className="text-sm font-bold text-gray-900">Subir PDF(s)</p>
                <p className="text-[10px] md:text-xs text-gray-400 font-medium mt-1">Seleccione uno o varios</p>
              </>
            )}
          </label>
        </div>
      </div>

      {/* Process Button */}
      <div className="flex justify-center py-4">
        <button 
          onClick={handleProcess}
          disabled={isProcessing || (!selectedFile && !selectedPdfFiles)}
          className="w-full md:w-auto px-12 py-5 bg-blue-600 text-white rounded-2xl font-black text-base md:text-lg shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale"
        >
          {isProcessing ? (
            <>
              <Loader2 className="animate-spin" size={24} />
              PROCESANDO...
            </>
          ) : (
            <>
              <ShieldCheck size={24} />
              {selectedPdfFiles ? 'SUBIR CERTIFICADOS' : 'IMPORTAR ESTUDIANTES'}
            </>
          )}
        </button>
      </div>

      {/* Excel Results */}
      {syncStatus && (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-gray-900 p-6 md:p-8 text-white flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4 text-center md:text-left">
              <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center font-black text-xl shrink-0">
                 {syncStatus.totalStudents > 0 ? Math.round((syncStatus.synced / syncStatus.totalStudents) * 100) : 0}%
              </div>
              <div>
                <h5 className="text-lg md:text-xl font-black tracking-tight">Reporte de Carga Excel</h5>
                <p className="text-green-300 text-[10px] md:text-xs font-bold uppercase tracking-widest">Proceso completado</p>
              </div>
            </div>
            
            <div className="flex gap-3 w-full md:w-auto">
               <div className="flex-1 md:flex-none bg-white/10 px-4 md:px-6 py-3 rounded-2xl backdrop-blur-md">
                 <p className="text-[8px] font-black text-blue-200 uppercase tracking-widest mb-1">Total Filas</p>
                 <p className="text-base font-black">{syncStatus.totalStudents}</p>
               </div>
               <div className="flex-1 md:flex-none bg-green-500/20 px-4 md:px-6 py-3 rounded-2xl backdrop-blur-md border border-green-500/30">
                 <p className="text-[8px] font-black text-green-200 uppercase tracking-widest mb-1">Cargados</p>
                 <p className="text-base font-black">{syncStatus.synced}</p>
               </div>
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-6">
            {syncStatus.errors.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle size={18} />
                  <h6 className="font-black uppercase tracking-widest text-[10px]">Errores Detectados:</h6>
                </div>
                <div className="bg-red-50 rounded-xl border border-red-100 overflow-hidden">
                   <div className="max-h-60 overflow-y-auto">
                     <table className="w-full text-left border-collapse">
                       <thead className="bg-red-100/50 text-[10px] uppercase tracking-widest text-red-800 font-bold sticky top-0">
                         <tr>
                           <th className="p-3">Fila</th>
                           <th className="p-3">Error</th>
                           <th className="p-3">Datos Recibidos</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-red-100">
                         {syncStatus.errors.map((item, i) => (
                           <tr key={i} className="hover:bg-red-100/30 transition-colors">
                             <td className="p-3 align-top">
                               <span className="inline-flex items-center justify-center px-2 py-1 bg-white border border-red-200 rounded-md text-xs font-black text-red-700">
                                 #{item.row}
                               </span>
                             </td>
                             <td className="p-3 align-top text-xs font-bold text-red-700 min-w-[150px]">
                               {item.error}
                             </td>
                             <td className="p-3 align-top">
                               <code className="block text-[10px] bg-white p-2 rounded border border-red-100 text-red-600 font-mono break-all leading-relaxed whitespace-pre-wrap">
                                 {JSON.stringify(item.data, null, 2)}
                               </code>
                             </td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                </div>
              </div>
            )}
             {syncStatus && syncStatus.errors.length === 0 && (
                <div className="text-center text-green-600 font-bold p-4 bg-green-50 rounded-xl">
                   ¡Carga exitosa sin errores!
                </div>
             )}
          </div>
        </div>
      )}

      {/* PDF Results */}
      {pdfStatus && (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-gray-900 p-6 md:p-8 text-white">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center font-black text-xl shrink-0">
                 PDF
              </div>
              <div>
                <h5 className="text-lg md:text-xl font-black tracking-tight">Reporte de Certificados</h5>
                <p className="text-orange-300 text-[10px] md:text-xs font-bold uppercase tracking-widest">{pdfStatus.processed} Archivos procesados</p>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-6">
            {pdfStatus.errors.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle size={18} />
                  <h6 className="font-black uppercase tracking-widest text-[10px]">Errores:</h6>
                </div>
                <div className="bg-red-50 p-4 rounded-xl border border-red-100 max-h-40 overflow-y-auto">
                   <ul className="list-disc pl-4 space-y-1">
                     {pdfStatus.errors.map((error, i) => (
                       <li key={i} className="text-xs text-red-800 font-medium">{error}</li>
                     ))}
                   </ul>
                </div>
              </div>
            )}
             {pdfStatus && pdfStatus.errors.length === 0 && (
                <div className="text-center text-green-600 font-bold p-4 bg-green-50 rounded-xl">
                   ¡Certificados subidos y vinculados exitosamente!
                </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
}
