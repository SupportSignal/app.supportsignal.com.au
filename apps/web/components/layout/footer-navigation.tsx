'use client';

import React from 'react';
import Link from 'next/link';
import { NAVIGATION_CONFIG } from '@/lib/navigation/navigation-config';

export function FooterNavigation() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-600 dark:text-gray-400">
        {/* Left side - Copyright and branding */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">{NAVIGATION_CONFIG.branding.logo}</span>
            <span className="font-medium">{NAVIGATION_CONFIG.branding.title}</span>
          </div>
          <span className="text-xs">© {currentYear}</span>
        </div>

        {/* Center - Secondary navigation */}
        <div className="flex items-center gap-4 text-xs">
          <Link 
            href="/privacy" 
            className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
          >
            Privacy Policy
          </Link>
          <Link 
            href="/terms" 
            className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
          >
            Terms of Service
          </Link>
          <Link 
            href="/support" 
            className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
          >
            Support
          </Link>
        </div>

        {/* Right side - Version and system info */}
        <div className="flex items-center gap-4 text-xs">
          <div className="hidden md:flex items-center gap-2">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              System Online
            </span>
          </div>
          <span className="text-gray-500">v2.2.0</span>
        </div>
      </div>
    </footer>
  );
}