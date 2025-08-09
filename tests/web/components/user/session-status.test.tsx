// @ts-nocheck
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionStatus, SessionInfo } from '@/components/user/session-status';
import { 
  healthcareSessionInfo, 
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
  Button: ({ children, className, size, variant, onClick, disabled, ...props }: any) => (
    <button 
      className={`button ${size || 'default'} ${variant || 'default'} ${className}`}
      onClick={onClick}
      disabled={disabled}
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
  Activity: ({ className, ...props }: any) => <div className={`icon activity ${className}`} {...props} data-testid="activity-icon" />,
  Clock: ({ className, ...props }: any) => <div className={`icon clock ${className}`} {...props} data-testid="clock-icon" />,
  AlertTriangle: ({ className, ...props }: any) => <div className={`icon alert-triangle ${className}`} {...props} data-testid="alert-triangle-icon" />,
  CheckCircle: ({ className, ...props }: any) => <div className={`icon check-circle ${className}`} {...props} data-testid="check-circle-icon" />,
  RefreshCw: ({ className, ...props }: any) => <div className={`icon refresh-cw ${className}`} {...props} data-testid="refresh-cw-icon" />,
  Wifi: ({ className, ...props }: any) => <div className={`icon wifi ${className}`} {...props} data-testid="wifi-icon" />,
  WifiOff: ({ className, ...props }: any) => <div className={`icon wifi-off ${className}`} {...props} data-testid="wifi-off-icon" />,
  Save: ({ className, ...props }: any) => <div className={`icon save ${className}`} {...props} data-testid="save-icon" />,
  Trash2: ({ className, ...props }: any) => <div className={`icon trash2 ${className}`} {...props} data-testid="trash2-icon" />,
  Eye: ({ className, ...props }: any) => <div className={`icon eye ${className}`} {...props} data-testid="eye-icon" />,
  Play: ({ className, ...props }: any) => <div className={`icon play ${className}`} {...props} data-testid="play-icon" />,
  Pause: ({ className, ...props }: any) => <div className={`icon pause ${className}`} {...props} data-testid="pause-icon" />,
  RotateCcw: ({ className, ...props }: any) => <div className={`icon rotate-ccw ${className}`} {...props} data-testid="rotate-ccw-icon" />,
  Shield: ({ className, ...props }: any) => <div className={`icon shield ${className}`} {...props} data-testid="shield-icon" />,
  Database: ({ className, ...props }: any) => <div className={`icon database ${className}`} {...props} data-testid="database-icon" />,
  CloudOff: ({ className, ...props }: any) => <div className={`icon cloud-off ${className}`} {...props} data-testid="cloud-off-icon" />,
  Zap: ({ className, ...props }: any) => <div className={`icon zap ${className}`} {...props} data-testid="zap-icon" />,
}));

// Mock utils
jest.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

