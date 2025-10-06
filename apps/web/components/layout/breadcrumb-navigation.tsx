'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

interface BreadcrumbNavigationProps {
  className?: string;
  items?: BreadcrumbItem[];
}

export function BreadcrumbNavigation({ className, items }: BreadcrumbNavigationProps) {
  const pathname = usePathname();

  // Auto-generate breadcrumbs from pathname if items not provided
  const breadcrumbs = items || generateBreadcrumbs(pathname);

  if (breadcrumbs.length <= 1) return null;

  return (
    <nav className={cn("flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400", className)}>
      <ol className="flex items-center space-x-1">
        {breadcrumbs.map((item, index) => (
          <li key={item.href} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="w-3 h-3 mx-1 text-gray-400" />
            )}
            {index === breadcrumbs.length - 1 ? (
              <span className="flex items-center gap-1 text-gray-900 dark:text-white font-medium">
                {item.icon}
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="flex items-center gap-1 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
              >
                {item.icon}
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  
  const breadcrumbs: BreadcrumbItem[] = [
    {
      label: 'Home',
      href: '/',
      icon: <Home className="w-3 h-3" />
    }
  ];

  // Special handling for admin tools
  
  // Admin page itself should show: Home > Admin Tools
  if (pathname === '/admin') {
    breadcrumbs.push({
      label: 'Admin Tools',
      href: '/admin'
    });
    return breadcrumbs;
  }
  
  // All admin tool paths - should show Home > Admin Tools > [Tool Name]
  const adminToolPaths = [
    // Company Administration tools
    '/users', '/reports',
    // Developer tools
    '/debug-logs', '/debug', '/test-llm', '/dev', '/showcase', '/wizard-demo'
  ];
  
  // Check if current path is an admin tool (including sub-paths under /admin/)
  const isAdminTool = adminToolPaths.some(path => pathname.startsWith(path)) || 
                     pathname.startsWith('/admin/') && pathname !== '/admin';
  
  if (isAdminTool) {
    // Add Admin Tools breadcrumb
    breadcrumbs.push({
      label: 'Admin Tools',
      href: '/admin'
    });
    
    // Add the tool page
    let toolName: string;
    let label: string;
    
    if (pathname.startsWith('/admin/')) {
      // For /admin/sub-path, use the sub-path as tool name
      toolName = segments[1]; // segments[0] is 'admin', segments[1] is the tool
      
      // Safety check for undefined toolName
      if (!toolName) {
        return breadcrumbs; // Just return Home > Admin Tools if no sub-path
      }
      
      label = toolName
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    } else {
      // For root-level admin tools like /debug-logs, /dev, etc.
      toolName = segments[0];
      
      // Safety check for undefined toolName
      if (!toolName) {
        return breadcrumbs; // Just return Home > Admin Tools if no path
      }
      
      label = toolName
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    
    breadcrumbs.push({
      label,
      href: pathname
    });
    
    return breadcrumbs;
  }

  // Default breadcrumb generation for other pages
  let currentPath = '';
  
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    
    // Convert segment to readable label
    const label = segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    breadcrumbs.push({
      label,
      href: currentPath
    });
  });

  return breadcrumbs;
}