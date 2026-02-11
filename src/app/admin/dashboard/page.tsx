"use client";

import { useState } from 'react';
import { Sidebar } from '@/components/admin/Sidebar';
import { Header } from '@/components/admin/Header';
import { StudentsView } from '@/components/admin/StudentsView';
import { UploadView } from '@/components/admin/UploadView';
import { ReportsView } from '@/components/admin/ReportsView';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('students');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="h-screen bg-[#F8FAFC] flex flex-col md:flex-row relative overflow-hidden">
      
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header 
          activeTab={activeTab}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />

        {/* Dynamic Content */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          {activeTab === 'students' && <StudentsView />}
          {activeTab === 'upload' && <UploadView />}
          {activeTab === 'reports' && <ReportsView />}
        </div>
      </main>
    </div>
  );
}
