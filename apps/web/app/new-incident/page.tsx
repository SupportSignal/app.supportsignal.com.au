'use client';

import { Suspense } from 'react';
import { IncidentCaptureWorkflow } from '@/components/incidents/incident-capture-workflow';

export default function NewIncidentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-lg text-gray-600 dark:text-gray-400">
          Loading incident workflow...
        </div>
      </div>
    }>
      <IncidentCaptureWorkflow />
    </Suspense>
  );
}