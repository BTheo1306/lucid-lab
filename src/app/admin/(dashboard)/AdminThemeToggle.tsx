'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import './admin-dark.css';

const STORAGE_KEY = 'lucid-lab-admin-theme';

function applyTheme(theme: 'light' | 'dark'): void {
  const root = document.querySelector('[data-admin-root]');
  if (!root) return;
  if (theme === 'dark') root.classList.add('admin-dark');
  else root.classList.remove('admin-dark');
}

export function AdminThemeToggle() {
  // Always start with 'light' to match the server render, then sync from
  // localStorage on the client after hydration is complete.
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const saved = stored === 'dark' ? 'dark' : 'light';
    setTheme(saved);
    applyTheme(saved);
    setMounted(true);
  }, []);

  function toggle(): void {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  }

  // Render a consistent Moon/"Dark" placeholder until mounted so the
  // server HTML and client first render always agree (no hydration mismatch).
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={mounted && theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className="admin-theme-toggle inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
    >
      {mounted && theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
      <span className="hidden sm:inline">
        {mounted && theme === 'dark' ? 'Light' : 'Dark'}
      </span>
    </button>
  );
}
