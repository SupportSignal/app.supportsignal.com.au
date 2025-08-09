'use client';

import React, { useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { useNavigationState } from '@/lib/navigation/use-navigation-state';
import { NAVIGATION_CONFIG } from '@/lib/navigation/navigation-config';
import { filterNavigationSections, isActiveRoute } from '@/lib/navigation/navigation-utils';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { 
  ChevronRight, 
  ChevronDown, 
  Menu,
  Zap,
  Moon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@starter/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@starter/ui/collapsible';

interface SidebarNavigationProps {
  className?: string;
}

export function SidebarNavigation({ className }: SidebarNavigationProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const { 
    sidebarCollapsed, 
    expandedSections, 
    toggleSidebar, 
    toggleSection 
  } = useNavigationState();

  if (!user) return null;

  const filteredSections = filterNavigationSections(
    NAVIGATION_CONFIG.sections, 
    user.role
  );

  const renderMenuItem = (item: any, level = 0) => {
    const isActive = isActiveRoute(pathname, item.href);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedSections.includes(item.id);
    
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (hasChildren) {
          toggleSection(item.id);
        } else if (item.href) {
          window.location.href = item.href;
        }
      } else if (e.key === 'ArrowRight' && hasChildren && !isExpanded) {
        e.preventDefault();
        toggleSection(item.id);
      } else if (e.key === 'ArrowLeft' && hasChildren && isExpanded) {
        e.preventDefault();
        toggleSection(item.id);
      }
    };
    const ariaLevel = level + 2; // Start at level 2 (after h1 main heading)

    const menuItemContent = (
      <div
        className={cn(
          "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer",
          "hover:bg-gray-100 dark:hover:bg-gray-700",
          "focus-visible:bg-gray-100 dark:focus-visible:bg-gray-700",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-500 focus-visible:outline-offset-2",
          level > 0 && "ml-8 text-xs border-l-2 border-gray-200 dark:border-gray-600 pl-4",
          isActive && "bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400",
          !isActive && "text-gray-700 dark:text-gray-300",
          hasChildren && "hover:bg-gray-50 dark:hover:bg-gray-800" // Slightly different hover for parent items
        )}
        role={level === 0 ? "menuitem" : "none"}
        aria-current={isActive ? "page" : undefined}
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        <span className="text-lg" aria-hidden="true">{item.icon}</span>
        {!sidebarCollapsed && (
          <>
            <span className="flex-1 text-left">{item.label}</span>
            {hasChildren && (
              <ChevronRight 
                className={cn(
                  "w-4 h-4 transition-transform text-gray-400 hover:text-gray-600 dark:hover:text-gray-300",
                  isExpanded && "rotate-90"
                )}
                aria-hidden="true"
              />
            )}
          </>
        )}
      </div>
    );

    if (hasChildren) {
      return (
        <Collapsible
          key={item.id}
          open={isExpanded && !sidebarCollapsed}
          onOpenChange={() => toggleSection(item.id)}
        >
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              className="w-full justify-start p-0 h-auto focus-visible:outline-none hover:bg-transparent"
              aria-expanded={isExpanded && !sidebarCollapsed}
              aria-controls={`submenu-${item.id}`}
              aria-label={`${item.label} submenu, ${isExpanded ? 'expanded' : 'collapsed'}`}
            >
              {menuItemContent}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div 
              className="space-y-1 mt-1"
              id={`submenu-${item.id}`}
              role="menu"
              aria-labelledby={`menuitem-${item.id}`}
            >
              {item.children.map((child: any) => renderMenuItem(child, level + 1))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      );
    }

    return (
      <Link 
        key={item.id} 
        href={item.href || '#'}
        className="focus-visible:outline-none"
        id={`menuitem-${item.id}`}
        aria-describedby={sidebarCollapsed ? `tooltip-${item.id}` : undefined}
        tabIndex={0}
      >
        {menuItemContent}
        {/* Hidden tooltip text for collapsed sidebar */}
        {sidebarCollapsed && (
          <span className="sr-only" id={`tooltip-${item.id}`}>
            {item.label}
          </span>
        )}
      </Link>
    );
  };

  const renderSection = (section: any) => {
    const isExpanded = expandedSections.includes(section.id);
    const showSectionHeader = !sidebarCollapsed && section.title !== 'Main Workflow';

    return (
      <div key={section.id} className="space-y-1" role="group" aria-labelledby={`section-${section.id}`}>
        {showSectionHeader && (
          <div className="px-3 py-2">
            {section.isCollapsible ? (
              <Button
                variant="ghost"
                onClick={() => toggleSection(section.id)}
                className="w-full justify-start p-0 h-auto text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                aria-expanded={isExpanded}
                aria-controls={`section-content-${section.id}`}
                id={`section-${section.id}`}
              >
                <span className="flex-1 text-left">{section.title}</span>
                <ChevronDown 
                  className={cn(
                    "w-3 h-3 transition-transform text-gray-400",
                    !isExpanded && "-rotate-90"
                  )}
                  aria-hidden="true"
                />
              </Button>
            ) : (
              <h2 
                className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                id={`section-${section.id}`}
              >
                {section.title}
              </h2>
            )}
          </div>
        )}
        
        {(!section.isCollapsible || isExpanded || sidebarCollapsed) && (
          <div 
            className="space-y-1" 
            role="menu"
            id={`section-content-${section.id}`}
            aria-labelledby={`section-${section.id}`}
          >
            {section.items.map((item: any) => renderMenuItem(item))}
          </div>
        )}
      </div>
    );
  };

  return (
    <nav 
      className={cn(
        "bg-gray-50 dark:bg-gray-800 flex flex-col h-full",
        className
      )}
      style={{ backgroundColor: NAVIGATION_CONFIG.colors.backgroundGrey }}
      role="navigation"
      aria-label="Main navigation"
      aria-expanded={!sidebarCollapsed}
    >
      {/* Sidebar header with toggle */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="hidden md:flex w-8 h-8 p-0 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-500"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!sidebarCollapsed}
            aria-controls="main-navigation"
          >
            <Menu className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* Navigation sections */}
      <div className="flex-1 overflow-y-auto py-4 space-y-6">
        {filteredSections.map(renderSection)}
      </div>

      {/* Bottom controls */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className={cn(
          "space-y-2",
          sidebarCollapsed && "flex flex-col items-center"
        )}>
          <div className={cn(
            "flex items-center gap-2 text-sm",
            sidebarCollapsed && "flex-col"
          )}>
            <Zap className="w-4 h-4 text-green-500" />
            {!sidebarCollapsed && (
              <span className="text-gray-600 dark:text-gray-400">Live</span>
            )}
          </div>
          <div className={cn(
            "flex items-center gap-2",
            sidebarCollapsed && "justify-center"
          )}>
            {!sidebarCollapsed && (
              <Moon className="w-4 h-4 text-gray-500" />
            )}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}