'use client';

import { ComingSoonPage } from '@/components/layout/coming-soon-page';

export default function TermsPage() {
  return (
    <ComingSoonPage
      title="Terms of Service"
      description="Clear and fair terms that govern your use of the SupportSignal platform. Our terms are designed to protect both users and ensure quality service delivery."
      icon="📋"
      expectedFeatures={[
        'Platform usage guidelines',
        'Account responsibilities',
        'Service level agreements',
        'Billing and subscription terms',
        'Limitation of liability',
        'Dispute resolution procedures'
      ]}
      backUrl="/dashboard"
      backLabel="Back to Dashboard"
    />
  );
}