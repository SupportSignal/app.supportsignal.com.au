'use client';

import { ComingSoonPage } from '@/components/layout/coming-soon-page';

export default function AdminToolsPage() {
  return (
    <ComingSoonPage
      title="Admin Tools"
      description="Advanced administrative utilities and system management tools."
      icon="🛠️"
      expectedFeatures={[
        'Database maintenance utilities',
        'System backup and restore',
        'Cache management tools',
        'Performance optimization utilities',
        'Data migration and cleanup tools',
        'System health diagnostics'
      ]}
      backUrl="/admin"
      backLabel="Back to Administration"
    />
  );
}