'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/auth-provider';
import { cn } from '@/lib/utils';
import { hasDeveloperAccess } from '@/lib/utils/developerAccess';

interface AdminCardData {
  id: string;
  title: string;
  description: string;
  icon: string;
  href: string;
  requiredRole: string[];
}

const ADMIN_SECTIONS = [
  {
    id: 'company-admin',
    title: 'Company Administration',
    requiredRole: ['system_admin', 'company_admin'],
    cards: [
      {
        id: 'users-roles',
        title: 'Users & Roles',
        description: 'Manage user accounts, permissions, and role assignments',
        icon: '👥',
        href: '/users',
        requiredRole: ['system_admin', 'company_admin'],
      },
      {
        id: 'reports',
        title: 'Reports',
        description: 'Generate and view system reports and analytics',
        icon: '📈',
        href: '/reports',
        requiredRole: ['system_admin', 'company_admin', 'team_lead'],
      },
      {
        id: 'company-settings',
        title: 'Company Settings',
        description: 'Configure company-wide settings and preferences',
        icon: '🏢',
        href: '/admin/company-settings',
        requiredRole: ['system_admin', 'company_admin'],
      },
    ],
  },
  {
    id: 'system-admin',
    title: 'System Administration',
    requiredRole: ['system_admin'],
    cards: [
      {
        id: 'system-analytics',
        title: 'System Analytics',
        description: 'Monitor system performance and usage metrics',
        icon: '📊',
        href: '/admin/analytics',
        requiredRole: ['system_admin'],
      },
      {
        id: 'global-users',
        title: 'Global User Management',
        description: 'Manage users across all companies and organizations',
        icon: '👥',
        href: '/admin/users',
        requiredRole: ['system_admin'],
      },
      {
        id: 'admin-tools',
        title: 'Admin Tools',
        description: 'Advanced administrative utilities and tools',
        icon: '🛠️',
        href: '/admin/tools',
        requiredRole: ['system_admin'],
      },
      {
        id: 'user-impersonation',
        title: 'User Impersonation',
        description: 'Impersonate users for testing and support purposes',
        icon: '🔐',
        href: '/admin/impersonation',
        requiredRole: ['system_admin'],
      },
      {
        id: 'company-management',
        title: 'Company Management',
        description: 'Create and manage organizations in the SupportSignal platform',
        icon: '🏢',
        href: '/admin/companies',
        requiredRole: ['system_admin'],
      },
      {
        id: 'ai-prompt-templates',
        title: 'AI Prompt Templates',
        description: 'Manage AI prompt templates for incident processing and analysis',
        icon: '🤖',
        href: '/admin/ai-prompts',
        requiredRole: ['system_admin'],
      },
    ],
  },
  {
    id: 'developer-tools',
    title: 'Developer Tools',
    requiredRole: ['system_admin'],
    cards: [
      {
        id: 'component-showcase',
        title: 'Component Showcase',
        description: 'Browse and test UI components and design patterns',
        icon: '🧪',
        href: '/showcase',
        requiredRole: ['system_admin'],
      },
      {
        id: 'wizard-demo',
        title: 'Wizard Demo',
        description: 'Test multi-step wizard functionality',
        icon: '🪄',
        href: '/wizard-demo',
        requiredRole: ['system_admin'],
      },
      {
        id: 'debug-logs',
        title: 'Debug Logs',
        description: 'View and analyze system debug logs',
        icon: '🐛',
        href: '/debug-logs',
        requiredRole: ['system_admin'],
      },
      {
        id: 'advanced-debug',
        title: 'Advanced Debug',
        description: 'Advanced debugging tools and utilities',
        icon: '🔍',
        href: '/debug',
        requiredRole: ['system_admin'],
      },
      {
        id: 'llm-testing',
        title: 'LLM Testing',
        description: 'Test and configure AI/LLM integrations',
        icon: '🤖',
        href: '/test-llm',
        requiredRole: ['system_admin'],
      },
      {
        id: 'dev-utils',
        title: 'Dev Utils',
        description: 'Development utilities and helper tools',
        icon: '⚡',
        href: '/dev',
        requiredRole: ['system_admin'],
      },
    ],
  },
];

function hasRequiredRole(userRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.includes(userRole);
}

function AdminCard({ card }: { card: AdminCardData }) {
  return (
    <Link
      href={card.href}
      className={cn(
        "group block p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700",
        "hover:shadow-lg hover:border-teal-300 dark:hover:border-teal-600 transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
      )}
    >
      <div className="flex items-start gap-4">
        <div className="text-3xl flex-shrink-0" aria-hidden="true">
          {card.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
            {card.title}
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {card.description}
          </p>
        </div>
      </div>
    </Link>
  );
}

function AdminSection({ section, userRole, user }: { section: typeof ADMIN_SECTIONS[0], userRole: string, user: any }) {
  const visibleCards = section.cards.filter(card => {
    // Special case for AI prompt templates - use developer access
    if (card.id === 'ai-prompt-templates') {
      return hasDeveloperAccess(user);
    }
    return hasRequiredRole(userRole, card.requiredRole);
  });

  if (visibleCards.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {section.title}
        </h2>
        <div className="mt-2 h-px bg-gradient-to-r from-teal-400 to-transparent"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleCards.map((card) => (
          <AdminCard key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Access Denied</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            You need to be signed in to access the administration panel.
          </p>
        </div>
      </div>
    );
  }

  const visibleSections = ADMIN_SECTIONS.filter(section => {
    // Special case for system-admin section - also show if user has developer access and there are developer-accessible cards
    if (section.id === 'system-admin') {
      if (hasRequiredRole(user.role, section.requiredRole)) {
        return true;
      }
      // Check if this section has any cards accessible to developer users
      const developerAccessibleCards = section.cards.filter(card => 
        card.id === 'ai-prompt-templates' && hasDeveloperAccess(user)
      );
      return developerAccessibleCards.length > 0;
    }
    return hasRequiredRole(user.role, section.requiredRole);
  });

  if (visibleSections.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Access Denied</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            You don&apos;t have permission to access administrative functions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Administration Dashboard
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage and monitor your SupportSignal system
        </p>
      </div>

      {visibleSections.map((section) => (
        <AdminSection
          key={section.id}
          section={section}
          userRole={user.role}
          user={user}
        />
      ))}
    </div>
  );
}