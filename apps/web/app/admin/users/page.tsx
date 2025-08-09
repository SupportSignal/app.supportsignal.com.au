'use client';

import { ComingSoonPage } from '@/components/layout/coming-soon-page';

export default function GlobalUserManagementPage() {
  return (
    <ComingSoonPage
      title="Global User Management"
      description="Manage users across all companies and organizations in the system."
      icon="👥"
      expectedFeatures={[
        'Cross-company user management',
        'System-wide role assignments',
        'Global user search and filtering',
        'Bulk user operations',
        'User migration between companies',
        'System administrator tools'
      ]}
      backUrl="/admin"
      backLabel="Back to Administration"
    />
  );
}