import { useState } from 'react';
import { X, Mail, Lock, User, Server, Shield, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { ConnectFormData } from '../types';

interface Props {
  onClose: () => void;
  onConnect: (data: ConnectFormData) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export default function ConnectModal({ onClose, onConnect, isLoading, error }: Props) {
  const [form, setForm] = useState<ConnectFormData>({
    email: '',
    password: '',
    name: '',
    imapHost: '',
    imapPort: '993',
    useTls: true,
    autoDetect: true,
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handle = (k: keyof ConnectFormData, v: string | boolean) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onConnect(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-[#1a2332] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Mail className="w-4 h-4 text-green-400" />
            </div>
            <h2 className="text-white font-semibold text-lg">Connect IMAP Account</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
              ⚠️ {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-slate-400 text-xs mb-1.5 font-medium uppercase tracking-wide">Display Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={form.name}
                onChange={e => handle('name', e.target.value)}
                placeholder="e.g. David"
                className="w-full bg-[#0f1923] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-green-500/50 text-sm"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-slate-400 text-xs mb-1.5 font-medium uppercase tracking-wide">Email Address *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                value={form.email}
                onChange={e => handle('email', e.target.value)}
                placeholder="user@gmail.com"
                required
                className="w-full bg-[#0f1923] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-green-500/50 text-sm"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-slate-400 text-xs mb-1.5 font-medium uppercase tracking-wide">Password / App Password *</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                value={form.password}
                onChange={e => handle('password', e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full bg-[#0f1923] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-green-500/50 text-sm"
              />
            </div>
            <p className="text-slate-500 text-xs mt-1">For Gmail, use an App Password (not your account password)</p>
          </div>

          {/* Advanced Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors"
          >
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Advanced IMAP Settings
          </button>

          {showAdvanced && (
            <div className="space-y-3 p-4 bg-[#0f1923] rounded-lg border border-white/5">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoDetect"
                  checked={form.autoDetect}
                  onChange={e => handle('autoDetect', e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="autoDetect" className="text-slate-300 text-sm">Auto-detect IMAP settings</label>
              </div>

              {!form.autoDetect && (
                <>
                  <div>
                    <label className="block text-slate-400 text-xs mb-1.5">IMAP Host</label>
                    <div className="relative">
                      <Server className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        value={form.imapHost}
                        onChange={e => handle('imapHost', e.target.value)}
                        placeholder="imap.gmail.com"
                        className="w-full bg-[#1a2332] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-green-500/50 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs mb-1.5">IMAP Port</label>
                    <input
                      type="number"
                      value={form.imapPort}
                      onChange={e => handle('imapPort', e.target.value)}
                      placeholder="993"
                      className="w-full bg-[#1a2332] border border-white/10 rounded-lg px-4 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-green-500/50 text-sm"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-400" />
                <input
                  type="checkbox"
                  id="useTls"
                  checked={form.useTls}
                  onChange={e => handle('useTls', e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="useTls" className="text-slate-300 text-sm">Use TLS/SSL</label>
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-500 hover:bg-green-400 disabled:bg-green-500/50 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4" />
                Connect Account
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
