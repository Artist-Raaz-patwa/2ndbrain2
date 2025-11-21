
export enum View {
  DASHBOARD = 'DASHBOARD',
  NOTES = 'NOTES',
  CALENDAR = 'CALENDAR',
  CRM = 'CRM',
  WALLET = 'WALLET',
  SETTINGS = 'SETTINGS'
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  date: string;
  notebook?: string; // New field for organizing notes into books
}

export interface Contact {
  id: string;
  name: string;
  role: string;
  company: string;
  status: 'Lead' | 'Active' | 'Closed';
}

export interface Card {
  id: string;
  name: string;
  bank: string;
  type: 'credit' | 'debit' | 'cash';
  balance: number;
  last4: string;
  theme: string; // e.g., 'from-neutral-800 to-neutral-900'
  excludeFromTotals?: boolean;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: 'income' | 'expense';
  cardId?: string; // Link transaction to specific account
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
}

export interface Habit {
  id: string;
  title: string;
  createdAt: number;
}

// Maps date string "YYYY-MM-DD" to array of completed habit IDs
export interface HabitLog {
  [date: string]: string[]; 
}

// --- New CRM Types ---

export interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  isCompleted: boolean;
  completedAt?: number; // Timestamp when task was marked done
  isBillable: boolean;
  amount: number;
  subtasks: Subtask[];
}

export interface Project {
  id: string;
  name: string;
  clientName: string; // Company Name
  status: 'Planning' | 'In Progress' | 'Completed' | 'On Hold';
  deadline: string;
  createdAt: number;
}