import React, { useState } from 'react';
import { Bell, ChevronDown, LogOut, User as UserIcon, Flower2, LayoutGrid } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

export default function TopHeader() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const getHeaderInfo = () => {
    const path = location.pathname;
    if (path === '/studio' || path === '/yoga-studio') return { title: 'AI Yoga Studio', icon: Flower2 };
    if (path === '/assistant') return { title: 'AI Fitness Assistant', icon: Flower2 };
    if (path === '/profile') return { title: 'My Profile', icon: UserIcon };
    return { title: 'Home', icon: LayoutGrid };
  };

  const { title, icon: HeaderIcon } = getHeaderInfo();
  const firstName = user?.name ? user.name.split(' ')[0] : 'User';
  // Get first letter for avatar
  const initials = firstName[0]?.toUpperCase() || 'U';

  return (
    <header className="h-16 px-8 flex items-center justify-between border-b border-[#F0E6F7] bg-white/80 backdrop-blur-md sticky top-0 z-30">
      {/* Page Title */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-fitverse-lavender flex items-center justify-center text-fitverse-purple">
          <HeaderIcon className="w-4 h-4" />
        </div>
        <h1 className="text-xl font-bold text-fitverse-dark tracking-tight">{title}</h1>
      </div>

      {/* Right: Bell + User */}
      <div className="flex items-center gap-5">
        <button
          aria-label="Notifications"
          className="w-9 h-9 rounded-full bg-white border border-[#EFE5F7] flex items-center justify-center text-fitverse-muted hover:text-fitverse-purple hover:border-fitverse-purple transition-colors relative shadow-xs"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-fitverse-purple absolute top-1.5 right-1.5 ring-2 ring-white"></span>
        </button>

        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 p-1 pr-2.5 rounded-full hover:bg-fitverse-lavender/50 transition-colors focus:outline-none"
          >
            {/* Avatar circle with initials */}
            <div className="w-8 h-8 rounded-full border-2 border-fitverse-purple/30 bg-fitverse-lavender flex items-center justify-center shadow-xs">
              <span className="text-xs font-bold text-fitverse-purple">{initials}</span>
            </div>
            <span className="text-sm font-semibold text-fitverse-dark">Hi, {firstName}</span>
            <ChevronDown className="w-3.5 h-3.5 text-fitverse-muted" />
          </button>

          {dropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-soft border border-[#F0E6F7] py-2 z-50"
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-xs text-fitverse-muted">Signed in as</p>
                <p className="text-sm font-semibold text-fitverse-dark truncate">{user?.email || 'user@fitverse.com'}</p>
              </div>
              <button
                onClick={() => { setDropdownOpen(false); navigate('/profile'); }}
                className="w-full px-4 py-2.5 text-left text-sm text-fitverse-dark hover:bg-fitverse-lavender/40 flex items-center gap-2.5"
              >
                <UserIcon className="w-4 h-4 text-fitverse-muted" />
                <span>My Profile</span>
              </button>
              <button
                onClick={() => { setDropdownOpen(false); logout(); navigate('/login', { replace: true }); }}
                className="w-full px-4 py-2.5 text-left text-sm text-fitverse-error hover:bg-red-50 flex items-center gap-2.5"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
