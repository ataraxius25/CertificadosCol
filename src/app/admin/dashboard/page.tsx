"use client";

import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/admin/Sidebar';
import { Header } from '@/components/admin/Header';
import { StudentsView } from '@/components/admin/StudentsView';
import { UploadView } from '@/components/admin/UploadView';
import { ReportsView } from '@/components/admin/ReportsView';
import { Student } from '@/types';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('students');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Master Sync State
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const fetchMasterData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await fetch('/api/admin/students');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setStudents(data);
          setLastSync(new Date());
        }
      }
    } catch (error) {
      console.error('Master Sync Error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMasterData();
  }, [fetchMasterData]);

  return (
    <div className="h-screen bg-[#F8FAFC] flex flex-col md:flex-row relative overflow-hidden">
      
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden text-black">
        <Header 
          activeTab={activeTab}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />

        {/* Dynamic Content - Mantener montados para evitar re-fetch costosos */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className={activeTab === 'students' ? 'block' : 'hidden'}>
            <StudentsView 
              students={students} 
              isLoading={isLoading} 
              lastSync={lastSync}
              refreshData={fetchMasterData} 
            />
          </div>
          <div className={activeTab === 'upload' ? 'block' : 'hidden'}>
            <UploadView refreshData={fetchMasterData} />
          </div>
          <div className={activeTab === 'reports' ? 'block' : 'hidden'}>
            <ReportsView 
              students={students} 
              isLoading={isLoading}
              lastSync={lastSync}
              refreshData={fetchMasterData}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
