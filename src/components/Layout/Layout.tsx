import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
  children: React.ReactNode;
  currentModule: string;
  onModuleChange: (module: string) => void;
}

export function Layout({ children, currentModule, onModuleChange }: LayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      
      <Sidebar 
        currentModule={currentModule}
        onModuleChange={onModuleChange}
        isCollapsed={sidebarCollapsed}
        isMobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        />
        
        <main className="flex-1 overflow-auto p-3 sm:p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}