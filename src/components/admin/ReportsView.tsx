import { useMemo, useState } from 'react';
import { RefreshCw, Users, Database, AlertCircle, Check, Loader2, Clock } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { ReportData, Student, DocumentType, SummaryStats } from '@/types';
import { useToast } from '@/components/ui/ToastContext';

interface ReportsViewProps {
  students: Student[];
  isLoading: boolean;
  lastSync: Date | null;
  refreshData: (force?: boolean) => Promise<void>;
}

export function ReportsView({ students, isLoading, lastSync, refreshData }: ReportsViewProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  
  const reports = useMemo<ReportData | null>(() => {
    if (!students || students.length === 0) return null;

    // Lógica idéntica a la API pero ejecutada en el cliente
    const summary: SummaryStats = {
      totalStudents: new Set(students.map(s => s.cedula)).size,
      totalCertificates: students.length,
      pendingCertificates: students.filter(c => c.certificatePath === '#').length,
      completedCertificates: students.filter(c => c.certificatePath !== '#').length,
    };

    // Certificados por Año
    const yearCounts: Record<number, number> = {};
    students.forEach(c => {
      const yr = Number(c.graduationYear);
      if (yr) yearCounts[yr] = (yearCounts[yr] || 0) + 1;
    });
    const certsByYear = Object.entries(yearCounts).map(([year, count]) => ({
      year: parseInt(year),
      count
    })).sort((a, b) => b.year - a.year);

    // Top Cursos
    const courseCounts: Record<string, number> = {};
    students.forEach(c => {
      if (c.courseName) courseCounts[c.courseName] = (courseCounts[c.courseName] || 0) + 1;
    });
    const topCourses = Object.entries(courseCounts)
      .map(([courseName, count]) => ({ courseName, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Distribución por Tipo de Documento
    const docCounts: Record<string, number> = {};
    students.forEach(s => {
      docCounts[s.documentType] = (docCounts[s.documentType] || 0) + 1;
    });
    const studentsByDocType = Object.entries(docCounts).map(([documentType, count]) => ({
      documentType: documentType as DocumentType,
      count
    }));

    return {
      summary,
      certsByYear,
      topCourses,
      studentsByDocType
    };
  }, [students]);

  if (isLoading && !reports) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
        <p className="text-gray-400 font-black tracking-widest uppercase text-xs">Calculando Reportes...</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!reports) {
    return (
      <div className="bg-white p-12 rounded-[2rem] border border-gray-100 text-center">
        <AlertCircle className="w-16 h-16 text-blue-200 mx-auto mb-4" />
        <p className="text-gray-500 font-black uppercase tracking-widest text-xs">No hay datos suficientes para generar reportes</p>
        <p className="text-gray-400 text-sm mt-2">Agregue estudiantes o sincronice la base de datos para ver estadísticas.</p>
        <button 
          onClick={() => refreshData(true)}
          className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase"
        >
          Sincronizar Ahora
        </button>
      </div>
    );
  }

  const { summary, certsByYear, topCourses, studentsByDocType } = reports;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData(true);
      toast('Datos actualizados al instante', 'success');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] border border-gray-100">
        <div>
          <h2 className="text-xl font-black text-gray-900">Estado del Sistema</h2>
          {lastSync && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">
              <Clock className="w-3.5 h-3.5" />
              Actualizado: {lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading || isRefreshing}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-2xl font-black text-sm transition-all active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${(isLoading || isRefreshing) ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'ACTUALIZANDO...' : 'ACTUALIZAR DATOS'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          title="Total Estudiantes"
          value={summary.totalStudents}
          icon={<Users className="w-6 h-6" />}
          color="blue"
        />
        <MetricCard
          title="Total Certificados"
          value={summary.totalCertificates}
          icon={<Database className="w-6 h-6" />}
          color="green"
        />
        <MetricCard
          title="Pendientes"
          value={summary.pendingCertificates}
          icon={<AlertCircle className="w-6 h-6" />}
          color="orange"
        />
        <MetricCard
          title="Completados"
          value={summary.completedCertificates}
          icon={<Check className="w-6 h-6" />}
          color="purple"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Certificates by Year */}
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100">
          <h3 className="text-lg font-black text-gray-900 mb-6">Certificados por Año</h3>
          <div className="space-y-3">
            {certsByYear.map((item) => (
              <div key={item.year} className="flex items-center gap-3">
                <span className="text-sm font-bold text-gray-600 w-16">{item.year}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-8 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-full flex items-center justify-end pr-3 transition-all duration-500"
                    style={{ width: `${(item.count / Math.max(...certsByYear.map((c) => (c.count || 1)))) * 100}%` }}
                  >
                    <span className="text-xs font-black text-white">{item.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Courses */}
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100">
          <h3 className="text-lg font-black text-gray-900 mb-6">Top 5 Cursos</h3>
          <div className="space-y-3">
            {topCourses.map((course, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-xs font-black text-green-600">{idx + 1}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900 truncate">{course.courseName}</p>
                </div>
                <span className="text-sm font-black text-gray-500">{course.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Document Type Distribution */}
      <div className="bg-white p-6 rounded-[2rem] border border-gray-100">
        <h3 className="text-lg font-black text-gray-900 mb-6">Distribución por Tipo de Documento</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {studentsByDocType.map((item: any) => {
            const docTypeLabels: Record<string, string> = {
              'CC': 'Cédula de Ciudadanía',
              'CE': 'Cédula de Extranjería',
              'PPT': 'Permiso por Protección Temporal',
              'PPN': 'Pasaporte',
            };
            
            return (
              <div key={item.documentType} className="text-center p-4 bg-gray-50 rounded-2xl">
                <p className="text-2xl font-black text-gray-900">{item.count}</p>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">{item.documentType}</p>
                <p className="text-[10px] font-medium text-gray-400 mt-1">{docTypeLabels[item.documentType] || item.documentType}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
