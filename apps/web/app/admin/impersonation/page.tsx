import { Metadata } from 'next';
import { ImpersonationControlPanel } from '@/components/admin/impersonation/impersonation-control-panel';
import { AdminPageHeader } from '@/components/layout/admin-page-header';

export const metadata: Metadata = {
  title: 'User Impersonation | SupportSignal Admin',
  description: 'System administrator impersonation for testing and support',
};

export default function ImpersonationPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="User Impersonation"
        description="Temporarily impersonate other users for testing and support purposes"
      />
      
      <ImpersonationControlPanel />
    </div>
  );
}