'use client';

import { ComingSoonPage } from '@/components/layout/coming-soon-page';

export default function ProfilePage() {
  return (
    <ComingSoonPage
      title="Profile Settings"
      description="Manage your personal profile, preferences, and account settings."
      icon="👤"
      expectedFeatures={[
        'Personal information management',
        'Profile picture upload',
        'Notification preferences',
        'Privacy settings',
        'Account security options',
        'Activity history and logs'
      ]}
      backUrl="/dashboard"
      backLabel="Back to Dashboard"
    />
  );
}