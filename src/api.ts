import { Account, ProviderStat } from './types';

// In production on Render, the API is served by the same Express server
// In dev, we use the VITE_API_URL env variable (proxy or direct)
const API_BASE = import.meta.env.VITE_API_URL || '';

export async function connectAccount(data: {
  email: string;
  password: string;
  name?: string;
  imapHost?: string;
  imapPort?: number;
  useTls?: boolean;
}): Promise<{ account: Account }> {
  const res = await fetch(`${API_BASE}/api/accounts/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Connection failed' }));
    throw new Error(err.error || 'Connection failed');
  }
  return res.json();
}

export async function getAccounts(): Promise<{ accounts: Account[] }> {
  const res = await fetch(`${API_BASE}/api/accounts`);
  if (!res.ok) throw new Error('Failed to fetch accounts');
  return res.json();
}

export async function deleteAccount(id: string): Promise<void> {
  await fetch(`${API_BASE}/api/accounts/${id}`, { method: 'DELETE' });
}

export async function refreshAccount(id: string): Promise<{ account: Account }> {
  const res = await fetch(`${API_BASE}/api/accounts/${id}/refresh`, { method: 'POST' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Refresh failed' }));
    throw new Error(err.error || 'Refresh failed');
  }
  return res.json();
}

export async function getStats(): Promise<{ stats: ProviderStat[]; total: number }> {
  const res = await fetch(`${API_BASE}/api/stats`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}
