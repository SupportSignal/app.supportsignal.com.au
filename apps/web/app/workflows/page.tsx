'use client';

import { ComingSoonPage } from '@/components/layout/coming-soon-page';

export default function WorkflowsPage() {
  return (
    <ComingSoonPage
      title="Workflows"
      description="Streamlined workflows for incident management and analysis."
      icon="⚡"
      expectedFeatures={[
        'Incident management workflows',
        'Analysis and reporting tools',
        'Automated escalation processes',
        'Team collaboration features',
        'Custom workflow builder',
        'Integration with external tools'
      ]}
      backUrl="/dashboard"
      backLabel="Back to Dashboard"
    />
  );
}