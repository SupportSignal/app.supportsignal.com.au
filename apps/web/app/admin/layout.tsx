'use client';

import { ReactNode } from 'react';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  // Clean admin layout - let individual pages handle their own headers
  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-6 py-12">
        {children}
      </div>
    </div>
  );
}