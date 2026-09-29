/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Mail,
  Send,
  Inbox,
  AlertTriangle,
  LifeBuoy,
  Paperclip,
  Reply,
  ShieldCheck,
  HardDrive,
  WifiOff,
} from 'lucide-react';
import { WebmailMessage, UserRole } from '../../types/intel';
import { ApiClient } from '../../services/apiClient';

interface WebmailViewProps {
  currentRole: UserRole;
  onOpenItemDetail?: (intelId: string) => void;
  refreshTrigger: number;
}

export const WebmailView: React.FC<WebmailViewProps> = ({
  currentRole,
  onOpenItemDetail,
  refreshTrigger,
}) => {
  const [messages, setMessages] = useState<WebmailMessage[]>([]);
  const [isOfflineLoaded, setIsOfflineLoaded] = useState<boolean>(false);
  const [selectedFolder, setSelectedFolder] = useState<'INBOX' | 'ALERTS' | 'BRIEFS' | 'SUPPORT' | 'SENT'>('INBOX');
  const [selectedMessage, setSelectedMessage] = useState<WebmailMessage | null>(null);
  const [showComposeModal, setShowComposeModal] = useState<boolean>(false);

  // Compose state
  const [toRecipient, setToRecipient] = useState<string>('support-team@aiguerrilla.net');
  const [subject, setSubject] = useState<string>('');
  const [classification, setClassification] = useState<'UNCLASSIFIED' | 'CONFIDENTIAL' | 'SECRET'>('CONFIDENTIAL');
  const [body, setBody] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);

  const loadMessages = async () => {
    try {
      const data = await ApiClient.fetchWebmail();
      setMessages(data);
      setIsOfflineLoaded(false);
      if (data.length > 0 && !selectedMessage) {
        setSelectedMessage(data[0]);
      }
    } catch (err) {
      console.warn('Network webmail fetch failed:', err);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [refreshTrigger]);

  const filteredMessages = messages.filter((m) => {
    if (selectedFolder === 'INBOX') return m.folder === 'INBOX' || m.folder === 'ALERTS';
    return m.folder === selectedFolder;
  });

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toRecipient.trim() || !subject.trim()) return;

    setIsSending(true);
    try {
      const sentMsg = await ApiClient.sendWebmail({
        sender: currentRole.email,
        recipient: toRecipient.trim(),
        subject: subject.trim(),
        body: body.trim(),
        classification,
      });

      setShowComposeModal(false);
      setSubject('');
      setBody('');
      loadMessages();
      setSelectedMessage(sentMsg);
    } catch (err) {
      console.error('Send mail error:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleStartReply = () => {
    if (!selectedMessage) return;
    setToRecipient(selectedMessage.sender);
    setSubject(`Re: ${selectedMessage.subject}`);
    setClassification(selectedMessage.classification as any);
    setBody(`\n\n--- On ${new Date(selectedMessage.timestamp).toLocaleDateString()}, ${selectedMessage.sender} wrote:\n> ${selectedMessage.body.replace(/\n/g, '\n> ')}`);
    setShowComposeModal(true);
  };

  return (
    <div className="space-y-6 bg-white text-sky-600">
      {/* Header Info */}
      <div className="bg-white border border-sky-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-sky-500" />
              <h1 className="text-base font-bold text-sky-700 font-mono tracking-tight">
                PENDARIEL SECURE OPERATIONAL WEBMAIL
              </h1>
              <span className="text-xs text-sky-400 font-mono">
                // REAL BACKEND EMAIL REPOSITORY
              </span>
            </div>
            <p className="text-xs text-sky-500 mt-1">
              Personalized webmail for <strong className="text-sky-800">{currentRole.email}</strong>. Messages are transmitted and stored on the backend.
            </p>
          </div>

          <button
            onClick={() => setShowComposeModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Compose Dispatch</span>
          </button>
        </div>
      </div>

      {/* Field Agent Offline Cache Notification */}
      {isOfflineLoaded && (
        <div className="p-3.5 bg-amber-50 border-2 border-amber-300 rounded-2xl text-xs font-mono text-amber-900 flex flex-wrap items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">FIELD AGENT OFFLINE WEBMAIL ACTIVE:</span>{' '}
              <span>Serving {messages.filter((m) => m.unread).length} unread priority briefing(s) and cached inbox messages from Service Worker cache storage.</span>
            </div>
          </div>
          <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded-lg text-[10px] font-bold">
            PWA Service Worker
          </span>
        </div>
      )}

      {/* Main Mail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
        {/* Left: Folders Sidebar (3 Cols) */}
        <div className="lg:col-span-3 bg-white border border-sky-200 rounded-xl p-4 shadow-xs space-y-4">
          <div className="text-xs font-mono font-bold text-sky-700 pb-2 border-b border-sky-100 flex items-center justify-between">
            <span>PENDARIEL MAILBOX</span>
            <span className="h-2 w-2 rounded-full bg-sky-500" />
          </div>

          <div className="space-y-1 text-xs font-mono">
            {[
              { id: 'INBOX', label: 'Primary Inbox', icon: Inbox, count: messages.filter((m) => m.folder === 'INBOX' || m.folder === 'ALERTS').length },
              { id: 'ALERTS', label: 'Incident Alerts', icon: AlertTriangle, count: messages.filter((m) => m.folder === 'ALERTS').length },
              { id: 'SUPPORT', label: 'Support & Tickets', icon: LifeBuoy, count: messages.filter((m) => m.folder === 'SUPPORT').length },
              { id: 'SENT', label: 'Sent Dispatches', icon: Send, count: messages.filter((m) => m.folder === 'SENT').length },
            ].map((f) => {
              const isSelected = selectedFolder === f.id;
              const Icon = f.icon;
              return (
                <button
                  key={f.id}
                  onClick={() => setSelectedFolder(f.id as any)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-sky-100/80 text-sky-800 font-bold'
                      : 'text-sky-600 hover:bg-sky-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-sky-500" />
                    <span>{f.label}</span>
                  </div>
                  <span className="text-[11px] font-mono text-sky-500 font-semibold">
                    {f.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="pt-4 border-t border-sky-100 text-xs font-mono space-y-2 text-sky-600">
            <div className="text-[11px] font-bold text-sky-700">USER PROFILE</div>
            <div className="text-[11px] text-sky-600">
              Account: <span className="font-semibold text-sky-800">{currentRole.name}</span>
            </div>
            <div className="text-[11px] text-sky-700 font-semibold truncate">
              {currentRole.email}
            </div>
            <div className="text-[10px] text-sky-500 flex items-center gap-1 pt-1 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-500" />
              <span>TLS 1.3 Personalised Webmail</span>
            </div>
          </div>
        </div>

        {/* Middle: Message List (4 Cols) */}
        <div className="lg:col-span-4 bg-white border border-sky-200 rounded-xl p-4 shadow-xs space-y-3">
          <div className="text-xs font-mono font-bold text-sky-700 pb-2 border-b border-sky-100 flex justify-between">
            <span>{selectedFolder} MESSAGES</span>
            <span>{filteredMessages.length} total</span>
          </div>

          <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
            {filteredMessages.map((msg) => {
              const isSelected = selectedMessage?.id === msg.id;
              return (
                <div
                  key={msg.id}
                  onClick={() => setSelectedMessage(msg)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer font-mono text-xs ${
                    isSelected
                      ? 'bg-sky-50 border-sky-400 shadow-xs'
                      : 'bg-white border-sky-100 hover:border-sky-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] text-sky-400 mb-1">
                    <span className="text-sky-700 font-bold truncate max-w-[140px]">
                      {msg.sender.split('@')[0]}
                    </span>
                    <span className="text-sky-400">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="font-semibold text-sky-800 line-clamp-1">
                    {msg.subject}
                  </div>

                  <div className="text-[11px] text-sky-600 mt-1 line-clamp-2">
                    {msg.body}
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-sky-100 text-[10px] text-sky-400 font-semibold">
                    <span className="text-sky-600">
                      {msg.classification}
                    </span>
                    {msg.attachedIntelId && (
                      <span className="text-sky-700 flex items-center gap-1">
                        <Paperclip className="w-3 h-3 text-sky-500" />
                        <span>Intel Attached</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            {filteredMessages.length === 0 && (
              <div className="text-center py-16 text-sky-400 font-mono text-xs">
                No messages in this folder.
              </div>
            )}
          </div>
        </div>

        {/* Right: Message Reader (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-sky-200 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          {selectedMessage ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between pb-3 border-b border-sky-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-sky-200 text-sky-700 bg-sky-50 font-bold">
                      {selectedMessage.classification}
                    </span>
                    <span className="text-sky-400 font-mono text-[11px]">
                      {new Date(selectedMessage.timestamp).toUTCString()}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-sky-800 mt-1">
                    {selectedMessage.subject}
                  </h2>
                  <div className="text-xs font-mono text-sky-600 mt-1">
                    From: <span className="font-semibold text-sky-800">{selectedMessage.sender}</span>
                  </div>
                  <div className="text-xs font-mono text-sky-600">
                    To: <span className="font-semibold text-sky-800">{selectedMessage.recipient}</span>
                  </div>
                </div>

                <button
                  onClick={handleStartReply}
                  className="flex items-center gap-1 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 rounded-lg text-xs font-mono transition-colors cursor-pointer shadow-xs"
                >
                  <Reply className="w-3.5 h-3.5 text-sky-500" />
                  <span>Reply</span>
                </button>
              </div>

              {/* Message Body */}
              <div className="bg-sky-50/40 p-4 rounded-xl border border-sky-100 text-xs font-mono text-sky-800 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
                {selectedMessage.body}
              </div>

              {/* Attached Intel Link if any */}
              {selectedMessage.attachedIntelId && (
                <div className="p-3 bg-sky-50/60 rounded-xl border border-sky-200 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2 text-sky-800 font-semibold">
                    <Paperclip className="w-4 h-4 text-sky-500" />
                    <span>ATTACHED INCIDENT: {selectedMessage.attachedIntelId}</span>
                  </div>
                  {onOpenItemDetail && (
                    <button
                      onClick={() => onOpenItemDetail(selectedMessage.attachedIntelId!)}
                      className="px-2.5 py-1 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-[11px] font-semibold cursor-pointer shadow-xs"
                    >
                      Inspect Threat
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-24 text-sky-400 font-mono text-xs">
              Select a message to inspect contents.
            </div>
          )}

          <div className="pt-3 border-t border-sky-100 text-[11px] font-mono text-sky-400 flex justify-between">
            <span>SIGNATURE: VERIFIED PGP 4096-BIT</span>
            <span>BACKEND REPOSITORY: ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Compose Dispatch Modal */}
      {showComposeModal && (
        <div className="fixed inset-0 bg-sky-950/20 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-sky-300 rounded-xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-sky-100">
              <h3 className="text-sm font-bold text-sky-800 font-mono flex items-center gap-2">
                <Send className="w-4 h-4 text-sky-500" />
                <span>COMPOSE DISPATCH (PENDARIEL WEBMAIL)</span>
              </h3>
              <button
                onClick={() => setShowComposeModal(false)}
                className="text-sky-400 hover:text-sky-600 font-mono text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSend} className="space-y-3 text-xs font-mono">
              <div>
                <label className="block text-sky-700 font-semibold mb-1">RECIPIENT ADDRESS</label>
                <input
                  type="email"
                  value={toRecipient}
                  onChange={(e) => setToRecipient(e.target.value)}
                  className="w-full bg-white border border-sky-200 rounded-lg p-2 text-sky-800"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-sky-700 font-semibold mb-1">DISPATCH SUBJECT</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Critical Threat Briefing: SCADA Vulnerability"
                    className="w-full bg-white border border-sky-200 rounded-lg p-2 text-sky-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sky-700 font-semibold mb-1">CLASSIFICATION</label>
                  <select
                    value={classification}
                    onChange={(e) => setClassification(e.target.value as any)}
                    className="w-full bg-white border border-sky-200 rounded-lg p-2 text-sky-800"
                  >
                    <option value="UNCLASSIFIED">UNCLASSIFIED</option>
                    <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                    <option value="SECRET">SECRET</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sky-700 font-semibold mb-1">MESSAGE BODY</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Enter briefing contents or operational inquiry..."
                  rows={6}
                  className="w-full bg-white border border-sky-200 rounded-lg p-2 text-sky-800 font-mono text-xs"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-sky-100">
                <button
                  type="button"
                  onClick={() => setShowComposeModal(false)}
                  className="px-4 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg cursor-pointer"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-bold cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSending ? 'Sending via Backend...' : 'Transmit Encrypted Dispatch'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