describe('SessionStatus - Healthcare Compliance', () => {
  const mockOnReconnect = jest.fn();
  const mockOnSaveSession = jest.fn();
  const mockOnRestoreWorkflow = jest.fn();
  const mockOnClearWorkflow = jest.fn();
  const mockOnExtendSession = jest.fn();
  const mockOnLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Healthcare Session Security & Connection Status', () => {
    it('displays connected session with proper security indicators', () => {
      const session = healthcareSessionInfo.active_connected;
      
      render(
        <SessionStatus
          session={session}
          onReconnect={mockOnReconnect}
          showDeviceInfo={true}
        />
      );

      // Verify connection status
      expect(screen.getByText('Connected')).toBeInTheDocument();
      expect(screen.getByTestId('wifi-icon')).toBeInTheDocument();
      expect(screen.getByText(/session is active and synchronized/i)).toBeInTheDocument();
      
      // Check session security information
      expect(screen.getByText(/session_001/)).toBeInTheDocument(); // Truncated session ID
      expect(screen.getByText('Duration:')).toBeInTheDocument();
      expect(screen.getByText('Last Activity:')).toBeInTheDocument();
      
      // Verify device information for security audit
      expect(screen.getByText('Chrome 120.0.6099.109')).toBeInTheDocument();
      expect(screen.getByText('Windows 11')).toBeInTheDocument();
      expect(screen.getByText('10.0.2.45')).toBeInTheDocument();
    });

    it('displays disconnected session with reconnection options', () => {
      const session = healthcareSessionInfo.disconnected_recovering;
      
      render(
        <SessionStatus
          session={session}
          onReconnect={mockOnReconnect}
        />
      );

      // Verify disconnected status
      expect(screen.getByText('Reconnecting')).toBeInTheDocument();
      expect(screen.getByTestId('refresh-cw-icon')).toBeInTheDocument();
      expect(screen.getByText(/attempting to restore connection/i)).toBeInTheDocument();
      
      // Should show reconnect button for manual retry
      expect(screen.getByRole('button', { name: /reconnect/i })).toBeInTheDocument();
    });

    it('handles session expiry with healthcare security requirements', () => {
      const session = healthcareSessionInfo.expired_session;
      
      render(
        <SessionStatus
          session={session}
          onLogout={mockOnLogout}
        />
      );

      // Should show expired status
      expect(screen.getByText('Expired')).toBeInTheDocument();
      expect(screen.getByText('Expired')).toHaveClass('bg-red-600');
      
      // Should show security logout requirement
      expect(screen.getByRole('button', { name: /session expired - login again/i })).toBeInTheDocument();
      expect(screen.getByText(/connection error/i)).toBeInTheDocument();
    });

    it('shows session expiry warning for healthcare workflow continuity', () => {
      const session = healthcareSessionInfo.expiring_soon;
      
      render(
        <SessionStatus
          session={session}
          onExtendSession={mockOnExtendSession}
        />
      );

      // Should show warning for expiring session
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
      expect(screen.getByText(/15m left/i)).toBeInTheDocument();
      
      // Should offer session extension
      expect(screen.getByRole('button', { name: /extend/i })).toBeInTheDocument();
    });
  });

  describe('Healthcare Workflow State Recovery', () => {
    it('displays workflow recovery options for incident management', () => {
      const session = healthcareSessionInfo.active_connected;
      
      render(
        <SessionStatus
          session={session}
          showWorkflowState={true}
          onRestoreWorkflow={mockOnRestoreWorkflow}
          onClearWorkflow={mockOnClearWorkflow}
        />
      );

      // Should show workflow recovery section
      expect(screen.getByText(/unsaved workflow detected/i)).toBeInTheDocument();
      expect(screen.getByTestId('save-icon')).toBeInTheDocument();
      
      // Should show workflow details
      expect(screen.getByText('incident-analysis')).toBeInTheDocument();
      expect(screen.getByText('incident_123')).toBeInTheDocument();
      
      // Should show recovery actions
      expect(screen.getByRole('button', { name: /restore/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
      expect(screen.getByTestId('rotate-ccw-icon')).toBeInTheDocument();
      expect(screen.getByTestId('trash2-icon')).toBeInTheDocument();
    });

    it('indicates unsaved changes for healthcare data integrity', () => {
      const session = healthcareSessionInfo.disconnected_recovering;
      
      render(
        <SessionStatus
          session={session}
          showWorkflowState={true}
        />
      );

      // Should warn about unsaved changes
      expect(screen.getByText('Unsaved Changes')).toBeInTheDocument();
      expect(screen.getByText('participant-contact')).toBeInTheDocument();
      expect(screen.getByText('incident_789')).toBeInTheDocument();
    });

    it('handles workflow restoration for healthcare continuity', async () => {
      const user = userEvent.setup();
      const session = healthcareSessionInfo.active_connected;
      
      render(
        <SessionStatus
          session={session}
          showWorkflowState={true}
          onRestoreWorkflow={mockOnRestoreWorkflow}
        />
      );

      const restoreButton = screen.getByRole('button', { name: /restore/i });
      await user.click(restoreButton);

      expect(mockOnRestoreWorkflow).toHaveBeenCalledWith(session.workflowState);
    });

    it('handles workflow clearing for data security', async () => {
      const user = userEvent.setup();
      const session = healthcareSessionInfo.disconnected_recovering;
      
      render(
        <SessionStatus
          session={session}
          showWorkflowState={true}
          onClearWorkflow={mockOnClearWorkflow}
        />
      );

      const clearButton = screen.getByRole('button', { name: /clear/i });
      await user.click(clearButton);

      expect(mockOnClearWorkflow).toHaveBeenCalledTimes(1);
    });
  });

  describe('Healthcare Session Security & Audit Requirements', () => {
    it('displays session permissions for audit compliance', () => {
      const session = healthcareSessionInfo.active_connected;
      
      render(
        <SessionStatus
          session={session}
          showPermissions={true}
        />
      );

      // Should show session permissions
      expect(screen.getByText('Session Permissions')).toBeInTheDocument();
      
      // Check individual permissions
      expect(screen.getByText('incidents:write')).toBeInTheDocument();
      expect(screen.getByText('analysis:read')).toBeInTheDocument();
      expect(screen.getByText('reports:read')).toBeInTheDocument();
      
      // Should show shield icons for permissions
      const shieldIcons = screen.getAllByTestId('shield-icon');
      expect(shieldIcons.length).toBeGreaterThan(0);
    });

    it('tracks session duration for healthcare compliance', () => {
      const session = {
        ...healthcareSessionInfo.active_connected,
        startTime: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      };
      
      render(
        <SessionStatus
          session={session}
        />
      );

      // Should show session duration
      expect(screen.getByText('Duration:')).toBeInTheDocument();
      expect(screen.getByText(/4h/)).toBeInTheDocument();
    });

    it('provides session ID for audit logging', () => {
      const session = healthcareSessionInfo.active_connected;
      
      render(
        <SessionStatus
          session={session}
        />
      );

      // Should show truncated session ID for security
      expect(screen.getByText(/session_001/)).toBeInTheDocument();
      expect(screen.getByText('Session ID:')).toBeInTheDocument();
    });

    it('handles session save for audit trail', async () => {
      const user = userEvent.setup();
      const session = healthcareSessionInfo.active_connected;
      
      render(
        <SessionStatus
          session={session}
          onSaveSession={mockOnSaveSession}
        />
      );

      const saveButton = screen.getByRole('button', { name: /save session/i });
      await user.click(saveButton);

      expect(mockOnSaveSession).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('database-icon')).toBeInTheDocument();
    });
  });

  describe('WCAG 2.1 AA Accessibility Compliance', () => {
    it('meets healthcare accessibility standards', async () => {
      const session = healthcareSessionInfo.active_connected;
      const { container } = render(
        <SessionStatus
          session={session}
          showWorkflowState={true}
          showDeviceInfo={true}
          showPermissions={true}
        />
      );

      await testHealthcareAccessibility(container, 'SessionStatus');
    });

    it('supports keyboard navigation for healthcare users', async () => {
      const session = healthcareSessionInfo.expiring_soon;
      const { container } = render(
        <SessionStatus
          session={session}
          onExtendSession={mockOnExtendSession}
          onSaveSession={mockOnSaveSession}
        />
      );

      // Expected interactive elements: Extend Session, Save Session
      await testKeyboardNavigation(container, 2);
    });

    it('provides screen reader support for session status', () => {
      const session = healthcareSessionInfo.disconnected_recovering;
      const { container } = render(
        <SessionStatus
          session={session}
          onReconnect={mockOnReconnect}
        />
      );

      const screenReaderContent = healthcareA11yUtils.simulateScreenReader(container);
      
      // Should announce connection status
      expect(screenReaderContent.combinedContent).toContain('Reconnecting');
      expect(screenReaderContent.combinedContent).toContain('Session Status');
      expect(screenReaderContent.combinedContent).toContain('attempting to restore connection');
    });

    it('announces critical session states to screen readers', () => {
      const expiredSession = healthcareSessionInfo.expired_session;
      const { container } = render(
        <SessionStatus
          session={expiredSession}
        />
      );

      // Should have proper role for alerts
      const announcements = testScreenReaderAnnouncements(container);
      expect(announcements.hasAnnouncements).toBe(true);
    });

    it('provides accessible session actions', () => {
      const session = healthcareSessionInfo.active_connected;
      
      render(
        <SessionStatus
          session={session}
          showWorkflowState={true}
          onRestoreWorkflow={mockOnRestoreWorkflow}
          onClearWorkflow={mockOnClearWorkflow}
          onSaveSession={mockOnSaveSession}
        />
      );

      // All buttons should have accessible names
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAccessibleName();
      });

      // Check specific button accessibility
      expect(screen.getByRole('button', { name: /restore/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save session/i })).toBeInTheDocument();
    });
  });

  describe('Healthcare Session Management Actions', () => {
    it('handles reconnection for healthcare workflow continuity', async () => {
      const user = userEvent.setup();
      const session = healthcareSessionInfo.disconnected_recovering;
      
      render(
        <SessionStatus
          session={session}
          onReconnect={mockOnReconnect}
        />
      );

      const reconnectButton = screen.getByRole('button', { name: /reconnect/i });
      expect(reconnectButton).not.toBeDisabled();
      
      await user.click(reconnectButton);
      expect(mockOnReconnect).toHaveBeenCalledTimes(1);
    });

    it('handles session extension for healthcare security', async () => {
      const user = userEvent.setup();
      const session = healthcareSessionInfo.expiring_soon;
      
      render(
        <SessionStatus
          session={session}
          onExtendSession={mockOnExtendSession}
        />
      );

      const extendButton = screen.getByRole('button', { name: /extend/i });
      await user.click(extendButton);
      
      expect(mockOnExtendSession).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
    });

    it('prevents actions when session is expired', () => {
      const session = healthcareSessionInfo.expired_session;
      
      render(
        <SessionStatus
          session={session}
          onExtendSession={mockOnExtendSession}
          onSaveSession={mockOnSaveSession}
        />
      );

      // Should not show extend button for expired session
      expect(screen.queryByRole('button', { name: /extend/i })).not.toBeInTheDocument();
      
      // Should require login for expired session
      expect(screen.getByRole('button', { name: /session expired - login again/i })).toBeInTheDocument();
    });

    it('handles auto-reconnection for healthcare environments', () => {
      const session = healthcareSessionInfo.disconnected_recovering;
      
      render(
        <SessionStatus
          session={session}
          autoReconnect={true}
        />
      );

      // Should show reconnecting status with animation
      expect(screen.getByText('Reconnecting')).toBeInTheDocument();
      expect(screen.getByTestId('refresh-cw-icon')).toHaveClass('animate-spin');
    });
  });

  describe('Healthcare Component Variants', () => {
    it('renders minimal variant for healthcare status bars', () => {
      const session = healthcareSessionInfo.active_connected;
      
      render(
        <SessionStatus
          session={session}
          variant="minimal"
        />
      );

      // Should show basic connection status
      expect(screen.getByText('Connected')).toBeInTheDocument();
      expect(screen.getByTestId('wifi-icon')).toBeInTheDocument();
      
      // Should show unsaved changes warning
      expect(screen.getByText('Unsaved')).toBeInTheDocument();
      
      // Should not show detailed information
      expect(screen.queryByText('Session Details')).not.toBeInTheDocument();
    });

    it('renders compact variant for healthcare dashboards', () => {
      const session = healthcareSessionInfo.expiring_soon;
      
      render(
        <SessionStatus
          session={session}
          variant="compact"
          onExtendSession={mockOnExtendSession}
        />
      );

      // Should show session active indicator
      expect(screen.getByText('Session Active')).toBeInTheDocument();
      expect(screen.getByText('Connected')).toBeInTheDocument();
      
      // Should show session duration and expiry
      expect(screen.getByText(/duration:/i)).toBeInTheDocument();
      expect(screen.getByText(/expires in 15m/i)).toBeInTheDocument();
      
      // Should show extend button
      expect(screen.getByRole('button', { name: /extend/i })).toBeInTheDocument();
    });

    it('renders full variant with comprehensive healthcare session information', () => {
      const session = healthcareSessionInfo.active_connected;
      
      render(
        <SessionStatus
          session={session}
          variant="full"
          showWorkflowState={true}
          showDeviceInfo={true}
          showPermissions={true}
        />
      );

      // Should show all sections
      expect(screen.getByText('Session Details')).toBeInTheDocument();
      expect(screen.getByText('Session Expiry')).toBeInTheDocument();
      expect(screen.getByText('Workflow Recovery')).toBeInTheDocument();
      expect(screen.getByText('Device Information')).toBeInTheDocument();
      expect(screen.getByText('Session Permissions')).toBeInTheDocument();
    });
  });

  describe('Healthcare Time & Duration Calculations', () => {
    it('formats session duration correctly for healthcare logging', () => {
      const session = {
        ...healthcareSessionInfo.active_connected,
        startTime: new Date(Date.now() - 125 * 60 * 1000), // 2h 5m ago
      };
      
      render(
        <SessionStatus
          session={session}
        />
      );

      // Should format duration as "2h 5m"
      expect(screen.getByText(/2h 5m/)).toBeInTheDocument();
    });

    it('shows time until expiry for healthcare compliance', () => {
      const session = {
        ...healthcareSessionInfo.active_connected,
        expiresAt: new Date(Date.now() + 45 * 60 * 1000), // 45 minutes from now
      };
      
      render(
        <SessionStatus
          session={session}
        />
      );

      // Should show remaining time
      expect(screen.getByText(/45 minutes/i)).toBeInTheDocument();
    });

    it('formats timestamps for Australian healthcare context', () => {
      const session = healthcareSessionInfo.active_connected;
      
      render(
        <SessionStatus
          session={session}
        />
      );

      // Should format times in Australian format (24-hour)
      const startTime = session.startTime.toLocaleTimeString('en-AU', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      
      expect(screen.getByText(startTime)).toBeInTheDocument();
    });
  });

  describe('Healthcare Error Handling & Edge Cases', () => {
    it('handles session without workflow state', () => {
      const session = {
        ...healthcareSessionInfo.expiring_soon,
        workflowState: undefined,
      };
      
      render(
        <SessionStatus
          session={session}
          showWorkflowState={true}
        />
      );

      // Should not show workflow section when no state exists
      expect(screen.queryByText('Workflow Recovery')).not.toBeInTheDocument();
    });

    it('handles extreme session durations', () => {
      const session = {
        ...healthcareSessionInfo.active_connected,
        startTime: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
      };
      
      render(
        <SessionStatus
          session={session}
        />
      );

      // Should format long duration correctly
      expect(screen.getByText(/1d 1h/)).toBeInTheDocument();
    });

    it('maintains accessibility with dynamic state changes', async () => {
      const initialSession = healthcareSessionInfo.active_connected;
      const { container, rerender } = render(
        <SessionStatus
          session={initialSession}
        />
      );

      await testHealthcareAccessibility(container);

      // Change to disconnected state
      const disconnectedSession = {
        ...initialSession,
        connectionStatus: 'disconnected' as const,
      };
      
      rerender(
        <SessionStatus
          session={disconnectedSession}
          onReconnect={mockOnReconnect}
        />
      );

      // Should maintain accessibility after state change
      await testHealthcareAccessibility(container);
    });

    it('handles missing session permissions gracefully', () => {
      const session = {
        ...healthcareSessionInfo.active_connected,
        permissions: [],
      };
      
      render(
        <SessionStatus
          session={session}
          showPermissions={true}
        />
      );

      // Should not show permissions section when empty
      expect(screen.queryByText('Session Permissions')).not.toBeInTheDocument();
    });
  });
});