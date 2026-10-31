import { useSyncExternalStore } from 'react';

export type Theme = 'navy' | 'light';

const STORAGE_KEY = 'blockallisto-theme';
const LOCKUP_NAVY = '/blockallisto-lockup-horizontal-reversed.svg';
const LOCKUP_LIGHT = '/blockallisto-lockup-horizontal.svg';

export function lockupFor(theme: Theme): string {
  return theme === 'light' ? LOCKUP_LIGHT : LOCKUP_NAVY;
}

function readStored(): Theme {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'navy';
  } catch {
    return 'navy';
  }
}

let current: Theme = readStored();
const listeners = new Set<() => void>();

function apply(theme: Theme) {
  if (theme === 'light') {
    document.documentElement.dataset.theme = 'light';
  } else {
    delete document.documentElement.dataset.theme;
  }
}

export function getTheme(): Theme {
  return current;
}

export function setTheme(theme: Theme) {
  current = theme;
  try {
    if (theme === 'light') {
      localStorage.setItem(STORAGE_KEY, 'light');
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* private mode: theme stays session-local */
  }
  apply(theme);
  listeners.forEach((l) => l());
}

export function initTheme() {
  apply(current);
}

export function useTheme(): Theme {
  return useSyncExternalStore((cb) => {
    listeners.add(cb);
    return () => listeners.delete(cb);
  }, getTheme);
}
