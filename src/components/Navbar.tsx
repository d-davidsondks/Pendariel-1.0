/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  Server,
  Radio,
  UserCheck,
  ChevronDown,
  Bell,
  Mail,
  Lock,
  Cpu,
  Search,
  Globe2,
  ExternalLink,
  ArrowRight,
  Tv,
  CheckCircle2,
  X,
  Network,
  Zap,
  LogOut,
  Menu,
  Smartphone,
  Laptop,
  QrCode,
  Copy,
  Check,
  TrendingUp,
  Sun,
  Moon,
  Settings,
} from 'lucide-react';
import { UserRole, GlobalSearchResultItem, UserAccount } from '../types/intel';
import { USER_ROLES } from '../data/mockData';
import { ApiClient } from '../services/apiClient';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  currentRole: UserRole;
  currentUser?: UserAccount | null;
  onSelectRole: (role: UserRole) => void;
  unreadAlertsCount: number;
  unreadMailCount: number;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onIngestSimulatedEvent: () => void;
  backendConnected: boolean;
  onGlobalSearchSelect?: (tab: string, item: any) => void;
  onLogout?: () => void;
  onOpenSettings?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  currentUser,
  onSelectRole,
  unreadAlertsCount,
  unreadMailCount,
  activeTab,
  onSelectTab,
  onIngestSimulatedEvent,
  backendConnected,
  onGlobalSearchSelect,
  onLogout,
  onOpenSettings,
}) => {
  const { isDark, toggleTheme } = useTheme();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Global Cross-Component Search State
  const [globalQuery, setGlobalQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<GlobalSearchResultItem[]>([]);
  const [categorizedResults, setCategorizedResults] = useState<{
    intel: any[];
    webmail: any[];
    deepweb: any[];
    agency: any[];
    financial: any[];
  }>({
    intel: [],
    webmail: [],
    deepweb: [],
    agency: [],
    financial: [],
  });
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchCategory, setSearchCategory] = useState<'ALL' | 'INTEL' | 'WEBMAIL' | 'DEEPWEB' | 'AGENCY' | 'FINANCIAL'>('ALL');
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Gateway Modal / Info
  const [showGatewayInfo, setShowGatewayInfo] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut: Cmd+K / Ctrl+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchFocused(true);
      } else if (e.key === 'Escape') {
        setIsSearchFocused(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside to dismiss search results
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced Cross-Component Query Execution
  useEffect(() => {
    if (!globalQuery.trim()) {
      setSearchResults([]);
      setCategorizedResults({ intel: [], webmail: [], deepweb: [], agency: [], financial: [] });
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await ApiClient.globalSearch(globalQuery.trim());
        if (res && res.results) {
          setSearchResults(res.results);
          if (res.categorized) {
            setCategorizedResults(res.categorized);
          }
        }
      } catch (err) {
        console.error('Global search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [globalQuery]);

  const handleSelectSearchResult = (result: GlobalSearchResultItem) => {
    setIsSearchFocused(false);
    onSelectTab(result.targetTab);
    if (onGlobalSearchSelect) {
      onGlobalSearchSelect(result.targetTab, result);
    }
  };

  const filteredResults = searchResults.filter((item) => {
    if (searchCategory === 'ALL') return true;
    return item.category === searchCategory;
  });

  return (
    <header className="border-b border-sky-100 bg-white text-sky-600 sticky top-0 z-50 shadow-xs">
      {/* Top telemetry bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-1.5 border-b border-sky-100 text-xs bg-sky-50/50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-sky-600 font-mono">
            <span className={`h-2 w-2 rounded-full ${backendConnected ? 'bg-sky-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="font-semibold text-sky-700">
              BACKEND: {backendConnected ? 'ONLINE (EXPRESS :3000)' : 'CONNECTING...'}
            </span>
          </div>

          {/* Tactical Network Gateway Node IP */}
          <button
            onClick={() => setShowGatewayInfo(!showGatewayInfo)}
            className="flex items-center gap-1.5 text-xs font-mono px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold transition-colors cursor-pointer"
            title="Internal Tactical Network Gateway"
          >
            <Network className="w-3.5 h-3.5 text-emerald-600" />
            <span>NODE: http://172.10.100.0:3000</span>
            <span className="text-[10px] text-emerald-600 font-normal">● SECNET</span>
          </button>

          <div className="hidden md:flex items-center gap-1.5 text-sky-600 font-mono">
            <Cpu className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-sky-700">SHARDS: 6/6 SYNCED</span>
            <span className="text-sky-300">·</span>
            <span className="text-sky-500">Latency: 1.2ms</span>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 text-sky-600 font-mono">
            <Lock className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-sky-700">GDPR ART 5 &amp; 17: ACTIVE</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-sky-500 text-xs">
            {currentTime}
          </span>
          <button
            onClick={onIngestSimulatedEvent}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-sky-50 border border-sky-200 rounded text-sky-600 transition-colors cursor-pointer text-xs font-mono shadow-xs"
            title="Ingest real event into backend database"
          >
            <Radio className="w-3 h-3 text-sky-400 animate-spin" />
            <span>Ingest Real Event</span>
          </button>
        </div>
      </div>

      {/* Gateway Dropdown / Details Popover */}
      {showGatewayInfo && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2.5 text-xs font-mono text-emerald-900 flex flex-wrap items-center justify-between gap-2 animate-fadeIn">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span><strong>Tactical Gateway:</strong> http://172.10.100.0:3000 (Subnet: 172.10.0.0/16 · Port: 3000 · Wildcard 0.0.0.0)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-emerald-700">Bound: 0.0.0.0:3000 / 172.10.100.0 / 127.0.0.1</span>
            <button
              onClick={() => setShowGatewayInfo(false)}
              className="text-emerald-700 hover:text-emerald-900 text-xs px-1 cursor-pointer"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Main navigation header */}
      <div className="flex items-center justify-between px-4 py-2.5 gap-4">
        {/* Brand identity: PENDARIEL */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="h-9 w-9 bg-sky-50 border border-sky-200 rounded-lg flex items-center justify-center text-sky-500 shadow-xs">
            <Shield className="w-5 h-5 text-sky-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-wider text-sky-600 uppercase font-mono">
                Pendariel
              </span>
            </div>
            <div className="text-[11px] text-sky-400 font-mono flex items-center gap-1">
              <span>Targeted Intelligence &amp; Operations System</span>
            </div>
          </div>
        </div>

        {/* GLOBAL SEARCH BAR: Cross-component search across Intel, Webmail, Deep Web, Agencies */}
        <div className="flex-1 max-w-2xl relative" ref={searchContainerRef}>
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-sky-400 absolute left-3.5 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={globalQuery}
              onChange={(e) => setGlobalQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              placeholder="Cross-component query across Intel, Webmail, Deep Web, Agencies... [Cmd+K]"
              className="w-full bg-sky-50/60 hover:bg-sky-50 focus:bg-white border border-sky-200 focus:border-sky-400 rounded-xl py-2 pl-10 pr-16 text-xs font-mono text-sky-800 placeholder-sky-400 focus:outline-none shadow-xs transition-all"
            />
            <div className="absolute right-3 flex items-center gap-1.5">
              {globalQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setGlobalQuery('');
                    setSearchResults([]);
                  }}
                  className="text-sky-400 hover:text-sky-600 text-xs px-1 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-sky-400 bg-white border border-sky-200 rounded shadow-2xs">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Results Dropdown Box */}
          {isSearchFocused && (globalQuery.trim().length > 0 || isSearching) && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border-2 border-sky-300 rounded-2xl shadow-2xl p-3 z-50 font-mono text-xs max-h-[460px] overflow-y-auto space-y-3">
              {/* Category Filter Pills */}
              <div className="flex items-center justify-between pb-2 border-b border-sky-100 text-[11px]">
                <div className="flex items-center gap-1 overflow-x-auto">
                  {(
                    [
                      { id: 'ALL', label: `All (${searchResults.length})` },
                      { id: 'INTEL', label: `Intel (${categorizedResults.intel.length})` },
                      { id: 'WEBMAIL', label: `Webmail (${categorizedResults.webmail.length})` },
                      { id: 'DEEPWEB', label: `Deep Web (${categorizedResults.deepweb.length})` },
                      { id: 'AGENCY', label: `Agencies (${categorizedResults.agency.length})` },
                      { id: 'FINANCIAL', label: `Financial (${categorizedResults.financial?.length || 0})` },
                    ] as const
                  ).map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSearchCategory(cat.id)}
                      className={`px-2 py-0.5 rounded-lg border transition-colors cursor-pointer font-bold ${
                        searchCategory === cat.id
                          ? 'bg-sky-500 text-white border-sky-600'
                          : 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {isSearching && (
                  <span className="text-sky-400 flex items-center gap-1 animate-pulse">
                    <span>Searching...</span>
                  </span>
                )}
              </div>

              {/* Result Items List */}
              {filteredResults.length === 0 && !isSearching && (
                <div className="p-4 text-center text-sky-400">
                  No matching indicators, webmails, .onion services, or agency dispatches found for &quot;{globalQuery}&quot;.
                </div>
              )}

              <div className="space-y-1.5">
                {filteredResults.map((result) => {
                  const categoryColor =
                    result.category === 'INTEL'
                      ? 'bg-sky-50 text-sky-800 border-sky-200'
                      : result.category === 'WEBMAIL'
                      ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                      : result.category === 'DEEPWEB'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : result.category === 'FINANCIAL'
                      ? 'bg-amber-50 text-amber-900 border-amber-300 font-extrabold'
                      : 'bg-rose-50 text-rose-800 border-rose-200';

                  return (
                    <button
                      key={`${result.category}-${result.id}`}
                      type="button"
                      onClick={() => handleSelectSearchResult(result)}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-sky-50/70 border border-sky-100 hover:border-sky-300 transition-colors flex items-start justify-between gap-3 group cursor-pointer"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${categoryColor}`}>
                            {result.category}
                          </span>
                          <h4 className="text-xs font-bold text-sky-900 group-hover:text-sky-600 line-clamp-1">
                            {result.title}
                          </h4>
                        </div>
                        <p className="text-[11px] text-sky-600 line-clamp-1">
                          {result.snippet}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-sky-400">
                          <span>{result.badge}</span>
                          {result.timestamp && (
                            <>
                              <span>·</span>
                              <span>{new Date(result.timestamp).toLocaleTimeString()}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1 text-[11px] text-sky-500 font-bold group-hover:text-sky-700 pt-1">
                        <span className="hidden sm:inline">Jump</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions & Role Switcher */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Mobile / URL Quick Access Button */}
          <button
            type="button"
            onClick={() => setShowGatewayInfo(!showGatewayInfo)}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-mono transition-colors cursor-pointer shadow-xs"
            title="Mobile & Gateway Network Status"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden lg:inline">Mobile/Gateway</span>
          </button>

          {/* Webmail Quick Trigger */}
          <button
            onClick={() => onSelectTab('webmail')}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition-colors relative cursor-pointer ${
              activeTab === 'webmail'
                ? 'bg-sky-100/80 border-sky-300 text-sky-800 font-semibold shadow-xs'
                : 'bg-white border-sky-200 text-sky-600 hover:bg-sky-50'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-sky-500" />
            <span className="hidden sm:inline">Webmail</span>
            {unreadMailCount > 0 && (
              <span className="ml-1 text-[10px] font-bold bg-sky-200 text-sky-800 px-1 rounded-full">
                {unreadMailCount}
              </span>
            )}
          </button>

          {/* Alerts Trigger */}
          <button
            onClick={() => onSelectTab('alerts')}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition-colors relative cursor-pointer ${
              activeTab === 'alerts'
                ? 'bg-sky-100/80 border-sky-300 text-sky-800 font-semibold shadow-xs'
                : 'bg-white border-sky-200 text-sky-600 hover:bg-sky-50'
            }`}
          >
            <Bell className="w-3.5 h-3.5 text-sky-500" />
            <span className="hidden sm:inline">Alerts</span>
            {unreadAlertsCount > 0 && (
              <span className="ml-1 text-[10px] font-bold bg-rose-500 text-white px-1.5 py-0.2 rounded-full">
                {unreadAlertsCount}
              </span>
            )}
          </button>

          {/* Quick Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-sky-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-700 text-sky-700 dark:text-sky-300 text-xs font-mono transition-colors cursor-pointer shadow-xs"
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle Theme Mode"
          >
            {isDark ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-indigo-500" />
            )}
            <span className="hidden lg:inline">{isDark ? 'Light' : 'Dark'}</span>
          </button>

          {/* User Settings Modal Trigger */}
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-sky-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-700 text-sky-700 dark:text-sky-300 text-xs font-mono transition-colors cursor-pointer shadow-xs"
              title="Operator Settings & Preferences"
              aria-label="Open Settings"
            >
              <Settings className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
              <span className="hidden lg:inline">Settings</span>
            </button>
          )}

          {/* Role Switcher Menu */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-sky-200 rounded-xl hover:bg-sky-50 text-xs font-mono transition-colors cursor-pointer shadow-xs"
            >
              <UserCheck className="w-3.5 h-3.5 text-sky-500" />
              <div className="text-left hidden md:block">
                <div className="font-bold text-sky-700 leading-tight">
                  {currentRole.name}
                </div>
                <div className="text-[10px] text-sky-400 leading-tight">
                  {currentRole.id === 'SUPER_ADMIN' ? 'Default: Xxxgoodname#1' : currentRole.id}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-sky-400" />
            </button>

            {roleMenuOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border-2 border-sky-300 rounded-2xl shadow-xl py-2 z-50 font-mono text-xs">
                <div className="px-3 py-2 border-b border-sky-100 text-[11px] text-sky-400 font-semibold">
                  <div>SIMULATE OPERATIONAL ROLE CLEARANCE</div>
                  {currentRole.id === 'SUPER_ADMIN' && (
                    <div className="mt-1 text-[10px] text-sky-700 bg-sky-50 p-1.5 rounded border border-sky-200 font-bold">
                      Master Account: davidsondks@gmail.com<br />
                      Default Password: <code className="text-sky-900 bg-sky-100 px-1 rounded">Xxxgoodname#1</code>
                    </div>
                  )}
                </div>
                {Object.values(USER_ROLES).map((role) => (
                  <button
                    key={role.id}
                    onClick={() => {
                      onSelectRole(role);
                      setRoleMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 hover:bg-sky-50 flex items-start gap-2.5 transition-colors cursor-pointer ${
                      currentRole.id === role.id ? 'bg-sky-50/80 font-bold text-sky-800' : 'text-sky-600'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
                      currentRole.id === role.id ? 'bg-sky-500' : 'bg-transparent border border-sky-300'
                    }`} />
                    <div>
                      <div className="text-sky-800 font-semibold">{role.name}</div>
                      <div className="text-[10px] text-sky-400">{role.title}</div>
                      <div className="text-[9px] text-sky-500 font-mono">{role.clearance}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Desktop Logout Button */}
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-700 text-xs font-mono transition-colors cursor-pointer shadow-xs"
              title="Log Out to Login Screen"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Log Out</span>
            </button>
          )}

          {/* Mobile Hamburger Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl border border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100 cursor-pointer shadow-xs"
            aria-label="Toggle Navigation Drawer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b-2 border-sky-300 px-4 py-4 space-y-4 font-mono shadow-2xl animate-fadeIn">
          {/* User Account & Clearance in Mobile Menu */}
          <div className="p-3 bg-sky-50 border border-sky-200 rounded-2xl flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-sky-900">
                {currentUser ? currentUser.name : currentRole.name}
              </div>
              <div className="text-[11px] text-sky-600 truncate max-w-[200px]">
                {currentUser?.email || 'davidsondks@gmail.com'}
              </div>
              <div className="text-[10px] font-bold text-sky-500">
                {currentRole.clearance}
              </div>
            </div>
            {onLogout && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
                className="px-2.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            )}
          </div>

          {/* Mobile Theme Toggle & Operator Settings */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-sky-50 dark:bg-slate-800 border border-sky-200 dark:border-slate-700 flex items-center justify-between cursor-pointer font-bold text-sky-800 dark:text-sky-200"
            >
              <div className="flex items-center gap-2">
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
                <span>Theme</span>
              </div>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-sky-200 dark:border-slate-700">
                {isDark ? 'Dark' : 'Light'}
              </span>
            </button>

            {onOpenSettings && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenSettings();
                }}
                className="p-2.5 rounded-xl bg-sky-50 dark:bg-slate-800 border border-sky-200 dark:border-slate-700 flex items-center justify-between cursor-pointer font-bold text-sky-800 dark:text-sky-200"
              >
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-sky-500" />
                  <span>Settings</span>
                </div>
                <span className="text-[10px] text-sky-400 font-mono">Open ›</span>
              </button>
            )}
          </div>

          {/* Mobile Quick Counters */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                onSelectTab('alerts');
                setMobileMenuOpen(false);
              }}
              className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2 text-sky-800 font-bold">
                <Bell className="w-4 h-4 text-sky-500" />
                <span>Alerts</span>
              </div>
              {unreadAlertsCount > 0 && (
                <span className="px-1.5 py-0.5 bg-rose-500 text-white rounded-full text-[10px] font-bold">
                  {unreadAlertsCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                onSelectTab('webmail');
                setMobileMenuOpen(false);
              }}
              className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2 text-sky-800 font-bold">
                <Mail className="w-4 h-4 text-sky-500" />
                <span>Webmail</span>
              </div>
              {unreadMailCount > 0 && (
                <span className="px-1.5 py-0.5 bg-sky-500 text-white rounded-full text-[10px] font-bold">
                  {unreadMailCount}
                </span>
              )}
            </button>
          </div>

          {/* Mobile Navigation Tabs (Touch-friendly 44px targets) */}
          <div className="space-y-1">
            <div className="text-[10px] text-sky-400 font-bold uppercase tracking-wider px-1">
              OPERATIONAL WORKSPACES
            </div>
            <div className="grid grid-cols-1 gap-1 max-h-60 overflow-y-auto pr-1">
              {[
                { id: 'powerbi', label: 'Targeted Search & Analytics' },
                { id: 'financial', label: 'Financial & Market Analysis' },
                { id: 'agencies', label: 'Agency & Media Feeds' },
                { id: 'graph', label: 'Knowledge Graph (D3)' },
                { id: 'deepweb', label: 'Deep Web Explorer (.onion)' },
                { id: 'stream', label: 'Streaming Pipeline' },
                { id: 'apidirectory', label: 'Live Free API Directory' },
                { id: 'privacy', label: 'Privacy & GDPR Vault' },
                { id: 'alerts', label: 'Automated Alerting' },
                { id: 'rbac', label: 'RBAC & Audit Ledger' },
                { id: 'cicd', label: 'CI/CD & Cloud Blueprint' },
                { id: 'webmail', label: 'Secure Webmail' },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      onSelectTab(tab.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-mono transition-colors cursor-pointer flex items-center justify-between ${
                      isActive
                        ? 'bg-sky-500 text-white font-bold shadow-xs'
                        : 'bg-white hover:bg-sky-50 text-sky-700 border border-sky-100'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {isActive && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mobile Copy Public URL Helper */}
          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
              <span>Direct Mobile / PC Cloud URL:</span>
            </div>
            <div className="text-[10px] text-emerald-700 break-all select-all font-mono">
              {window.location.origin}
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(window.location.origin);
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2500);
              }}
              className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Mobile Link'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Primary Section Tabs (Desktop Bar) */}
      <nav className="hidden md:flex items-center px-4 overflow-x-auto gap-1 border-t border-sky-100 bg-white">
        {[
          { id: 'powerbi', label: 'Targeted Search & Analytics' },
          { id: 'financial', label: 'Financial & Market Analysis' },
          { id: 'agencies', label: 'Agency & Media' },
          { id: 'graph', label: 'Knowledge Graph (D3)' },
          { id: 'deepweb', label: 'Deep Web Explorer (.onion)' },
          { id: 'stream', label: 'Streaming Pipeline' },
          { id: 'apidirectory', label: 'Live Free API Directory' },
          { id: 'privacy', label: 'Privacy & GDPR Vault' },
          { id: 'alerts', label: 'Automated Alerting' },
          { id: 'rbac', label: 'RBAC & Audit Ledger' },
          { id: 'cicd', label: 'CI/CD & Cloud Blueprint' },
          { id: 'webmail', label: 'Secure Webmail' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`px-3.5 py-2.5 text-xs font-mono tracking-tight whitespace-nowrap transition-colors cursor-pointer border-b-2 ${
                isActive
                  ? 'border-sky-500 text-sky-700 bg-sky-50/60 font-semibold'
                  : 'border-transparent text-sky-500 hover:text-sky-700 hover:border-sky-200'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
