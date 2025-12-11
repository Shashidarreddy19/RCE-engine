import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Plus,
  Search,
  Code2,
  Clock,
  Trash2,
  Filter,
  Moon,
  Sun,
  Settings,
  LogOut,
  Loader2,
  Home,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useEditorStore } from '../store/editorStore';
import { Toast } from '../components/Toast';
import { API_URL } from '../src/config';

type Language = 'python' | 'java' | 'cpp' | 'javascript' | 'c' | 'go';

interface CodeSnippet {
  _id: string;
  userId: string;
  title: string;
  language: string;
  code: string;
  description: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

const languageColors: Record<Language, string> = {
  python: 'bg-blue-500',
  java: 'bg-red-500',
  cpp: 'bg-cyan-500',
  javascript: 'bg-yellow-500',
  c: 'bg-green-500',
  go: 'bg-cyan-600',
};

const languageLabels: Record<Language, string> = {
  python: 'Python',
  java: 'Java',
  cpp: 'C++',
  javascript: 'JavaScript',
  c: 'C',
  go: 'Go',
};

export function Dashboard() {
  const [snippets, setSnippets] = useState<CodeSnippet[]>([]);
  const [filteredSnippets, setFilteredSnippets] = useState<CodeSnippet[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<Language | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const resetEditor = useEditorStore((state) => state.resetEditor);

  useEffect(() => {
    loadSnippets();
  }, []);

  useEffect(() => {
    filterSnippets();
  }, [snippets, searchQuery, selectedLanguage]);

  const loadSnippets = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${API_URL}/api/snippets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSnippets(data);
    } catch (error) {
      setToast({ message: 'Failed to load snippets', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const filterSnippets = () => {
    let filtered = snippets;

    if (searchQuery) {
      filtered = filtered.filter(
        (snippet) =>
          snippet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          snippet.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedLanguage !== 'all') {
      filtered = filtered.filter((snippet) => snippet.language === selectedLanguage);
    }

    setFilteredSnippets(filtered);
  };

  const handleDeleteSnippet = async (_id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm('Are you sure you want to delete this snippet?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/snippets/${_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSnippets(snippets.filter((s) => s._id !== _id));
      setToast({ message: 'Snippet deleted successfully', type: 'success' });
    } catch (error) {
      setToast({ message: 'Failed to delete snippet', type: 'error' });
    }
  };

  const handleNewCode = () => {
    resetEditor();
    navigate('/editor');
  };

  const handleOpenSnippet = (snippet: CodeSnippet) => {
    navigate(`/editor/${snippet._id}`);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const formatDate = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return then.toLocaleDateString();
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Code2 className="w-6 h-6 text-white" />
              </div>
              <span className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                RCE Engine
              </span>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-gray-100 text-gray-600'} transition`}
                title="Go to Home"
              >
                <Home className="w-5 h-5" />
              </button>
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-gray-100 text-gray-600'} transition`}
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={() => navigate('/settings')}
                className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-gray-100 text-gray-600'} transition`}
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={handleLogout}
                className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-gray-100 text-gray-600'} transition`}
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Welcome back, {user?.name || 'Developer'}
          </h1>
          <p className={theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}>
            Manage your code snippets and start coding
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-400'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search snippets..."
              className={`w-full pl-10 pr-4 py-3 rounded-lg border ${theme === 'dark'
                ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
            />
          </div>

          <div className="flex gap-2">
            <div className="relative">
              <Filter className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-400'}`} />
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value as Language | 'all')}
                className={`pl-10 pr-8 py-3 rounded-lg border ${theme === 'dark'
                  ? 'bg-slate-800 border-slate-700 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 transition appearance-none cursor-pointer`}
              >
                <option value="all">All Languages</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="javascript">JavaScript</option>
                <option value="c">C</option>
                <option value="go">Go</option>
              </select>
            </div>

            <button
              onClick={handleNewCode}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-cyan-600 transition shadow-lg hover:shadow-xl flex items-center gap-2 whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              New Code
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : filteredSnippets.length === 0 ? (
          <div className={`text-center py-16 ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'} rounded-xl border ${theme === 'dark' ? 'border-slate-700' : 'border-gray-200'}`}>
            <Code2 className={`w-16 h-16 mx-auto mb-4 ${theme === 'dark' ? 'text-slate-600' : 'text-gray-300'}`} />
            <h3 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              No snippets found
            </h3>
            <p className={`mb-6 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>
              Create your first code snippet to get started
            </p>
            <button
              onClick={handleNewCode}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-cyan-600 transition shadow-lg inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create New Snippet
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSnippets.map((snippet) => (
              <div
                key={snippet._id}
                onClick={() => handleOpenSnippet(snippet)}
                className={`${theme === 'dark' ? 'bg-slate-800 border-slate-700 hover:border-slate-600' : 'bg-white border-gray-200 hover:border-gray-300'
                  } rounded-xl border p-6 cursor-pointer transition hover:shadow-lg group`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className={`${languageColors[snippet.language as Language]} text-white text-xs font-semibold px-2 py-1 rounded`}>
                      {languageLabels[snippet.language as Language]}
                    </span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteSnippet(snippet._id, e)}
                    className={`opacity-0 group-hover:opacity-100 p-1 rounded ${theme === 'dark' ? 'hover:bg-slate-700 text-slate-400 hover:text-red-400' : 'hover:bg-gray-100 text-gray-400 hover:text-red-500'
                      } transition`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {snippet.title}
                </h3>

                {snippet.description && (
                  <p className={`text-sm mb-4 line-clamp-2 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>
                    {snippet.description}
                  </p>
                )}

                <div className={`flex items-center gap-2 text-sm ${theme === 'dark' ? 'text-slate-500' : 'text-gray-500'}`}>
                  <Clock className="w-4 h-4" />
                  <span>{formatDate(snippet.updatedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
