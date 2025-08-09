'use client';

import { ComingSoonPage } from '@/components/layout/coming-soon-page';
import { NAVIGATION_CONFIG } from '@/lib/navigation/navigation-config';

export default function IncidentsPage() {
  // Find the incidents configuration from navigation
  const workflowSection = NAVIGATION_CONFIG.sections.find(section => section.id === 'workflows');
  const incidentsConfig = workflowSection?.items.find(item => item.id === 'incidents');
  
  return (
    <ComingSoonPage
      title={incidentsConfig?.label || 'Incidents'}
      description={incidentsConfig?.comingSoon?.description}
      icon={incidentsConfig?.icon}
      expectedFeatures={incidentsConfig?.comingSoon?.features}
      backUrl="/workflows"
      backLabel="Back to Workflows"
    />
  );
}