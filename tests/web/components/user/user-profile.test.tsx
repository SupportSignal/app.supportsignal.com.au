// @ts-nocheck
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserProfile, UserProfileProps } from '@/components/user/user-profile';
import { 
  healthcareUserProfiles, 
  healthcareTestUtils,
} from '../../../fixtures/healthcare';
import { 
  testHealthcareAccessibility,
  testKeyboardNavigation,
  testScreenReaderAnnouncements,
  healthcareA11yUtils
} from '../../../utils/accessibility';

// Mock UI components
jest.mock('@starter/ui', () => ({
  Badge: ({ children, className, variant, ...props }: any) => (
    <span className={`badge ${variant || 'default'} ${className}`} {...props}>
      {children}
    </span>
  ),
  Button: ({ children, className, size, variant, onClick, ...props }: any) => (
    <button 
      className={`button ${size || 'default'} ${variant || 'default'} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  ),
  Card: ({ children, className, ...props }: any) => (
    <div className={`card ${className}`} {...props}>{children}</div>
  ),
  CardContent: ({ children, className, ...props }: any) => (
    <div className={`card-content ${className}`} {...props}>{children}</div>
  ),
  CardHeader: ({ children, className, ...props }: any) => (
    <div className={`card-header ${className}`} {...props}>{children}</div>
  ),
  CardTitle: ({ children, className, ...props }: any) => (
    <h3 className={`card-title ${className}`} {...props}>{children}</h3>
  ),
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  User: ({ className, ...props }: any) => <div className={`icon user ${className}`} {...props} data-testid="user-icon" />,
  Crown: ({ className, ...props }: any) => <div className={`icon crown ${className}`} {...props} data-testid="crown-icon" />,
  Shield: ({ className, ...props }: any) => <div className={`icon shield ${className}`} {...props} data-testid="shield-icon" />,
  Users: ({ className, ...props }: any) => <div className={`icon users ${className}`} {...props} data-testid="users-icon" />,
  UserCheck: ({ className, ...props }: any) => <div className={`icon user-check ${className}`} {...props} data-testid="usercheck-icon" />,
  Mail: ({ className, ...props }: any) => <div className={`icon mail ${className}`} {...props} data-testid="mail-icon" />,
  Phone: ({ className, ...props }: any) => <div className={`icon phone ${className}`} {...props} data-testid="phone-icon" />,
  MapPin: ({ className, ...props }: any) => <div className={`icon map-pin ${className}`} {...props} data-testid="mappin-icon" />,
  Calendar: ({ className, ...props }: any) => <div className={`icon calendar ${className}`} {...props} data-testid="calendar-icon" />,
  Settings: ({ className, ...props }: any) => <div className={`icon settings ${className}`} {...props} data-testid="settings-icon" />,
  LogOut: ({ className, ...props }: any) => <div className={`icon log-out ${className}`} {...props} data-testid="logout-icon" />,
  Edit: ({ className, ...props }: any) => <div className={`icon edit ${className}`} {...props} data-testid="edit-icon" />,
  Eye: ({ className, ...props }: any) => <div className={`icon eye ${className}`} {...props} data-testid="eye-icon" />,
  Clock: ({ className, ...props }: any) => <div className={`icon clock ${className}`} {...props} data-testid="clock-icon" />,
  CheckCircle: ({ className, ...props }: any) => <div className={`icon check-circle ${className}`} {...props} data-testid="checkcircle-icon" />,
}));

// Mock utils
jest.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

describe('UserProfile - Healthcare Compliance', () => {
  const mockOnEdit = jest.fn();
  const mockOnSettings = jest.fn();
  const mockOnLogout = jest.fn();
  const mockOnViewPermissions = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Healthcare Role-Based User Display', () => {
    it('renders system administrator profile with proper role indicators', () => {
      const user = healthcareUserProfiles.system_admin;
      
      render(
        <UserProfile
          user={user}
          currentUserId={user.id}
          onEdit={mockOnEdit}
          onSettings={mockOnSettings}
        />
      );

      // Verify system admin role display
      expect(screen.getByText('Dr. Sarah Mitchell')).toBeInTheDocument();
      expect(screen.getByText('System Administrator')).toBeInTheDocument();
      expect(screen.getByTestId('crown-icon')).toBeInTheDocument();
      
      // Check role description
      expect(screen.getByText(/full system access and management/i)).toBeInTheDocument();
      
      // Check organization details
      expect(screen.getByText('Metropolitan Healthcare Systems')).toBeInTheDocument();
      expect(screen.getByText('Information Technology')).toBeInTheDocument();
      expect(screen.getByText('Chief Information Security Officer')).toBeInTheDocument();
    });

    it('renders company administrator profile with appropriate permissions', () => {
      const user = healthcareUserProfiles.company_admin;
      
      render(
        <UserProfile
          user={user}
          currentUserId={user.id}
          showStats={true}
        />
      );

      expect(screen.getByText('Mark Thompson')).toBeInTheDocument();
      expect(screen.getByText('Company Administrator')).toBeInTheDocument();
      expect(screen.getByTestId('shield-icon')).toBeInTheDocument();
      
      // Check organization details
      expect(screen.getByText('CityCare NDIS Services')).toBeInTheDocument();
      expect(screen.getByText('Operations Director')).toBeInTheDocument();
      
      // Check location formatting
      expect(screen.getByText('Melbourne, VIC')).toBeInTheDocument();
    });

    it('renders team leader profile with team management context', () => {
      const user = healthcareUserProfiles.team_lead;
      
      render(
        <UserProfile
          user={user}
          currentUserId="different_user"
          showStats={true}
        />
      );

      expect(screen.getByText('Jennifer Wu')).toBeInTheDocument();
      expect(screen.getByText('Team Leader')).toBeInTheDocument();
      expect(screen.getByTestId('users-icon')).toBeInTheDocument();
      
      // Check role description
      expect(screen.getByText(/team management and workflow oversight/i)).toBeInTheDocument();
      
      // Should show statistics
      expect(screen.getByText('134')).toBeInTheDocument(); // Incidents reported
      expect(screen.getByText('89')).toBeInTheDocument(); // Incidents analyzed
      expect(screen.getByText('91%')).toBeInTheDocument(); // Completion rate
    });

    it('renders frontline worker profile with appropriate restrictions', () => {
      const user = healthcareUserProfiles.frontline_worker;
      
      render(
        <UserProfile
          user={user}
          currentUserId="different_user"
          showActions={false}
        />
      );

      expect(screen.getByText('David Chen')).toBeInTheDocument();
      expect(screen.getByText('Frontline Worker')).toBeInTheDocument();
      expect(screen.getByTestId('usercheck-icon')).toBeInTheDocument();
      
      // Check role description
      expect(screen.getByText(/direct participant support and incident reporting/i)).toBeInTheDocument();
      
      // Check department and title
      expect(screen.getByText('Direct Support')).toBeInTheDocument();
      expect(screen.getByText('Support Worker')).toBeInTheDocument();
      
      // Should not show admin actions for different user
      expect(screen.queryByText('Settings')).not.toBeInTheDocument();
    });
  });

  describe('Healthcare Data Privacy & Security', () => {
    it('does not expose sensitive user identifiers in DOM', () => {
      const user = healthcareUserProfiles.system_admin;
      const { container } = render(
        <UserProfile
          user={user}
          currentUserId={user.id}
        />
      );

      const htmlContent = container.innerHTML;

      // Should not contain internal user IDs or sensitive data
      expect(htmlContent).not.toMatch(/user_\d{3}/);
      expect(htmlContent).not.toMatch(/company_\d{3}/);
      expect(htmlContent).not.toMatch(/role_\d{3}/);
      
      // Should display user information but not expose internal structure
      expect(screen.getByText('Dr. Sarah Mitchell')).toBeInTheDocument();
      expect(screen.getByText('sarah.mitchell@healthsystem.com.au')).toBeInTheDocument();
    });

    it('handles phone number display with privacy considerations', () => {
      const user = healthcareUserProfiles.company_admin;
      
      render(
        <UserProfile
          user={user}
          currentUserId="different_user"
        />
      );

      // Phone should be displayed but not in a way that exposes raw data structure
      expect(screen.getByText('+61 3 8555 0456')).toBeInTheDocument();
      expect(screen.getByTestId('phone-icon')).toBeInTheDocument();
    });

    it('properly handles optional data fields', () => {
      const userWithoutPhone = {
        ...healthcareUserProfiles.team_lead,
        phone: undefined,
        avatar: undefined,
      };
      
      render(
        <UserProfile
          user={userWithoutPhone}
          currentUserId={userWithoutPhone.id}
        />
      );

      // Should not show phone section when not available
      expect(screen.queryByTestId('phone-icon')).not.toBeInTheDocument();
      
      // Should show initials when no avatar
      expect(screen.getByText('JW')).toBeInTheDocument();
    });

    it('respects current user context for sensitive actions', () => {
      const user = healthcareUserProfiles.frontline_worker;
      
      render(
        <UserProfile
          user={user}
          currentUserId={user.id}
          showActions={true}
        />
      );

      // Should show settings and edit for current user
      expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
      
      // Now test with different current user
      render(
        <UserProfile
          user={user}
          currentUserId="different_user"
          showActions={true}
        />
      );

      // Should not show personal actions for other users
      expect(screen.queryByRole('button', { name: /settings/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    });
  });

  describe('WCAG 2.1 AA Accessibility Compliance', () => {
    it('meets healthcare accessibility standards', async () => {
      const user = healthcareUserProfiles.company_admin;
      const { container } = render(
        <UserProfile
          user={user}
          currentUserId={user.id}
          showStats={true}
          showPreferences={true}
        />
      );

      await testHealthcareAccessibility(container, 'UserProfile');
    });

    it('provides proper keyboard navigation for healthcare users', async () => {
      const user = healthcareUserProfiles.team_lead;
      const { container } = render(
        <UserProfile
          user={user}
          currentUserId={user.id}
          onEdit={mockOnEdit}
          onSettings={mockOnSettings}
          onLogout={mockOnLogout}
          onViewPermissions={mockOnViewPermissions}
        />
      );

      // Expected interactive elements: Settings, Edit, Logout, View Permissions
      await testKeyboardNavigation(container, 4);
    });

    it('supports screen reader navigation', () => {
      const user = healthcareUserProfiles.system_admin;
      const { container } = render(
        <UserProfile
          user={user}
          currentUserId={user.id}
          showStats={true}
        />
      );

      const screenReaderContent = healthcareA11yUtils.simulateScreenReader(container);
      
      // Should contain essential user information for screen readers
      expect(screenReaderContent.combinedContent).toContain('Dr. Sarah Mitchell');
      expect(screenReaderContent.combinedContent).toContain('System Administrator');
      expect(screenReaderContent.combinedContent).toContain('Metropolitan Healthcare Systems');
      
      // Statistics should be accessible
      expect(screenReaderContent.combinedContent).toContain('Incidents Reported');
      expect(screenReaderContent.combinedContent).toContain('Performance Statistics');
    });

    it('provides accessible status indicators', () => {
      const onlineUser = healthcareUserProfiles.system_admin;
      const offlineUser = { ...healthcareUserProfiles.company_admin, isOnline: false };
      
      render(
        <UserProfile
          user={onlineUser}
          currentUserId={onlineUser.id}
        />
      );

      // Online status should be accessible
      expect(screen.getByText('Online')).toBeInTheDocument();
      
      render(
        <UserProfile
          user={offlineUser}
          currentUserId={offlineUser.id}
        />
      );

      // Offline status should show last seen time
      expect(screen.getByText(/last seen/i)).toBeInTheDocument();
      expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
    });

    it('has proper heading hierarchy for healthcare context', () => {
      const user = healthcareUserProfiles.team_lead;
      
      render(
        <UserProfile
          user={user}
          currentUserId={user.id}
          showStats={true}
          showPreferences={true}
        />
      );

      // Check heading structure
      expect(screen.getByRole('heading', { name: /user profile/i })).toBeInTheDocument();
      
      // Section headings should be properly structured
      expect(screen.getByText('Contact Information')).toBeInTheDocument();
      expect(screen.getByText('Organization')).toBeInTheDocument();
      expect(screen.getByText('Performance Statistics')).toBeInTheDocument();
      expect(screen.getByText('Preferences')).toBeInTheDocument();
    });
  });

  describe('Healthcare Profile Management Actions', () => {
    it('handles edit action with healthcare context', async () => {
      const user = userEvent.setup();
      const profile = healthcareUserProfiles.company_admin;
      
      render(
        <UserProfile
          user={profile}
          currentUserId={profile.id}
          onEdit={mockOnEdit}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });

    it('handles settings action for healthcare users', async () => {
      const user = userEvent.setup();
      const profile = healthcareUserProfiles.frontline_worker;
      
      render(
        <UserProfile
          user={profile}
          currentUserId={profile.id}
          onSettings={mockOnSettings}
        />
      );

      const settingsButton = screen.getByRole('button', { name: /settings/i });
      await user.click(settingsButton);

      expect(mockOnSettings).toHaveBeenCalledTimes(1);
    });

    it('handles view permissions action', async () => {
      const user = userEvent.setup();
      const profile = healthcareUserProfiles.team_lead;
      
      render(
        <UserProfile
          user={profile}
          currentUserId={profile.id}
          onViewPermissions={mockOnViewPermissions}
        />
      );

      const viewPermissionsButton = screen.getByRole('button', { name: /view permissions/i });
      await user.click(viewPermissionsButton);

      expect(mockOnViewPermissions).toHaveBeenCalledTimes(1);
    });

    it('handles logout action for healthcare security', async () => {
      const user = userEvent.setup();
      const profile = healthcareUserProfiles.system_admin;
      
      render(
        <UserProfile
          user={profile}
          currentUserId={profile.id}
          onLogout={mockOnLogout}
        />
      );

      const logoutButton = screen.getByRole('button', { name: /logout/i });
      await user.click(logoutButton);

      expect(mockOnLogout).toHaveBeenCalledTimes(1);
    });
  });

  describe('Healthcare Profile Variants', () => {
    it('renders minimal variant for compact healthcare displays', () => {
      const user = healthcareUserProfiles.frontline_worker;
      
      render(
        <UserProfile
          user={user}
          currentUserId="different_user"
          variant="minimal"
        />
      );

      // Should show basic user info
      expect(screen.getByText('David Chen')).toBeInTheDocument();
      expect(screen.getByText('Frontline Worker')).toBeInTheDocument();
      
      // Should show online status
      expect(screen.getByTestId('checkcircle-icon')).toBeInTheDocument(); // Online indicator
      
      // Should not show detailed information in minimal mode
      expect(screen.queryByText('Contact Information')).not.toBeInTheDocument();
      expect(screen.queryByText('Organization')).not.toBeInTheDocument();
    });

    it('renders compact variant for healthcare dashboards', () => {
      const user = healthcareUserProfiles.team_lead;
      
      render(
        <UserProfile
          user={user}
          currentUserId={user.id}
          variant="compact"
          showActions={true}
        />
      );

      // Should show essential information
      expect(screen.getByText('Jennifer Wu')).toBeInTheDocument();
      expect(screen.getByText('Team Leader')).toBeInTheDocument();
      expect(screen.getByText('CityCare NDIS Services')).toBeInTheDocument();
      
      // Should show last active time
      expect(screen.getByText(/last active/i)).toBeInTheDocument();
      
      // Should show settings button for current user
      expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
    });

    it('renders full variant with comprehensive healthcare information', () => {
      const user = healthcareUserProfiles.system_admin;
      
      render(
        <UserProfile
          user={user}
          currentUserId={user.id}
          variant="full"
          showStats={true}
          showPreferences={true}
          showActions={true}
        />
      );

      // Should show all sections
      expect(screen.getByText('Contact Information')).toBeInTheDocument();
      expect(screen.getByText('Organization')).toBeInTheDocument();
      expect(screen.getByText('Performance Statistics')).toBeInTheDocument();
      expect(screen.getByText('Preferences')).toBeInTheDocument();
      
      // Should show all statistics
      expect(screen.getByText('Incidents Reported')).toBeInTheDocument();
      expect(screen.getByText('Incidents Analyzed')).toBeInTheDocument();
      expect(screen.getByText('Avg Response Time')).toBeInTheDocument();
      expect(screen.getByText('Completion Rate')).toBeInTheDocument();
      
      // Should show preference details
      expect(screen.getByText('Email Notifications')).toBeInTheDocument();
      expect(screen.getByText('SMS Notifications')).toBeInTheDocument();
      expect(screen.getByText('Dark Mode')).toBeInTheDocument();
    });
  });

  describe('Healthcare Statistics & Performance Metrics', () => {
    it('displays healthcare performance statistics correctly', () => {
      const user = healthcareUserProfiles.company_admin;
      
      render(
        <UserProfile
          user={user}
          currentUserId={user.id}
          showStats={true}
        />
      );

      // Check specific statistics
      expect(screen.getByText('67')).toBeInTheDocument(); // Incidents reported
      expect(screen.getByText('423')).toBeInTheDocument(); // Incidents analyzed
      expect(screen.getByText('28m')).toBeInTheDocument(); // Avg response time
      expect(screen.getByText('94%')).toBeInTheDocument(); // Completion rate
      
      // Check statistic labels
      expect(screen.getByText('Incidents Reported')).toBeInTheDocument();
      expect(screen.getByText('Incidents Analyzed')).toBeInTheDocument();
      expect(screen.getByText('Avg Response Time')).toBeInTheDocument();
      expect(screen.getByText('Completion Rate')).toBeInTheDocument();
    });

    it('handles statistics gracefully when showStats is false', () => {
      const user = healthcareUserProfiles.team_lead;
      
      render(
        <UserProfile
          user={user}
          currentUserId={user.id}
          showStats={false}
        />
      );

      // Should not show statistics section
      expect(screen.queryByText('Performance Statistics')).not.toBeInTheDocument();
      expect(screen.queryByText('Incidents Reported')).not.toBeInTheDocument();
    });
  });

  describe('Healthcare User Preferences & Settings', () => {
    it('displays user preferences for current user', () => {
      const user = healthcareUserProfiles.system_admin;
      
      render(
        <UserProfile
          user={user}
          currentUserId={user.id}
          showPreferences={true}
        />
      );

      // Should show preferences section
      expect(screen.getByText('Preferences')).toBeInTheDocument();
      
      // Check notification preferences
      expect(screen.getByText('Email Notifications')).toBeInTheDocument();
      expect(screen.getByText('SMS Notifications')).toBeInTheDocument();
      
      // Check preference states
      const emailEnabled = user.preferences.emailNotifications ? 'Enabled' : 'Disabled';
      const smsEnabled = user.preferences.smsNotifications ? 'Enabled' : 'Disabled';
      const darkModeEnabled = user.preferences.darkMode ? 'Enabled' : 'Disabled';
      
      expect(screen.getByText(emailEnabled)).toBeInTheDocument();
      expect(screen.getByText(smsEnabled)).toBeInTheDocument();
      expect(screen.getByText(darkModeEnabled)).toBeInTheDocument();
      
      // Check language preference
      expect(screen.getByText(user.preferences.language)).toBeInTheDocument();
    });

    it('hides preferences for other users', () => {
      const user = healthcareUserProfiles.team_lead;
      
      render(
        <UserProfile
          user={user}
          currentUserId="different_user"
          showPreferences={true}
        />
      );

      // Should not show preferences for other users
      expect(screen.queryByText('Preferences')).not.toBeInTheDocument();
      expect(screen.queryByText('Email Notifications')).not.toBeInTheDocument();
    });
  });

  describe('Healthcare Date & Time Formatting', () => {
    it('formats Australian dates correctly', () => {
      const user = healthcareUserProfiles.frontline_worker;
      
      render(
        <UserProfile
          user={user}
          currentUserId={user.id}
        />
      );

      // Check date formatting (Australian format: DD/MM/YYYY becomes "DD MMM YYYY")
      const joinedDate = user.joinedAt.toLocaleDateString('en-AU', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      
      expect(screen.getByText(joinedDate)).toBeInTheDocument();
    });

    it('calculates and displays time since last activity', () => {
      const user = {
        ...healthcareUserProfiles.company_admin,
        isOnline: false,
        lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      };
      
      render(
        <UserProfile
          user={user}
          currentUserId={user.id}
        />
      );

      // Should show relative time for last activity
      expect(screen.getByText(/2h ago|last seen/i)).toBeInTheDocument();
    });
  });

  describe('Healthcare Error Handling & Edge Cases', () => {
    it('handles missing contact information gracefully', () => {
      const userWithMissingInfo = {
        ...healthcareUserProfiles.team_lead,
        phone: undefined,
        location: undefined,
        department: undefined,
        title: undefined,
      };
      
      render(
        <UserProfile
          user={userWithMissingInfo}
          currentUserId={userWithMissingInfo.id}
        />
      );

      // Should still show basic information
      expect(screen.getByText('Jennifer Wu')).toBeInTheDocument();
      expect(screen.getByText('Team Leader')).toBeInTheDocument();
      
      // Should not show sections for missing data
      expect(screen.queryByTestId('phone-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('mappin-icon')).not.toBeInTheDocument();
    });

    it('maintains accessibility with missing optional data', async () => {
      const minimalUser = {
        ...healthcareUserProfiles.frontline_worker,
        phone: undefined,
        avatar: undefined,
        location: undefined,
        department: undefined,
        title: undefined,
      };
      
      const { container } = render(
        <UserProfile
          user={minimalUser}
          currentUserId={minimalUser.id}
        />
      );

      // Should maintain accessibility even with minimal data
      await testHealthcareAccessibility(container, 'UserProfile with minimal data');
    });

    it('handles extreme statistics values', () => {
      const userWithExtremeStats = {
        ...healthcareUserProfiles.system_admin,
        stats: {
          incidentsReported: 9999,
          incidentsAnalyzed: 0,
          averageResponseTime: 999,
          completionRate: 100,
        },
      };
      
      render(
        <UserProfile
          user={userWithExtremeStats}
          currentUserId={userWithExtremeStats.id}
          showStats={true}
        />
      );

      // Should display extreme values correctly
      expect(screen.getByText('9999')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('999m')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });
});