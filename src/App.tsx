/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { PowerBiCanvas } from './components/tabs/PowerBiCanvas';
import { DataStreamView } from './components/tabs/DataStreamView';
import { ApiDirectoryView } from './components/tabs/ApiDirectoryView';
import { PrivacyVaultView } from './components/tabs/PrivacyVaultView';
import { AlertsView } from './components/tabs/AlertsView';
import { RbacAuditView } from './components/tabs/RbacAuditView';
import { CicdCloudView } from './components/tabs/CicdCloudView';
import { WebmailView } from './components/tabs/WebmailView';
import { KnowledgeGraphView } from './components/tabs/KnowledgeGraphView';
import { DeepWebView } from './components/tabs/DeepWebView';
import { AgencyFeedsView } from './components/tabs/AgencyFeedsView';
import { FinancialAnalysisView } from './components/tabs/FinancialAnalysisView';
import { ExportDossierModal } from './components/modals/ExportDossierModal';
import { UserSettingsModal } from './components/modals/UserSettingsModal';
import { ThemeProvider } from './context/ThemeContext';
import {
  UserRole,
  IntelligenceItem,
  UserAccount,
} from './types/intel';
import { USER_ROLES } from './data/mockData';
import { ApiClient } from './services/apiClient';
import { LoginPage } from './components/LoginPage';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>(USER_ROLES.SUPER_ADMIN);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authChecked, setAuthChecked] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('powerbi');
  const [backendConnected, setBackendConnected] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState<number>(2);
  const [unreadMailCount, setUnreadMailCount] = useState<number>(1);
  const [intelItems, setIntelItems] = useState<IntelligenceItem[]>([]);

  // Export modal state
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [dossierItem, setDossierItem] = useState<IntelligenceItem | undefined>(undefined);

  // User Settings Modal state
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const triggerGlobalRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  // Check persisted session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const storedUser = localStorage.getItem('pendariel_auth_user');
        const storedRole = localStorage.getItem('pendariel_auth_role');
        if (storedUser) {
          const user: UserAccount = JSON.parse(storedUser);
          if (user.status !== 'REVOKED') {
            setCurrentUser(user);
            setIsAuthenticated(true);
            if (storedRole) {
              setCurrentRole(JSON.parse(storedRole));
            }
            // Load user-specific default workspace if saved
            try {
              const uKey = user.email || user.id;
              const savedSettings = localStorage.getItem(`pendariel_settings_${uKey}`);
              if (savedSettings) {
                const parsed = JSON.parse(savedSettings);
                if (parsed.defaultWorkspaceTab) {
                  setActiveTab(parsed.defaultWorkspaceTab);
                }
              }
            } catch (_) {}
          } else {
            localStorage.removeItem('pendariel_auth_user');
            localStorage.removeItem('pendariel_auth_role');
            localStorage.removeItem('pendariel_auth_token');
            setIsAuthenticated(false);
          }
        }
      } catch (err) {
        setIsAuthenticated(false);
      } finally {
        setAuthChecked(true);
      }
    };
    checkSession();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('pendariel_auth_user');
    localStorage.removeItem('pendariel_auth_role');
    localStorage.removeItem('pendariel_auth_token');
    setCurrentUser(null);
    setIsAuthenticated(false);
    showToast('Logged out to Security Gateway');
  };

  const handleLoginSuccess = (user: UserAccount, role: UserRole) => {
    setCurrentUser(user);
    setCurrentRole(role);
    setIsAuthenticated(true);
    try {
      const uKey = user.email || user.id;
      const savedSettings = localStorage.getItem(`pendariel_settings_${uKey}`);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.defaultWorkspaceTab) {
          setActiveTab(parsed.defaultWorkspaceTab);
        }
      }
    } catch (_) {}
    showToast(`Access Granted: ${user.name}`);
  };

  // Verify backend health on mount
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await ApiClient.fetchHealth();
        if (res.status === 'UP') {
          setBackendConnected(true);
        }
      } catch (err) {
        console.error('Backend connecting...', err);
        setBackendConnected(false);
      }
    };
    checkBackend();
    const interval = setInterval(checkBackend, 5000);
    return () => clearInterval(interval);
  }, []);

  // Update counts & intel items
  useEffect(() => {
    const fetchData = async () => {
      try {
        const mail = await ApiClient.fetchWebmail();
        setUnreadMailCount(mail.filter((m) => m.unread).length);

        const intelRes = await ApiClient.fetchIntel();
        if (intelRes && intelRes.hits) {
          setIntelItems(intelRes.hits);
        }
      } catch (err) {
        // quiet
      }
    };
    fetchData();
  }, [refreshTrigger]);

  const handleSimulateRealEvent = async () => {
    const titles = [
      'Anomalous TLS Tunneling on DNS Port 53',
      'High-Risk Ransomware Canary File Alteration',
      'SCADA Modbus Coils Forced Reconfiguration',
      'BGP Transit Route Leak on European Diplomatic Backbone',
    ];
    const pickedTitle = titles[Math.floor(Math.random() * titles.length)];

    try {
      const res = await ApiClient.ingestIntel({
        title: pickedTitle,
        summary: `Automated anomaly trigger identified by neural pattern matching on European backhaul nodes.`,
        rawPayload: JSON.stringify({
          target: 'gateway.energy-grid.eu',
          analyst: 'sarah.chen@energy-defense.eu',
          ip: '194.26.29.112',
          risk_index: 94,
        }),
        source: 'Pendariel Neural Scanner',
        category: 'CYBER_ATTACK',
        severity: 'CRITICAL',
        sector: 'CRITICAL_INFRA',
        region: 'EUROPE',
        confidence: 96,
        iocs: {
          ips: ['194.26.29.112'],
          domains: ['gateway.energy-grid.eu'],
          cves: ['CVE-2026-4418'],
        },
        actor: currentRole.name,
      });

      if (res.success) {
        triggerGlobalRefresh();
        showToast(`Ingested real backend event: ${res.item.id}`);
      }
    } catch (err) {
      console.error('Ingest event error:', err);
    }
  };

  if (authChecked && !isAuthenticated) {
    return (
      <ThemeProvider currentUser={currentUser}>
        <LoginPage
          onLoginSuccess={handleLoginSuccess}
          defaultEmail="davidsondks@gmail.com"
          defaultPassword="Xxxgoodname#1"
        />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider currentUser={currentUser}>
      <div className="min-h-screen bg-white dark:bg-slate-950 text-sky-600 dark:text-sky-300 flex flex-col font-sans selection:bg-sky-100 selection:text-sky-800 transition-colors">
        {/* Toast popup */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-white dark:bg-slate-900 border border-sky-400 dark:border-sky-600 text-sky-800 dark:text-sky-100 px-4 py-2.5 rounded-xl shadow-xl text-xs font-mono flex items-center gap-2 animate-bounce">
            <span className="h-2 w-2 rounded-full bg-sky-500" />
            <span className="font-semibold">{toastMessage}</span>
          </div>
        )}

        {/* Main Navbar */}
        <Navbar
          currentUser={currentUser}
          currentRole={currentRole}
          onSelectRole={(r) => {
            setCurrentRole(r);
            showToast(`Active Role: ${r.name}`);
          }}
          unreadAlertsCount={unreadAlertsCount}
          unreadMailCount={unreadMailCount}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onIngestSimulatedEvent={handleSimulateRealEvent}
          backendConnected={backendConnected}
          onGlobalSearchSelect={(tab, item) => {
            setActiveTab(tab);
            showToast(`Navigated to ${tab.toUpperCase()}: ${item.title.slice(0, 30)}...`);
          }}
          onLogout={handleLogout}
          onOpenSettings={() => setShowSettingsModal(true)}
        />

      {/* Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {activeTab === 'powerbi' && (
          <PowerBiCanvas
            currentRole={currentRole}
            onOpenExportDossier={(item) => {
              setDossierItem(item);
              setShowExportModal(true);
            }}
            onInspectItem={(item) => {
              setDossierItem(item);
              setShowExportModal(true);
            }}
            refreshTrigger={refreshTrigger}
          />
        )}

        {activeTab === 'agencies' && (
          <AgencyFeedsView
            currentRole={currentRole}
            onIngestSuccess={() => {
              triggerGlobalRefresh();
              showToast('Agency intelligence dispatch ingested into Kafka & Elasticsearch');
            }}
          />
        )}

        {activeTab === 'graph' && (
          <KnowledgeGraphView
            currentRole={currentRole}
            intelItems={intelItems}
            onOpenIncident={(id) => {
              setActiveTab('powerbi');
            }}
          />
        )}

        {activeTab === 'deepweb' && (
          <DeepWebView
            currentRole={currentRole}
            onIngestThreat={() => {
              triggerGlobalRefresh();
              showToast('Deep web IOC ingested into intelligence database');
            }}
          />
        )}

        {activeTab === 'stream' && (
          <DataStreamView
            currentRole={currentRole}
            onItemIngested={triggerGlobalRefresh}
          />
        )}

        {activeTab === 'apidirectory' && (
          <ApiDirectoryView currentRole={currentRole} />
        )}

        {activeTab === 'privacy' && (
          <PrivacyVaultView
            currentRole={currentRole}
            onAuditUpdated={triggerGlobalRefresh}
          />
        )}

        {activeTab === 'alerts' && (
          <AlertsView
            currentRole={currentRole}
            onAlertTriggered={() => {
              triggerGlobalRefresh();
              showToast('Alert notification dispatched to webmail');
            }}
          />
        )}

        {activeTab === 'rbac' && (
          <RbacAuditView
            currentRole={currentRole}
            onSelectRole={setCurrentRole}
            refreshTrigger={refreshTrigger}
            onRoleAssigned={() => {
              triggerGlobalRefresh();
              showToast('Role assignment updated successfully');
            }}
          />
        )}

        {activeTab === 'cicd' && (
          <CicdCloudView
            currentRole={currentRole}
            onDeployComplete={() => {
              triggerGlobalRefresh();
              showToast('Production deployment verified on Cloud Run');
            }}
          />
        )}

        {activeTab === 'financial' && (
          <FinancialAnalysisView
            currentRole={currentRole}
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === 'webmail' && (
          <WebmailView
            currentRole={currentRole}
            onOpenItemDetail={(intelId) => {
              setActiveTab('powerbi');
            }}
            refreshTrigger={refreshTrigger}
          />
        )}
      </main>

      {/* Export Dossier Modal */}
      {showExportModal && (
        <ExportDossierModal
          item={dossierItem}
          allItems={[]}
          currentRole={currentRole}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {/* User-Specific Settings Panel Modal */}
      {showSettingsModal && (
        <UserSettingsModal
          currentUser={currentUser}
          currentRole={currentRole}
          onClose={() => setShowSettingsModal(false)}
          onShowToast={showToast}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-sky-100 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 px-6 text-center text-xs font-mono text-sky-500 dark:text-sky-400 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-center">
          <div className="font-semibold text-sky-700 dark:text-sky-300">
            PENDARIEL // AUTONOMOUS TARGETED INTELLIGENCE & OPERATIONS PLATFORM
          </div>
        </div>
      </footer>
    </div>
  </ThemeProvider>
);
}
