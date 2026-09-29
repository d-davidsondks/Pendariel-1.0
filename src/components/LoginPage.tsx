/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Smartphone,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  QrCode,
  ExternalLink,
  Crown,
  Key,
  Ban,
  Cpu,
  Globe2,
  Sun,
  Moon,
} from 'lucide-react';
import { UserRole, UserAccount } from '../types/intel';
import { USER_ROLES } from '../data/mockData';
import { ApiClient } from '../services/apiClient';
import { useTheme } from '../context/ThemeContext';

interface LoginPageProps {
  onLoginSuccess: (user: UserAccount, role: UserRole) => void;
  defaultEmail?: string;
  defaultPassword?: string;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  defaultEmail = 'davidsondks@gmail.com',
  defaultPassword = 'Xxxgoodname#1',
}) => {
  const [email, setEmail] = useState<string>(defaultEmail);
  const [password, setPassword] = useState<string>(defaultPassword);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [revokedNotice, setRevokedNotice] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const { isDark, toggleTheme } = useTheme();

  // Available cloud access URLs
  const publicAppUrl = window.location.origin;
  const tacticalGatewayUrl = 'http://172.10.100.0:3000';

  const handleCopyPublicUrl = () => {
    navigator.clipboard.writeText(publicAppUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 3000);
  };

  const handlePerformLogin = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
    const loginEmail = (customEmail ?? email).trim();
    const loginPassword = customPass ?? password;

    if (!loginEmail) {
      setErrorMessage('Please enter an operator email address.');
      return;
    }
    if (!loginPassword) {
      setErrorMessage('Please enter your access password.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setRevokedNotice(null);

    try {
      const response = await ApiClient.login(loginEmail, loginPassword);
      if (response.success && response.user) {
        const authenticatedUser: UserAccount = response.user;
        const matchingRole =
          USER_ROLES[authenticatedUser.roleId as keyof typeof USER_ROLES] || USER_ROLES.SUPER_ADMIN;

        // Persist session if rememberMe checked
        if (rememberMe) {
          localStorage.setItem('pendariel_auth_user', JSON.stringify(authenticatedUser));
          localStorage.setItem('pendariel_auth_role', JSON.stringify(matchingRole));
          if (response.token) {
            localStorage.setItem('pendariel_auth_token', response.token);
          }
        }

        onLoginSuccess(authenticatedUser, matchingRole);
      } else {
        setErrorMessage('Authentication rejected by security gateway.');
      }
    } catch (err: any) {
      const msg = err.message || 'Authentication failed. Please check credentials.';
      if (msg.toLowerCase().includes('revoked')) {
        setRevokedNotice(msg);
      } else {
        setErrorMessage(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectQuickAccount = (acctEmail: string, acctPass: string) => {
    setEmail(acctEmail);
    setPassword(acctPass);
    setErrorMessage(null);
    setRevokedNotice(null);
    handlePerformLogin(undefined, acctEmail, acctPass);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-sky-100 flex flex-col justify-between font-sans selection:bg-sky-100 selection:text-sky-800">
      {/* Top Banner: Tactical Network & Gateway Diagnostics */}
      <div className="bg-sky-900 text-sky-100 text-[11px] font-mono px-4 py-2 border-b border-sky-800 flex flex-wrap items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-white">PENDARIEL SECURE ACCESS GATEWAY</span>
          <span className="text-sky-300">· TLS 1.3 / AES-256</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-sky-800 hover:bg-sky-700 text-sky-200 text-[10px] font-mono cursor-pointer transition-colors border border-sky-700 shadow-xs"
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
          >
            {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-300" />}
            <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <span className="text-sky-300 hidden sm:inline">Tactical Bind: <code className="bg-sky-800/80 px-1.5 py-0.5 rounded text-white">172.10.100.0:3000</code></span>
          <span className="text-emerald-300 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Operational Online</span>
          </span>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Left Column: Login Card (Cols 1-7) */}
          <div className="lg:col-span-7 bg-white border-2 border-sky-300 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 bg-sky-500 rounded-2xl flex items-center justify-center text-white shadow-md shadow-sky-500/20">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold font-mono tracking-wider text-sky-900 uppercase">
                      Pendariel
                    </h1>
                    <p className="text-xs font-mono text-sky-600">
                      Targeted Intelligence & Operations Platform
                    </p>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-sky-50 border border-sky-200 rounded-full text-[11px] font-mono text-sky-700">
                  <Smartphone className="w-3.5 h-3.5 text-sky-500" />
                  <span>Mobile &amp; PC Ready</span>
                </div>
              </div>

              {/* Master Account 1-Tap Quick Action */}
              <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-sky-50 to-indigo-50 border-2 border-sky-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-sky-900">
                      <Crown className="w-4 h-4 text-amber-500" />
                      <span>MASTER ROLE AUTHORITY (SUPER ADMIN)</span>
                    </div>
                    <div className="text-xs font-mono text-sky-700">
                      Account: <strong>davidsondks@gmail.com</strong>
                    </div>
                    <div className="text-[11px] font-mono text-sky-600">
                      Default Password: <code className="bg-white px-1.5 py-0.5 rounded border border-sky-200 font-bold text-sky-900">Xxxgoodname#1</code>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePerformLogin(undefined, 'davidsondks@gmail.com', 'Xxxgoodname#1')}
                    disabled={loading}
                    className="shrink-0 px-3.5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold font-mono shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <span>1-Tap Sign In</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Error / Revocation Alerts */}
              {revokedNotice && (
                <div className="mb-5 p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 font-mono text-xs flex items-start gap-3 animate-shake">
                  <Ban className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold text-rose-800">OPERATIONAL CLEARANCE SUSPENDED</div>
                    <p className="text-[11px] leading-relaxed text-rose-700">{revokedNotice}</p>
                    <p className="text-[10px] text-rose-500">Contact Cmdr. Davidson (davidsondks@gmail.com) for authorization.</p>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="mb-5 p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 font-mono text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Form Input */}
              <form onSubmit={handlePerformLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold font-mono text-sky-900 mb-1.5">
                    OPERATOR EMAIL ADDRESS
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-sky-400 absolute left-3.5 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. davidsondks@gmail.com"
                      className="w-full bg-sky-50/50 hover:bg-sky-50 focus:bg-white border border-sky-300 focus:border-sky-500 rounded-xl py-2.5 pl-10 pr-3 text-xs font-mono text-sky-900 placeholder-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold font-mono text-sky-900">
                      ACCESS PASSWORD
                    </label>
                    <button
                      type="button"
                      onClick={() => setPassword('Xxxgoodname#1')}
                      className="text-[11px] font-mono text-sky-600 hover:text-sky-800 underline cursor-pointer"
                    >
                      Fill Default Password
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-sky-400 absolute left-3.5 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password (e.g. Xxxgoodname#1)"
                      className="w-full bg-sky-50/50 hover:bg-sky-50 focus:bg-white border border-sky-300 focus:border-sky-500 rounded-xl py-2.5 pl-10 pr-10 text-xs font-mono text-sky-900 placeholder-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-sky-400 hover:text-sky-600 cursor-pointer p-1"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-mono pt-1">
                  <label className="flex items-center gap-2 text-sky-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-sky-300 text-sky-600 focus:ring-sky-400 h-4 w-4"
                    />
                    <span>Remember session on this device</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-300 text-white rounded-xl text-xs font-bold font-mono tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>AUTHENTICATING TELEMETRY CLEARANCE...</span>
                    </>
                  ) : (
                    <>
                      <span>AUTHENTICATE &amp; ENTER OPERATIONAL DECK</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Quick Switch Accounts List */}
            <div className="mt-6 pt-4 border-t border-sky-100">
              <div className="text-[11px] font-mono text-sky-500 font-semibold mb-2">
                OPERATIONAL PERSONNEL DIRECTORY (CLICK TO TEST ROLES):
              </div>
              <div className="grid grid-cols-2 gap-2 text-left">
                <button
                  type="button"
                  onClick={() => handleSelectQuickAccount('chen.intel@pendariel.net', 'chen-pass2026')}
                  className="p-2 rounded-xl bg-sky-50/70 hover:bg-sky-100 border border-sky-200 text-left transition-colors cursor-pointer"
                >
                  <div className="font-bold text-sky-900 text-xs truncate">Analyst Sarah Chen</div>
                  <div className="text-[10px] text-sky-600">Threat Analyst · SECRET</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectQuickAccount('compliance.auditor@pendariel.net', 'rostova-pass2026')}
                  className="p-2 rounded-xl bg-sky-50/70 hover:bg-sky-100 border border-sky-200 text-left transition-colors cursor-pointer"
                >
                  <div className="font-bold text-sky-900 text-xs truncate">Auditor Elena Rostova</div>
                  <div className="text-[10px] text-sky-600">Privacy Auditor · GDPR</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectQuickAccount('field.unit9@pendariel.net', 'PND-8fK2#9xM')}
                  className="p-2 rounded-xl bg-sky-50/70 hover:bg-sky-100 border border-sky-200 text-left transition-colors cursor-pointer"
                >
                  <div className="font-bold text-sky-900 text-xs truncate">Agent Marcus Vance</div>
                  <div className="text-[10px] text-sky-600">Field Operator · Temp Pass</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectQuickAccount('davidsondks@gmail.com', 'Xxxgoodname#1')}
                  className="p-2 rounded-xl bg-sky-100/70 hover:bg-sky-200 border border-sky-300 text-left transition-colors cursor-pointer"
                >
                  <div className="font-bold text-sky-900 text-xs truncate">Cmdr. D. Davidson</div>
                  <div className="text-[10px] text-sky-600">Super Admin · Root</div>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Mobile & Computer Access Guide (Cols 8-12) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            
            {/* Live Cloud Access Card */}
            <div className="bg-white border-2 border-emerald-300 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <Globe2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs font-mono text-emerald-900 uppercase">
                      Mobile &amp; Computer Access
                    </h3>
                    <p className="text-[10px] font-mono text-emerald-600">Public Live Cloud Run Host</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                  LIVE NOW
                </span>
              </div>

              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
                <div className="text-[11px] font-mono text-emerald-800 leading-tight">
                  To open on your phone or any PC:
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-emerald-300 font-mono text-[11px] text-emerald-900 break-all select-all flex items-center justify-between gap-2">
                  <span className="truncate">{publicAppUrl}</span>
                  <button
                    type="button"
                    onClick={handleCopyPublicUrl}
                    className="shrink-0 p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg cursor-pointer transition-colors"
                    title="Copy URL"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCopyPublicUrl}
                    className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    {copiedUrl ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Public Link</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowQrModal(true)}
                    className="px-3 py-1.5 bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-800 rounded-xl text-xs font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    title="Scan QR Code on Phone"
                  >
                    <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Scan QR</span>
                  </button>
                </div>
              </div>

              {/* Network Diagnostics Note explaining the screenshot error */}
              <div className="p-3 bg-sky-50 rounded-2xl border border-sky-200 space-y-1.5 text-[11px] font-mono">
                <div className="flex items-center gap-1.5 font-bold text-sky-900">
                  <Cpu className="w-3.5 h-3.5 text-sky-600" />
                  <span>NOTE REGARDING 172.10.100.0</span>
                </div>
                <p className="text-sky-700 leading-relaxed text-[11px]">
                  <strong>http://172.10.100.0:3000</strong> is an internal cluster SecNet IP. Because cellular networks (4G/5G) cannot route to private cluster subnets directly, entering 172.10.100.0 in mobile Chrome causes <code>ERR_CONNECTION_ABORTED</code>.
                </p>
                <p className="text-sky-800 font-semibold text-[11px]">
                  ✓ On your mobile device, visit the HTTPS link above to open Pendariel seamlessly!
                </p>
              </div>
            </div>

            {/* Platform Features Badge Grid */}
            <div className="bg-white border-2 border-sky-200 rounded-3xl p-5 shadow-lg space-y-3">
              <div className="font-mono text-xs font-bold text-sky-900 uppercase">
                Enterprise Platform Capabilities
              </div>
              <div className="space-y-2 text-xs font-mono text-sky-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                  <span>Strategic Agency Feeds: US Military, CIA, FBI, Mossad, CNN, BBC</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                  <span>Cross-Component Global Search across Intel, Mail &amp; Deep Web</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                  <span>Master Access Control &amp; 1-Click Role Revocation</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                  <span>Adaptive Responsive Interface for Mobile, Tablet &amp; PC</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* QR Code Modal for Instant Mobile Scan */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-sky-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border-2 border-sky-300 shadow-2xl text-center space-y-4 font-mono animate-scaleIn">
            <div className="flex items-center justify-between pb-2 border-b border-sky-100">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-sky-600" />
                <span className="font-bold text-xs text-sky-900">SCAN WITH MOBILE CAMERA</span>
              </div>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="text-sky-400 hover:text-sky-700 text-base font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Generated QR Representation */}
            <div className="bg-sky-50 p-4 rounded-2xl border border-sky-200 inline-block mx-auto">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(publicAppUrl)}`}
                alt="Scan to open Pendariel on Mobile"
                className="w-48 h-48 rounded-xl shadow-xs mx-auto"
                onError={(e) => {
                  // Fallback if external image blocked
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>

            <div className="space-y-1 text-xs text-sky-700">
              <p className="font-bold text-sky-900">Open Chrome or Camera on your phone</p>
              <p className="text-[11px] text-sky-600">Scan this code to launch Pendariel immediately on your mobile browser.</p>
            </div>

            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-sky-200 bg-white py-3 px-6 text-center text-xs font-mono text-sky-500">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <span>PENDARIEL // OPERATIONAL COMMAND CONSOLE</span>
          <span className="text-[11px] text-sky-400">Master Authority: davidsondks@gmail.com</span>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>Multi-Device Ready (Mobile &amp; PC)</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
