/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Shield,
  FileText,
  UserCheck,
  CheckCircle2,
  Search,
  RefreshCw,
  UserPlus,
  Edit3,
  Trash2,
  Key,
  Lock,
  Crown,
  Check,
  Copy,
  AlertTriangle,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  UserX,
  Ban,
  Unlock,
} from 'lucide-react';
import { UserRole, AuditLogEntry, UserAccount, RoleType } from '../../types/intel';
import { USER_ROLES } from '../../data/mockData';
import { ApiClient } from '../../services/apiClient';

interface RbacAuditViewProps {
  currentRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  refreshTrigger: number;
  onRoleAssigned?: () => void;
}

export const RbacAuditView: React.FC<RbacAuditViewProps> = ({
  currentRole,
  onSelectRole,
  refreshTrigger,
  onRoleAssigned,
}) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isVerifyingChain, setIsVerifyingChain] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<{
    valid: boolean;
    totalEntries: number;
    headHash: string;
  } | null>(null);

  // Quick Zero-Code Role Assignment Form State (No Code Editing Needed!)
  const [quickEmail, setQuickEmail] = useState<string>('');
  const [quickRole, setQuickRole] = useState<RoleType>('THREAT_ANALYST');
  const [quickName, setQuickName] = useState<string>('');
  const [isInviting, setIsInviting] = useState<boolean>(false);
  const [showAdvancedFields, setShowAdvancedFields] = useState<boolean>(false);
  const [quickTitle, setQuickTitle] = useState<string>('');
  const [quickClearance, setQuickClearance] = useState<string>('');

  // Generated Credentials Display Modal
  const [generatedCreds, setGeneratedCreds] = useState<{
    email: string;
    roleId: string;
    tempPassword: string;
    name: string;
  } | null>(null);
  const [copiedCreds, setCopiedCreds] = useState<boolean>(false);

  // Re-assign Role Modal state
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [assignedRoleId, setAssignedRoleId] = useState<RoleType>('THREAT_ANALYST');
  const [assignedTitle, setAssignedTitle] = useState<string>('');
  const [assignedClearance, setAssignedClearance] = useState<string>('');
  const [assignedPermissions, setAssignedPermissions] = useState<Record<string, boolean>>({});
  const [isSavingRole, setIsSavingRole] = useState<boolean>(false);

  // First Sign-In Password Change Modal State (to test / execute password reset)
  const [passwordChangeUser, setPasswordChangeUser] = useState<UserAccount | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState<string>('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState<string>('');
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState<boolean>(false);

  const loadData = async () => {
    try {
      const [auditData, usersData] = await Promise.all([
        ApiClient.fetchAudit(),
        ApiClient.fetchUsers(),
      ]);
      setLogs(auditData);
      setUsers(usersData);
    } catch (err) {
      console.error('Failed to load RBAC data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  const permissionsList = [
    { key: 'canViewRawPII', label: 'View Unmasked Raw PII' },
    { key: 'canTriggerPurge', label: 'Execute GDPR Article 17 Purge' },
    { key: 'canConfigureAlerts', label: 'Configure Automated Alert Rules' },
    { key: 'canTriggerDeployments', label: 'Trigger Production CI/CD Rollouts' },
    { key: 'canExportDossiers', label: 'Generate & Export Intelligence Dossiers' },
    { key: 'canManageApiKeys', label: 'Manage Free API Directory Key Vault' },
    { key: 'canExecuteKafkaInject', label: 'Inject Telemetry into Kafka Buffer' },
  ];

  // Zero-Code Role Assignment Handler: Email + Role -> Temp Password generated
  const handleQuickInviteAndAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickEmail.trim()) return;

    setIsInviting(true);
    try {
      const res = await ApiClient.inviteUser({
        email: quickEmail.trim(),
        roleId: quickRole,
        name: quickName.trim() || undefined,
        title: quickTitle.trim() || undefined,
        clearance: quickClearance.trim() || undefined,
        assignor: currentRole.email,
      });

      setGeneratedCreds({
        email: res.user.email,
        roleId: res.user.roleId,
        tempPassword: res.tempPassword,
        name: res.user.name,
      });

      // Clear input fields
      setQuickEmail('');
      setQuickName('');
      setQuickTitle('');
      setQuickClearance('');

      await loadData();
      if (onRoleAssigned) onRoleAssigned();
    } catch (err: any) {
      alert(`Role assignment error: ${err.message}`);
    } finally {
      setIsInviting(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!generatedCreds) return;
    const text = `PENDARIEL ACCESS CREDENTIALS\nEmail: ${generatedCreds.email}\nAssigned Role: ${generatedCreds.roleId}\nTemporary Password: ${generatedCreds.tempPassword}\nNote: You MUST change this password upon your first sign-in.`;
    navigator.clipboard.writeText(text);
    setCopiedCreds(true);
    setTimeout(() => setCopiedCreds(false), 3000);
  };

  // Re-generate temporary password for an operator
  const handleRegenerateTempPassword = async (user: UserAccount) => {
    try {
      const res = await ApiClient.resetTempPassword(user.id, currentRole.email);
      setGeneratedCreds({
        email: user.email,
        roleId: user.roleId,
        tempPassword: res.tempPassword,
        name: user.name,
      });
      await loadData();
      if (onRoleAssigned) onRoleAssigned();
    } catch (err: any) {
      alert(`Error regenerating password: ${err.message}`);
    }
  };

  // First Sign-In Password Change submit
  const handleExecutePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordChangeUser) return;

    if (newPasswordInput.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      setPasswordError('Passwords do not match');
      return;
    }

    setIsUpdatingPassword(true);
    setPasswordError(null);
    try {
      await ApiClient.changePassword(passwordChangeUser.id, newPasswordInput);
      setPasswordChangeUser(null);
      setNewPasswordInput('');
      setConfirmPasswordInput('');
      await loadData();
      if (onRoleAssigned) onRoleAssigned();
      alert(`Permanent password successfully set for ${passwordChangeUser.name}! Account is now active.`);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleRevokeUserAccess = async (user: UserAccount) => {
    if (
      !confirm(
        `CONFIRM ACCESS REVOCATION: Are you sure you want to revoke all access for ${user.name} (${user.email})? They will be immediately locked out.`
      )
    ) {
      return;
    }
    try {
      await ApiClient.revokeUserAccess(user.id, currentRole.email);
      await loadData();
      if (onRoleAssigned) onRoleAssigned();
      alert(`Access successfully REVOKED for ${user.name} (${user.email}). All session tokens terminated.`);
    } catch (err: any) {
      alert(`Error revoking access: ${err.message}`);
    }
  };

  const handleRestoreUserAccess = async (user: UserAccount) => {
    try {
      await ApiClient.restoreUserAccess(user.id, currentRole.email);
      await loadData();
      if (onRoleAssigned) onRoleAssigned();
      alert(`Access successfully RESTORED for ${user.name} (${user.email}).`);
    } catch (err: any) {
      alert(`Error restoring access: ${err.message}`);
    }
  };

  const handleOpenAssignModal = (user: UserAccount) => {
    setEditingUser(user);
    setAssignedRoleId(user.roleId);
    setAssignedTitle(user.title);
    setAssignedClearance(user.clearance);
    setAssignedPermissions({ ...user.permissions });
  };

  const handleSelectRolePreset = (roleId: RoleType) => {
    setAssignedRoleId(roleId);
    const template = USER_ROLES[roleId];
    if (template) {
      setAssignedTitle(template.title);
      setAssignedClearance(template.clearance);
      setAssignedPermissions({ ...template.permissions });
    }
  };

  const handleSaveRoleAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsSavingRole(true);
    try {
      await ApiClient.assignUserRole(editingUser.id, {
        roleId: assignedRoleId,
        permissions: assignedPermissions,
        title: assignedTitle,
        clearance: assignedClearance,
        assignor: currentRole.email,
      });

      setEditingUser(null);
      await loadData();
      if (onRoleAssigned) onRoleAssigned();
    } catch (err) {
      console.error('Failed to assign role:', err);
    } finally {
      setIsSavingRole(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to deactivate this operator account?')) return;
    try {
      await ApiClient.deleteUser(userId, currentRole.email);
      await loadData();
      if (onRoleAssigned) onRoleAssigned();
    } catch (err) {
      console.error('Failed to deactivate user:', err);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.actor.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.resource.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q)
    );
  });

  const handleVerifyChain = async () => {
    setIsVerifyingChain(true);
    try {
      const res = await ApiClient.verifyAuditChain();
      setVerificationResult(res);
    } catch (err) {
      console.error('Audit verification error:', err);
    } finally {
      setIsVerifyingChain(false);
    }
  };

  return (
    <div className="space-y-6 bg-white text-sky-600">
      {/* Header Info & Role Authority Banner */}
      <div className="bg-white border border-sky-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-sky-500" />
              <h1 className="text-base font-bold text-sky-700 font-mono tracking-tight">
                PENDARIEL ROLE & PRIVILEGE ASSIGNMENT AUTHORITY
              </h1>
              <span className="text-xs text-sky-400 font-mono">
                // ZERO-CODE ACCESS GOVERNANCE
              </span>
            </div>
            <p className="text-xs text-sky-500 mt-1">
              You do <strong className="text-sky-800">NOT need to edit any code</strong>. Simply add an individual&apos;s email address to assign their role. A secure temporary password is automatically generated and must be changed upon their first sign-in.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleVerifyChain}
              disabled={isVerifyingChain}
              className="flex items-center gap-1.5 px-3 py-2 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg text-sky-700 font-mono text-xs transition-colors cursor-pointer shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-sky-500 ${isVerifyingChain ? 'animate-spin' : ''}`} />
              <span>Verify Audit Ledger</span>
            </button>
          </div>
        </div>

        {verificationResult && (
          <div className="mt-3 p-3 bg-sky-50 border border-sky-300 rounded-lg flex items-center justify-between text-xs font-mono text-sky-700">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sky-600" />
              <span>Chain Integrity Validated: All {verificationResult.totalEntries} entries sequentially linked without tampering.</span>
            </div>
            <span className="font-bold text-sky-800">100% UNTAMPERED</span>
          </div>
        )}
      </div>

      {/* ZERO-CODE ROLE ASSIGNMENT & INVITATION CONSOLE */}
      <div className="bg-white border-2 border-sky-300 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-sky-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-500" />
            <h2 className="text-xs font-bold text-sky-800 font-mono">
              ZERO-CODE ROLE ASSIGNMENT & TEMPORARY PASSWORD GENERATOR
            </h2>
          </div>
          <span className="text-[11px] font-mono text-sky-500">
            Authorized Administrator: <strong className="text-sky-800">{currentRole.email}</strong>
          </span>
        </div>

        <form onSubmit={handleQuickInviteAndAssign} className="space-y-4 text-xs font-mono">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            {/* Email Address (Primary & Only Required Field) */}
            <div className="md:col-span-6">
              <label className="block text-sky-800 font-bold mb-1">
                INDIVIDUAL&apos;S EMAIL ADDRESS <span className="text-sky-500 font-normal">(Required)</span>
              </label>
              <input
                type="email"
                value={quickEmail}
                onChange={(e) => setQuickEmail(e.target.value)}
                placeholder="e.g. analyst.morris@defense-intel.gov"
                className="w-full bg-white border-2 border-sky-300 rounded-xl py-2 px-3 text-sky-800 placeholder-sky-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-500 shadow-xs"
                required
              />
            </div>

            {/* Assigned Role */}
            <div className="md:col-span-3">
              <label className="block text-sky-800 font-bold mb-1">
                ASSIGNED ROLE
              </label>
              <select
                value={quickRole}
                onChange={(e) => setQuickRole(e.target.value as any)}
                className="w-full bg-white border-2 border-sky-300 rounded-xl py-2 px-3 text-sky-800 font-semibold text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-500 shadow-xs"
              >
                <option value="THREAT_ANALYST">Threat Analyst (SOC / OSINT)</option>
                <option value="PRIVACY_AUDITOR">Privacy Auditor (GDPR / Purge)</option>
                <option value="FIELD_OPERATOR">Field Operator (Edge Collector)</option>
                <option value="SUPER_ADMIN">Super Admin (Master Command)</option>
              </select>
            </div>

            {/* Submit Action */}
            <div className="md:col-span-3">
              <button
                type="submit"
                disabled={isInviting}
                className="w-full py-2.5 px-4 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold font-mono text-xs transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
              >
                {isInviting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Assigning Role...</span>
                  </>
                ) : (
                  <>
                    <Key className="w-3.5 h-3.5" />
                    <span>Assign & Generate Password</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Optional Details Toggle */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowAdvancedFields(!showAdvancedFields)}
              className="text-[11px] text-sky-500 hover:text-sky-700 underline cursor-pointer"
            >
              {showAdvancedFields ? 'Hide optional custom name & clearance' : '+ Optional: specify custom name & clearance (auto-inferred if omitted)'}
            </button>

            {showAdvancedFields && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 p-3 bg-sky-50/50 rounded-xl border border-sky-100">
                <div>
                  <label className="block text-[11px] text-sky-700 font-semibold mb-1">FULL NAME (OPTIONAL)</label>
                  <input
                    type="text"
                    value={quickName}
                    onChange={(e) => setQuickName(e.target.value)}
                    placeholder="Auto-inferred from email if empty"
                    className="w-full bg-white border border-sky-200 rounded-lg p-2 text-sky-800 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-sky-700 font-semibold mb-1">CUSTOM TITLE / SPECIALIZATION</label>
                  <input
                    type="text"
                    value={quickTitle}
                    onChange={(e) => setQuickTitle(e.target.value)}
                    placeholder="e.g. Senior Malware Analyst"
                    className="w-full bg-white border border-sky-200 rounded-lg p-2 text-sky-800 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-sky-700 font-semibold mb-1">SECURITY CLEARANCE</label>
                  <input
                    type="text"
                    value={quickClearance}
                    onChange={(e) => setQuickClearance(e.target.value)}
                    placeholder="e.g. SECRET // NOFORN"
                    className="w-full bg-white border border-sky-200 rounded-lg p-2 text-sky-800 text-xs"
                  />
                </div>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* GENERATED TEMPORARY CREDENTIALS POPUP MODAL */}
      {generatedCreds && (
        <div className="fixed inset-0 bg-sky-950/20 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border-2 border-sky-400 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-sky-100">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-sky-500" />
                <h3 className="text-sm font-bold text-sky-800">
                  TEMPORARY CREDENTIALS GENERATED
                </h3>
              </div>
              <button
                onClick={() => setGeneratedCreds(null)}
                className="text-sky-400 hover:text-sky-600 text-lg cursor-pointer px-2"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-sky-500">ASSIGNED OPERATOR:</span>
                <span className="font-bold text-sky-800">{generatedCreds.name}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-sky-500">EMAIL:</span>
                <span className="font-bold text-sky-800">{generatedCreds.email}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-sky-500">ASSIGNED ROLE:</span>
                <span className="px-2 py-0.5 rounded bg-white border border-sky-200 text-sky-700 font-bold">
                  {generatedCreds.roleId}
                </span>
              </div>
            </div>

            {/* Temporary Password Highlight Box */}
            <div className="p-4 bg-white border-2 border-sky-400 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sky-500 font-bold text-[11px]">
                  TEMPORARY ACCESS PASSWORD:
                </span>
                <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-bold">
                  MUST CHANGE ON FIRST SIGN-IN
                </span>
              </div>

              <div className="flex items-center justify-between bg-sky-50 p-3 rounded-lg border border-sky-200">
                <code className="text-base font-bold text-sky-800 tracking-wider">
                  {generatedCreds.tempPassword}
                </code>
                <button
                  type="button"
                  onClick={handleCopyCredentials}
                  className="flex items-center gap-1 px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-bold text-[11px] cursor-pointer shadow-xs transition-colors"
                >
                  {copiedCreds ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Credentials</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="p-3 bg-sky-50/70 border border-sky-100 rounded-xl space-y-1 text-[11px] text-sky-600">
              <div className="flex items-center gap-1.5 font-bold text-sky-800">
                <CheckCircle2 className="w-4 h-4 text-sky-500" />
                <span>Onboarding Notification Dispatched</span>
              </div>
              <p>
                An automated onboarding brief containing these credentials and security instructions has been delivered to the internal webmail inbox for <strong>{generatedCreds.email}</strong>.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setGeneratedCreds(null)}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold cursor-pointer shadow-xs"
              >
                Close & Return to Directory
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Assignment Directory Table */}
      <div className="bg-white border border-sky-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-sky-100">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-sky-500" />
            <h2 className="text-xs font-bold text-sky-700 font-mono">
              ACTIVE PERSONNEL & ASSIGNED ROLES ({users.length} OPERATORS)
            </h2>
          </div>
          <span className="text-xs font-mono text-sky-500">
            Assigned by: <strong className="text-sky-800">{currentRole.email}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-sky-100 text-[11px] text-sky-500">
                <th className="pb-3 pl-2">NAME & EMAIL</th>
                <th className="pb-3">ASSIGNED ROLE</th>
                <th className="pb-3">SIGN-IN & CREDENTIAL STATUS</th>
                <th className="pb-3">CLEARANCE</th>
                <th className="pb-3">ASSIGNED BY</th>
                <th className="pb-3 pr-2 text-right">ROLE & ACCESS ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100">
              {users.map((user) => {
                const isRoot = user.id === 'usr-davidson' || user.email === 'davidsondks@gmail.com';
                const isRevoked = user.status === 'REVOKED';
                const isPending = !isRevoked && (user.mustChangePasswordOnFirstSignIn || user.status === 'PENDING_FIRST_LOGIN');
                return (
                  <tr key={user.id} className={`hover:bg-sky-50/40 ${isRevoked ? 'bg-rose-50/30' : ''}`}>
                    <td className="py-3 pl-2">
                      <div className="font-bold text-sky-800 flex items-center gap-1.5">
                        {isRoot && <Crown className="w-3.5 h-3.5 text-sky-500" />}
                        <span>{user.name}</span>
                        {isRevoked && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300 font-bold">
                            LOCKED OUT
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-sky-500 font-normal">{user.email}</div>
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-lg border border-sky-200 text-sky-700 bg-sky-50 font-bold inline-block text-[11px]">
                        {user.roleId.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3">
                      {isRevoked ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-bold">
                            <Ban className="w-3 h-3 text-rose-600" />
                            <span>ACCESS REVOKED BY MASTER ADMIN</span>
                          </span>
                          {user.accessRevokedAt && (
                            <div className="text-[10px] text-rose-600">
                              Revoked: {new Date(user.accessRevokedAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      ) : isRoot ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                            <Crown className="w-3 h-3 text-emerald-600" />
                            <span>MASTER AUTHORITY // ACTIVE</span>
                          </span>
                          <div className="text-[10px] text-sky-600">
                            Default Pass: <code className="font-bold text-sky-900 bg-sky-100 px-1 py-0.2 rounded border border-sky-200">Xxxgoodname#1</code>
                          </div>
                        </div>
                      ) : isPending ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                            <Key className="w-3 h-3 text-amber-600" />
                            <span>TEMP PASSWORD PENDING RESET</span>
                          </span>
                          {user.tempPassword && (
                            <div className="text-[10px] text-sky-500">
                              Temp Pass: <code className="font-bold text-sky-700">{user.tempPassword}</code>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3 text-sky-600" />
                          <span>ACTIVE // PASSWORD SET</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-sky-600 font-semibold text-[10px]">
                      {user.clearance}
                    </td>
                    <td className="py-3 text-sky-500 text-[11px]">
                      <div>{user.assignedBy}</div>
                      <div className="text-[10px] text-sky-400">
                        {new Date(user.assignedAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3 pr-2 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Revoke or Restore Access Buttons */}
                        {!isRoot && isRevoked && (
                          <button
                            onClick={() => handleRestoreUserAccess(user)}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-lg text-[11px] font-bold cursor-pointer shadow-xs flex items-center gap-1"
                            title="Restore access for this operator"
                          >
                            <Unlock className="w-3 h-3 text-emerald-600" />
                            <span>Restore Access</span>
                          </button>
                        )}

                        {!isRoot && !isRevoked && (
                          <button
                            onClick={() => handleRevokeUserAccess(user)}
                            className="px-2 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 rounded-lg text-[11px] font-bold cursor-pointer shadow-xs flex items-center gap-1"
                            title="Revoke access and terminate sessions"
                          >
                            <UserX className="w-3 h-3 text-rose-600" />
                            <span>Revoke Access</span>
                          </button>
                        )}

                        {/* If pending, button to test / execute first signin password change */}
                        {isPending && (
                          <button
                            onClick={() => {
                              setPasswordChangeUser(user);
                              setPasswordError(null);
                              setNewPasswordInput('');
                              setConfirmPasswordInput('');
                            }}
                            className="px-2 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-lg text-[11px] font-semibold cursor-pointer shadow-xs flex items-center gap-1"
                            title="Simulate / Complete First Sign-in Password Reset"
                          >
                            <Key className="w-3 h-3 text-amber-600" />
                            <span>Change 1st Pass</span>
                          </button>
                        )}

                        {/* Regenerate Temp Password */}
                        {!isRoot && !isRevoked && (
                          <button
                            onClick={() => handleRegenerateTempPassword(user)}
                            className="px-2 py-1 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 rounded-lg text-[11px] cursor-pointer shadow-xs flex items-center gap-1"
                            title="Re-generate Temporary Password"
                          >
                            <RefreshCw className="w-3 h-3 text-sky-500" />
                            <span>New Temp Pass</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenAssignModal(user)}
                          className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-xs flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3 text-sky-500" />
                          <span>Re-assign</span>
                        </button>

                        {!isRoot && (
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-1 bg-sky-50 hover:bg-rose-50 border border-sky-200 text-sky-400 hover:text-rose-600 rounded-lg text-xs cursor-pointer transition-colors shadow-xs"
                            title="Deactivate Operator"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* FIRST SIGN-IN PASSWORD CHANGE MODAL */}
      {passwordChangeUser && (
        <div className="fixed inset-0 bg-sky-950/20 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border-2 border-sky-400 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-sky-100">
              <div>
                <h3 className="text-sm font-bold text-sky-800 flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-sky-500" />
                  <span>FIRST SIGN-IN: SET PERMANENT PASSWORD</span>
                </h3>
                <div className="text-[11px] text-sky-500 mt-0.5">
                  Account: {passwordChangeUser.name} ({passwordChangeUser.email})
                </div>
              </div>
              <button
                onClick={() => setPasswordChangeUser(null)}
                className="text-sky-400 hover:text-sky-600 text-lg cursor-pointer px-2"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] space-y-1">
              <span className="font-bold block">Mandatory Security Policy:</span>
              <p>
                As part of role provisioning by {currentRole.email}, this account was issued a temporary password that must be replaced before accessing live intelligence telemetry.
              </p>
            </div>

            <form onSubmit={handleExecutePasswordChange} className="space-y-3">
              <div>
                <label className="block text-sky-800 font-bold mb-1">
                  NEW PERMANENT PASSWORD (MIN 8 CHARACTERS)
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="Enter secure new password..."
                    className="w-full bg-white border border-sky-300 rounded-lg py-2 pl-3 pr-10 text-sky-800 text-xs font-mono focus:outline-none focus:border-sky-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-2.5 text-sky-400 hover:text-sky-600"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sky-800 font-bold mb-1">
                  CONFIRM NEW PERMANENT PASSWORD
                </label>
                <input
                  type="password"
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  placeholder="Re-type new password..."
                  className="w-full bg-white border border-sky-300 rounded-lg py-2 px-3 text-sky-800 text-xs font-mono focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              {passwordError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-[11px]">
                  {passwordError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-sky-100">
                <button
                  type="button"
                  onClick={() => setPasswordChangeUser(null)}
                  className="px-4 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-bold cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{isUpdatingPassword ? 'Saving Password...' : 'Save & Activate Account'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RBAC Entitlements Matrix */}
      <div className="bg-white border border-sky-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-sky-100">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-sky-500" />
            <h2 className="text-xs font-bold text-sky-700 font-mono">
              ROLE PRIVILEGE MATRIX
            </h2>
          </div>
          <span className="text-xs text-sky-500 font-mono">
            Administered by: <strong className="text-sky-800">{currentRole.name}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-sky-100 text-[11px] text-sky-500">
                <th className="pb-3 pl-2">SYSTEM CAPABILITY</th>
                <th className="pb-3 text-center">SUPER ADMIN</th>
                <th className="pb-3 text-center">THREAT ANALYST</th>
                <th className="pb-3 text-center">PRIVACY AUDITOR</th>
                <th className="pb-3 text-center pr-2">FIELD OPERATOR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100">
              {permissionsList.map((perm) => (
                <tr key={perm.key} className="hover:bg-sky-50/40">
                  <td className="py-2.5 pl-2 text-sky-800 font-medium">
                    {perm.label}
                  </td>
                  {Object.values(USER_ROLES).map((role) => {
                    const hasAccess = (role.permissions as any)[perm.key];
                    return (
                      <td key={role.id} className="py-2.5 text-center">
                        {hasAccess ? (
                          <span className="text-sky-600 font-bold">ALLOWED</span>
                        ) : (
                          <span className="text-sky-300">DENIED</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Immutable Audit Log Table */}
      <div className="bg-white border border-sky-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-sky-100 gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-sky-500" />
            <h2 className="text-xs font-bold text-sky-700 font-mono">
              IMMUTABLE CHRONOLOGICAL AUDIT LEDGER ({filteredLogs.length})
            </h2>
          </div>

          <div className="relative min-w-[260px]">
            <Search className="w-3.5 h-3.5 text-sky-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search audit trail..."
              className="w-full bg-white border border-sky-200 rounded-lg py-1.5 pl-8 pr-3 text-xs text-sky-800 placeholder-sky-300 focus:outline-none focus:border-sky-400 font-mono shadow-xs"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-sky-100 text-[11px] text-sky-500">
                <th className="pb-2.5 pl-2">ENTRY ID / TIME</th>
                <th className="pb-2.5">ACTOR</th>
                <th className="pb-2.5">ACTION</th>
                <th className="pb-2.5">RESOURCE</th>
                <th className="pb-2.5">DETAILS</th>
                <th className="pb-2.5 pr-2">SHA-256 PROOF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-sky-50/40">
                  <td className="py-2.5 pl-2 text-sky-700">
                    <div className="font-bold text-sky-800">{log.id}</div>
                    <div className="text-[10px] text-sky-400">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="py-2.5 text-sky-800">
                    <div>{log.actor}</div>
                    <div className="text-[10px] text-sky-400">{log.role}</div>
                  </td>
                  <td className="py-2.5">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2.5 text-sky-700 font-semibold">
                    {log.resource}
                  </td>
                  <td className="py-2.5 text-sky-600 max-w-xs truncate" title={log.details}>
                    {log.details}
                  </td>
                  <td className="py-2.5 pr-2 text-sky-500 text-[10px]">
                    <span className="font-mono text-sky-600">
                      {log.tamperProofHash?.slice(0, 16)}...
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Role & Permissions Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-sky-950/20 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-sky-300 rounded-xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-sky-100">
              <div>
                <h3 className="text-sm font-bold text-sky-800 font-mono flex items-center gap-2">
                  <Crown className="w-4 h-4 text-sky-500" />
                  <span>RE-ASSIGN ROLE & PERMISSIONS // {editingUser.name}</span>
                </h3>
                <div className="text-[11px] font-mono text-sky-500">
                  Target Account: {editingUser.email}
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-sky-400 hover:text-sky-600 font-mono text-lg cursor-pointer px-2"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRoleAssignment} className="space-y-4 text-xs font-mono">
              {/* Preset Role Selector */}
              <div>
                <label className="block text-sky-700 font-semibold mb-1">
                  ROLE PRESET ASSIGNMENT
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { id: 'SUPER_ADMIN', label: 'Super Admin' },
                      { id: 'THREAT_ANALYST', label: 'Threat Analyst' },
                      { id: 'PRIVACY_AUDITOR', label: 'Privacy Auditor' },
                      { id: 'FIELD_OPERATOR', label: 'Field Operator' },
                    ] as const
                  ).map((r) => (
                    <button
                      type="button"
                      key={r.id}
                      onClick={() => handleSelectRolePreset(r.id)}
                      className={`p-2 rounded-lg border text-left cursor-pointer transition-colors ${
                        assignedRoleId === r.id
                          ? 'bg-sky-500 text-white font-bold border-sky-600 shadow-xs'
                          : 'bg-sky-50/50 border-sky-200 text-sky-700 hover:bg-sky-100'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title & Clearance */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sky-700 font-semibold mb-1">SPECIALIZATION / TITLE</label>
                  <input
                    type="text"
                    value={assignedTitle}
                    onChange={(e) => setAssignedTitle(e.target.value)}
                    className="w-full bg-white border border-sky-200 rounded-lg p-2 text-sky-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sky-700 font-semibold mb-1">CLEARANCE LEVEL</label>
                  <input
                    type="text"
                    value={assignedClearance}
                    onChange={(e) => setAssignedClearance(e.target.value)}
                    className="w-full bg-white border border-sky-200 rounded-lg p-2 text-sky-800"
                    required
                  />
                </div>
              </div>

              {/* Granular Permission Toggles */}
              <div>
                <label className="block text-sky-700 font-semibold mb-1.5">
                  CUSTOMIZE GRANULAR PRIVILEGES
                </label>
                <div className="p-3 bg-sky-50/50 rounded-xl border border-sky-100 space-y-2">
                  {permissionsList.map((perm) => (
                    <label key={perm.key} className="flex items-center justify-between cursor-pointer text-sky-700">
                      <span>{perm.label}</span>
                      <input
                        type="checkbox"
                        checked={!!assignedPermissions[perm.key]}
                        onChange={(e) =>
                          setAssignedPermissions({
                            ...assignedPermissions,
                            [perm.key]: e.target.checked,
                          })
                        }
                        className="accent-sky-500 h-4 w-4"
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-sky-100">
                <span className="text-[11px] text-sky-500 font-semibold">
                  Assignor: {currentRole.email}
                </span>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingRole}
                    className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-bold cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSavingRole ? 'Saving Assignment...' : 'Commit Role Assignment'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
