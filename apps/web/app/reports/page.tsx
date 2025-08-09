'use client';

import { ComingSoonPage } from '@/components/layout/coming-soon-page';

export default function ReportsPage() {
  return (
    <ComingSoonPage
      title="Reports"
      description="Comprehensive reporting and analytics for your support operations."
      icon="📈"
      expectedFeatures={[
        'Customizable report builder',
        'Real-time and scheduled reports',
        'Performance metrics and KPIs',
        'Data export capabilities',
        'Interactive dashboards',
        'Automated report distribution'
      ]}
      backUrl="/admin"
      backLabel="Back to Administration"
    />
  );
}