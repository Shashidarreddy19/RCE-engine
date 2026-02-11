import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    User,
    Settings,
    LogOut,
    LayoutDashboard,
    ChevronDown
} from 'lucide-react';

interface UserProfileProps {
    user: {
        name: string;
        email: string;
    };
    onLogout: () => void;
}

export function UserProfile({ user, onLogout }: UserProfileProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLogout = () => {
        onLogout();
        setIsOpen(false);
        navigate('/');
    };

    const initial = user.name ? user.name.charAt(0).toUpperCase() : 'U';

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition shadow-sm group"
            >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                    {initial}
                </div>
                <span className="text-sm font-medium text-slate-700 hidden sm:block max-w-[100px] truncate">
                    {user.name}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                    <div className="px-4 py-2 border-b border-slate-100 mb-1">
                        <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>

                    <div className="p-1 space-y-0.5">
                        <Link
                            to="/dashboard"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition"
                        >
                            <LayoutDashboard className="w-4 h-4 text-slate-500" />
                            Dashboard
                        </Link>

                        {/* View Profile Mock - linking to Settings for now as per plan */}
                        <Link
                            to="/settings"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition"
                        >
                            <User className="w-4 h-4 text-slate-500" />
                            View Profile
                        </Link>

                        <Link
                            to="/settings"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition"
                        >
                            <Settings className="w-4 h-4 text-slate-500" />
                            Settings
                        </Link>
                    </div>

                    <div className="border-t border-slate-100 mt-1 pt-1 p-1">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition text-left"
                        >
                            <LogOut className="w-4 h-4" />
                            Logout
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
