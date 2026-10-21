import '@testing-library/jest-dom';

// In-memory mock for localStorage in jsdom / Node 22 test environment
const storage: Record<string, string> = {};

const localStorageMock = {
  getItem: (key: string) => storage[key] ?? null,
  setItem: (key: string, value: string) => {
    storage[key] = String(value);
  },
  removeItem: (key: string) => {
    delete storage[key];
  },
  clear: () => {
    for (const key in storage) {
      delete storage[key];
    }
  },
};

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});
