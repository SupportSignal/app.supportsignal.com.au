'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@starter/ui';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // useEffect only runs on the client, so now we can safely show the UI
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="sm"
        aria-label="Toggle theme"
        className="w-9 h-9 px-0 border-white/30 text-white hover:bg-white/10 hover:text-white"
      >
        <Sun className="h-4 w-4" aria-hidden="true" />
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      className="w-9 h-9 px-0 border-white/30 text-white hover:bg-white/10 hover:text-white transition-all duration-200"
    >
      {theme === 'light' ? (
        <Moon className="h-4 w-4 transition-transform duration-200 hover:rotate-12" aria-hidden="true" />
      ) : (
        <Sun className="h-4 w-4 transition-transform duration-200 hover:rotate-12" aria-hidden="true" />
      )}
    </Button>
  );
}
