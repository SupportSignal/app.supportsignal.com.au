// @ts-nocheck
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LiveStatusIndicator, LiveStatus, LiveEvent } from '@/components/realtime/live-status-indicator';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Zap: () => <div data-testid="zap-icon" />,
  Wifi: () => <div data-testid="wifi-icon" />,
  WifiOff: () => <div data-testid="wifi-off-icon" />,
  RefreshCw: () => <div data-testid="refresh-icon" />,
  AlertTriangle: () => <div data-testid="alert-icon" />,
  CheckCircle: () => <div data-testid="check-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  Users: () => <div data-testid="users-icon" />,
  Activity: () => <div data-testid="activity-icon" />,
  Database: () => <div data-testid="database-icon" />,
  CloudOff: () => <div data-testid="cloud-off-icon" />,
  Pause: () => <div data-testid="pause-icon" />,
  Play: () => <div data-testid="play-icon" />,
  X: () => <div data-testid="x-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  Edit3: () => <div data-testid="edit-icon" />,
  MessageSquare: () => <div data-testid="message-icon" />,
  Bell: () => <div data-testid="bell-icon" />,
  Signal: () => <div data-testid="signal-icon" />,
}));

// Mock UI components
jest.mock('@starter/ui', () => ({
  Badge: ({ children, className }: any) => (
    <div data-testid="badge" className={className}>
      {children}
    </div>
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

describe('LiveStatusIndicator', () => {
  // Healthcare connection scenarios
  const createHealthcareStatus = (status: LiveStatus['connectionStatus']): LiveStatus => ({
    connectionStatus: status,
    lastUpdate: new Date(Date.now() - 30000), // 30 seconds ago
    updateFrequency: 5, // 5 seconds
    dataSource: 'NDIS Incident Management System',
    subscriberCount: 12,
    errorCount: status === 'connected' ? 0 : 3,
    latency: status === 'connected' ? 45 : 150,
    retryCount: status === 'reconnecting' ? 2 : 0,
  });

  const createHealthcareEvents = (): LiveEvent[] => [
    {
      id: 'event_001',
      type: 'incident_created',
      timestamp: new Date(Date.now() - 60000), // 1 minute ago
      message: 'New incident reported for participant Alex Williams',
      priority: 'high',
      userId: 'user_frontline_001',
      userName: 'David Chen',
    },
    {
      id: 'event_002',
      type: 'user_joined',
      timestamp: new Date(Date.now() - 120000), // 2 minutes ago
      message: 'Jennifer Wu joined the incident analysis',
      priority: 'medium',
      userId: 'user_teamlead_001',
      userName: 'Jennifer Wu',
    },
    {
      id: 'event_003',
      type: 'analysis_complete',
      timestamp: new Date(Date.now() - 180000), // 3 minutes ago
      message: 'Risk assessment completed for incident #INC-2024-0123',
      priority: 'medium',
      userId: 'user_analyst_001',
      userName: 'Dr. Sarah Mitchell',
    },
    {
      id: 'event_004',
      type: 'incident_updated',
      timestamp: new Date(Date.now() - 300000), // 5 minutes ago
      message: 'Narrative enhanced with AI-generated insights',
      priority: 'low',
      userId: 'system',
      userName: 'System',
    },
    {
      id: 'event_005',
      type: 'notification',
      timestamp: new Date(Date.now() - 600000), // 10 minutes ago
      message: 'Workflow handoff: Incident assigned to team lead',
      priority: 'critical',
      userId: 'user_admin_001',
      userName: 'Mark Thompson',
    },
  ];

  const mockHandlers = {
    onReconnect: jest.fn(),
    onPause: jest.fn(),
    onResume: jest.fn(),
    onClearEvents: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Healthcare Connection Status Management', () => {
    it('should display connected status for NDIS system', () => {
      const status = createHealthcareStatus('connected');
      const events = createHealthcareEvents();

      render(
        <LiveStatusIndicator
          status={status}
          recentEvents={events}
          variant="full"
          showMetrics={true}
        />
      );

      expect(screen.getByText('Real-time Status')).toBeInTheDocument();
      expect(screen.getByText('Live')).toBeInTheDocument();
      expect(screen.getByText('Real-time updates active')).toBeInTheDocument();
      
      // Check healthcare data source
      expect(screen.getByText('NDIS Incident Management System')).toBeInTheDocument();
      
      // Check connection metrics for healthcare workflow
      expect(screen.getByText('45ms')).toBeInTheDocument(); // Low latency for healthcare
      expect(screen.getByText('5s')).toBeInTheDocument(); // Update frequency
      expect(screen.getByText('12')).toBeInTheDocument(); // Healthcare team subscribers
    });

    it('should handle disconnected status during healthcare crisis', () => {
      const status = createHealthcareStatus('disconnected');

      render(
        <LiveStatusIndicator
          status={status}
          variant="compact"
          showControls={true}
          onReconnect={mockHandlers.onReconnect}
        />
      );

      expect(screen.getByText('Offline')).toBeInTheDocument();
      expect(screen.getByText('Connection lost - updates paused')).toBeInTheDocument();
      
      // Should show error count for healthcare monitoring
      expect(screen.getByText('3 errors')).toBeInTheDocument();
      
      // Should provide reconnect option for healthcare continuity
      expect(screen.getByTestId('refresh-icon')).toBeInTheDocument();
    });

    it('should display reconnecting status with retry count', () => {
      const status = createHealthcareStatus('reconnecting');

      render(
        <LiveStatusIndicator
          status={status}
          variant="minimal"
        />
      );

      expect(screen.getByText('Reconnecting')).toBeInTheDocument();
      expect(screen.getByTestId('refresh-icon')).toBeInTheDocument();
    });

    it('should show unstable connection warnings for healthcare systems', () => {
      const status = createHealthcareStatus('unstable');

      render(
        <LiveStatusIndicator
          status={status}
          variant="compact"
        />
      );

      expect(screen.getByText('Unstable')).toBeInTheDocument();
      expect(screen.getByText('Connection unstable - some updates may be delayed')).toBeInTheDocument();
    });
  });

  describe('Healthcare Real-time Events', () => {
    it('should display healthcare workflow events', () => {
      const status = createHealthcareStatus('connected');
      const events = createHealthcareEvents();

      render(
        <LiveStatusIndicator
          status={status}
          recentEvents={events}
          showEvents={true}
          variant="full"
        />
      );

      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      
      // Check healthcare-specific events
      expect(screen.getByText(/New incident reported for participant Alex Williams/)).toBeInTheDocument();
      expect(screen.getByText(/Jennifer Wu joined the incident analysis/)).toBeInTheDocument();
      expect(screen.getByText(/Risk assessment completed/)).toBeInTheDocument();
      expect(screen.getByText(/Narrative enhanced with AI-generated insights/)).toBeInTheDocument();
      expect(screen.getByText(/Workflow handoff: Incident assigned to team lead/)).toBeInTheDocument();
    });

    it('should prioritize critical healthcare events', () => {
      const status = createHealthcareStatus('connected');
      const events = createHealthcareEvents();

      render(
        <LiveStatusIndicator
          status={status}
          recentEvents={events}
          showEvents={true}
          variant="full"
        />
      );

      // Check priority badges
      expect(screen.getByText('critical')).toBeInTheDocument();
      expect(screen.getByText('high')).toBeInTheDocument();
      expect(screen.getAllByText('medium')).toHaveLength(2);
      expect(screen.getByText('low')).toBeInTheDocument();
    });

    it('should show healthcare team member attribution', () => {
      const status = createHealthcareStatus('connected');
      const events = createHealthcareEvents();

      render(
        <LiveStatusIndicator
          status={status}
          recentEvents={events}
          showEvents={true}
          variant="full"
        />
      );

      // Check healthcare team member names
      expect(screen.getByText(/by David Chen/)).toBeInTheDocument();
      expect(screen.getByText(/by Jennifer Wu/)).toBeInTheDocument();
      expect(screen.getByText(/by Dr. Sarah Mitchell/)).toBeInTheDocument();
      expect(screen.getByText(/by Mark Thompson/)).toBeInTheDocument();
    });

    it('should limit events display for healthcare dashboard', () => {
      const status = createHealthcareStatus('connected');
      const manyEvents = Array.from({ length: 20 }, (_, i) => ({
        id: `event_${i}`,
        type: 'incident_updated' as const,
        timestamp: new Date(Date.now() - i * 60000),
        message: `Healthcare event ${i}`,
        priority: 'medium' as const,
        userId: `user_${i}`,
        userName: `Healthcare Worker ${i}`,
      }));

      render(
        <LiveStatusIndicator
          status={status}
          recentEvents={manyEvents}
          showEvents={true}
          maxEvents={5}
          variant="full"
        />
      );

      // Should only show first 5 events
      expect(screen.getByText('Healthcare event 0')).toBeInTheDocument();
      expect(screen.getByText('Healthcare event 4')).toBeInTheDocument();
      expect(screen.queryByText('Healthcare event 5')).not.toBeInTheDocument();
    });
  });

  describe('Healthcare System Metrics', () => {
    it('should display healthcare system performance metrics', () => {
      const status = createHealthcareStatus('connected');

      render(
        <LiveStatusIndicator
          status={status}
          showMetrics={true}
          variant="full"
        />
      );

      // Check critical healthcare system metrics
      expect(screen.getByText('30s ago')).toBeInTheDocument(); // Last update
      expect(screen.getByText('5s')).toBeInTheDocument(); // Frequency critical for healthcare
      expect(screen.getByText('12')).toBeInTheDocument(); // Healthcare team subscribers
      expect(screen.getByText('45ms')).toBeInTheDocument(); // Low latency requirement
    });

    it('should highlight performance issues in healthcare context', () => {
      const slowStatus: LiveStatus = {
        ...createHealthcareStatus('unstable'),
        latency: 500, // High latency for healthcare
        errorCount: 5,
      };

      render(
        <LiveStatusIndicator
          status={slowStatus}
          showMetrics={true}
          variant="full"
        />
      );

      expect(screen.getByText('500ms')).toBeInTheDocument();
      expect(screen.getByText('5 errors')).toBeInTheDocument();
    });

    it('should show bandwidth usage for healthcare data streams', () => {
      const status = createHealthcareStatus('connected');

      render(
        <LiveStatusIndicator
          status={status}
          showMetrics={true}
          variant="full"
        />
      );

      // Data source should be displayed
      expect(screen.getByText('NDIS Incident Management System')).toBeInTheDocument();
    });
  });

  describe('Healthcare System Controls', () => {
    it('should provide reconnection controls for healthcare continuity', async () => {
      const status = createHealthcareStatus('disconnected');

      render(
        <LiveStatusIndicator
          status={status}
          showControls={true}
          onReconnect={mockHandlers.onReconnect}
          variant="full"
        />
      );

      const reconnectButton = screen.getByTestId('refresh-icon').closest('button');
      fireEvent.click(reconnectButton!);

      await waitFor(() => {
        expect(mockHandlers.onReconnect).toHaveBeenCalled();
      });
    });

    it('should allow pausing updates during healthcare procedures', () => {
      const status = createHealthcareStatus('connected');

      render(
        <LiveStatusIndicator
          status={status}
          showControls={true}
          onPause={mockHandlers.onPause}
          onResume={mockHandlers.onResume}
          variant="full"
        />
      );

      const pauseButton = screen.getByTestId('pause-icon').closest('button');
      fireEvent.click(pauseButton!);

      expect(mockHandlers.onPause).toHaveBeenCalled();
    });

    it('should allow clearing events for healthcare audit management', () => {
      const status = createHealthcareStatus('connected');
      const events = createHealthcareEvents();

      render(
        <LiveStatusIndicator
          status={status}
          recentEvents={events}
          showControls={true}
          onClearEvents={mockHandlers.onClearEvents}
          variant="full"
        />
      );

      const clearButton = screen.getByTestId('x-icon').closest('button');
      fireEvent.click(clearButton!);

      expect(mockHandlers.onClearEvents).toHaveBeenCalled();
    });
  });

  describe('Variant Display Modes for Healthcare Dashboards', () => {
    const status = createHealthcareStatus('connected');

    it('should render indicator variant for healthcare navigation', () => {
      render(
        <LiveStatusIndicator
          status={status}
          variant="indicator"
        />
      );

      expect(screen.getByTestId('wifi-icon')).toBeInTheDocument();
      expect(screen.getByText('Live')).toBeInTheDocument();
    });

    it('should render minimal variant for healthcare widgets', () => {
      render(
        <LiveStatusIndicator
          status={status}
          variant="minimal"
        />
      );

      expect(screen.getByText('Live')).toBeInTheDocument();
      expect(screen.getByText('30s ago')).toBeInTheDocument();
    });

    it('should render compact variant for healthcare sidebars', () => {
      render(
        <LiveStatusIndicator
          status={status}
          variant="compact"
          showMetrics={true}
        />
      );

      expect(screen.getByText('Live Status')).toBeInTheDocument();
      expect(screen.getByText('Real-time updates active')).toBeInTheDocument();
      expect(screen.getByText('30s ago')).toBeInTheDocument();
      expect(screen.getByText('12 subscribers')).toBeInTheDocument();
    });

    it('should render full variant for healthcare monitoring dashboard', () => {
      const events = createHealthcareEvents();

      render(
        <LiveStatusIndicator
          status={status}
          recentEvents={events}
          variant="full"
          showMetrics={true}
          showControls={true}
        />
      );

      expect(screen.getByText('Real-time Status')).toBeInTheDocument();
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      // Should show comprehensive metrics
      expect(screen.getByText('30s ago')).toBeInTheDocument();
      expect(screen.getByText('5s')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
      expect(screen.getByText('45ms')).toBeInTheDocument();
    });
  });

  describe('Healthcare Time Formatting', () => {
    it('should format timestamps in Australian healthcare format', () => {
      const status = createHealthcareStatus('connected');
      const recentEvent: LiveEvent = {
        id: 'recent_event',
        type: 'incident_created',
        timestamp: new Date(), // Just now
        message: 'Recent healthcare event',
        priority: 'medium',
        userId: 'user_001',
        userName: 'Healthcare Worker',
      };

      render(
        <LiveStatusIndicator
          status={status}
          recentEvents={[recentEvent]}
          showEvents={true}
          variant="full"
        />
      );

      // Should format time for Australian healthcare context
      expect(screen.getByText(/\d{1,2}:\d{2}:\d{2}/)).toBeInTheDocument();
    });

    it('should handle various time intervals for healthcare monitoring', () => {
      const statuses = [
        { ...createHealthcareStatus('connected'), lastUpdate: new Date(Date.now() - 30000) }, // 30s
        { ...createHealthcareStatus('connected'), lastUpdate: new Date(Date.now() - 300000) }, // 5m
        { ...createHealthcareStatus('connected'), lastUpdate: new Date(Date.now() - 3600000) }, // 1h
      ];

      statuses.forEach((status, index) => {
        const { unmount } = render(
          <LiveStatusIndicator
            status={status}
            variant="minimal"
          />
        );

        if (index === 0) {
          expect(screen.getByText('30s ago')).toBeInTheDocument();
        } else if (index === 1) {
          expect(screen.getByText('5m ago')).toBeInTheDocument();
        }

        unmount();
      });
    });
  });

  describe('Healthcare Error Handling & Edge Cases', () => {
    it('should handle missing event data gracefully', () => {
      const status = createHealthcareStatus('connected');

      render(
        <LiveStatusIndicator
          status={status}
          recentEvents={[]}
          showEvents={true}
          variant="full"
        />
      );

      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      // Should not crash with empty events
    });

    it('should handle undefined subscriber count for healthcare system', () => {
      const status: LiveStatus = {
        ...createHealthcareStatus('connected'),
        subscriberCount: undefined,
      };

      render(
        <LiveStatusIndicator
          status={status}
          showMetrics={true}
          variant="full"
        />
      );

      // Should not show subscriber count when undefined
      expect(screen.queryByText(/subscribers/)).not.toBeInTheDocument();
    });

    it('should handle missing user attribution in healthcare events', () => {
      const status = createHealthcareStatus('connected');
      const eventsWithoutUsers: LiveEvent[] = [
        {
          id: 'event_no_user',
          type: 'system_alert',
          timestamp: new Date(),
          message: 'System maintenance completed',
          priority: 'low',
        },
      ];

      render(
        <LiveStatusIndicator
          status={status}
          recentEvents={eventsWithoutUsers}
          showEvents={true}
          variant="full"
        />
      );

      expect(screen.getByText('System maintenance completed')).toBeInTheDocument();
      // Should not show "by undefined"
      expect(screen.queryByText(/by undefined/)).not.toBeInTheDocument();
    });

    it('should handle connection status changes during healthcare operations', () => {
      const initialStatus = createHealthcareStatus('connected');
      
      const { rerender } = render(
        <LiveStatusIndicator
          status={initialStatus}
          variant="compact"
        />
      );

      expect(screen.getByText('Live')).toBeInTheDocument();

      // Simulate connection loss during healthcare procedure
      const disconnectedStatus = createHealthcareStatus('disconnected');
      rerender(
        <LiveStatusIndicator
          status={disconnectedStatus}
          variant="compact"
        />
      );

      expect(screen.getByText('Offline')).toBeInTheDocument();
      expect(screen.getByText('Connection lost - updates paused')).toBeInTheDocument();
    });

    it('should handle auto-reconnect scenarios for healthcare continuity', () => {
      const status = createHealthcareStatus('reconnecting');

      render(
        <LiveStatusIndicator
          status={status}
          autoReconnect={true}
          variant="compact"
        />
      );

      expect(screen.getByText('Reconnecting')).toBeInTheDocument();
      expect(screen.getByText('Attempting to restore connection...')).toBeInTheDocument();
    });
  });

  describe('Healthcare Compliance & Accessibility', () => {
    it('should provide appropriate ARIA labels for healthcare accessibility', () => {
      const status = createHealthcareStatus('connected');

      render(
        <LiveStatusIndicator
          status={status}
          showControls={true}
          onReconnect={mockHandlers.onReconnect}
          variant="full"
        />
      );

      // Control buttons should be accessible
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should maintain audit trail for healthcare status changes', () => {
      const status = createHealthcareStatus('connected');
      const auditEvents = createHealthcareEvents();

      render(
        <LiveStatusIndicator
          status={status}
          recentEvents={auditEvents}
          showEvents={true}
          variant="full"
        />
      );

      // Should show timestamped events for healthcare audit
      expect(screen.getByText(/\d{1,2}:\d{2}:\d{2}/)).toBeInTheDocument();
      auditEvents.forEach(event => {
        if (event.userName) {
          expect(screen.getByText(`by ${event.userName}`)).toBeInTheDocument();
        }
      });
    });
  });
});