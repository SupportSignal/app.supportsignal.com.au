'use client';

import { ComingSoonPage } from '@/components/layout/coming-soon-page';

export default function AccountSettingsPage() {
  return (
    <ComingSoonPage
      title="Account Settings"
      description="Comprehensive account management and security settings."
      icon="⚙️"
      expectedFeatures={[
        'Password and security management',
        'Two-factor authentication setup',
        'API key management',
        'Session management',
        'Account deletion options',
        'Data export and privacy controls'
      ]}
      backUrl="/dashboard"
      backLabel="Back to Dashboard"
    />
  );
}