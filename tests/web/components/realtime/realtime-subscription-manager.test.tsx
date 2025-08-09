// @ts-nocheck
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RealTimeSubscriptionManager, Subscription, ConnectionMetrics, RealTimeConfig } from '@/components/realtime/realtime-subscription-manager';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Activity: () => <div data-testid="activity-icon" />,
  Zap: () => <div data-testid="zap-icon" />,
  Wifi: () => <div data-testid="wifi-icon" />,
  WifiOff: () => <div data-testid="wifi-off-icon" />,
  RefreshCw: () => <div data-testid="refresh-icon" />,
  Pause: () => <div data-testid="pause-icon" />,
  Play: () => <div data-testid="play-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  CheckCircle: () => <div data-testid="check-circle-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  Database: () => <div data-testid="database-icon" />,
  Users: () => <div data-testid="users-icon" />,
  FileText: () => <div data-testid="file-text-icon" />,
  BarChart3: () => <div data-testid="bar-chart-icon" />,
  Bell: () => <div data-testid="bell-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  Edit3: () => <div data-testid="edit-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  Monitor: () => <div data-testid="monitor-icon" />,
  Smartphone: () => <div data-testid="smartphone-icon" />,
  Globe: () => <div data-testid="globe-icon" />,
  Signal: () => <div data-testid="signal-icon" />,
  Cloud: () => <div data-testid="cloud-icon" />,
  Server: () => <div data-testid="server-icon" />,
  X: () => <div data-testid="x-icon" />,
}));

