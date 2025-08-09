import { NavigationSection, MenuItem, UserRole } from '@/components/layout/navigation-types';

export function hasRequiredRole(userRole: string | undefined, requiredRoles?: UserRole[]): boolean {
  if (!requiredRoles || requiredRoles.length === 0) return true;
  if (!userRole) return false;
  return requiredRoles.includes(userRole as UserRole);
}

export function filterMenuItems(items: MenuItem[], userRole?: string): MenuItem[] {
  return items
    .filter((item) => hasRequiredRole(userRole, item.requiredRole))
    .map((item) => ({
      ...item,
      children: item.children ? filterMenuItems(item.children, userRole) : undefined,
    }));
}

export function filterNavigationSections(sections: NavigationSection[], userRole?: string): NavigationSection[] {
  return sections
    .filter((section) => hasRequiredRole(userRole, section.requiredRole))
    .map((section) => ({
      ...section,
      items: filterMenuItems(section.items, userRole),
    }))
    .filter((section) => section.items.length > 0);
}

export function isActiveRoute(pathname: string, href?: string): boolean {
  if (!href) return false;
  if (href === '/') return pathname === '/';
  return pathname.startsWith(href);
}

export function findActiveMenuItem(items: MenuItem[], pathname: string): MenuItem | null {
  for (const item of items) {
    if (item.href && isActiveRoute(pathname, item.href)) {
      return item;
    }
    if (item.children) {
      const activeChild = findActiveMenuItem(item.children, pathname);
      if (activeChild) return activeChild;
    }
  }
  return null;
}

export function getExpandedSectionsForPath(sections: NavigationSection[], pathname: string): string[] {
  const expandedSections: string[] = [];
  
  for (const section of sections) {
    const hasActiveItem = findActiveMenuItem(section.items, pathname);
    if (hasActiveItem) {
      expandedSections.push(section.id);
    }
  }
  
  return expandedSections;
}