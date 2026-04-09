export interface Email {
  uid: number;
  subject: string;
  from: string;
  fromName: string;
  date: string;
  folder: 'INBOX' | 'SPAM' | 'FORUMS' | 'PERSONAL' | 'UPDATES' | 'PROMOTIONS';
  flags: string[];
}

export interface Account {
  id: string;
  email: string;
  name: string;
  provider: 'Gmail' | 'Outlook / Hotmail' | 'At&t / Yahoo' | 'Others';
  imapHost: string;
  imapPort: number;
  emails: Email[];
  connectedAt: string;
  status: 'connected' | 'error' | 'refreshing';
}

export interface ProviderStat {
  name: string;
  count: number;
  percentage: number;
}

export interface ConnectFormData {
  email: string;
  password: string;
  name: string;
  imapHost: string;
  imapPort: string;
  useTls: boolean;
  autoDetect: boolean;
}
