import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { getStoredDarkMode, setStoredDarkMode } from '../lib/storage';

const lightTheme = {
  background: '#f7f8ff',
  surface: '#ffffff',
  surfaceSoft: '#eef2ff',
  surfaceMuted: '#f8f9ff',
  border: '#e4e8ff',
  borderSoft: '#dde3ff',
  text: '#22325c',
  textMuted: '#6f7db4',
  textSoft: '#97a3d0',
  primary: '#4d63df',
  primaryStrong: '#5c74f6',
  actionBlue: '#4d63df',
  actionBlueStrong: '#5c74f6',
  primarySoft: 'rgba(208, 236, 255, 0.78)',
  primarySoftBorder: 'rgba(222, 244, 255, 0.95)',
  tabBar: 'rgba(255, 255, 255, 0.86)',
  tabBarBorder: 'rgba(217, 229, 255, 0.9)',
  icon: '#64748b',
  successBg: '#e7f6ef',
  successText: '#2b7d54',
  dangerBg: '#ffe7ea',
  dangerText: '#e25363',
  dangerStrong: '#e25363',
  warningBg: '#ffefe3',
  warningText: '#f08a24',
  switchThumb: '#eef2ff',
  switchTrackOff: '#dbe1ff',
  statusBar: 'dark-content' as const,
};

const darkTheme = {
  background: '#050505',
  surface: '#111111',
  surfaceSoft: '#171717',
  surfaceMuted: '#0d0d0d',
  border: '#262626',
  borderSoft: '#333333',
  text: '#f5f5f5',
  textMuted: '#a3a3a3',
  textSoft: '#737373',
  primary: '#e5e7eb',
  primaryStrong: '#f5f5f5',
  actionBlue: '#5b8cff',
  actionBlueStrong: '#4f7dff',
  primarySoft: 'rgba(255, 255, 255, 0.12)',
  primarySoftBorder: 'rgba(255, 255, 255, 0.08)',
  tabBar: 'rgba(18, 18, 18, 0.94)',
  tabBarBorder: 'rgba(255, 255, 255, 0.08)',
  icon: '#d4d4d4',
  successBg: 'rgba(43, 125, 84, 0.24)',
  successText: '#8fe0b1',
  dangerBg: 'rgba(226, 83, 99, 0.24)',
  dangerText: '#ff9da8',
  dangerStrong: '#ff5d73',
  warningBg: 'rgba(240, 138, 36, 0.22)',
  warningText: '#ffc37d',
  switchThumb: '#1f1f1f',
  switchTrackOff: '#303030',
  statusBar: 'light-content' as const,
};

type ThemePalette = Omit<typeof lightTheme, 'statusBar'> & {
  statusBar: 'dark-content' | 'light-content';
};

const ThemeContext = createContext<{
  isDark: boolean;
  setIsDark: (enabled: boolean) => void;
  theme: ThemePalette;
}>({
  isDark: true,
  setIsDark: () => undefined,
  theme: darkTheme,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDarkState] = useState(true);

  useEffect(() => {
    let mounted = true;

    getStoredDarkMode().then((value) => {
      if (mounted) {
        setIsDarkState(value);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  function setIsDark(enabled: boolean) {
    setIsDarkState(enabled);
    void setStoredDarkMode(enabled);
  }

  const value = useMemo(
    () => ({
      isDark,
      setIsDark,
      theme: isDark ? darkTheme : lightTheme,
    }),
    [isDark],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
