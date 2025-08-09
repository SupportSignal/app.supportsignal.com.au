'use client';

import { ComingSoonPage } from '@/components/layout/coming-soon-page';

export default function CompanySettingsPage() {
  return (
    <ComingSoonPage
      title="Company Settings"
      description="Configure company-wide settings, branding, and organizational preferences."
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
    />
  );
}