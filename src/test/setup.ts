import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, vi } from 'vitest';
import { resetMockAuthStore } from './mockAuthStore';

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  window.scrollTo = vi.fn();
});

const clearBrowserStorage = () => {
  if (typeof window === 'undefined') {
    return;
  }

  if (typeof window.localStorage?.clear === 'function') {
    window.localStorage.clear();
  }

  if (typeof window.sessionStorage?.clear === 'function') {
    window.sessionStorage.clear();
  }
};

beforeEach(() => {
  clearBrowserStorage();
  resetMockAuthStore();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  clearBrowserStorage();
  resetMockAuthStore();
});
