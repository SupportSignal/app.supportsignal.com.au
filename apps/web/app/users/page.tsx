'use client';

import { ComingSoonPage } from '@/components/layout/coming-soon-page';

export default function UsersPage() {
  return (
    <ComingSoonPage
      title="Users & Roles"
      description="Comprehensive user management and role-based access control."
      icon="👥"
      expectedFeatures={[
        'User account creation and management',
        'Role-based permission system',
        'Team organization and hierarchy',
        'Bulk user operations',
        'User activity monitoring',
        'Integration with identity providers'
      ]}
      backUrl="/admin"
      backLabel="Back to Administration"
    />
  );
}