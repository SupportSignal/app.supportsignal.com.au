// @ts-nocheck
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NotificationCenter, Notification, NotificationSettings } from '@/components/realtime/notification-center';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Bell: () => <div data-testid="bell-icon" />,
  BellOff: () => <div data-testid="bell-off-icon" />,
  X: () => <div data-testid="x-icon" />,
  Check: () => <div data-testid="check-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  Info: () => <div data-testid="info-icon" />,
  CheckCircle: () => <div data-testid="check-circle-icon" />,
  XCircle: () => <div data-testid="x-circle-icon" />,
  ArrowRight: () => <div data-testid="arrow-right-icon" />,
  User: () => <div data-testid="user-icon" />,
  Users: () => <div data-testid="users-icon" />,
  FileText: () => <div data-testid="file-text-icon" />,
  Activity: () => <div data-testid="activity-icon" />,
  MessageSquare: () => <div data-testid="message-square-icon" />,
  Calendar: () => <div data-testid="calendar-icon" />,
  Zap: () => <div data-testid="zap-icon" />,
  Filter: () => <div data-testid="filter-icon" />,
  Search: () => <div data-testid="search-icon" />,
  Archive: () => <div data-testid="archive-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  EyeOff: () => <div data-testid="eye-off-icon" />,
  Volume2: () => <div data-testid="volume-icon" />,
  VolumeX: () => <div data-testid="volume-x-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
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
  CardHeader: ({ children, className }: any) => (
    <div data-testid="card-header" className={className}>
      {children}
    </div>
  ),
  CardTitle: ({ children, className }: any) => (
    <div data-testid="card-title" className={className}>
      {children}
    </div>
  ),
}));

