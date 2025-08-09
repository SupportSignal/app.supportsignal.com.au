'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { useNavigationState } from '@/lib/navigation/use-navigation-state';
import { getExpandedSectionsForPath } from '@/lib/navigation/navigation-utils';
import { NAVIGATION_CONFIG } from '@/lib/navigation/navigation-config';
import { SidebarNavigation } from './sidebar-navigation';
import { HeaderNavigation } from './header-navigation';
import { FooterNavigation } from './footer-navigation';
import { ImpersonationBanner } from '@/components/admin/impersonation/ImpersonationBanner';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const { 
    sidebarCollapsed, 
    mobileMenuOpen, 
    setActivePath, 
    setExpandedSections,
    setMobileMenuOpen 
  } = useNavigationState();

  // Update active path and expanded sections when route changes
  useEffect(() => {
    setActivePath(pathname);
    
    if (user?.role) {
      const expandedSections = getExpandedSectionsForPath(
        NAVIGATION_CONFIG.sections, 
        pathname
      );
      setExpandedSections(expandedSections);
    }
    
    // Close mobile menu on route change
    setMobileMenuOpen(false);
  }, [pathname, user?.role, setActivePath, setExpandedSections, setMobileMenuOpen]);

  // Don't render sidebar for unauthenticated users
  const showSidebar = !!user;
  const showFullLayout = !!user;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <HeaderNavigation />
      
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        {showSidebar && (
          <SidebarNavigation 
            className={cn(
              "transition-all duration-300 ease-in-out border-r border-gray-200 dark:border-gray-700",
              sidebarCollapsed ? "w-16" : "w-60",
              // Mobile sidebar
              "md:relative md:translate-x-0",
              mobileMenuOpen 
                ? "fixed inset-y-0 left-0 z-50 translate-x-0" 
                : "fixed inset-y-0 left-0 z-50 -translate-x-full md:translate-x-0"
            )}
          />
        )}

        {/* Mobile overlay */}
        {mobileMenuOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Main content area */}
        <div 
          className={cn(
            "flex-1 flex flex-col overflow-hidden",
            showSidebar && !sidebarCollapsed && "md:ml-0",
            showSidebar && sidebarCollapsed && "md:ml-0"
          )}
        >
          {/* Impersonation Banner - shows at top when active */}
          <ImpersonationBanner />
          
          <main className="flex-1 overflow-auto">
            <div className="h-full">
              {children}
            </div>
          </main>
          
          {showFullLayout && <FooterNavigation />}
        </div>
      </div>
    </div>
  );
}