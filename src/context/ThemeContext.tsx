/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ThemeMode, UserSpecificSettings, DEFAULT_USER_SETTINGS } from '../types/settings';
import { UserAccount } from '../types/intel';

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  isDark: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  userSettings: UserSpecificSettings;
  updateUserSettings: (partial: Partial<UserSpecificSettings>) => void;
  resetUserSettings: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  currentUser?: UserAccount | null;
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ currentUser, children }) => {
  const userKey = currentUser?.email || currentUser?.id || 'default_user';

  // Helper to load settings from localStorage for a specific user
  const loadSettingsForUser = useCallback((key: string): UserSpecificSettings => {
    try {
      const storageKey = `pendariel_settings_${key}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_USER_SETTINGS,
          ...parsed,
          userId: key,
        };
      }

      // Check legacy theme key if any
      const legacyTheme = localStorage.getItem(`pendariel_theme_${key}`) || localStorage.getItem('pendariel_theme');
      const themeVal: ThemeMode = (legacyTheme === 'dark' || legacyTheme === 'light' || legacyTheme === 'system') 
        ? legacyTheme 
        : 'light';

      return {
        ...DEFAULT_USER_SETTINGS,
        userId: key,
        theme: themeVal,
      };
    } catch (e) {
      return {
        ...DEFAULT_USER_SETTINGS,
        userId: key,
      };
    }
  }, []);

  const [userSettings, setUserSettings] = useState<UserSpecificSettings>(() => loadSettingsForUser(userKey));
  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // When currentUser changes (e.g. login or switch user), reload their specific settings
  useEffect(() => {
    const loaded = loadSettingsForUser(userKey);
    setUserSettings(loaded);
  }, [userKey, loadSettingsForUser]);

  // Listen to system preference changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemIsDark(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Compute resolved active theme ('light' or 'dark')
  const resolvedTheme: 'light' | 'dark' = 
    userSettings.theme === 'system'
      ? (systemIsDark ? 'dark' : 'light')
      : userSettings.theme;

  const isDark = resolvedTheme === 'dark';

  // Apply .dark class to <html> element
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }, [isDark]);

  // Save settings to localStorage per user
  const saveSettings = (newSettings: UserSpecificSettings) => {
    try {
      const storageKey = `pendariel_settings_${newSettings.userId}`;
      localStorage.setItem(storageKey, JSON.stringify(newSettings));
      // Also sync user theme key and global fallback
      localStorage.setItem(`pendariel_theme_${newSettings.userId}`, newSettings.theme);
      localStorage.setItem('pendariel_theme', newSettings.theme);
    } catch (e) {
      console.error('Failed to persist user settings to localStorage:', e);
    }
  };

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setUserSettings((prev) => {
      const updated = {
        ...prev,
        theme: newTheme,
        lastUpdated: new Date().toISOString(),
      };
      saveSettings(updated);
      return updated;
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setUserSettings((prev) => {
      const nextTheme: ThemeMode = prev.theme === 'dark' ? 'light' : 'dark';
      const updated = {
        ...prev,
        theme: nextTheme,
        lastUpdated: new Date().toISOString(),
      };
      saveSettings(updated);
      return updated;
    });
  }, []);

  const updateUserSettings = useCallback((partial: Partial<UserSpecificSettings>) => {
    setUserSettings((prev) => {
      const updated = {
        ...prev,
        ...partial,
        lastUpdated: new Date().toISOString(),
      };
      saveSettings(updated);
      return updated;
    });
  }, []);

  const resetUserSettings = useCallback(() => {
    const fresh: UserSpecificSettings = {
      ...DEFAULT_USER_SETTINGS,
      userId: userKey,
      lastUpdated: new Date().toISOString(),
    };
    saveSettings(fresh);
    setUserSettings(fresh);
  }, [userKey]);

  return (
    <ThemeContext.Provider
      value={{
        theme: userSettings.theme,
        resolvedTheme,
        isDark,
        setTheme,
        toggleTheme,
        userSettings,
        updateUserSettings,
        resetUserSettings,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