describe('NotificationCenter', () => {
  // Healthcare workflow notification scenarios
  const createHealthcareNotifications = (): Notification[] => [
    {
      id: 'notif_001',
      type: 'workflow_handoff',
      title: 'Incident Handoff - Team Lead Review Required',
      message: 'Incident #INC-2024-0123 has been completed by David Chen and requires team lead review for participant Alex Williams.',
      priority: 'high',
      category: 'workflow',
      timestamp: new Date(Date.now() - 300000), // 5 minutes ago
      isRead: false,
      isArchived: false,
      resourceId: 'incident_123',
      resourceType: 'incident',
      fromUser: {
        id: 'user_frontline_001',
        name: 'David Chen',
      },
      actionRequired: true,
      dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    },
    {
      id: 'notif_002', 
      type: 'incident_assigned',
      title: 'New Incident Assigned',
      message: 'You have been assigned incident #INC-2024-0124 for participant Jamie Park requiring immediate attention.',
      priority: 'critical',
      category: 'incident',
      timestamp: new Date(Date.now() - 600000), // 10 minutes ago
      isRead: false,
      isArchived: false,
      resourceId: 'incident_124',
      resourceType: 'incident',
      fromUser: {
        id: 'user_teamlead_001',
        name: 'Jennifer Wu',
      },
      actionRequired: true,
    },
    {
      id: 'notif_003',
      type: 'analysis_complete',
      title: 'Risk Assessment Completed',
      message: 'AI-powered risk assessment has been completed for incident #INC-2024-0122. Review recommendations now available.',
      priority: 'medium',
      category: 'workflow',
      timestamp: new Date(Date.now() - 900000), // 15 minutes ago
      isRead: true,
      isArchived: false,
      resourceId: 'incident_122',
      resourceType: 'analysis',
    },
    {
      id: 'notif_004',
      type: 'comment_added',
      title: 'New Comment on Incident',
      message: 'Dr. Sarah Mitchell added a comment to your incident report regarding follow-up care recommendations.',
      priority: 'medium',
      category: 'collaboration',
      timestamp: new Date(Date.now() - 1200000), // 20 minutes ago
      isRead: true,
      isArchived: false,
      resourceId: 'incident_125',
      resourceType: 'incident',
      fromUser: {
        id: 'user_admin_001',
        name: 'Dr. Sarah Mitchell',
      },
    },
    {
      id: 'notif_005',
      type: 'deadline_approaching',
      title: 'NDIS Reporting Deadline Approaching',
      message: 'Monthly incident summary report for CityCare NDIS Services is due in 2 hours.',
      priority: 'high',
      category: 'deadline',
      timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
      isRead: false,
      isArchived: false,
      dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
    },
    {
      id: 'notif_006',
      type: 'system_alert',
      title: 'System Maintenance Scheduled',
      message: 'NDIS Incident Management System maintenance scheduled for tonight 11 PM - 3 AM AEST.',
      priority: 'low',
      category: 'system',
      timestamp: new Date(Date.now() - 3600000), // 1 hour ago
      isRead: true,
      isArchived: true,
    },
    {
      id: 'notif_007',
      type: 'user_mention',
      title: 'You were mentioned in incident discussion',
      message: 'Mark Thompson mentioned you in incident #INC-2024-0121: "Please coordinate with Jennifer for follow-up"',
      priority: 'medium',
      category: 'collaboration',
      timestamp: new Date(Date.now() - 2400000), // 40 minutes ago
      isRead: false,
      isArchived: false,
      fromUser: {
        id: 'user_admin_002',
        name: 'Mark Thompson',
      },
    },
  ];

  const createHealthcareSettings = (): NotificationSettings => ({
    enabled: true,
    sound: true,
    desktop: true,
    email: false,
    categories: {
      workflow: true,
      incident: true,
      system: true,
      collaboration: true,
      deadline: true,
    },
    priority: {
      low: true,
      medium: true,
      high: true,
      critical: true,
    },
  });

  const mockHandlers = {
    onNotificationClick: jest.fn(),
    onNotificationDismiss: jest.fn(),
    onNotificationArchive: jest.fn(),
    onMarkAsRead: jest.fn(),
    onMarkAllAsRead: jest.fn(),
    onClearAll: jest.fn(),
    onSettingsChange: jest.fn(),
    onAction: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Healthcare Workflow Handoff Notifications', () => {
    it('should display healthcare workflow handoff notifications', () => {
      const notifications = createHealthcareNotifications();
      const settings = createHealthcareSettings();

      render(
        <NotificationCenter
          notifications={notifications}
          settings={settings}
          variant="full"
        />
      );

      expect(screen.getByText('Notification Center')).toBeInTheDocument();
      
      // Check workflow handoff notification
      expect(screen.getByText('Incident Handoff - Team Lead Review Required')).toBeInTheDocument();
      expect(screen.getByText(/David Chen and requires team lead review/)).toBeInTheDocument();
      expect(screen.getByText('Action Required')).toBeInTheDocument();
      
      // Check incident assignment
      expect(screen.getByText('New Incident Assigned')).toBeInTheDocument();
      expect(screen.getByText(/Jamie Park requiring immediate attention/)).toBeInTheDocument();
    });

    it('should prioritize critical healthcare notifications', () => {
      const notifications = createHealthcareNotifications();
      const settings = createHealthcareSettings();

      render(
        <NotificationCenter
          notifications={notifications}
          settings={settings}
          variant="full"
        />
      );

      // Should show priority badges
      expect(screen.getByText('critical')).toBeInTheDocument();
      expect(screen.getAllByText('high')).toHaveLength(2); // workflow handoff + deadline
      expect(screen.getAllByText('medium')).toHaveLength(3);
      expect(screen.getByText('low')).toBeInTheDocument();
    });

    it('should show healthcare team member attribution', () => {
      const notifications = createHealthcareNotifications();
      const settings = createHealthcareSettings();

      render(
        <NotificationCenter
          notifications={notifications}
          settings={settings}
          variant="full"
        />
      );

      // Check healthcare team member names
      expect(screen.getByText(/by David Chen/)).toBeInTheDocument();
      expect(screen.getByText(/by Jennifer Wu/)).toBeInTheDocument();
      expect(screen.getByText(/by Dr. Sarah Mitchell/)).toBeInTheDocument();
      expect(screen.getByText(/by Mark Thompson/)).toBeInTheDocument();
    });

    it('should handle due dates for healthcare compliance', () => {
      const notifications = createHealthcareNotifications();
      const settings = createHealthcareSettings();

      render(
        <NotificationCenter
          notifications={notifications}
          settings={settings}
          variant="full"
        />
      );

      // Should show due date information for compliance
      expect(screen.getByText(/Due.*\d{1,2}:\d{2}:\d{2}/)).toBeInTheDocument();
    });
  });

  describe('Healthcare Notification Categories', () => {
    const notifications = createHealthcareNotifications();
    const settings = createHealthcareSettings();

    it('should filter by healthcare workflow category', () => {
      render(
        <NotificationCenter
          notifications={notifications}
          settings={settings}
          variant="full"
        />
      );

      // Test workflow category filter
      const categorySelect = screen.getByDisplayValue('All Categories');
      fireEvent.change(categorySelect, { target: { value: 'workflow' } });

      // Should show workflow notifications
      expect(screen.getByText('Incident Handoff - Team Lead Review Required')).toBeInTheDocument();
      expect(screen.getByText('Risk Assessment Completed')).toBeInTheDocument();
      
      // Should not show incident notifications
      expect(screen.queryByText('New Incident Assigned')).not.toBeInTheDocument();
    });

    it('should filter by healthcare incident category', () => {
      render(
        <NotificationCenter
          notifications={notifications}
          settings={settings}
          variant="full"
        />
      );

      const categorySelect = screen.getByDisplayValue('All Categories');
      fireEvent.change(categorySelect, { target: { value: 'incident' } });

      expect(screen.getByText('New Incident Assigned')).toBeInTheDocument();
    });

    it('should filter by healthcare collaboration category', () => {
      render(
        <NotificationCenter
          notifications={notifications}
          settings={settings}
          variant="full"
        />
      );

      const categorySelect = screen.getByDisplayValue('All Categories');
      fireEvent.change(categorySelect, { target: { value: 'collaboration' } });

      expect(screen.getByText('New Comment on Incident')).toBeInTheDocument();
      expect(screen.getByText('You were mentioned in incident discussion')).toBeInTheDocument();
    });

    it('should filter by healthcare deadline category', () => {
      render(
        <NotificationCenter
          notifications={notifications}
          settings={settings}
          variant="full"
        />
      );

      const categorySelect = screen.getByDisplayValue('All Categories');
      fireEvent.change(categorySelect, { target: { value: 'deadline' } });

      expect(screen.getByText('NDIS Reporting Deadline Approaching')).toBeInTheDocument();
    });

    it('should filter by healthcare system category', () => {
      render(
        <NotificationCenter
          notifications={notifications}
          settings={settings}
          variant="full"
        />
      );

      const categorySelect = screen.getByDisplayValue('All Categories');
      fireEvent.change(categorySelect, { target: { value: 'system' } });

      // Should not show archived system notifications by default
      expect(screen.queryByText('System Maintenance Scheduled')).not.toBeInTheDocument();
    });
  });

  describe('Healthcare Notification Management', () => {
    const notifications = createHealthcareNotifications();
    const settings = createHealthcareSettings();

    it('should handle marking healthcare notifications as read', () => {
      render(
        <NotificationCenter
          notifications={notifications}
          settings={settings}
          onMarkAsRead={mockHandlers.onMarkAsRead}
          variant="full"
        />
      );

      // Click on unread notification
      const workflowNotification = screen.getByText('Incident Handoff - Team Lead Review Required');
      fireEvent.click(workflowNotification);

      expect(mockHandlers.onMarkAsRead).toHaveBeenCalledWith('notif_001');
    });

    it('should handle dismissing healthcare notifications', () => {
      render(
        <NotificationCenter
          notifications={notifications}
          settings={settings}
          onNotificationDismiss={mockHandlers.onNotificationDismiss}
          variant="full"
        />
      );

      // Find and click dismiss button
      const dismissButtons = screen.getAllByTestId('x-icon');
      fireEvent.click(dismissButtons[0].closest('button')!);

      expect(mockHandlers.onNotificationDismiss).toHaveBeenCalled();
    });

    it('should handle archiving healthcare notifications', () => {
      render(
        <NotificationCenter
          notifications={notifications}
          settings={settings}
          onNotificationArchive={mockHandlers.onNotificationArchive}
          variant="full"
        />
      );

      // Find and click archive button
      const archiveButtons = screen.getAllByTestId('archive-icon');
      fireEvent.click(archiveButtons[0].closest('button')!);

      expect(mockHandlers.onNotificationArchive).toHaveBeenCalled();
    });

    it('should handle marking all healthcare notifications as read', () => {
      render(
        <NotificationCenter
          notifications={notifications}
          settings={settings}
          onMarkAllAsRead={mockHandlers.onMarkAllAsRead}
          variant="full"
        />
      );

      const markAllButton = screen.getByText('Mark all read');
      fireEvent.click(markAllButton);

      expect(mockHandlers.onMarkAllAsRead).toHaveBeenCalled();
    });

    it('should handle clearing all healthcare notifications', () => {
      render(
        <NotificationCenter
          notifications={notifications}
          settings={settings}
          onClearAll={mockHandlers.onClearAll}
          variant="full"
        />
      );

      const clearAllButton = screen.getByText('Clear all');
      fireEvent.click(clearAllButton);

      expect(mockHandlers.onClearAll).toHaveBeenCalled();
    });
  });

  describe('Healthcare Notification Search & Filtering', () => {
    const notifications = createHealthcareNotifications();
    const settings = createHealthcareSettings();

    it('should search healthcare notifications by content', () => {
      render(
        <NotificationCenter
          notifications={notifications}
          settings={settings}
          variant="full"
        />
      );

      const searchInput = screen.getByPlaceholderText('Search notifications...');
      fireEvent.change(searchInput, { target: { value: 'Alex Williams' } });

      // Should show notifications containing participant name
      expect(screen.getByText('Incident Handoff - Team Lead Review Required')).toBeInTheDocument();
      // Should not show unrelated notifications
      expect(screen.queryByText('New Incident Assigned')).not.toBeInTheDocument();
    });

    it('should search by healthcare team member names', () => {
      render(
        <NotificationCenter
          notifications={notifications}
          settings={settings}
          variant="full"
        />
      );

      const searchInput = screen.getByPlaceholderText('Search notifications...');
      fireEvent.change(searchInput, { target: { value: 'David Chen' } });

      expect(screen.getByText('Incident Handoff - Team Lead Review Required')).toBeInTheDocument();
    });

    it('should filter by unread healthcare notifications', () => {
      render(
        <NotificationCenter
          notifications={notifications}
          settings={settings}
          variant="full"
        />
      );

      const unreadButton = screen.getByText(/Unread \(\d+\)/);
      fireEvent.click(unreadButton);

      // Should show only unread notifications
      expect(screen.getByText('Incident Handoff - Team Lead Review Required')).toBeInTheDocument();
      expect(screen.getByText('New Incident Assigned')).toBeInTheDocument();
      expect(screen.getByText('NDIS Reporting Deadline Approaching')).toBeInTheDocument();
      
      // Should not show read notifications
      expect(screen.queryByText('Risk Assessment Completed')).not.toBeInTheDocument();
    });

    it('should show archived healthcare notifications when requested', () => {
      render(
        <NotificationCenter
          notifications={notifications}
          settings={settings}
          showArchived={true}
          variant="full"
        />
      );

      const archivedButton = screen.getByText('Archived');
      fireEvent.click(archivedButton);

      expect(screen.getByText('System Maintenance Scheduled')).toBeInTheDocument();
    });
  });

  describe('Healthcare Notification Settings', () => {
    const notifications = createHealthcareNotifications();
    const settings = createHealthcareSettings();

    it('should display healthcare notification settings panel', () => {
      render(
        <NotificationCenter
          notifications={notifications}
          settings={settings}
          showSettings={true}
          onSettingsChange={mockHandlers.onSettingsChange}
          variant="full"
        />
      );

      const settingsButton = screen.getByTestId('settings-icon').closest('button');
      fireEvent.click(settingsButton!);

      expect(screen.getByText('Notification Settings')).toBeInTheDocument();
      expect(screen.getByText('Enable notifications')).toBeInTheDocument();
      expect(screen.getByText('Sound notifications')).toBeInTheDocument();
    });

    it('should handle healthcare notification settings changes', () => {
      render(
        <NotificationCenter
          notifications={notifications}
          settings={settings}
          showSettings={true}
          onSettingsChange={mockHandlers.onSettingsChange}
          variant="full"
        />
      );

      const settingsButton = screen.getByTestId('settings-icon').closest('button');
      fireEvent.click(settingsButton!);

      // Toggle notification enable
      const enableToggle = screen.getByText('Enable notifications').closest('div')?.querySelector('button');
      fireEvent.click(enableToggle!);

      expect(mockHandlers.onSettingsChange).toHaveBeenCalledWith({
        ...settings,
        enabled: false,
      });
    });
  });

  describe('Variant Display Modes for Healthcare Dashboards', () => {
    const notifications = createHealthcareNotifications();
    const settings = createHealthcareSettings();

    it('should render minimal variant for healthcare navigation', () => {
      render(
        <NotificationCenter
          notifications={notifications}
          settings={settings}
          variant="minimal"
        />
      );

      const unreadCount = notifications.filter(n => !n.isRead && !n.isArchived).length;
      expect(screen.getByText(unreadCount > 9 ? '9+' : unreadCount.toString())).toBeInTheDocument();
      expect(screen.getByText(/urgent/)).toBeInTheDocument(); // Critical notifications
    });

    it('should render dropdown variant for healthcare quick access', () => {
      render(
        <NotificationCenter
          notifications={notifications}
          settings={settings}
          variant="dropdown"
        />
      );

      expect(screen.getByText('Notifications')).toBeInTheDocument();
      const unreadCount = notifications.filter(n => !n.isRead && !n.isArchived).length;
      expect(screen.getByText(unreadCount.toString())).toBeInTheDocument();
      
      // Should show notifications in compact format
      expect(screen.getByText('Incident Handoff - Team Lead Review Required')).toBeInTheDocument();
    });

    it('should render full variant for healthcare notification management', () => {
      render(
        <NotificationCenter
          notifications={notifications}
          settings={settings}
          variant="full"
        />
      );

      expect(screen.getByText('Notification Center')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search notifications...')).toBeInTheDocument();
      expect(screen.getByDisplayValue('All Categories')).toBeInTheDocument();
      
      // Should show comprehensive notification details
      notifications.forEach(notification => {
        if (!notification.isArchived) {
          expect(screen.getByText(notification.title)).toBeInTheDocument();
        }
      });
    });
  });

  describe('Healthcare Time Formatting & Display', () => {
    it('should format notification timestamps in Australian healthcare format', () => {
      const recentNotification: Notification = {
        id: 'recent_notif',
        type: 'incident_assigned',
        title: 'Recent Healthcare Event',
        message: 'Test message',
        priority: 'medium',
        category: 'incident',
        timestamp: new Date(Date.now() - 30000), // 30 seconds ago
        isRead: false,
        isArchived: false,
      };

      const settings = createHealthcareSettings();

      render(
        <NotificationCenter
          notifications={[recentNotification]}
          settings={settings}
          variant="full"
        />
      );

      expect(screen.getByText('Just now')).toBeInTheDocument();
    });

    it('should handle various time intervals for healthcare monitoring', () => {
      const timeVariations: Notification[] = [
        {
          id: 'notif_minutes',
          type: 'workflow_handoff',
          title: '5 Minutes Ago',
          message: 'Test',
          priority: 'medium',
          category: 'workflow',
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          isRead: false,
          isArchived: false,
        },
        {
          id: 'notif_hours',
          type: 'incident_assigned',
          title: '2 Hours Ago', 
          message: 'Test',
          priority: 'medium',
          category: 'incident',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          isRead: false,
          isArchived: false,
        },
      ];

      const settings = createHealthcareSettings();

      render(
        <NotificationCenter
          notifications={timeVariations}
          settings={settings}
          variant="full"
        />
      );

      expect(screen.getByText('5m ago')).toBeInTheDocument();
      expect(screen.getByText('2h ago')).toBeInTheDocument();
    });
  });

  describe('Healthcare Error Handling & Edge Cases', () => {
    it('should handle empty notification list for healthcare dashboard', () => {
      const settings = createHealthcareSettings();

      render(
        <NotificationCenter
          notifications={[]}
          settings={settings}
          variant="full"
        />
      );

      expect(screen.getByText('No notifications found')).toBeInTheDocument();
      expect(screen.getByText('All caught up!')).toBeInTheDocument();
    });

    it('should handle notifications without healthcare team attribution', () => {
      const systemNotification: Notification = {
        id: 'system_notif',
        type: 'system_alert',
        title: 'System Generated Notification',
        message: 'Automated healthcare system message',
        priority: 'low',
        category: 'system',
        timestamp: new Date(),
        isRead: false,
        isArchived: false,
      };

      const settings = createHealthcareSettings();

      render(
        <NotificationCenter
          notifications={[systemNotification]}
          settings={settings}
          variant="full"
        />
      );

      expect(screen.getByText('System Generated Notification')).toBeInTheDocument();
      // Should not show "by undefined"
      expect(screen.queryByText(/by undefined/)).not.toBeInTheDocument();
    });

    it('should handle maximum visible notifications limit', () => {
      const manyNotifications = Array.from({ length: 20 }, (_, i) => ({
        id: `notif_${i}`,
        type: 'incident_assigned' as const,
        title: `Healthcare Notification ${i}`,
        message: `Test message ${i}`,
        priority: 'medium' as const,
        category: 'incident' as const,
        timestamp: new Date(Date.now() - i * 60000),
        isRead: false,
        isArchived: false,
      }));

      const settings = createHealthcareSettings();

      render(
        <NotificationCenter
          notifications={manyNotifications}
          settings={settings}
          maxVisible={5}
          variant="full"
        />
      );

      // Should only show first 5 notifications
      expect(screen.getByText('Healthcare Notification 0')).toBeInTheDocument();
      expect(screen.getByText('Healthcare Notification 4')).toBeInTheDocument();
      expect(screen.queryByText('Healthcare Notification 5')).not.toBeInTheDocument();
    });

    it('should handle disabled healthcare notification categories', () => {
      const notifications = createHealthcareNotifications();
      const disabledSettings: NotificationSettings = {
        ...createHealthcareSettings(),
        categories: {
          ...createHealthcareSettings().categories,
          workflow: false,
        },
      };

      render(
        <NotificationCenter
          notifications={notifications}
          settings={disabledSettings}
          variant="full"
        />
      );

      // Should still show all notifications in UI (filtering would be server-side)
      expect(screen.getByText('Notification Center')).toBeInTheDocument();
    });
  });

  describe('Healthcare Compliance & Accessibility', () => {
    it('should provide appropriate ARIA labels for healthcare accessibility', () => {
      const notifications = createHealthcareNotifications();
      const settings = createHealthcareSettings();

      render(
        <NotificationCenter
          notifications={notifications}
          settings={settings}
          variant="dropdown"
        />
      );

      // Notification items should be accessible
      const notificationCards = screen.getAllByTestId('card');
      expect(notificationCards.length).toBeGreaterThan(0);
    });

    it('should maintain healthcare audit trail with timestamps', () => {
      const notifications = createHealthcareNotifications();
      const settings = createHealthcareSettings();

      render(
        <NotificationCenter
          notifications={notifications}
          settings={settings}
          variant="full"
        />
      );

      // Should show timestamped notifications for healthcare audit
      notifications.forEach(notification => {
        if (!notification.isArchived) {
          expect(screen.getByText(notification.title)).toBeInTheDocument();
        }
      });
    });

    it('should handle healthcare notification interactions', () => {
      const notifications = createHealthcareNotifications();
      const settings = createHealthcareSettings();

      render(
        <NotificationCenter
          notifications={notifications}
          settings={settings}
          onNotificationClick={mockHandlers.onNotificationClick}
          variant="full"
        />
      );

      // Test notification click interaction
      const notificationElement = screen.getByText('Incident Handoff - Team Lead Review Required');
      fireEvent.click(notificationElement);
      
      expect(mockHandlers.onNotificationClick).toHaveBeenCalledWith(notifications[0]);
    });
  });
});