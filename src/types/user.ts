export type UserRole = 'admin' | 'user' | 'manager' | 'super_admin';

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  role?: UserRole;
  password?: string;
  darkMode: boolean;
  avatarUrl?: string;
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string;
  lastSyncAt?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  action: 'LOGIN' | 'LOGOUT' | 'PAYMENT' | 'NEW_LOAN' | 'EDIT_LOAN' | 'ROLLOVER' | 'SETTINGS_UPDATE' | 'SYNC';
  description: string;
  timestamp: string;
  device?: string;
  metadata?: Record<string, any>;
}

