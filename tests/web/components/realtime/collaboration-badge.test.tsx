// @ts-nocheck
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CollaborationBadge, CollaboratingUser, CollaborationSession } from '@/components/realtime/collaboration-badge';
import { healthcareTestUtils, healthcareUserRoles } from '../../../fixtures/healthcare';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Users: () => <div data-testid="users-icon" />,
  User: () => <div data-testid="user-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  Edit3: () => <div data-testid="edit-icon" />,
  Crown: () => <div data-testid="crown-icon" />,
  Shield: () => <div data-testid="shield-icon" />,
  UserCheck: () => <div data-testid="user-check-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  Activity: () => <div data-testid="activity-icon" />,
  Keyboard: () => <div data-testid="keyboard-icon" />,
  Circle: () => <div data-testid="circle-icon" />,
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  Lock: () => <div data-testid="lock-icon" />,
  Unlock: () => <div data-testid="unlock-icon" />,
}));

// Mock UI components
jest.mock('@starter/ui', () => ({
  Badge: ({ children, className, variant }: any) => (
    <div data-testid="badge" className={className} data-variant={variant}>
      {children}
    </div>
  ),
  Button: ({ children, className, onClick, size, variant }: any) => (
    <button 
      data-testid="button" 
      className={className} 
      onClick={onClick}
      data-size={size}
      data-variant={variant}
    >
      {children}
    </button>
  ),
  Card: ({ children, className }: any) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
  CardContent: ({ children, className }: any) => (
    <div data-testid="card-content" className={className}>
      {children}
    </div>
  ),
}));