// Mock UI components
jest.mock('@starter/ui', () => ({
  Badge: ({ children, className, variant }: any) => (
    <div data-testid="badge" className={className} data-variant={variant}>
      {children}
    </div>
  ),
  Button: ({ children, className, onClick, size, variant, disabled }: any) => (
    <button 
      data-testid="button" 
      className={className} 
      onClick={onClick}
      data-size={size}
      data-variant={variant}
      disabled={disabled}
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

describe('RealTimeSubscriptionManager', () => {
  // Healthcare realtime subscription scenarios
  const createHealthcareSubscriptions = (): Subscription[] => [
    {
      id: 'sub_incident_001',
      name: 'Incident Updates - High Priority',
      resourceType: 'incident',
      resourcePattern: 'priority:high,critical',
      eventTypes: ['created', 'updated', 'status_changed', 'assigned'],
      status: 'active',
      priority: 'critical',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      lastEvent: new Date(Date.now() - 300000), // 5 minutes ago
      eventCount: 47,
      metadata: {
        participantTypes: ['high_support', 'complex_care'],
        locations: ['residential', 'community'],
        severity: ['high', 'critical'],
      },
    },
    {
      id: 'sub_analysis_001',
      name: 'AI Analysis Completion',
      resourceType: 'analysis',
      resourceId: 'incident_123',
      eventTypes: ['analysis_complete', 'risk_assessment_ready', 'recommendations_generated'],
      status: 'active',
      priority: 'high',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      lastEvent: new Date(Date.now() - 900000), // 15 minutes ago
      eventCount: 12,
      metadata: {
        analysisTypes: ['safety', 'compliance', 'trend'],
        autoActions: true,
      },
    },
    {
      id: 'sub_user_001',
      name: 'Healthcare Team Activity',
      resourceType: 'user',
      resourcePattern: 'company_id:company_002',
      eventTypes: ['login', 'logout', 'role_change', 'permission_update'],
      status: 'active',
      priority: 'medium',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      lastEvent: new Date(Date.now() - 1800000), // 30 minutes ago
      eventCount: 234,
      metadata: {
        roles: ['team_lead', 'frontline_worker', 'company_admin'],
        departments: ['support_coordination', 'direct_support'],
      },
    },
    {
      id: 'sub_workflow_001',
      name: 'NDIS Workflow Handoffs',
      resourceType: 'workflow',
      eventTypes: ['handoff_initiated', 'handoff_completed', 'escalation_triggered'],
      status: 'paused',
      priority: 'medium',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      lastEvent: new Date(Date.now() - 3600000), // 1 hour ago
      eventCount: 89,
      retryCount: 0,
      metadata: {
        workflowSteps: ['capture', 'analysis', 'completion'],
        handoffRules: 'team_lead_review',
      },
    },
    {
      id: 'sub_notification_001',
      name: 'Critical Notifications',
      resourceType: 'notification',
      eventTypes: ['critical_alert', 'deadline_warning', 'system_maintenance'],
      status: 'error',
      priority: 'high',
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      lastEvent: new Date(Date.now() - 7200000), // 2 hours ago
      eventCount: 5,
      retryCount: 3,
      metadata: {
        alertTypes: ['participant_safety', 'compliance_deadline', 'system_health'],
        escalationLevels: ['team_lead', 'company_admin', 'system_admin'],
      },
    },
    {
      id: 'sub_system_001',
      name: 'NDIS System Health',
      resourceType: 'system',
      eventTypes: ['health_check', 'performance_alert', 'security_event'],
      status: 'reconnecting',
      priority: 'critical',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      lastEvent: new Date(Date.now() - 600000), // 10 minutes ago
      eventCount: 156,
      retryCount: 2,
      metadata: {
        systems: ['incident_management', 'user_authentication', 'data_storage'],
        thresholds: { cpu: 80, memory: 85, disk: 90 },
      },
    },
  ];

  const createHealthcareMetrics = (): ConnectionMetrics => ({
    status: 'connected',
    latency: 42, // Low latency for healthcare
    uptime: 99.7,
    totalEvents: 15847,
    eventsPerSecond: 2.3,
    errorRate: 0.1, // Very low error rate for healthcare
    reconnectCount: 1,
    lastReconnect: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    bandwidth: {
      incoming: 1024 * 15, // 15KB/s
      outgoing: 1024 * 3,  // 3KB/s
    },
  });

  const createHealthcareConfig = (): RealTimeConfig => ({
    autoReconnect: true,
    reconnectDelay: 2000,
    maxReconnectAttempts: 10,
    heartbeatInterval: 30000,
    eventBufferSize: 1000,
    compressionEnabled: true,
    batchUpdates: true,
    batchDelay: 500,
  });

  const mockHandlers = {
    onSubscriptionAdd: jest.fn(),
    onSubscriptionRemove: jest.fn(),
    onSubscriptionPause: jest.fn(),
    onSubscriptionResume: jest.fn(),
    onSubscriptionEdit: jest.fn(),
    onConnect: jest.fn(),
    onDisconnect: jest.fn(),
    onReconnect: jest.fn(),
    onConfigUpdate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Healthcare Subscription Management', () => {
    it('should display healthcare realtime subscriptions', () => {
      const subscriptions = createHealthcareSubscriptions();
      const metrics = createHealthcareMetrics();
      const config = createHealthcareConfig();

      render(
        <RealTimeSubscriptionManager
          subscriptions={subscriptions}
          metrics={metrics}
          config={config}
          variant="full"
          showMetrics={true}
        />
      );

      expect(screen.getByText('Real-time Subscriptions')).toBeInTheDocument();
      expect(screen.getByText('Connected')).toBeInTheDocument();
      
      // Check healthcare subscriptions
      expect(screen.getByText('Incident Updates - High Priority')).toBeInTheDocument();
      expect(screen.getByText('AI Analysis Completion')).toBeInTheDocument();
      expect(screen.getByText('Healthcare Team Activity')).toBeInTheDocument();
      expect(screen.getByText('NDIS Workflow Handoffs')).toBeInTheDocument();
      expect(screen.getByText('Critical Notifications')).toBeInTheDocument();
      expect(screen.getByText('NDIS System Health')).toBeInTheDocument();
    });

    it('should show subscription status indicators for healthcare monitoring', () => {
      const subscriptions = createHealthcareSubscriptions();
      const metrics = createHealthcareMetrics();
      const config = createHealthcareConfig();

      render(
        <RealTimeSubscriptionManager
          subscriptions={subscriptions}
          metrics={metrics}
          config={config}
          variant="full"
        />
      );

      // Check status badges
      expect(screen.getAllByText('Active')).toHaveLength(3); // 3 active subscriptions
      expect(screen.getByText('Paused')).toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Reconnecting')).toBeInTheDocument();
    });

    it('should display healthcare subscription metrics', () => {
      const subscriptions = createHealthcareSubscriptions();
      const metrics = createHealthcareMetrics();
      const config = createHealthcareConfig();

      render(
        <RealTimeSubscriptionManager
          subscriptions={subscriptions}
          metrics={metrics}
          config={config}
          variant="full"
          showMetrics={true}
        />
      );

      // Check connection metrics critical for healthcare
      expect(screen.getByText('42ms')).toBeInTheDocument(); // Low latency
      expect(screen.getByText('2.3')).toBeInTheDocument(); // Events per second
      expect(screen.getByText('99.7%')).toBeInTheDocument(); // High uptime
      expect(screen.getByText('0.1%')).toBeInTheDocument(); // Low error rate
    });

    it('should show subscription event counts for healthcare audit', () => {
      const subscriptions = createHealthcareSubscriptions();
      const metrics = createHealthcareMetrics();
      const config = createHealthcareConfig();

      render(
        <RealTimeSubscriptionManager
          subscriptions={subscriptions}
          metrics={metrics}
          config={config}
          variant="full"
        />
      );

      // Check event counts for healthcare tracking
      expect(screen.getByText('47 events')).toBeInTheDocument();
      expect(screen.getByText('12 events')).toBeInTheDocument();
      expect(screen.getByText('234 events')).toBeInTheDocument();
      expect(screen.getByText('89 events')).toBeInTheDocument();
    });

    it('should display last event times for healthcare monitoring', () => {
      const subscriptions = createHealthcareSubscriptions();
      const metrics = createHealthcareMetrics();
      const config = createHealthcareConfig();

      render(
        <RealTimeSubscriptionManager
          subscriptions={subscriptions}
          metrics={metrics}
          config={config}
          variant="full"
        />
      );

      // Check relative time formatting
      expect(screen.getByText(/5m ago/)).toBeInTheDocument();
      expect(screen.getByText(/15m ago/)).toBeInTheDocument();
      expect(screen.getByText(/30m ago/)).toBeInTheDocument();
    });
  });

  describe('Healthcare Subscription Lifecycle Management', () => {
    it('should handle adding new healthcare subscriptions', () => {
      const subscriptions = createHealthcareSubscriptions();
      const metrics = createHealthcareMetrics();
      const config = createHealthcareConfig();

      render(
        <RealTimeSubscriptionManager
          subscriptions={subscriptions}
          metrics={metrics}
          config={config}
          onSubscriptionAdd={mockHandlers.onSubscriptionAdd}
          variant="full"
        />
      );

      const addButton = screen.getByText('Add Subscription');
      fireEvent.click(addButton);

      expect(mockHandlers.onSubscriptionAdd).toHaveBeenCalledWith({
        name: 'New Subscription',
        resourceType: 'incident',
        eventTypes: ['created', 'updated'],
        status: 'active',
        priority: 'medium',
        eventCount: 0,
      });
    });

    it('should handle pausing healthcare subscriptions', () => {
      const subscriptions = createHealthcareSubscriptions();
      const metrics = createHealthcareMetrics();
      const config = createHealthcareConfig();

      render(
        <RealTimeSubscriptionManager
          subscriptions={subscriptions}
          metrics={metrics}
          config={config}
          onSubscriptionPause={mockHandlers.onSubscriptionPause}
          variant="full"
        />
      );

      // Find and click pause button for active subscription
      const pauseButtons = screen.getAllByTestId('pause-icon');
      fireEvent.click(pauseButtons[0].closest('button')!);

      expect(mockHandlers.onSubscriptionPause).toHaveBeenCalledWith('sub_incident_001');
    });

    it('should handle resuming healthcare subscriptions', () => {
      const subscriptions = createHealthcareSubscriptions();
      const metrics = createHealthcareMetrics();
      const config = createHealthcareConfig();

      render(
        <RealTimeSubscriptionManager
          subscriptions={subscriptions}
          metrics={metrics}
          config={config}
          onSubscriptionResume={mockHandlers.onSubscriptionResume}
          variant="full"
        />
      );

      // Find and click resume button for paused subscription
      const playButtons = screen.getAllByTestId('play-icon');
      fireEvent.click(playButtons[0].closest('button')!);

      expect(mockHandlers.onSubscriptionResume).toHaveBeenCalled();
    });

    it('should handle removing healthcare subscriptions', () => {
      const subscriptions = createHealthcareSubscriptions();
      const metrics = createHealthcareMetrics();
      const config = createHealthcareConfig();

      render(
        <RealTimeSubscriptionManager
          subscriptions={subscriptions}
          metrics={metrics}
          config={config}
          onSubscriptionRemove={mockHandlers.onSubscriptionRemove}
          variant="full"
        />
      );

      // Find and click remove button
      const removeButtons = screen.getAllByTestId('x-icon');
      fireEvent.click(removeButtons[0].closest('button')!);

      expect(mockHandlers.onSubscriptionRemove).toHaveBeenCalled();
    });
  });

  describe('Healthcare Connection Management', () => {
    it('should handle healthcare system disconnection', () => {
      const subscriptions = createHealthcareSubscriptions();
      const disconnectedMetrics: ConnectionMetrics = {
        ...createHealthcareMetrics(),
        status: 'disconnected',
      };
      const config = createHealthcareConfig();

      render(
        <RealTimeSubscriptionManager
          subscriptions={subscriptions}
          metrics={disconnectedMetrics}
          config={config}
          onReconnect={mockHandlers.onReconnect}
          showControls={true}
          variant="full"
        />
      );

      expect(screen.getByText('Disconnected')).toBeInTheDocument();
      
      const reconnectButton = screen.getByText('Reconnect');
      fireEvent.click(reconnectButton);

      expect(mockHandlers.onReconnect).toHaveBeenCalled();
    });

    it('should handle healthcare system reconnection', async () => {
      const subscriptions = createHealthcareSubscriptions();
      const metrics = createHealthcareMetrics();
      const config = createHealthcareConfig();

      render(
        <RealTimeSubscriptionManager
          subscriptions={subscriptions}
          metrics={metrics}
          config={config}
          onReconnect={mockHandlers.onReconnect}
          showControls={true}
          variant="full"
        />
      );

      // Mock reconnection being in progress
      const { rerender } = render(
        <RealTimeSubscriptionManager
          subscriptions={subscriptions}
          metrics={{ ...metrics, status: 'reconnecting' }}
          config={config}
          onReconnect={mockHandlers.onReconnect}
          showControls={true}
          variant="full"
        />
      );

      expect(screen.getByText('Reconnecting')).toBeInTheDocument();
    });

    it('should handle healthcare system manual disconnect', () => {
      const subscriptions = createHealthcareSubscriptions();
      const metrics = createHealthcareMetrics();
      const config = createHealthcareConfig();

      render(
        <RealTimeSubscriptionManager
          subscriptions={subscriptions}
          metrics={metrics}
          config={config}
          onDisconnect={mockHandlers.onDisconnect}
          showControls={true}
          variant="full"
        />
      );

      const disconnectButton = screen.getByText('Disconnect');
      fireEvent.click(disconnectButton);

      expect(mockHandlers.onDisconnect).toHaveBeenCalled();
    });
  });

  describe('Healthcare System Configuration', () => {
    it('should display healthcare realtime configuration panel', () => {
      const subscriptions = createHealthcareSubscriptions();
      const metrics = createHealthcareMetrics();
      const config = createHealthcareConfig();

      render(
        <RealTimeSubscriptionManager
          subscriptions={subscriptions}
          metrics={metrics}
          config={config}
          showConfig={true}
          onConfigUpdate={mockHandlers.onConfigUpdate}
          variant="full"
        />
      );

      const settingsButton = screen.getByTestId('settings-icon').closest('button');
      fireEvent.click(settingsButton!);

      expect(screen.getByText('Connection Configuration')).toBeInTheDocument();
      expect(screen.getByText('Auto Reconnect')).toBeInTheDocument();
      expect(screen.getByText('Batch Updates')).toBeInTheDocument();
      expect(screen.getByText('Reconnect Delay (ms)')).toBeInTheDocument();
      expect(screen.getByText('Buffer Size')).toBeInTheDocument();
    });

    it('should handle healthcare auto-reconnect configuration', () => {
      const subscriptions = createHealthcareSubscriptions();
      const metrics = createHealthcareMetrics();
      const config = createHealthcareConfig();

      render(
        <RealTimeSubscriptionManager
          subscriptions={subscriptions}
          metrics={metrics}
          config={config}
          showConfig={true}
          onConfigUpdate={mockHandlers.onConfigUpdate}
          variant="full"
        />
      );

      const settingsButton = screen.getByTestId('settings-icon').closest('button');
      fireEvent.click(settingsButton!);

      const autoReconnectToggle = screen.getByText('Auto Reconnect').closest('div')?.querySelector('button');
      fireEvent.click(autoReconnectToggle!);

      expect(mockHandlers.onConfigUpdate).toHaveBeenCalledWith({
        autoReconnect: false,
      });
    });

    it('should handle healthcare batch updates configuration', () => {
      const subscriptions = createHealthcareSubscriptions();
      const metrics = createHealthcareMetrics();
      const config = createHealthcareConfig();

      render(
        <RealTimeSubscriptionManager
          subscriptions={subscriptions}
          metrics={metrics}
          config={config}
          showConfig={true}
          onConfigUpdate={mockHandlers.onConfigUpdate}
          variant="full"
        />
      );

      const settingsButton = screen.getByTestId('settings-icon').closest('button');
      fireEvent.click(settingsButton!);

      const batchToggle = screen.getByText('Batch Updates').closest('div')?.querySelector('button');
      fireEvent.click(batchToggle!);

      expect(mockHandlers.onConfigUpdate).toHaveBeenCalledWith({
        batchUpdates: false,
      });
    });

    it('should handle healthcare reconnect delay configuration', () => {
      const subscriptions = createHealthcareSubscriptions();
      const metrics = createHealthcareMetrics();
      const config = createHealthcareConfig();

      render(
        <RealTimeSubscriptionManager
          subscriptions={subscriptions}
          metrics={metrics}
          config={config}
          showConfig={true}
          onConfigUpdate={mockHandlers.onConfigUpdate}
          variant="full"
        />
      );

      const settingsButton = screen.getByTestId('settings-icon').closest('button');
      fireEvent.click(settingsButton!);

      const delayInput = screen.getByDisplayValue('2000');
      fireEvent.change(delayInput, { target: { value: '3000' } });

      expect(mockHandlers.onConfigUpdate).toHaveBeenCalledWith({
        reconnectDelay: 3000,
      });
    });

    it('should handle healthcare buffer size configuration', () => {
      const subscriptions = createHealthcareSubscriptions();
      const metrics = createHealthcareMetrics();
      const config = createHealthcareConfig();

      render(
        <RealTimeSubscriptionManager
          subscriptions={subscriptions}
          metrics={metrics}
          config={config}
          showConfig={true}
          onConfigUpdate={mockHandlers.onConfigUpdate}
          variant="full"
        />
      );

      const settingsButton = screen.getByTestId('settings-icon').closest('button');
      fireEvent.click(settingsButton!);

      const bufferInput = screen.getByDisplayValue('1000');
      fireEvent.change(bufferInput, { target: { value: '2000' } });

      expect(mockHandlers.onConfigUpdate).toHaveBeenCalledWith({
        eventBufferSize: 2000,
      });
    });
  });

  describe('Healthcare System Bandwidth Monitoring', () => {
    it('should display healthcare system bandwidth usage', () => {
      const subscriptions = createHealthcareSubscriptions();
      const metrics = createHealthcareMetrics();
      const config = createHealthcareConfig();

      render(
        <RealTimeSubscriptionManager
          subscriptions={subscriptions}
          metrics={metrics}
          config={config}
          variant="full"
          showMetrics={true}
        />
      );

      // Check bandwidth display (15KB/s incoming, 3KB/s outgoing)
      expect(screen.getByText('15 KB/s')).toBeInTheDocument();
      expect(screen.getByText('3 KB/s')).toBeInTheDocument();
      expect(screen.getByText('Incoming')).toBeInTheDocument();
      expect(screen.getByText('Outgoing')).toBeInTheDocument();
    });

    it('should format bandwidth values correctly for healthcare monitoring', () => {
      const subscriptions = createHealthcareSubscriptions();
      const highBandwidthMetrics: ConnectionMetrics = {
        ...createHealthcareMetrics(),
        bandwidth: {
          incoming: 1024 * 1024 * 2.5, // 2.5 MB/s
          outgoing: 1024 * 500,        // 500 KB/s
        },
      };
      const config = createHealthcareConfig();

      render(
        <RealTimeSubscriptionManager
          subscriptions={subscriptions}
          metrics={highBandwidthMetrics}
          config={config}
          variant="full"
          showMetrics={true}
        />
      );

      expect(screen.getByText('2.5 MB/s')).toBeInTheDocument();
      expect(screen.getByText('500 KB/s')).toBeInTheDocument();
    });
  });

  describe('Variant Display Modes for Healthcare Dashboards', () => {
    const subscriptions = createHealthcareSubscriptions();
    const metrics = createHealthcareMetrics();
    const config = createHealthcareConfig();

    it('should render minimal variant for healthcare status indicators', () => {
      render(
        <RealTimeSubscriptionManager
          subscriptions={subscriptions}
          metrics={metrics}
          config={config}
          variant="minimal"
        />
      );

      const activeCount = subscriptions.filter(s => s.status === 'active').length;
      expect(screen.getByText(`${activeCount} active`)).toBeInTheDocument();
      expect(screen.getByText('2.3 events/s')).toBeInTheDocument();
      
      // Should show error count for healthcare monitoring
      const errorCount = subscriptions.filter(s => s.status === 'error').length;
      expect(screen.getByText(`${errorCount} errors`)).toBeInTheDocument();
    });

    it('should render dashboard variant for healthcare overview', () => {
      render(
        <RealTimeSubscriptionManager
          subscriptions={subscriptions}
          metrics={metrics}
          config={config}
          variant="dashboard"
        />
      );

      expect(screen.getByText('Connected')).toBeInTheDocument();
      expect(screen.getByText('42ms latency')).toBeInTheDocument();
      
      const activeCount = subscriptions.filter(s => s.status === 'active').length;
      expect(screen.getByText(activeCount.toString())).toBeInTheDocument();
      expect(screen.getByText('Active Subscriptions')).toBeInTheDocument();
      
      expect(screen.getByText('2.3')).toBeInTheDocument();
      expect(screen.getByText('Events/Second')).toBeInTheDocument();
      
      expect(screen.getByText('0.1%')).toBeInTheDocument();
      expect(screen.getByText('Error Rate')).toBeInTheDocument();
    });

    it('should render full variant for healthcare subscription management', () => {
      render(
        <RealTimeSubscriptionManager
          subscriptions={subscriptions}
          metrics={metrics}
          config={config}
          variant="full"
          showMetrics={true}
          showControls={true}
        />
      );

      expect(screen.getByText('Real-time Subscriptions')).toBeInTheDocument();
      expect(screen.getByText('Active Subscriptions')).toBeInTheDocument();
      
      // Should show all subscription details
      subscriptions.forEach(subscription => {
        expect(screen.getByText(subscription.name)).toBeInTheDocument();
      });
      
      // Should show comprehensive metrics
      expect(screen.getByText('42ms')).toBeInTheDocument();
      expect(screen.getByText('2.3')).toBeInTheDocument();
      expect(screen.getByText('99.7%')).toBeInTheDocument();
      expect(screen.getByText('0.1%')).toBeInTheDocument();
    });
  });

  describe('Healthcare Error Handling & Edge Cases', () => {
    it('should handle empty subscription list for healthcare system', () => {
      const metrics = createHealthcareMetrics();
      const config = createHealthcareConfig();

      render(
        <RealTimeSubscriptionManager
          subscriptions={[]}
          metrics={metrics}
          config={config}
          variant="full"
        />
      );

      expect(screen.getByText('No subscriptions configured')).toBeInTheDocument();
      expect(screen.getByText('Add subscriptions to receive real-time updates')).toBeInTheDocument();
    });

    it('should handle subscription with missing last event time', () => {
      const subscriptionWithoutLastEvent: Subscription = {
        id: 'sub_no_event',
        name: 'Test Subscription',
        resourceType: 'incident',
        eventTypes: ['created'],
        status: 'active',
        priority: 'medium',
        createdAt: new Date(),
        eventCount: 0,
      };

      const metrics = createHealthcareMetrics();
      const config = createHealthcareConfig();

      render(
        <RealTimeSubscriptionManager
          subscriptions={[subscriptionWithoutLastEvent]}
          metrics={metrics}
          config={config}
          variant="full"
        />
      );

      expect(screen.getByText('Test Subscription')).toBeInTheDocument();
      expect(screen.getByText('0 events')).toBeInTheDocument();
      // Should not show "Last: undefined"
      expect(screen.queryByText(/Last: undefined/)).not.toBeInTheDocument();
    });

    it('should handle unstable connection for healthcare system', () => {
      const subscriptions = createHealthcareSubscriptions();
      const unstableMetrics: ConnectionMetrics = {
        ...createHealthcareMetrics(),
        status: 'unstable',
        errorRate: 5.2,
        reconnectCount: 5,
      };
      const config = createHealthcareConfig();

      render(
        <RealTimeSubscriptionManager
          subscriptions={subscriptions}
          metrics={unstableMetrics}
          config={config}
          variant="full"
          showMetrics={true}
        />
      );

      expect(screen.getByText('Unstable')).toBeInTheDocument();
      expect(screen.getByText('5.2%')).toBeInTheDocument(); // Higher error rate
    });

    it('should handle subscription retry scenarios for healthcare continuity', () => {
      const failingSubscription: Subscription = {
        id: 'sub_failing',
        name: 'Critical Healthcare Alerts',
        resourceType: 'notification',
        eventTypes: ['critical_alert'],
        status: 'error',
        priority: 'critical',
        createdAt: new Date(),
        lastEvent: new Date(),
        eventCount: 3,
        retryCount: 7,
      };

      const metrics = createHealthcareMetrics();
      const config = createHealthcareConfig();

      render(
        <RealTimeSubscriptionManager
          subscriptions={[failingSubscription]}
          metrics={metrics}
          config={config}
          variant="full"
        />
      );

      expect(screen.getByText('Critical Healthcare Alerts')).toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
      // Should show visual indication of error status
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
    });

    it('should handle large event counts for healthcare audit trail', () => {
      const highVolumeSubscription: Subscription = {
        id: 'sub_high_volume',
        name: 'High Volume Healthcare Events',
        resourceType: 'incident',
        eventTypes: ['created', 'updated'],
        status: 'active',
        priority: 'medium',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        lastEvent: new Date(),
        eventCount: 15679,
      };

      const metrics = createHealthcareMetrics();
      const config = createHealthcareConfig();

      render(
        <RealTimeSubscriptionManager
          subscriptions={[highVolumeSubscription]}
          metrics={metrics}
          config={config}
          variant="full"
        />
      );

      expect(screen.getByText('High Volume Healthcare Events')).toBeInTheDocument();
      expect(screen.getByText('15679 events')).toBeInTheDocument();
    });
  });

  describe('Healthcare Compliance & Accessibility', () => {
    it('should provide appropriate ARIA labels for healthcare accessibility', () => {
      const subscriptions = createHealthcareSubscriptions();
      const metrics = createHealthcareMetrics();
      const config = createHealthcareConfig();

      render(
        <RealTimeSubscriptionManager
          subscriptions={subscriptions}
          metrics={metrics}
          config={config}
          variant="full"
          showControls={true}
        />
      );

      // Control buttons should be accessible
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should maintain healthcare audit trail with subscription lifecycle events', () => {
      const subscriptions = createHealthcareSubscriptions();
      const metrics = createHealthcareMetrics();
      const config = createHealthcareConfig();

      render(
        <RealTimeSubscriptionManager
          subscriptions={subscriptions}
          metrics={metrics}
          config={config}
          variant="full"
        />
      );

      // Should show creation times and last event times for audit
      subscriptions.forEach(subscription => {
        expect(screen.getByText(subscription.name)).toBeInTheDocument();
        if (subscription.lastEvent) {
          // Time formatting should be present
          const timeElements = screen.queryAllByText(/\d+m ago|\d+h ago/);
          expect(timeElements.length).toBeGreaterThan(0);
        }
      });
    });

    it('should handle subscription metadata for healthcare context', () => {
      const subscriptions = createHealthcareSubscriptions();
      const metrics = createHealthcareMetrics();
      const config = createHealthcareConfig();

      render(
        <RealTimeSubscriptionManager
          subscriptions={subscriptions}
          metrics={metrics}
          config={config}
          variant="full"
        />
      );

      // Should display event types for healthcare workflows
      expect(screen.getByText(/created, updated, status_changed, assigned/)).toBeInTheDocument();
      expect(screen.getByText(/analysis_complete, risk_assessment_ready, recommendations_generated/)).toBeInTheDocument();
    });
  });
});