import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
      get resolvedTheme() {
        const { theme } = get();
        if (theme === 'system') {
          return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light';
        }
        return theme as 'light' | 'dark';
      },
    }),
    {
      name: 'theme-storage',
    }
  )
);

// Helper to get the actual resolved theme
export function getResolvedTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';

  const theme = useThemeStore.getState().theme;
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme as 'light' | 'dark';
}

// Apply theme to document with smooth transition
export function applyTheme(theme: 'light' | 'dark') {
  const root = document.documentElement;

  // Add transition class for smooth color change
  root.style.setProperty('color-transition', 'background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease');

  root.classList.remove('light', 'dark');
  root.classList.add(theme);

  // Remove transition property after animation completes
  setTimeout(() => {
    root.style.removeProperty('color-transition');
  }, 300);
}

// Initialize theme (call once on app mount)
export function initTheme() {
  const resolvedTheme = getResolvedTheme();
  applyTheme(resolvedTheme);
}
