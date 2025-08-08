import type { Meta, StoryObj } from '@storybook/react';
import { SessionStatus } from '../../../../apps/web/components/user/session-status';

const meta: Meta<typeof SessionStatus> = {
  title: 'Healthcare Components/User/SessionStatus',
  component: SessionStatus,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Real-time session status indicator for healthcare systems with security monitoring and automatic timeout warnings.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['active', 'idle', 'warning', 'expired', 'locked'],
      description: 'Current session security status',
    },
    timeRemaining: {
      control: { type: 'number', min: 0, max: 3600 },
      description: 'Seconds remaining before session timeout',
    },
    securityLevel: {
      control: 'select',
      options: ['low', 'medium', 'high', 'critical'],
      description: 'Security level requiring different timeout policies',
    },
    showTimeRemaining: {
      control: 'boolean',
      description: 'Display countdown timer for session expiry',
    },
    onExtend: {
      action: 'session-extended',
      description: 'Callback when user extends session',
    },
    onLogout: {
      action: 'logged-out',
      description: 'Callback when user logs out',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Active Healthcare Provider Session
export const ActiveProviderSession: Story = {
  args: {
    status: 'active',
    timeRemaining: 1800, // 30 minutes
    securityLevel: 'critical',
    showTimeRemaining: true,
    userRole: 'healthcare_provider',
    location: 'Workstation-ICU-03',
    onExtend: () => console.log('Healthcare provider session extended'),
    onLogout: () => console.log('Healthcare provider logged out'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Active session for healthcare provider with critical security level and location tracking.',
      },
    },
  },
};

// Idle with Warning
export const IdleWithWarning: Story = {
  args: {
    status: 'idle',
    timeRemaining: 300, // 5 minutes
    securityLevel: 'high',
    showTimeRemaining: true,
    userRole: 'nurse',
    location: 'Nursing-Station-2B',
    idleTime: 900, // 15 minutes idle
    onExtend: () => console.log('Nurse session extended from idle'),
    onLogout: () => console.log('Nurse auto-logout from idle'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Idle session showing warning state with automatic logout countdown for security compliance.',
      },
    },
  },
};

// Critical Warning State
export const CriticalWarning: Story = {
  args: {
    status: 'warning',
    timeRemaining: 60, // 1 minute
    securityLevel: 'critical',
    showTimeRemaining: true,
    userRole: 'healthcare_provider',
    location: 'Surgery-OR-05',
    emergencyMode: true,
    onExtend: () => console.log('Critical session extended in OR'),
    onLogout: () => console.log('Critical session timeout in OR'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Critical warning state during surgical procedures with emergency session extension options.',
      },
    },
  },
};

// Session Expired
export const SessionExpired: Story = {
  args: {
    status: 'expired',
    timeRemaining: 0,
    securityLevel: 'high',
    showTimeRemaining: false,
    userRole: 'patient',
    location: 'Patient-Portal',
    onExtend: () => console.log('Attempt to extend expired session'),
    onLogout: () => console.log('Redirect to login from expired session'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Expired session requiring re-authentication with clear security messaging.',
      },
    },
  },
};

// Account Locked
export const AccountLocked: Story = {
  args: {
    status: 'locked',
    timeRemaining: 0,
    securityLevel: 'critical',
    showTimeRemaining: false,
    userRole: 'administrator',
    location: 'Admin-Console',
    lockReason: 'Multiple failed authentication attempts',
    onExtend: () => console.log('Cannot extend locked session'),
    onLogout: () => console.log('Locked account logout'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Locked account status with security incident information and admin contact options.',
      },
    },
  },
};

// Patient Portal Session
export const PatientPortalSession: Story = {
  args: {
    status: 'active',
    timeRemaining: 2700, // 45 minutes
    securityLevel: 'medium',
    showTimeRemaining: true,
    userRole: 'patient',
    location: 'Patient-Portal-Home',
    onExtend: () => console.log('Patient portal session extended'),
    onLogout: () => console.log('Patient logged out from portal'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Standard patient portal session with medium security requirements and user-friendly interface.',
      },
    },
  },
};

// Emergency Override Session
export const EmergencyOverride: Story = {
  args: {
    status: 'active',
    timeRemaining: 7200, // 2 hours  
    securityLevel: 'critical',
    showTimeRemaining: true,
    userRole: 'healthcare_provider',
    location: 'Emergency-Department',
    emergencyMode: true,
    overrideActive: true,
    onExtend: () => console.log('Emergency override session extended'),
    onLogout: () => console.log('Emergency session logged out'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Emergency override session with extended timeout for critical patient care situations.',
      },
    },
  },
};

// Minimal Display
export const MinimalDisplay: Story = {
  args: {
    status: 'active',
    timeRemaining: 1200,
    securityLevel: 'medium',
    showTimeRemaining: false,
    compact: true,
    onExtend: () => console.log('Minimal session extended'),
    onLogout: () => console.log('Minimal session logout'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Minimal session status display for space-constrained interfaces.',
      },
    },
  },
};