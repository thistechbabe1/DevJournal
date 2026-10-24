import { Injectable, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly STORAGE_KEY = 'devjournal-theme';
  readonly theme = signal<Theme>('light');

  constructor() {
    this.initTheme();
  }

  private initTheme(): void {
    if (typeof window === 'undefined') return;

    const existingAttr = document.documentElement.getAttribute('data-theme') as Theme | null;
    if (existingAttr === 'light' || existingAttr === 'dark') {
      this.theme.set(existingAttr);
      return;
    }

    const saved = localStorage.getItem(this.STORAGE_KEY) as Theme | null;
    if (saved === 'light' || saved === 'dark') {
      this.setTheme(saved);
      return;
    }

    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.setTheme(prefersDark ? 'dark' : 'light');
  }

  toggleTheme(): void {
    const nextTheme: Theme = this.theme() === 'dark' ? 'light' : 'dark';
    this.setTheme(nextTheme);
  }

  setTheme(newTheme: Theme): void {
    this.theme.set(newTheme);
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-theme', newTheme);
      try {
        localStorage.setItem(this.STORAGE_KEY, newTheme);
      } catch (e) {
        // Ignore localStorage errors (e.g. private browsing quota)
      }
    }
  }
}
