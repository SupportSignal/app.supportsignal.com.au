'use client';

import { CompanyManagementPage } from '@/components/company/CompanyManagementPage';

export default function CompanyManagementRoute() {
  return (
    <CompanyManagementPage 
      backUrl="/dashboard"
      backLabel="Back to Dashboard"
    />
  );
}