export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  href?: string;
  children?: MenuItem[];
  requiredRole?: UserRole[];
  isDeveloperTool?: boolean;
  isCollapsible?: boolean;
  // Coming soon page metadata
  comingSoon?: {
    description?: string;
    features?: string[];
    status?: 'planned' | 'in-development' | 'coming-soon';
  };
}

export interface NavigationSection {
  id: string;
  title: string;
  items: MenuItem[];
  requiredRole?: UserRole[];
  isCollapsible?: boolean;
  defaultCollapsed?: boolean;
}

export interface NavigationState {
  sidebarCollapsed: boolean;
  activePath: string;
  expandedSections: string[];
  mobileMenuOpen: boolean;
}

export type UserRole = 'system_admin' | 'company_admin' | 'team_lead' | 'frontline_worker';

export interface NavigationConfig {
  sections: NavigationSection[];
  branding: {
    logo: string;
    title: string;
    tagline: string;
  };
  colors: {
    tealGradient: string;
    navy: string;
    backgroundGrey: string;
    ctaBlue: string;
    successGreen: string;
    alertAmber: string;
  };
}