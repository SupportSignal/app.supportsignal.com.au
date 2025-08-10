'use client';

import { ComingSoonPage } from '@/components/layout/coming-soon-page';

export default function PrivacyPage() {
  return (
    <ComingSoonPage
      title="Privacy Policy"
      description="Your privacy and data protection are our top priorities. Our comprehensive privacy policy will outline how we collect, use, and protect your information."
      icon="🔒"
      expectedFeatures={[
        'Data collection and usage transparency',
        'Cookie and tracking policies', 
        'Third-party service integrations',
        'Data retention and deletion',
        'User rights and controls',
        'GDPR and compliance frameworks'
      ]}
      backUrl="/dashboard"
      backLabel="Back to Dashboard"
    />
  );
}