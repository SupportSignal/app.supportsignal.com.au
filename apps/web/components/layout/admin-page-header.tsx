'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@starter/ui/button';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export function AdminPageHeader({ 
  title, 
  description, 
  icon, 
  className,
  children 
}: AdminPageHeaderProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Back Navigation */}
      <div className="flex items-center justify-between">
        <Button asChild variant="outline" size="sm">
          <Link href="/admin" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Admin Tools
          </Link>
        </Button>
        {children}
      </div>

      {/* Page Header */}
      <div className="flex items-center gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
        {icon && (
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-teal-100 dark:bg-teal-900">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {title}
          </h1>
          {description && (
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}