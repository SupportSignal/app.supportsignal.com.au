'use client';

import { ComingSoonPage } from '@/components/layout/coming-soon-page';
import { NAVIGATION_CONFIG } from '@/lib/navigation/navigation-config';

export default function AnalysisPage() {
  // Find the analysis configuration from navigation
  const workflowSection = NAVIGATION_CONFIG.sections.find(section => section.id === 'workflows');
  const analysisConfig = workflowSection?.items.find(item => item.id === 'analysis');
  
  return (
    <ComingSoonPage
      title={analysisConfig?.label || 'Analysis'}
      description={analysisConfig?.comingSoon?.description}
      icon={analysisConfig?.icon}
      expectedFeatures={analysisConfig?.comingSoon?.features}
      backUrl="/workflows"
      backLabel="Back to Workflows"
    />
  );
}