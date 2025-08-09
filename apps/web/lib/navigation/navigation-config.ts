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
          id: 'incidents',
          label: 'Incidents',
          icon: '🚨',
          href: '/incidents',
          requiredRole: ['system_admin', 'company_admin', 'team_lead', 'frontline_worker'],
          comingSoon: {
            description: 'Create, track, and manage incidents with comprehensive workflow tools.',
            features: [
              'Incident creation and assignment',
              'Status tracking and updates',
              'Timeline and audit trails',
              'Automated escalation rules',
              'Team collaboration tools',
              'Reporting and analytics'
            ],
            status: 'in-development'
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