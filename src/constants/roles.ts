export type Role = {
  id: string;
  label: string;
  ratePerHour: number; // in base USD, converted at runtime
  isDefault: boolean;
  emoji?: string;
};

// The 5 default roles — always shown on setup screen
export const DEFAULT_ROLES: Role[] = [
  { id: 'exec',       label: 'Executive / C-Suite', ratePerHour: 300, isDefault: true },
  { id: 'senior',     label: 'Senior / Director',   ratePerHour: 150, isDefault: true },
  { id: 'mid',        label: 'Mid-level',            ratePerHour: 80,  isDefault: true },
  { id: 'junior',     label: 'Junior',               ratePerHour: 40,  isDefault: true },
  { id: 'contractor', label: 'Contractor',           ratePerHour: 200, isDefault: true },
];

// Quick-add joke roles — shown in the custom role sheet
export const JOKE_ROLES: Role[] = [
  { id: 'ceo',        label: 'CEO',                  ratePerHour: 2500, isDefault: false, emoji: '👔' },
  { id: 'cfo',        label: 'CFO',                  ratePerHour: 1800, isDefault: false, emoji: '💰' },
  { id: 'consultant', label: 'Consultant',           ratePerHour: 500,  isDefault: false, emoji: '📊' },
  { id: 'intern',     label: 'Intern',               ratePerHour: 15,   isDefault: false, emoji: '🫡' },
  { id: 'janitor',    label: 'Janitor',              ratePerHour: 25,   isDefault: false, emoji: '🧹' },
  { id: 'receptionist', label: 'Receptionist',      ratePerHour: 30,   isDefault: false, emoji: '📞' },
  { id: 'ceos_driver', label: "CEO's Driver",        ratePerHour: 45,   isDefault: false, emoji: '🚗' },
  { id: 'lawyer',     label: 'Lawyer',               ratePerHour: 800,  isDefault: false, emoji: '⚖️' },
  { id: 'pr',         label: 'PR Manager',           ratePerHour: 120,  isDefault: false, emoji: '📣' },
  { id: 'pm',         label: 'Project Manager',      ratePerHour: 100,  isDefault: false, emoji: '📋' },
];

export const MEETING_DURATIONS = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '1 hour', value: 60 },
  { label: '90 min', value: 90 },
  { label: 'Custom', value: -1 },
];

export const SUPPORTED_CURRENCIES = ['USD', 'GBP', 'EUR', 'AUD', 'JPY', 'SGD', 'CAD'];
