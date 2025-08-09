'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@starter/ui/button';

interface ComingSoonPageProps {
  title: string;
  description?: string;
  icon?: string;
  expectedFeatures?: string[];
  backUrl?: string;
  backLabel?: string;
  className?: string;
}

export function ComingSoonPage({
  title,
  description,
  icon = '🚧',
  expectedFeatures = [],
  backUrl = '/dashboard',
  backLabel = 'Back to Dashboard',
  className
}: ComingSoonPageProps) {
  return (
    <div className={cn("min-h-[60vh] flex items-center justify-center p-4", className)}>
      <div className="max-w-2xl mx-auto text-center space-y-8">
        {/* Icon and Status */}
        <div className="space-y-4">
          <div className="text-6xl mb-4" aria-hidden="true">
            {icon}
          </div>
          <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400">
            <Clock className="w-5 h-5" />
            <span className="text-sm font-medium uppercase tracking-wider">Coming Soon</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            {title}
          </h1>
          
          {description && (
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
              {description}
            </p>
          )}
        </div>

        {/* Expected Features */}
        {expectedFeatures.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-left max-w-md mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-teal-500" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Planned Features
              </h3>
            </div>
            <ul className="space-y-2">
              {expectedFeatures.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-2 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-4">
          <Button asChild variant="outline" className="gap-2">
            <Link href={backUrl}>
              <ArrowLeft className="w-4 h-4" />
              {backLabel}
            </Link>
          </Button>
          
          <Button asChild variant="default" className="gap-2">
            <Link href="/dashboard">
              <span className="text-lg" aria-hidden="true">📊</span>
              Go to Dashboard
            </Link>
          </Button>
        </div>

        {/* Development Note */}
        <div className="text-xs text-gray-500 dark:text-gray-400 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p>
            This page is under active development. Features will be added incrementally 
            as we build out the SupportSignal platform.
          </p>
        </div>
      </div>
    </div>
  );
}