describe('CollaborationBadge', () => {
  // Healthcare team collaboration scenarios
  const createHealthcareTeamUsers = (): CollaboratingUser[] => [
    {
      id: 'user_001',
      name: 'Dr. Sarah Mitchell',
      role: 'system_admin' as const,
      activity: 'editing' as const,
      lastSeen: new Date(Date.now() - 30000), // 30 seconds ago
      permissions: {
        canEdit: true,
        canView: true,
        canComment: true,
      },
      location: {
        section: 'Incident Analysis',
        field: 'risk_assessment',
      },
    },
    {
      id: 'user_002',
      name: 'Jennifer Wu',
      role: 'team_lead' as const,
      activity: 'viewing' as const,
      lastSeen: new Date(Date.now() - 60000), // 1 minute ago
      permissions: {
        canEdit: true,
        canView: true,
        canComment: true,
      },
      location: {
        section: 'Participant Details',
      },
    },
    {
      id: 'user_003',
      name: 'David Chen',
      role: 'frontline_worker' as const,
      activity: 'typing' as const,
      lastSeen: new Date(Date.now() - 10000), // 10 seconds ago
      isCurrentUser: true,
      permissions: {
        canEdit: false,
        canView: true,
        canComment: true,
      },
      location: {
        section: 'Incident Narrative',
        field: 'description',
      },
    },
    {
      id: 'user_004',
      name: 'Mark Thompson',
      role: 'company_admin' as const,
      activity: 'idle' as const,
      lastSeen: new Date(Date.now() - 600000), // 10 minutes ago (should be filtered out as away)
      permissions: {
        canEdit: true,
        canView: true,
        canComment: true,
      },
    },
  ];

  const createIncidentSession = (): CollaborationSession => ({
    id: 'session_001',
    resourceId: 'incident_123',
    resourceType: 'incident' as const,
    startTime: new Date(Date.now() - 3600000), // 1 hour ago
    isLocked: false,
    maxCollaborators: 5,
    conflictCount: 0,
  });

  const mockHandlers = {
    onUserClick: jest.fn(),
    onViewUsers: jest.fn(),
    onResolveConflict: jest.fn(),
    onRequestAccess: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Healthcare Team Collaboration Scenarios', () => {
    it('should display active healthcare team members editing incident', () => {
      const users = createHealthcareTeamUsers();
      const session = createIncidentSession();

      render(
        <CollaborationBadge
          users={users}
          session={session}
          currentUserId="user_003"
          variant="full"
        />
      );

      // Should show healthcare team collaboration
      expect(screen.getByText('Active Collaborators')).toBeInTheDocument();
      expect(screen.getByText(/3 user.*currently working/)).toBeInTheDocument(); // 3 active users (excluding away user)

      // Should show healthcare roles
      expect(screen.getByText('Dr. Sarah Mitchell')).toBeInTheDocument();
      expect(screen.getByText('Jennifer Wu')).toBeInTheDocument();
      expect(screen.getByText('David Chen')).toBeInTheDocument();
      expect(screen.getByText('(You)')).toBeInTheDocument();

      // Should not show away user (Mark Thompson) in active count
      expect(screen.queryByText('Mark Thompson')).not.toBeInTheDocument();
    });

    it('should show correct activity indicators for healthcare workflow', () => {
      const users = createHealthcareTeamUsers();

      render(
        <CollaborationBadge
          users={users}
          variant="compact"
          showActivity={true}
        />
      );

      // Should show activity summary for healthcare team
      expect(screen.getByText('1 editing')).toBeInTheDocument(); // Dr. Sarah editing
      expect(screen.getByText('1 viewing')).toBeInTheDocument(); // Jennifer viewing
      // David typing should be counted (current user activity)
    });

    it('should handle workflow handoff scenario with notifications', () => {
      const frontlineUser: CollaboratingUser = {
        id: 'user_004',
        name: 'David Chen',
        role: 'frontline_worker',
        activity: 'editing',
        lastSeen: new Date(),
        permissions: { canEdit: true, canView: true, canComment: true },
      };

      const teamLeadUser: CollaboratingUser = {
        id: 'user_005',
        name: 'Jennifer Wu',
        role: 'team_lead',
        activity: 'viewing',
        lastSeen: new Date(),
        permissions: { canEdit: true, canView: true, canComment: true },
      };

      render(
        <CollaborationBadge
          users={[frontlineUser, teamLeadUser]}
          variant="compact"
          currentUserId="user_004"
        />
      );

      expect(screen.getByText('Collaborating')).toBeInTheDocument();
      expect(screen.getByText('2 active')).toBeInTheDocument();
    });

    it('should show conflict indicators for simultaneous editing', () => {
      const conflictUsers = createHealthcareTeamUsers().map(user => ({
        ...user,
        hasConflict: user.activity === 'editing' ? true : false,
      }));

      render(
        <CollaborationBadge
          users={conflictUsers}
          showConflicts={true}
          variant="compact"
          onResolveConflict={mockHandlers.onResolveConflict}
        />
      );

      // Should show conflict badge
      expect(screen.getByText(/conflict/i)).toBeInTheDocument();

      // Should show conflict resolution option for editing user
      const resolveButtons = screen.getAllByText('Resolve');
      expect(resolveButtons.length).toBeGreaterThan(0);
    });

    it('should handle locked incident during handoff', () => {
      const users = createHealthcareTeamUsers();
      const lockedSession: CollaborationSession = {
        ...createIncidentSession(),
        isLocked: true,
        lockOwner: 'user_001', // Dr. Sarah Mitchell
      };

      render(
        <CollaborationBadge
          users={users}
          session={lockedSession}
          variant="compact"
        />
      );

      expect(screen.getByText(/locked/i)).toBeInTheDocument();
    });
  });

  describe('Variant Display Modes', () => {
    const users = createHealthcareTeamUsers().slice(0, 2); // Use 2 users for simplicity

    it('should render minimal variant for healthcare dashboard', () => {
      render(
        <CollaborationBadge
          users={users}
          variant="minimal"
          showConflicts={true}
        />
      );

      // Should show user avatars/initials in minimal space
      expect(screen.getByText('DM')).toBeInTheDocument(); // Dr. Mitchell initials
      expect(screen.getByText('JW')).toBeInTheDocument(); // Jennifer Wu initials
    });

    it('should render count variant for navigation indicators', () => {
      render(
        <CollaborationBadge
          users={users}
          variant="count"
        />
      );

      expect(screen.getByTestId('users-icon')).toBeInTheDocument();
      expect(screen.getByText(users.length.toString())).toBeInTheDocument();
    });

    it('should render compact variant for workflow sidebars', () => {
      render(
        <CollaborationBadge
          users={users}
          variant="compact"
        />
      );

      expect(screen.getByText('Collaborating')).toBeInTheDocument();
      expect(screen.getByText(`${users.length} active`)).toBeInTheDocument();
    });

    it('should render full variant for detailed collaboration view', () => {
      const session = createIncidentSession();

      render(
        <CollaborationBadge
          users={users}
          session={session}
          variant="full"
        />
      );

      expect(screen.getByText('Active Collaborators')).toBeInTheDocument();
      // Should show session metrics
      expect(screen.getByText(/active/i)).toBeInTheDocument();
      expect(screen.getByText(/editing/i)).toBeInTheDocument();
      expect(screen.getByText(/viewing/i)).toBeInTheDocument();
    });
  });

  describe('Healthcare Role-Based Permissions', () => {
    it('should show permission indicators for different healthcare roles', () => {
      const users = createHealthcareTeamUsers();

      render(
        <CollaborationBadge
          users={users}
          showPermissions={true}
          showRoles={true}
          variant="full"
        />
      );

      // System admin should have full edit permissions
      expect(screen.getByText('System Admin')).toBeInTheDocument();
      
      // Team lead should have edit permissions
      expect(screen.getByText('Team Leader')).toBeInTheDocument();
      
      // Frontline worker might have limited permissions
      expect(screen.getByText('Frontline Worker')).toBeInTheDocument();
    });

    it('should handle permission request flow for restricted users', () => {
      const restrictedUser: CollaboratingUser = {
        id: 'user_restricted',
        name: 'New Trainee',
        role: 'frontline_worker',
        activity: 'viewing',
        lastSeen: new Date(),
        permissions: {
          canEdit: false,
          canView: true,
          canComment: false,
        },
      };

      render(
        <CollaborationBadge
          users={[restrictedUser]}
          variant="full"
          onRequestAccess={mockHandlers.onRequestAccess}
        />
      );

      const requestButton = screen.getByText('Request Access');
      fireEvent.click(requestButton);

      expect(mockHandlers.onRequestAccess).toHaveBeenCalled();
    });
  });

  describe('Real-time Activity Tracking', () => {
    it('should filter out inactive users based on last seen time', () => {
      const users = createHealthcareTeamUsers();
      
      render(
        <CollaborationBadge
          users={users}
          variant="compact"
        />
      );

      // Should show 3 active users (Mark Thompson should be filtered out due to 10min inactivity)
      expect(screen.getByText('3 active')).toBeInTheDocument();
    });

    it('should show real-time activity animations for active users', () => {
      const activeUser: CollaboratingUser = {
        id: 'user_active',
        name: 'Active User',
        role: 'team_lead',
        activity: 'typing',
        lastSeen: new Date(),
        permissions: { canEdit: true, canView: true, canComment: true },
      };

      render(
        <CollaborationBadge
          users={[activeUser]}
          variant="minimal"
          showActivity={true}
        />
      );

      // Activity indicator should be present for typing activity
      // (Animation classes would be tested in integration tests)
      const userElement = screen.getByText('AU'); // Active User initials
      expect(userElement).toBeInTheDocument();
    });

    it('should handle user location tracking within incident sections', () => {
      const users = createHealthcareTeamUsers();

      render(
        <CollaborationBadge
          users={users}
          variant="full"
        />
      );

      // Should show user locations in incident sections
      expect(screen.getByText(/Incident Analysis/)).toBeInTheDocument();
      expect(screen.getByText(/Participant Details/)).toBeInTheDocument();
      expect(screen.getByText(/Incident Narrative/)).toBeInTheDocument();
    });
  });

  describe('Healthcare Compliance & Accessibility', () => {
    it('should provide appropriate ARIA labels for screen readers', () => {
      const users = createHealthcareTeamUsers();

      render(
        <CollaborationBadge
          users={users}
          variant="minimal"
        />
      );

      // Check for accessibility attributes on user elements
      const userElements = screen.getAllByRole('button');
      userElements.forEach(element => {
        expect(element).toHaveAttribute('title');
      });
    });

    it('should handle user interactions for healthcare workflow', () => {
      const users = createHealthcareTeamUsers();

      render(
        <CollaborationBadge
          users={users}
          variant="full"
          onUserClick={mockHandlers.onUserClick}
          onViewUsers={mockHandlers.onViewUsers}
        />
      );

      // Test user click interaction
      const userElement = screen.getByText('Dr. Sarah Mitchell');
      fireEvent.click(userElement);
      
      expect(mockHandlers.onUserClick).toHaveBeenCalledWith('user_001');
    });

    it('should show appropriate indicators for NDIS compliance requirements', () => {
      const users = createHealthcareTeamUsers();
      const session = createIncidentSession();

      render(
        <CollaborationBadge
          users={users}
          session={session}
          variant="full"
          showConflicts={true}
        />
      );

      // Should show collaboration metrics for audit trail
      expect(screen.getByText(/Active$/)).toBeInTheDocument();
      expect(screen.getByText(/Editing$/)).toBeInTheDocument();
      expect(screen.getByText(/Viewing$/)).toBeInTheDocument();
    });
  });

  describe('Error Handling & Edge Cases', () => {
    it('should handle empty user list gracefully', () => {
      render(
        <CollaborationBadge
          users={[]}
          variant="compact"
        />
      );

      expect(screen.getByText('0 active')).toBeInTheDocument();
    });

    it('should handle users without avatars', () => {
      const userWithoutAvatar: CollaboratingUser = {
        id: 'user_no_avatar',
        name: 'Test User',
        role: 'frontline_worker',
        activity: 'viewing',
        lastSeen: new Date(),
        permissions: { canEdit: true, canView: true, canComment: true },
      };

      render(
        <CollaborationBadge
          users={[userWithoutAvatar]}
          variant="minimal"
        />
      );

      // Should show initials when no avatar
      expect(screen.getByText('TU')).toBeInTheDocument();
    });

    it('should handle maximum visible users with overflow', () => {
      const manyUsers = Array.from({ length: 8 }, (_, i) => ({
        id: `user_${i}`,
        name: `User ${i}`,
        role: 'frontline_worker' as const,
        activity: 'viewing' as const,
        lastSeen: new Date(),
        permissions: { canEdit: true, canView: true, canComment: true },
      }));

      render(
        <CollaborationBadge
          users={manyUsers}
          variant="minimal"
          maxVisible={3}
          onViewUsers={mockHandlers.onViewUsers}
        />
      );

      // Should show overflow indicator
      expect(screen.getByText('+5')).toBeInTheDocument();
      
      // Test overflow click
      const overflowElement = screen.getByText('+5');
      fireEvent.click(overflowElement);
      expect(mockHandlers.onViewUsers).toHaveBeenCalled();
    });

    it('should format time correctly for different intervals', () => {
      const users = [
        {
          id: 'user_now',
          name: 'Just Now User',
          role: 'team_lead' as const,
          activity: 'editing' as const,
          lastSeen: new Date(),
          permissions: { canEdit: true, canView: true, canComment: true },
        },
        {
          id: 'user_minutes',
          name: 'Minutes Ago User',
          role: 'team_lead' as const,
          activity: 'viewing' as const,
          lastSeen: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
          permissions: { canEdit: true, canView: true, canComment: true },
        },
        {
          id: 'user_hours',
          name: 'Hours Ago User',
          role: 'team_lead' as const,
          activity: 'idle' as const,
          lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          permissions: { canEdit: true, canView: true, canComment: true },
        },
      ];

      render(
        <CollaborationBadge
          users={users}
          variant="full"
        />
      );

      // Should show relative time formatting
      expect(screen.getByText(/now/i)).toBeInTheDocument();
      expect(screen.getByText(/5m/)).toBeInTheDocument();
      expect(screen.getByText(/2h/)).toBeInTheDocument();
    });
  });
});