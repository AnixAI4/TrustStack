// Dashboard sidebar module config - routes under /trustdeck
export const PLATFORM_SIDEBAR_MODULES = [
  { key: 'overview',        label: 'Overview',                href: '/trustdeck/overview',        icon: 'LayoutDashboard', available: true },
  { key: 'reports',         label: 'Board Reports',           href: '/trustdeck/reports',          icon: 'FileBarChart',    available: true },
  { key: 'assessment',      label: 'DPDP Compass™',          href: '/trustdeck/assessment',       icon: 'Compass',         available: true },
  { key: 'consent',         label: 'Consent Management',     href: '/trustdeck/consent',          icon: 'CheckSquare',     available: true },
  { key: 'privacy-notice',  label: 'Privacy Notice Builder', href: '/trustdeck/privacy-notice',   icon: 'FileText',        available: true },
  { key: 'grievance',       label: 'Grievance Officer',      href: '/trustdeck/grievance',        icon: 'MessageCircle',   available: true },
  { key: 'dsr',             label: 'DSR Management',         href: '/trustdeck/dsr',              icon: 'Users',           available: true },
  { key: 'ropa',            label: 'ROPA Builder',           href: '/trustdeck/ropa',             icon: 'Database',        available: true },
  { key: 'vendors',         label: 'Vendor DPA Manager',     href: '/trustdeck/vendors',          icon: 'Building2',       available: true },
  { key: 'breach',          label: 'Breach Response',        href: '/trustdeck/breach',           icon: 'AlertTriangle',   available: true },
  { key: 'settings',        label: 'Settings',               href: '/trustdeck/settings',         icon: 'Settings',        available: false },
] as const
