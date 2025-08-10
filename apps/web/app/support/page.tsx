'use client';

import { ComingSoonPage } from '@/components/layout/coming-soon-page';

export default function SupportPage() {
  return (
    <ComingSoonPage
      title="Support Center"
      description="Get the help you need with comprehensive documentation, tutorials, and direct support channels. Our support center will be your go-to resource for all SupportSignal questions."
      icon="💬"
      expectedFeatures={[
        'Knowledge base and FAQs',
        'Video tutorials and guides',
        'Live chat support',
        'Ticket submission system',
        'Community forums',
        'Contact information and hours'
      ]}
      backUrl="/dashboard"
      backLabel="Back to Dashboard"
    />
  );
}