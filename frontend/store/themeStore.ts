import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  theme: 'light' | 'dark';
  editorTheme: 'vs-light' | 'vs-dark';
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  toggleTheme: () => void;
  setFontSize: (size: number) => void;
  setTabSize: (size: number) => void;
  setWordWrap: (wrap: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'dark',
      editorTheme: 'vs-dark',
      fontSize: 14,
      tabSize: 4,
      wordWrap: true,

      toggleTheme: () =>
        set((state) => {
          const newTheme = state.theme === 'light' ? 'dark' : 'light';
          const newEditorTheme = newTheme === 'light' ? 'vs-light' : 'vs-dark';
          document.documentElement.classList.toggle('dark', newTheme === 'dark');
          return { theme: newTheme, editorTheme: newEditorTheme };
        }),

      setFontSize: (fontSize) => set({ fontSize }),
      setTabSize: (tabSize) => set({ tabSize }),
      setWordWrap: (wordWrap) => set({ wordWrap }),
    }),
    {
      name: 'theme-storage',
    }
  )
);
