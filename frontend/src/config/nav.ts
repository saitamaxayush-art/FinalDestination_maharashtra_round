export interface NavItem {
  name: string;
  path: string;
  stepNumber?: number;
  description: string;
}

export const LEFT_NAV_ITEMS: NavItem[] = [
  { name: 'Home', path: '/', description: 'Overview and landing page' },
  { name: 'Assets', path: '/dashboard/assets', stepNumber: 1, description: 'Store and tag raw media files' },
  { name: 'Scripts', path: '/dashboard/scripts', stepNumber: 2, description: 'Write scripts and test hook variants' },
  { name: 'Footage Match', path: '/dashboard/footage', stepNumber: 3, description: 'Align spoken script lines to footage segments' },
  { name: 'Clips', path: '/dashboard/clips', stepNumber: 4, description: 'Extract high-retention short cuts' },
];

export const RIGHT_NAV_ITEMS: NavItem[] = [
  { name: 'Editor', path: '/dashboard/editor', stepNumber: 5, description: 'Fine-tune cuts with editable AI layers' },
  { name: 'Platforms', path: '/dashboard/platforms', stepNumber: 6, description: 'Adapt aspect ratio, captions and safe zones' },
  { name: 'Workflow', path: '/dashboard/workflow', stepNumber: 7, description: 'Manage production on Kanban and Calendar' },
  { name: 'Insights', path: '/dashboard/insights', stepNumber: 8, description: 'Review real views and retention metrics' },
];

export const PIPELINE_STEPS: NavItem[] = [
  { name: 'Assets', path: '/dashboard/assets', stepNumber: 1, description: 'Store and tag raw media files' },
  { name: 'Scripts', path: '/dashboard/scripts', stepNumber: 2, description: 'Write scripts and test hook variants' },
  { name: 'Footage Match', path: '/dashboard/footage', stepNumber: 3, description: 'Align spoken script lines to footage segments' },
  { name: 'Clips', path: '/dashboard/clips', stepNumber: 4, description: 'Extract high-retention short cuts' },
  { name: 'Editor', path: '/dashboard/editor', stepNumber: 5, description: 'Fine-tune cuts with editable AI layers' },
  { name: 'Platforms', path: '/dashboard/platforms', stepNumber: 6, description: 'Adapt aspect ratio, captions and safe zones' },
  { name: 'Workflow', path: '/dashboard/workflow', stepNumber: 7, description: 'Manage production on Kanban and Calendar' },
  { name: 'Insights', path: '/dashboard/insights', stepNumber: 8, description: 'Review real views and retention metrics' },
];

export const LEGAL_NAV_ITEMS = [
  { name: 'Privacy Policy', path: '/privacy' },
  { name: 'Terms and Conditions', path: '/terms' },
];
