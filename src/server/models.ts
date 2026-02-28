export interface Transaction {
  id?: number;
  userId: string;
  amount: number;
  category: 'FOOD' | 'ENTERTAINMENT' | 'SHOPPING' | 'BILLS' | 'TRANSPORT' | 'GAMBLING' | 'LUXURY';
  merchant: string;
  timestamp: string; // ISO string
  isImpulsive: boolean;
  recipient?: string;
  upiId?: string;
  note?: string;
  mood?: string;
  prePaymentMemoryShown?: boolean;
  prePaymentAction?: string;
}

export interface UserProfile {
  userId: string;
  monthlyIncome: number;
  savingsGoal: number;
  riskScore: number;
  totalSpent: number;
}

export interface Intervention {
  id?: number;
  userId: string;
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  category: string;
  triggeredAt: string; // ISO string
  wasAcknowledged: boolean;
}

export interface Category {
  id?: number;
  userId: string;
  name: string;
  icon: string;
  isDefault: boolean;
}

export interface Dream {
  id?: number;
  userId: string;
  name: string;
  cost: number;
  targetDate: string; // ISO string
  createdAt: string; // ISO string
}
