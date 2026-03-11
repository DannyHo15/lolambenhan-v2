'use client';

import { useEffect } from 'react';
import { useThemeStore, applyTheme, getResolvedTheme, initTheme } from '@/lib/store/theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((state) => state.theme);

  // Initialize theme once on mount
  useEffect(() => {
    initTheme();
  }, []);

  // Apply theme when theme changes
  useEffect(() => {
    const resolvedTheme = getResolvedTheme();
    applyTheme(resolvedTheme);
  }, [theme]);

  // Listen for system theme changes when using 'system' theme
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleSystemThemeChange = () => {
      applyTheme(mediaQuery.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [theme]);

  return <>{children}</>;
}
