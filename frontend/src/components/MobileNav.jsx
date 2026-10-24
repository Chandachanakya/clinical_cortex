import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Activity, Bell, FileText, User } from 'lucide-react';

const MobileNav = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { icon: Home, label: 'Home', path: '/' },
        { icon: Activity, label: 'Analytics', path: '/analytics' },
        { icon: Bell, label: 'Alerts', path: '/alerts' },
        { icon: FileText, label: 'Reports', path: '/reports' },
        { icon: User, label: 'Profile', path: '/patient-dashboard' }
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 safe-area-inset-bottom">
            <div className="flex justify-around items-center h-16">
                {navItems.map(({ icon: Icon, label, path }) => (
                    <button
                        key={path}
                        onClick={() => navigate(path)}
                        className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${isActive(path)
                                ? 'text-blue-600'
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        <Icon size={22} className="mb-1" />
                        <span className="text-xs font-medium">{label}</span>
                    </button>
                ))}
            </div>
        </nav>
    );
};

export default MobileNav;
