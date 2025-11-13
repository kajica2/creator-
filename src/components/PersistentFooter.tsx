import React, { useState } from 'react';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
import { Settings, User, Shield, ExternalLink, Github, Twitter, Mail, Coffee } from 'lucide-react';

interface PersistentFooterProps {
  onNavigate?: (page: string) => void;
}

export function PersistentFooter({ onNavigate }: PersistentFooterProps) {
  const { user, signOut } = useSupabaseAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);

  const handleDashboardAccess = (type: 'user' | 'admin') => {
    if (type === 'admin') {
      // Navigate to admin entrance
      window.location.href = '/?role=admin';
    } else {
      // Navigate to user dashboard
      window.location.href = '/?role=user';
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setShowUserMenu(false);
      setShowAdminMenu(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-800 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Left Section - Brand & Navigation */}
          <div className="flex items-center space-x-6">
            <div className="text-sm font-medium text-slate-300">
              KaiDjuric AI Tools
            </div>
            <nav className="hidden md:flex items-center space-x-4">
              <button
                onClick={() => onNavigate?.('home')}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                Home
              </button>
              <button
                onClick={() => onNavigate?.('tools')}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                Tools
              </button>
              <button
                onClick={() => onNavigate?.('about')}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                About
              </button>
            </nav>
          </div>

          {/* Center Section - Quick Actions */}
          <div className="hidden lg:flex items-center space-x-4">
            <a
              href="https://github.com/kajicadjuric"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white transition-colors"
            >
              <Github className="w-4 h-4" />
            </a>
            <a
              href="https://twitter.com/kajicadjuric"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white transition-colors"
            >
              <Twitter className="w-4 h-4" />
            </a>
            <a
              href="mailto:contact@kajicadjuric.com"
              className="text-slate-400 hover:text-white transition-colors"
            >
              <Mail className="w-4 h-4" />
            </a>
          </div>

          {/* Right Section - Dashboard Access */}
          <div className="flex items-center space-x-3">

            {/* User Dashboard */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-blue-600/20 border border-blue-500/30 hover:bg-blue-600/30 transition-all duration-200"
              >
                <User className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-medium text-blue-200">User</span>
              </button>

              {showUserMenu && (
                <div className="absolute bottom-full right-0 mb-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl">
                  <div className="p-2">
                    {user ? (
                      <>
                        <div className="px-3 py-2 border-b border-slate-700">
                          <p className="text-xs text-slate-400">Signed in as</p>
                          <p className="text-sm font-medium text-white truncate">{user.email}</p>
                        </div>
                        <button
                          onClick={() => handleDashboardAccess('user')}
                          className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded flex items-center space-x-2"
                        >
                          <Settings className="w-4 h-4" />
                          <span>Dashboard</span>
                        </button>
                        <button
                          onClick={handleSignOut}
                          className="w-full text-left px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-slate-700 rounded"
                        >
                          Sign Out
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleDashboardAccess('user')}
                          className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded flex items-center space-x-2"
                        >
                          <User className="w-4 h-4" />
                          <span>User Login</span>
                        </button>
                        <div className="px-3 py-2 text-xs text-slate-500">
                          Access personal tools & settings
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Admin Dashboard */}
            <div className="relative">
              <button
                onClick={() => setShowAdminMenu(!showAdminMenu)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-purple-600/20 border border-purple-500/30 hover:bg-purple-600/30 transition-all duration-200"
              >
                <Shield className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-medium text-purple-200">Admin</span>
              </button>

              {showAdminMenu && (
                <div className="absolute bottom-full right-0 mb-2 w-52 bg-slate-800 border border-slate-700 rounded-lg shadow-xl">
                  <div className="p-2">
                    <div className="px-3 py-2 border-b border-slate-700">
                      <p className="text-xs font-medium text-purple-300 flex items-center space-x-1">
                        <Shield className="w-3 h-3" />
                        <span>Admin Access</span>
                      </p>
                    </div>
                    <button
                      onClick={() => handleDashboardAccess('admin')}
                      className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded flex items-center space-x-2"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Control Panel</span>
                    </button>
                    <div className="px-3 py-2 text-xs text-slate-500">
                      System analytics & management
                    </div>
                    <div className="px-3 py-2 text-xs text-amber-400 bg-amber-500/10 rounded mt-1">
                      ⚠️ Requires authentication
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* App Access Button */}
            <button
              onClick={() => window.location.href = '?app=true'}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-emerald-600/20 border border-emerald-500/30 hover:bg-emerald-600/30 transition-all duration-200"
            >
              <Coffee className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-medium text-emerald-200 hidden sm:inline">Launch App</span>
              <ExternalLink className="w-3 h-3 text-emerald-400" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-slate-800 py-2">
          <div className="flex justify-around">
            <button
              onClick={() => onNavigate?.('home')}
              className="text-xs text-slate-400 hover:text-white transition-colors py-1"
            >
              Home
            </button>
            <button
              onClick={() => onNavigate?.('tools')}
              className="text-xs text-slate-400 hover:text-white transition-colors py-1"
            >
              Tools
            </button>
            <button
              onClick={() => onNavigate?.('about')}
              className="text-xs text-slate-400 hover:text-white transition-colors py-1"
            >
              About
            </button>
            <a
              href="https://github.com/kajicadjuric"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-400 hover:text-white transition-colors py-1"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>

      {/* Click outside to close menus */}
      {(showUserMenu || showAdminMenu) && (
        <div
          className="fixed inset-0 -z-10"
          onClick={() => {
            setShowUserMenu(false);
            setShowAdminMenu(false);
          }}
        />
      )}
    </footer>
  );
}