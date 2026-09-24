export type Role = 'owner' | 'frontdesk' | 'trainer' | 'accountant';
export type Method = 'UPI' | 'Card' | 'Cash' | 'Online';
export type InvoiceStatus = 'Paid' | 'Pending' | 'Overdue' | 'Failed';
export type MemberStatus = 'Active' | 'Expiring' | 'Expired' | 'New';
export type LeadSource = 'Instagram' | 'WhatsApp' | 'Website' | 'Walk-in' | 'Referral';
export type LeadStage = 'New Lead' | 'Contacted' | 'Trial Booked' | 'Visited' | 'Interested' | 'Converted' | 'Lost';

export interface Plan {
  id: string;
  name: string;
  kind: 'plan' | 'addon';
  price: number;
  months: number; // 0 for add-ons
  durationLabel: string;
  access: string;
  ptSessions: number;
  benefits: string[];
  status: 'active' | 'disabled';
  popular?: boolean;
}

export interface Offer {
  code: string;
  description: string;
  window: string;
  status: 'Active' | 'Scheduled' | 'Ended';
  uses: number;
}

export interface Trainer {
  id: string;
  name: string;
  title: string;
  specialization: string;
  rating: number;
  availability: string;
  status: 'Available' | 'In session' | 'Off today';
  phone: string;
  joined: string;
  bio: string;
  certs: string[];
  retention: number;
  ptSessionsMonth: number;
  ptRate: number;
}

export interface Measurement {
  date: Date;
  weight: number;
  bodyFat: number;
  waist: number;
  chest: number;
  arms: number;
}

export interface Note {
  id: string;
  at: Date;
  by: string;
  text: string;
}

export interface Member {
  id: string;
  name: string;
  phone: string;
  email: string;
  gender: 'Male' | 'Female';
  dob: Date;
  heightCm: number;
  joinDate: Date;
  planId: string;
  planLabel: string;
  start: Date;
  expiry: Date;
  trainerId?: string;
  visitsThisMonth: number;
  visitDays: number[]; // days of the current month with a visit
  totalVisits: number;
  autopay: boolean;
  emergency: { name: string; relation: string; phone: string };
  programId?: string;
  ptUsed: number;
  ptTotal: number;
  measurements: Measurement[];
  notes: Note[];
  frozenUntil?: Date;
}

export interface Invoice {
  id: string;
  memberId: string;
  item: string;
  amount: number;
  method: Method | null;
  date: Date;
  status: InvoiceStatus;
}

export interface CheckIn {
  id: string;
  memberId: string;
  in: Date;
  out?: Date;
  method: 'App QR' | 'Front desk';
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  source: LeadSource;
  referredBy?: string;
  plan: string;
  stage: LeadStage;
  lastContact: string;
  nextFollowUp: string;
  followKind: 'today' | 'late' | 'done' | 'lost' | '';
  created: Date;
  lostReason?: string;
}

export interface Exercise {
  name: string;
  muscle: string;
  sets: number;
  reps: string;
  rest: string;
  video: string;
}

export interface WorkoutDay {
  name: string;
  focus: string;
  exercises: Exercise[];
}

export interface Program {
  id: string;
  name: string;
  level: string;
  weeks: string;
  daysPerWeek: number;
  createdBy: string;
  updated: Date;
  description: string;
  completion: number;
  note: string;
  days: WorkoutDay[];
}

export interface Session {
  id: string;
  trainerId: string;
  memberId?: string;
  title: string;
  sub: string;
  at: Date;
}

export interface Activity {
  id: string;
  icon: string;
  who: string;
  what: string;
  sub: string;
  at: Date;
  memberId?: string;
}
