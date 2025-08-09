'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { useNavigationState } from '@/lib/navigation/use-navigation-state';
import { NAVIGATION_CONFIG } from '@/lib/navigation/navigation-config';
import { LogoutButton } from '@/components/auth/logout-button';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { BreadcrumbNavigation } from './breadcrumb-navigation';
import { 
  Search, 
  Bell, 
  Settings, 
  User, 
  Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@starter/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@starter/ui/dropdown-menu';

export function HeaderNavigation() {
  const { user } = useAuth();
  const { toggleMobileMenu } = useNavigationState();
  const pathname = usePathname();

  const isSignedIn = !!user;
  const isHomePage = pathname === '/';

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      {/* Main header bar */}
      <div className="h-16 px-4">
        <div className="flex items-center justify-between h-full max-w-full">
          {/* Left side - Logo and mobile menu */}
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            {isSignedIn && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMobileMenu}
                className="md:hidden w-8 h-8 p-0"
              >
                <Menu className="w-5 h-5" />
              </Button>
            )}

            {/* Logo and branding */}
            <Link href="/" className="flex items-center gap-3">
              <span className="text-2xl">{NAVIGATION_CONFIG.branding.logo}</span>
              <div className="hidden sm:block">
                <div 
                  className="font-bold text-xl"
                  style={{ color: NAVIGATION_CONFIG.colors.navy }}
                >
                  {NAVIGATION_CONFIG.branding.title}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 -mt-1">
                  {NAVIGATION_CONFIG.branding.tagline}
                </div>
              </div>
            </Link>
          </div>

          {/* Center - Search (for signed-in users) */}
          {isSignedIn && (
            <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search... (⌘K)"
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  aria-label="Search"
                  onKeyDown={(e) => {
                    if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      e.currentTarget.focus();
                    }
                  }}
                />
              </div>
            </div>
          )}

          {/* Right side - Actions and user menu */}
          <div className="flex items-center gap-2">
            {isSignedIn ? (
              <>
                {/* Notifications */}
                <Button variant="ghost" size="sm" className="w-8 h-8 p-0 relative text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                  <Bell className="w-4 h-4" />
                  {/* Notification badge */}
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
                    <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                  </span>
                </Button>

                {/* Single consolidated user menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center gap-2 h-8 px-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                      <div className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center text-white text-sm font-medium">
                        {user.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <span className="hidden sm:inline text-sm font-medium">
                        {user.name}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5 text-sm font-medium text-gray-900 dark:text-white">
                      {user.name}
                    </div>
                    <div className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
                      {user.email}
                    </div>
                    <div className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {user.role?.replace('_', ' ')}
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        View Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/account-settings" className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Account Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/change-password" className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Change Password
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <div className="flex items-center justify-between w-full">
                        <span>Theme</span>
                        <ThemeToggle />
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <div className="px-2 py-1">
                      <LogoutButton />
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              /* Authentication buttons for signed-out users (hidden on homepage) */
              <div className="flex items-center gap-2">
                {!isHomePage && (
                  <>
                    <Link
                      href="/login"
                      className="text-gray-700 hover:text-teal-600 dark:text-gray-300 dark:hover:text-teal-400 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      className="bg-teal-500 hover:bg-teal-600 text-white px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
                <ThemeToggle />
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Breadcrumb navigation for signed-in users */}
      {isSignedIn && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700">
          <BreadcrumbNavigation />
        </div>
      )}
    </header>
  );
}