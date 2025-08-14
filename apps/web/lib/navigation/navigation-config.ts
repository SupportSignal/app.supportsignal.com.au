import { NavigationConfig, UserRole } from '@/components/layout/navigation-types';

export const NAVIGATION_CONFIG: NavigationConfig = {
  branding: {
    logo: '🟢',
    title: 'SupportSignal',
    tagline: 'Where insight meets action',
  },
  colors: {
    tealGradient: '#3CD7C4',
    navy: '#0C2D55',
    backgroundGrey: '#F4F7FA',
    ctaBlue: '#287BCB',
    successGreen: '#27AE60',
    alertAmber: '#F2C94C',
  },
  sections: [
    {
      id: 'main-links',
      title: '', // No group title - these are standalone links
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: '📊',
          href: '/dashboard',
          requiredRole: ['system_admin', 'company_admin', 'team_lead', 'frontline_worker'],
        },
      ],
    },
    {
      id: 'workflows',
      title: 'Workflows',
      requiredRole: ['system_admin', 'company_admin', 'team_lead', 'frontline_worker'],
      items: [
        {
          id: 'new-incident',
          label: 'New Incident',
          icon: '🚨',
          href: '/new-incident',
          requiredRole: ['system_admin', 'company_admin', 'team_lead', 'frontline_worker'],
        },
        {
          id: 'incidents',
          label: 'Incidents',
          icon: '📋',
          href: '/incidents',
          requiredRole: ['system_admin', 'company_admin', 'team_lead', 'frontline_worker'],
          comingSoon: {
            description: 'View, manage, and track all incidents across your organization.',
            features: [
              'Incident dashboard with filtering and search',
              'Status tracking and workflow management',
              'Incident timeline and history',
              'Bulk actions and batch operations',
              'Export and reporting capabilities',
              'Real-time notifications and updates'
            ],
            status: 'planned'
          }
        },
        {
          id: 'analysis',
          label: 'Analysis',
          icon: '🔍',
          href: '/analysis',
          requiredRole: ['system_admin', 'company_admin', 'team_lead'],
          comingSoon: {
            description: 'Analyze patterns, trends, and insights from your support data.',
            features: [
              'Trend analysis and pattern detection',
              'Performance metrics and KPIs',
              'Custom reporting dashboards',
              'Data visualization tools',
              'Predictive analytics',
              'Export and sharing capabilities'
            ],
            status: 'planned'
          }
        },
      ],
    },
    {
      id: 'company-admin',
      title: 'Company Administration',
      requiredRole: ['system_admin', 'company_admin', 'team_lead'],
      items: [
        {
          id: 'participants',
          label: 'Participants',
          icon: '👥',
          href: '/participants',
          requiredRole: ['system_admin', 'company_admin', 'team_lead'],
        },
        {
          id: 'company-management',
          label: 'Company Management',
          icon: '🏢',
          href: '/company-management',
          requiredRole: ['system_admin', 'company_admin'],
        },
      ],
    },
    {
      id: 'admin-links',
      title: '', // No group title - this is a standalone link
      items: [
        {
          id: 'admin-tools',
          label: 'Admin Tools',
          icon: '🏢',
          href: '/admin',
          requiredRole: ['system_admin', 'company_admin'],
        },
      ],
    },
  ],
};