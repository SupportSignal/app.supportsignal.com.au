'use client';

import { CompanyManagementPage } from '@/components/company/company-management-page';

export default function CompanySettingsPage() {
  return (
    <CompanyManagementPage 
      backUrl="/admin"
      backLabel="Back to Administration"
    />
  );
}