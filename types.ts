
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'expired' | 'error';
export type InstanceType = 'web_bridge' | 'cloud_api';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar: string;
  role: string;
  tier: string;
  joinedAt: string;
  lastLogin: string;
  loginIp: string;
  twoFactorEnabled: boolean;
  passwordLastChanged: string;
}

export interface WhatsAppInstance {
  id: string;
  name: string;
  type: InstanceType;
  phoneNumber: string | null;
  status: ConnectionStatus;
  createdAt: string;
  lastActive: string;
  messagesSent: number;
  config?: {
    backendUrl?: string;
    apiKey?: string;
    phoneNumberId?: string;
    wabaId?: string;
  };
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed: string | null;
  status: 'active' | 'revoked';
  requestCount: number;
}

export interface ChatMessage {
  id: string;
  from: string;
  to?: string;
  content: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  direction?: 'incoming' | 'outgoing';
}

export interface UsageData {
  date: string;
  messages: number;
  apiCalls: number;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  source: string;
}
