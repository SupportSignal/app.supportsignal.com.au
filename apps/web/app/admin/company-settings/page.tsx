'use client';

import { CompanyManagementPage } from '@/components/company/CompanyManagementPage';

export default function CompanySettingsPage() {
  return (
    <CompanyManagementPage 
      backUrl="/admin"
      backLabel="Back to Administration"
    />
  );
}