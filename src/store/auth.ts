import type { Role } from '../data/types';

export type Screen = 'dashboard' | 'members' | 'profile' | 'plans' | 'payments' | 'attendance' | 'trainers' | 'workouts' | 'leads' | 'reports';
/** full = read + write · view = read only · own = only the trainer's own members/profile · none = hidden */
export type Access = 'full' | 'view' | 'own' | 'none';

export const ACCESS: Record<Role, Record<Screen, Access>> = {
  owner: { dashboard: 'full', members: 'full', profile: 'full', plans: 'full', payments: 'full', attendance: 'full', trainers: 'full', workouts: 'full', leads: 'full', reports: 'full' },
  frontdesk: { dashboard: 'view', members: 'full', profile: 'full', plans: 'view', payments: 'full', attendance: 'full', trainers: 'view', workouts: 'none', leads: 'full', reports: 'none' },
  trainer: { dashboard: 'none', members: 'own', profile: 'own', plans: 'none', payments: 'none', attendance: 'view', trainers: 'own', workouts: 'full', leads: 'none', reports: 'none' },
  accountant: { dashboard: 'full', members: 'none', profile: 'view', plans: 'view', payments: 'full', attendance: 'none', trainers: 'none', workouts: 'none', leads: 'none', reports: 'full' },
};

export interface StaffUser {
  role: Role;
  name: string;
  email: string;
  title: string;
  trainerId?: string;
}

export const DEMO_PASSWORD = 'club29';
export const STAFF: StaffUser[] = [
  { role: 'owner', name: 'Admin', email: 'admin@club29.in', title: 'Owner · Club29' },
  { role: 'frontdesk', name: 'Pooja Iyer', email: 'frontdesk@club29.in', title: 'Front desk' },
  { role: 'trainer', name: 'John Smith', email: 'john@club29.in', title: 'Head trainer', trainerId: 't-john' },
  { role: 'accountant', name: 'Nilesh Shah', email: 'accounts@club29.in', title: 'Accountant' },
];
export const ROLE_LABEL: Record<Role, string> = { owner: 'Owner / Admin', frontdesk: 'Manager / Front desk', trainer: 'Trainer', accountant: 'Accountant' };

export const access = (role: Role, s: Screen) => ACCESS[role][s];
export const canSee = (role: Role, s: Screen) => ACCESS[role][s] !== 'none';
export const canEdit = (role: Role, s: Screen) => ACCESS[role][s] === 'full' || (s === 'profile' && ACCESS[role][s] === 'own');
export const seesRevenue = (role: Role) => role === 'owner' || role === 'accountant';

export const HOME: Record<Role, string> = { owner: '/dashboard', frontdesk: '/dashboard', trainer: '/trainers', accountant: '/dashboard' };
