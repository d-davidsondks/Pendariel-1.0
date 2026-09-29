/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ThemeMode = 'light' | 'dark' | 'system';

export interface UserSpecificSettings {
  userId: string;
  theme: ThemeMode;
  compactDensity: boolean;
  soundEffects: boolean;
  highContrast: boolean;
  telemetryRefreshIntervalSec: number; // 5, 10, 15, 30, 60
  defaultWorkspaceTab: string; // 'powerbi' | 'financial' | etc.
  notifyOnCriticalAlerts: boolean;
  lastUpdated: string;
}

export const DEFAULT_USER_SETTINGS: Omit<UserSpecificSettings, 'userId'> = {
  theme: 'light',
  compactDensity: false,
  soundEffects: false,
  highContrast: false,
  telemetryRefreshIntervalSec: 10,
  defaultWorkspaceTab: 'powerbi',
  notifyOnCriticalAlerts: true,
  lastUpdated: new Date().toISOString(),
};
