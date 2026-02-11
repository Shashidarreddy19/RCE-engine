import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
// import axios from 'axios'; // Removed direct axios usage
import { io } from 'socket.io-client';
import {
  Play,
  Save,
  Download,
  ArrowLeft,
  Loader2,
  Code2,
  Settings as SettingsIcon,
  Moon,
  Sun,
  X
} from 'lucide-react';
import { useEditorStore, Language } from '../store/editorStore';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { Toast } from '../components/Toast';
import { api } from '../src/config';

const languageOptions: { value: Language; label: string; extension: string }[] = [
  { value: 'python', label: 'Python', extension: 'py' },
  { value: 'java', label: 'Java', extension: 'java' },
  { value: 'cpp', label: 'C++', extension: 'cpp' },
  { value: 'javascript', label: 'Node.js', extension: 'js' },
  { value: 'c', label: 'C', extension: 'c' },
  { value: 'go', label: 'Go', extension: 'go' },
];

export function EditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState('Untitled');
  const [description, setDescription] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Demo / Guest State
  const { user } = useAuthStore();
  const [executionCount, setExecutionCount] = useState(0);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const isGuest = !user;
  const isGuestRef = useRef(isGuest);

  useEffect(() => {
    isGuestRef.current = isGuest;
  }, [isGuest]);

  // Socket & Terminal
  const socketRef = useRef<any>(null);
  const terminalContainerRef = useRef<HTMLDivElement>(null);
  const hiddenInputRef = useRef<HTMLTextAreaElement>(null);

  // Terminal state: history of chunks, and current active input
  const [terminalHistory, setTerminalHistory] = useState<Array<{ type: 'output' | 'input', content: string }>>([]);
  const [inputBuffer, setInputBuffer] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    code,
    language,
    currentSnippetId,
    setCode,
    setLanguage,
    setCurrentSnippetId,
  } = useEditorStore();

  const { theme, editorTheme, fontSize, tabSize, wordWrap, toggleTheme } = useThemeStore();

  // Socket Connection
  useEffect(() => {
    socketRef.current = io();

    socketRef.current.on('connect', () => {
      console.log('Connected to execution server');
    });

    socketRef.current.on("output", (data: string) => {
      setTerminalHistory((prev) => [...prev, { type: "output", content: data }]);

      requestAnimationFrame(() => {
        hiddenInputRef.current?.focus();
      });

      if (
        data.includes("[Program exited") ||
        data.includes("[Execution Timeout]") ||
        data.toLowerCase().includes("exception") ||
        data.toLowerCase().includes("error") ||
        data.toLowerCase().includes("traceback") ||
        data.toLowerCase().includes("fatal") ||
        data.toLowerCase().includes("terminated") ||
        data.toLowerCase().includes("segmentation")
      ) {
        setIsProcessing(false);
        // If guest, increment count and show prompt
        if (isGuestRef.current) {
          setExecutionCount(prev => prev + 1);
        }
      }
    });



    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalContainerRef.current) {
      terminalContainerRef.current.scrollTop = terminalContainerRef.current.scrollHeight;
    }
  }, [terminalHistory, inputBuffer]);

  // Focus hidden input when terminal is clicked
  // Always focus hidden input on mount
  useEffect(() => {
    hiddenInputRef.current?.focus();
  }, [language, terminalHistory]);


  // Handle Input logic
  const handleTerminalClick = () => {
    hiddenInputRef.current?.focus();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const lineToSend = inputBuffer;

      setTerminalHistory(prev => [...prev, { type: 'input', content: lineToSend + '\n' }]);
      socketRef.current?.emit('input', lineToSend);
      setInputBuffer('');

      // 🔥 KEEP TERMINAL READY FOR NEXT INPUT
      requestAnimationFrame(() => {
        hiddenInputRef.current?.focus();
      });
    }
  };

  const handleRunCode = () => {
    // Guest Limit Check: Allow only 1 run, block 2nd attempt
    if (isGuest && executionCount >= 1) {
      setShowLoginPrompt(true);
      return;
    }

    setIsProcessing(true);
    setTerminalHistory([{ type: 'output', content: '$ Running code...\n' }]);
    setInputBuffer('');

    const LANGUAGE_MAP: any = {
      python: "python",
      java: "java",
      cpp: "cpp",
      c: "c",
      go: "go",
      javascript: "Node.js"   // ⭐ This is required
    };

    socketRef.current?.emit("run", { code, language: LANGUAGE_MAP[language] });


    // Focus terminal input immediately
    setTimeout(() => hiddenInputRef.current?.focus(), 50);
  };
  // Stop "Running..." when user changes the language
  useEffect(() => {
    setIsProcessing(false);
  }, [language]);


  // Whenever snippet loads, ensure run state resets
  useEffect(() => {
    setIsProcessing(false);
  }, [id]);



  // --- Standard Data Loading/Saving Logic (Unchanged) ---
  useEffect(() => {
    if (id) {
      loadSnippet(id);
    }
  }, [id]);

  useEffect(() => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      localStorage.setItem('autosave_code', code);
      localStorage.setItem('autosave_language', language);
    }, 5000);
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
  }, [code, language]);

  const loadSnippet = async (snippetId: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const { data } = await api.get(`/snippets/${snippetId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTitle(data.title);
      setDescription(data.description || '');
      setCode(data.code);
      setLanguage(data.language as Language);
      setCurrentSnippetId(data._id);
    } catch (error) {
      setToast({ message: 'Failed to load snippet', type: 'error' });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSnippet = async () => {
    if (!title.trim()) {
      setToast({ message: 'Please enter a title', type: 'error' });
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const snippetData = { title, description, code, language };
      if (currentSnippetId) {
        await api.put(`/snippets/${currentSnippetId}`, snippetData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setToast({ message: 'Snippet updated successfully', type: 'success' });
      } else {
        const { data } = await api.post('/snippets', snippetData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCurrentSnippetId(data._id);
        setToast({ message: 'Snippet saved successfully', type: 'success' });
      }
      setShowSaveDialog(false);
    } catch (error) {
      setToast({ message: 'Failed to save snippet', type: 'error' });
    }
  };

  const handleDownload = () => {
    const lang = languageOptions.find((l) => l.value === language);
    const filename = `${title.replace(/\s+/g, '_')}.${lang?.extension || 'txt'}`;
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`h-screen flex flex-col ${theme === 'dark' ? 'bg-slate-900' : 'bg-gray-50'}`}>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Navigation Bar */}
      <nav className={`${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} border-b`}>
        <div className="px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-gray-100 text-gray-600'} transition`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Code2 className="w-5 h-5 text-white" />
              </div>
              <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {title}
              </span>
            </div>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className={`px-3 py-1.5 rounded-lg border text-sm font-medium ${theme === 'dark'
                ? 'bg-slate-700 border-slate-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer`}
            >
              {languageOptions.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRunCode}
              disabled={isProcessing}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-600 transition shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isProcessing ? (
                <> <Loader2 className="w-4 h-4 animate-spin" /> Running... </>
              ) : (
                <> <Play className="w-4 h-4" /> Run </>
              )}
            </button>
            <button onClick={() => setShowSaveDialog(true)} className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-gray-100 text-gray-600'} transition`}>
              <Save className="w-5 h-5" />
            </button>
            <button onClick={handleDownload} className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-gray-100 text-gray-600'} transition`}>
              <Download className="w-5 h-5" />
            </button>
            <button onClick={toggleTheme} className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-gray-100 text-gray-600'} transition`}>
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button onClick={() => navigate('/settings')} className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-gray-100 text-gray-600'} transition`}>
              <SettingsIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden">
        {/* Editor Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-hidden">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            ) : (
              <Editor
                height="100%"
                language={language === 'cpp' ? 'cpp' : language}
                value={code}
                onChange={(value) => setCode(value || '')}
                theme={editorTheme}
                options={{
                  fontSize,
                  tabSize,
                  wordWrap: wordWrap ? 'on' : 'off',
                  minimap: { enabled: true },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  formatOnPaste: true,
                  formatOnType: true,
                }}
              />
            )}
          </div>
        </div>

        {/* Unified Terminal Area - Seamless Input */}
        <div className={`w-1/3 flex flex-col ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} border-l`}>
          <div className={`flex items-center px-4 py-3 border-b ${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex-1 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-slate-400"></div>
              <div className="w-2 h-2 rounded-full bg-slate-400"></div>
              <div className="w-2 h-2 rounded-full bg-slate-400"></div>
            </div>
            <span className={`font-mono text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-gray-400'}`}>
              TERMINAL
            </span>
            <div className="flex-1 flex justify-end">
              <button
                onClick={() => {
                  setTerminalHistory([]);
                  setInputBuffer('');
                }}
                className={`p-1 rounded hover:bg-opacity-20 ${theme === 'dark' ? 'hover:bg-white text-slate-400' : 'hover:bg-black text-gray-500'}`}
                title="Clear Terminal"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div
            ref={terminalContainerRef}
            tabIndex={0}                   // 🔥 allows focus
            onClick={() => hiddenInputRef.current?.focus()}
            className="flex-1 overflow-auto p-4 font-mono text-sm ..."
            style={{ fontFamily: "'Fira Code', 'JetBrains Mono', monospace", cursor: 'text' }}
          >
            {/* 
                We render the history, then the current input buffer inline.
                The whitespace-pre-wrap ensures newlines are respected.
            */}
            <span className="whitespace-pre-wrap break-words">
              {terminalHistory.map((item, i) => (
                // We can color user input differently to distinguish it from stdout
                <span key={i} className={item.type === 'input' ? (theme === 'dark' ? 'text-green-400' : 'text-green-600') : ''}>
                  {item.content}
                </span>
              ))}
              {/* Active Input Buffer */}
              <span className={theme === 'dark' ? 'text-green-400' : 'text-green-600'}>
                {inputBuffer}
              </span>
              {/* Cursor */}
              <span className="animate-pulse inline-block w-2 h-4 bg-current align-middle ml-0.5"></span>
            </span>

            {/* Hidden Input for capturing keystrokes */}
            <textarea
              ref={hiddenInputRef}
              value={inputBuffer}
              onChange={(e) => setInputBuffer(e.target.value)}
              onKeyDown={handleInputKeyDown}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "1px",       // MUST NOT be 0px or keyboard input will NOT work
                height: "1px",
                opacity: 0,
                zIndex: -1,
                pointerEvents: "none",
                overflow: "hidden",
              }}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck="false"
            />

          </div>
        </div>
      </div>

      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'} rounded-xl shadow-2xl p-6`}>
            <h2 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{currentSnippetId ? 'Update' : 'Save'} Snippet</h2>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>Title</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`} placeholder="My Code Snippet" />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>Description (optional)</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none`} placeholder="Describe your code..." />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowSaveDialog(false)} className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${theme === 'dark' ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'}`}>Cancel</button>
              <button onClick={handleSaveSnippet} className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-lg hover:from-blue-600 hover:to-cyan-600 transition">{currentSnippetId ? 'Update' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
      {/* Guest Limit / Login Prompt Modal */}
      {showLoginPrompt && isGuest && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4 transition-all duration-300">
          <div className={`${theme === 'dark' ? 'bg-slate-800' : 'bg-white'} rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border ${theme === 'dark' ? 'border-slate-700' : 'border-slate-100'} animate-in fade-in zoom-in duration-300`}>
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Code2 className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className={`text-2xl font-bold mb-3 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Continue Coding?
            </h2>
            <p className={`mb-8 text-lg ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              Create a free account to run more code, save your snippets, and track your progress.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => navigate('/signup')}
                className="w-full py-3.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Create Free Account
              </button>
              <button
                onClick={() => navigate('/login')}
                className={`w-full py-3.5 font-semibold rounded-xl border transition ${theme === 'dark' ? 'border-slate-700 hover:bg-slate-700 text-white' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}`}
              >
                Sign In
              </button>
            </div>

            <button
              onClick={() => navigate('/')}
              className="mt-6 text-sm text-slate-500 hover:text-slate-400 font-medium"
            >
              Back to Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
