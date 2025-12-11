import { Link } from 'react-router-dom';
import { Code2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { UserProfile } from './UserProfile';

export function Navbar() {
    const { user, signOut } = useAuthStore();

    return (
        <nav className="border-b border-slate-200 sticky top-0 bg-white/80 backdrop-blur-md z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                            <Code2 className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                            RCE Engine
                        </span>
                    </Link>
                </div>

                <div className="flex items-center gap-6">
                    {user ? (
                        <UserProfile user={user} onLogout={signOut} />
                    ) : (
                        <>
                            <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition">
                                Sign in
                            </Link>
                            <Link
                                to="/signup"
                                className="px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition shadow-lg shadow-slate-900/20"
                            >
                                Get Started
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
