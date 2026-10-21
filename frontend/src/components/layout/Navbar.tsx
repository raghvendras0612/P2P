import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Compass,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSelectedPath } from '../../context/SelectedPathContext';

export const Navbar: React.FC = () => {
  const { profile, logout } = useAuth();
  const { selectedPath } = useSelectedPath();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/paths', label: 'My Paths', icon: Compass },
    { to: '/tests', label: 'Skill Tests', icon: ShieldCheck },
    { to: '/resume', label: 'Resume', icon: FileText },
    { to: '/mentor', label: 'Mentor', icon: MessageSquare },
    { to: '/profile', label: 'Profile', icon: UserIcon },
  ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center text-white shadow-sm">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-gray-900 text-lg tracking-tight">Career Path Simulator</span>
              {selectedPath ? (
                <span className="hidden sm:inline-flex items-center gap-1 ml-2 px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200">
                  <Compass className="w-3 h-3 text-emerald-600" />
                  <span>{selectedPath.career_path.name}</span>
                </span>
              ) : (
                <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-xs font-medium bg-primary-50 text-primary-700 rounded-full border border-primary-200">
                  B.Tech India
                </span>
              )}
            </div>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-700 font-semibold'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 mr-1.5" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          {/* User badge and logout */}
          <div className="flex items-center space-x-3">
            {profile?.full_name && (
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-sm font-semibold text-gray-800">{profile.full_name}</span>
                <span className="text-xs text-gray-500">
                  {profile.year_of_study ? `Year ${profile.year_of_study}` : ''} {profile.branch || ''}
                </span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Logout"
              aria-label="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav bar */}
      <div className="md:hidden border-t border-gray-100 px-2 py-1.5 flex justify-around bg-gray-50">
        {navLinks.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center px-2 py-1 text-xs font-medium rounded ${
                  isActive ? 'text-primary-700 font-semibold' : 'text-gray-600'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </header>
  );
};
