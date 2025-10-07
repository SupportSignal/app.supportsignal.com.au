'use client';

import { CompanyManagementPage } from '@/components/company/company-management-page';

export default function CompanyManagementRoute() {
  return (
    <CompanyManagementPage 
      backUrl="/dashboard"
      backLabel="Back to Dashboard"
    />
  );
}