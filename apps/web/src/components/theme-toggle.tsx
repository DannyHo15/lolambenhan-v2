'use client';

import { Moon, Sun, Monitor } from 'lucide-react';
import { useThemeStore } from '@/lib/store/theme';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useThemeStore();

  const themes: Array<{ value: 'light' | 'dark' | 'system'; icon: typeof Sun; label: string }> = [
    { value: 'light', icon: Sun, label: 'Sáng' },
    { value: 'dark', icon: Moon, label: 'Tối' },
    { value: 'system', icon: Monitor, label: 'Hệ thống' },
  ];

  return (
    <div className={cn('flex items-center gap-1 bg-muted/50 rounded-lg p-1', className)}>
      {themes.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={cn(
            'relative flex items-center justify-center w-8 h-8 rounded-md transition-all',
            'hover:bg-background',
            theme === value
              ? 'bg-background shadow-sm text-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
          title={label}
        >
          <Icon className="w-4 h-4" />
          {theme === value && (
            <span className="absolute inset-0 rounded-md ring-2 ring-primary/20 ring-offset-1 ring-offset-background" />
          )}
        </button>
      ))}
    </div>
  );
}

// Simpler button version that cycles through themes
// TODO: Comment out theme toggle temporarily
/*
export function ThemeToggleButton({ className }: { className?: string }) {
  const { theme, setTheme } = useThemeStore();

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const getIcon = () => {
    if (theme === 'light') return <Sun className="w-5 h-5" />;
    if (theme === 'dark') return <Moon className="w-5 h-5" />;
    return <Monitor className="w-5 h-5" />;
  };

  const getLabel = () => {
    if (theme === 'light') return 'Chế độ sáng';
    if (theme === 'dark') return 'Chế độ tối';
    return 'Theo hệ thống';
  };

  return (
    <button
      onClick={cycleTheme}
      className={cn(
        'inline-flex items-center gap-2 px-3 py-2 rounded-lg',
        'text-sm font-medium transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        className
      )}
      title={getLabel()}
    >
      {getIcon()}
      <span className="hidden sm:inline">{getLabel()}</span>
    </button>
  );
}
*/
