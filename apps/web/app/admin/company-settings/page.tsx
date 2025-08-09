'use client';

import { ComingSoonPage } from '@/components/layout/coming-soon-page';

export default function CompanySettingsPage() {
  return (
    <ComingSoonPage
      title="Company Settings"
      description="Configure company-wide settings, branding, and organizational preferences. Also accessible from the Company Administration section in the main navigation."
      icon="🏢"
      expectedFeatures={[
        'Company profile and branding',
        'Organizational structure setup',
        'Default workflows and processes',
        'Integration configurations',
        'Compliance and security policies',
        'Billing and subscription management'
      ]}
      backUrl="/admin"
      backLabel="Back to Administration"
      additionalActions={[
        {
          label: 'Company Management (Main)',
          href: '/company-management',
          description: 'Access company management from main navigation'
        }
      ]}
    />
  );
}