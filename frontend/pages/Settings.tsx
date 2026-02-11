import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Code2,
  User,
  Lock,
  Monitor,
  LogOut,
  Loader2,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useEditorStore, Language } from '../store/editorStore';
import { Toast } from '../components/Toast';

export function Settings() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const {
    theme,
    fontSize,
    tabSize,
    wordWrap,
    toggleTheme,
    setFontSize,
    setTabSize,
    setWordWrap,
  } = useThemeStore();
  const { language, setLanguage } = useEditorStore();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setToast({ message: 'Passwords do not match', type: 'error' });
      return;
    }

    if (newPassword.length < 6) {
      setToast({ message: 'Password must be at least 6 characters', type: 'error' });
      return;
    }

    setLoading(true);

    try {
      // Backend removed - password update disabled
      setToast({ message: 'Password update is not available. Backend services have been removed.', type: 'error' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : 'Failed to update password',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-900' : 'bg-gray-50'}`}>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <nav className={`${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} border-b`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-gray-100 text-gray-600'} transition`}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <Code2 className="w-6 h-6 text-white" />
                </div>
                <span className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Settings
                </span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className={`${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} rounded-xl border p-6`}>
            <div className="flex items-center gap-3 mb-6">
              <User className={`w-5 h-5 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`} />
              <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Profile Information
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={user?.name || ''}
                  disabled
                  className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark'
                    ? 'bg-slate-900 border-slate-700 text-slate-400'
                    : 'bg-gray-50 border-gray-300 text-gray-600'
                    } cursor-not-allowed`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark'
                    ? 'bg-slate-900 border-slate-700 text-slate-400'
                    : 'bg-gray-50 border-gray-300 text-gray-600'
                    } cursor-not-allowed`}
                />
              </div>
            </div>
          </div>

          <div className={`${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} rounded-xl border p-6`}>
            <div className="flex items-center gap-3 mb-6">
              <Lock className={`w-5 h-5 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`} />
              <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Change Password
              </h2>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark'
                    ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="At least 6 characters"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark'
                    ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Confirm your new password"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !newPassword || !confirmPassword}
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-cyan-600 transition shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Password'
                )}
              </button>
            </form>
          </div>

          <div className={`${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} rounded-xl border p-6`}>
            <div className="flex items-center gap-3 mb-6">
              <Monitor className={`w-5 h-5 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`} />
              <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Editor Preferences
              </h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className={`block text-sm font-medium mb-3 ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>
                  Theme
                </label>
                <button
                  onClick={toggleTheme}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border ${theme === 'dark'
                    ? 'bg-slate-900 border-slate-700 hover:bg-slate-700'
                    : 'bg-white border-gray-300 hover:bg-gray-50'
                    } transition`}
                >
                  <span className={`flex items-center gap-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {theme === 'dark' ? (
                      <>
                        <Moon className="w-5 h-5" />
                        Dark Mode
                      </>
                    ) : (
                      <>
                        <Sun className="w-5 h-5" />
                        Light Mode
                      </>
                    )}
                  </span>
                  <div className={`w-12 h-6 rounded-full ${theme === 'dark' ? 'bg-blue-500' : 'bg-gray-300'} relative transition`}>
                    <div
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                    />
                  </div>
                </button>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>
                  Default Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark'
                    ? 'bg-slate-900 border-slate-700 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer`}
                >
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                  <option value="javascript">JavaScript</option>
                  <option value="c">C</option>
                  <option value="go">Go</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>
                  Font Size: {fontSize}px
                </label>
                <input
                  type="range"
                  min="12"
                  max="24"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full h-2 bg-blue-500 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>
                  Tab Size: {tabSize} spaces
                </label>
                <input
                  type="range"
                  min="2"
                  max="8"
                  step="2"
                  value={tabSize}
                  onChange={(e) => setTabSize(Number(e.target.value))}
                  className="w-full h-2 bg-blue-500 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>
                  Word Wrap
                </span>
                <button
                  onClick={() => setWordWrap(!wordWrap)}
                  className={`w-12 h-6 rounded-full ${wordWrap ? 'bg-blue-500' : 'bg-gray-300'} relative transition`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${wordWrap ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className={`${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} rounded-xl border p-6`}>
            <div className="flex items-center gap-3 mb-4">
              <LogOut className={`w-5 h-5 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`} />
              <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Account Actions
              </h2>
            </div>

            <button
              onClick={handleLogout}
              className="w-full px-6 py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
