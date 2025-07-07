import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Warehouse,
  Package2,
  Users,
  Calculator,
  Receipt,
  Settings,
  ChevronRight,
  Building2,
  X
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface SidebarProps {
  currentModule: string;
  onModuleChange: (module: string) => void;
  isCollapsed: boolean;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

const modules = [
  { id: 'dashboard', name: 'Tableau de bord', icon: LayoutDashboard },
  { id: 'sales', name: 'Ventes', icon: ShoppingCart },
  { id: 'purchases', name: 'Achats', icon: Package },
  { id: 'stock', name: 'Stock', icon: Warehouse },
  { id: 'products', name: 'Produits', icon: Package2 },
  { id: 'crm', name: 'CRM', icon: Users },
  { id: 'accounting', name: 'Comptabilité', icon: Calculator },
  { id: 'expenses', name: 'Dépenses', icon: Receipt },
  { id: 'settings', name: 'Paramètres', icon: Settings },
];

export function Sidebar({ currentModule, onModuleChange, isCollapsed, isMobileOpen, onMobileClose }: SidebarProps) {
  const { profile, canAccessModule } = useAuth();

  const handleModuleClick = (moduleId: string) => {
    onModuleChange(moduleId);
    if (onMobileClose) {
      onMobileClose();
    }
  };

  return (
    <aside className={`bg-slate-900 text-white transition-all duration-300 flex flex-col
      ${isCollapsed ? 'w-16' : 'w-64'}
      lg:relative lg:translate-x-0
      ${isMobileOpen ? 'fixed inset-y-0 left-0 z-50 translate-x-0' : 'fixed inset-y-0 left-0 z-50 -translate-x-full lg:translate-x-0'}
    `}>
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src="/icone-equerre.png" alt="Equerre" className="h-12 w-auto" />
            {!isCollapsed && (
              <div className="min-w-0">
                <h1 className="font-bold text-lg truncate">EQUERRE ERP</h1>
                <p className="text-xs text-slate-400 truncate">{profile?.company?.name}</p>
              </div>
            )}
          </div>
          {/* Mobile close button */}
          {onMobileClose && (
            <button
              onClick={onMobileClose}
              className="lg:hidden p-1 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* User Info */}
      {!isCollapsed && profile && (
        <div className="p-4 border-b border-slate-700">
          <div className="text-sm">
            <p className="font-medium truncate">{profile.first_name} {profile.last_name}</p>
            <p className="text-slate-400 capitalize truncate">{profile.role}</p>
            {profile.activity && (
              <p className="text-xs text-slate-500 truncate">{profile.activity.name}</p>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {modules.map((module) => {
            const Icon = module.icon;
            const isActive = currentModule === module.id;
            const hasAccess = canAccessModule(module.id);

            if (!hasAccess) return null;

            return (
              <li key={module.id}>
                <button
                  onClick={() => handleModuleClick(module.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  title={isCollapsed ? module.name : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 truncate">{module.name}</span>
                      {isActive && <ChevronRight className="h-4 w-4 flex-shrink-0" />}
                    </>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}