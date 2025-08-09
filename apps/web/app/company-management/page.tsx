'use client';

import { ComingSoonPage } from '@/components/layout/coming-soon-page';

export default function CompanyManagementPage() {
  return (
    <ComingSoonPage
      title="Company Management"
      description="Manage your company's information, settings, and administrative configuration."
      icon="🏢"
      expectedFeatures={[
        'View and edit company details',
        'Manage organizational settings',
        'Configure default participant status',
        'Set incident escalation rules',
        'Notification preferences',
        'Administrative user management',
        'Company branding and customization',
        'Audit trail and change history'
      ]}
      backUrl="/dashboard"
      backLabel="Back to Dashboard"
    />
  );
}