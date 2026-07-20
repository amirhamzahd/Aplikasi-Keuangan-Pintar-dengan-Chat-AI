'use client';

// Standardized theme hook returning Light theme only
export function useTheme() {
  return {
    theme: 'light' as 'light' | 'dark',
    toggleTheme: () => {
      // Light Mode Only - theme toggling disabled
    }
  };
}
