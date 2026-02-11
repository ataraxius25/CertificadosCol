import { useState, useEffect } from 'react';
import { Users, Database, AlertCircle, Check, Loader2 } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { ReportData } from '@/types';

export function ReportsView() {
  const [reports, setReports] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/admin/reports');
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
        <AlertCircle className="w-16 h-16 text-red-200 mx-auto mb-4" />
        <p className="text-gray-500 font-bold">Error al cargar reportes</p>
      </div>
    );
  }

  const { summary, certsByYear, topCourses, studentsByDocType } = reports;

  return (
    <div className="space-y-6">
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
