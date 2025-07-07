import React, { useState } from 'react';
import { Menu, LogOut, Bell, User, Power } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ProfileModal } from '../Profile/ProfileModal';

interface HeaderProps {
  onToggleSidebar: () => void;
  onToggleMobileMenu?: () => void;
}

export function Header({ onToggleSidebar, onToggleMobileMenu }: HeaderProps) {
  const { profile, logout } = useAuth();
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const handleSignOut = async () => {
    await logout();
    setShowLogoutMenu(false);
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-3 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
            {/* Desktop sidebar toggle */}
            <button
              onClick={onToggleSidebar}
              className="hidden lg:block p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            {/* Mobile menu toggle */}
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                {profile?.activity?.name || 'Tableau de bord'}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 truncate">
                {new Date().toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {profile?.first_name} {profile?.last_name}
                </p>
                <p className="text-xs text-gray-500 capitalize">{profile?.role}</p>
              </div>
              
              <button
                onClick={() => setShowProfileModal(true)}
                className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 hover:bg-blue-700 transition-colors"
                title="Mon profil"
              >
                <User className="h-4 w-4 text-white" />
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowLogoutMenu(!showLogoutMenu)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Se déconnecter"
                >
                  <LogOut className="h-5 w-5 text-gray-600" />
                </button>

                {showLogoutMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <button
                      onClick={handleSignOut}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Se déconnecter</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Overlay pour fermer le menu */}
        {showLogoutMenu && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowLogoutMenu(false)}
          />
        )}
      </header>

      {/* Modal de profil */}
      {showProfileModal && (
        <ProfileModal onClose={() => setShowProfileModal(false)} />
      )}
    </>
  );
}