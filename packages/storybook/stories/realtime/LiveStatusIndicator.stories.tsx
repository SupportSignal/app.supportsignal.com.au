import type { Meta, StoryObj } from '@storybook/react';
import { LiveStatusIndicator } from '../../../../apps/web/components/realtime/live-status-indicator';

const meta: Meta<typeof LiveStatusIndicator> = {
  title: 'Healthcare Components/Realtime/LiveStatusIndicator',
  component: LiveStatusIndicator,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Real-time status indicator for healthcare systems showing live connection states, data synchronization, and system health.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['connected', 'connecting', 'disconnected', 'error', 'syncing', 'idle'],
      description: 'Current connection and synchronization status',
    },
    dataType: {
      control: 'select',
      options: ['patient_vitals', 'lab_results', 'medication_orders', 'system_alerts', 'user_activity'],
      description: 'Type of data being monitored',
    },
    lastUpdate: {
      description: 'Timestamp of last data update',
    },
    updateFrequency: {
      control: { type: 'number', min: 1, max: 60 },
      description: 'Expected update frequency in seconds',
    },
    showTimestamp: {
      control: 'boolean',
      description: 'Display last update timestamp',
    },
    criticalLevel: {
      control: 'boolean',
      description: 'Mark as critical system component',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Patient Vitals Monitoring - Active
export const PatientVitalsActive: Story = {
  args: {
    status: 'connected',
    dataType: 'patient_vitals',
    lastUpdate: new Date(Date.now() - 5000).toISOString(), // 5 seconds ago
    updateFrequency: 10,
    showTimestamp: true,
    criticalLevel: true,
    patientId: 'PT-12345',
    location: 'ICU Room 204',
  },
  parameters: {
    docs: {
      description: {
        story: 'Active patient vital signs monitoring with critical system designation and real-time updates.',
      },
    },
  },
};

// Lab Results Syncing
export const LabResultsSyncing: Story = {
  args: {
    status: 'syncing',
    dataType: 'lab_results',
    lastUpdate: new Date(Date.now() - 30000).toISOString(), // 30 seconds ago
    updateFrequency: 60,
    showTimestamp: true,
    criticalLevel: false,
    pendingResults: 3,
    labSystem: 'Quest Diagnostics',
  },
  parameters: {
    docs: {
      description: {
        story: 'Laboratory results synchronization in progress with external lab system integration.',
      },
    },
  },
};

// Medication Orders - Connection Error
export const MedicationOrdersError: Story = {
  args: {
    status: 'error',
    dataType: 'medication_orders',
    lastUpdate: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
    updateFrequency: 30,
    showTimestamp: true,
    criticalLevel: true,
    errorMessage: 'Pharmacy system connection timeout',
    retryAttempts: 3,
  },
  parameters: {
    docs: {
      description: {
        story: 'Critical error state for medication ordering system requiring immediate attention.',
      },
    },
  },
};

// System Alerts - Disconnected
export const SystemAlertsDisconnected: Story = {
  args: {
    status: 'disconnected',
    dataType: 'system_alerts',
    lastUpdate: new Date(Date.now() - 120000).toISOString(), // 2 minutes ago
    updateFrequency: 15,
    showTimestamp: true,
    criticalLevel: true,
    disconnectedSince: new Date(Date.now() - 120000).toISOString(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Disconnected system alerts monitor requiring reconnection for critical healthcare notifications.',
      },
    },
  },
};

// User Activity - Connecting
export const UserActivityConnecting: Story = {
  args: {
    status: 'connecting',
    dataType: 'user_activity',
    updateFrequency: 20,
    showTimestamp: true,
    criticalLevel: false,
    connectionAttempt: 2,
    maxRetries: 5,
  },
  parameters: {
    docs: {
      description: {
        story: 'User activity monitoring system establishing connection with retry mechanism.',
      },
    },
  },
};

// Emergency Alert System - Critical Active
export const EmergencyAlertActive: Story = {
  args: {
    status: 'connected',
    dataType: 'system_alerts',
    lastUpdate: new Date().toISOString(),
    updateFrequency: 5,
    showTimestamp: true,
    criticalLevel: true,
    alertLevel: 'emergency',
    activeAlerts: 2,
    location: 'Emergency Department',
  },
  parameters: {
    docs: {
      description: {
        story: 'Emergency alert system with active critical alerts requiring immediate response.',
      },
    },
  },
};

// Surgical Equipment - Idle State
export const SurgicalEquipmentIdle: Story = {
  args: {
    status: 'idle',
    dataType: 'patient_vitals',
    lastUpdate: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
    updateFrequency: 5,
    showTimestamp: true,
    criticalLevel: false,
    equipmentType: 'Surgical Monitor',
    room: 'OR-3',
  },
  parameters: {
    docs: {
      description: {
        story: 'Surgical equipment in idle state between procedures with status monitoring.',
      },
    },
  },
};

// Multi-System Dashboard View
export const MultiSystemDashboard: Story = {
  args: {
    status: 'connected',
    dataType: 'system_alerts',
    lastUpdate: new Date().toISOString(),
    updateFrequency: 10,
    showTimestamp: true,
    criticalLevel: true,
    compact: true,
    systemCount: 12,
    connectedSystems: 10,
    alertSystems: 2,
  },
  parameters: {
    docs: {
      description: {
        story: 'Compact multi-system dashboard view showing overall health status across healthcare systems.',
      },
    },
  },
};

// Minimal Status Display
export const MinimalDisplay: Story = {
  args: {
    status: 'connected',
    showTimestamp: false,
    compact: true,
    criticalLevel: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Minimal status indicator for space-constrained interfaces.',
      },
    },
  },
};