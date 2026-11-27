import { LayoutDashboard, UserRound, Settings, BadgeCheck } from 'lucide-react';

export type PortalRole = 'employer' | 'job-seeker';
export const portalNavItems = [
  { id: 'dashboard', label: 'overview', icon: LayoutDashboard },
  { id: 'profile', label: 'profile', icon: UserRound },
  { id: 'settings', label: 'settings', icon: Settings },
  { id: 'verification', label: 'verification', icon: BadgeCheck },
] as const;
