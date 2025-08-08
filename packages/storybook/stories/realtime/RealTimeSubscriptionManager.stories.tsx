import type { Meta, StoryObj } from '@storybook/react';
import { RealTimeSubscriptionManager } from '../../../../apps/web/components/realtime/realtime-subscription-manager';

const meta: Meta<typeof RealTimeSubscriptionManager> = {
  title: 'Healthcare Components/Realtime/RealTimeSubscriptionManager',
  component: RealTimeSubscriptionManager,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Real-time subscription manager for healthcare systems managing WebSocket connections, data streams, and live updates with automatic reconnection and error handling.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    subscriptions: {
      description: 'Array of active subscriptions with healthcare data types and connection status',
    },
    connectionStatus: {
      control: 'select',
      options: ['connected', 'connecting', 'disconnected', 'error', 'reconnecting'],
      description: 'Overall WebSocket connection status',
    },
    showDebugInfo: {
      control: 'boolean',
      description: 'Display debug information and connection metrics',
    },
    autoReconnect: {
      control: 'boolean',
      description: 'Enable automatic reconnection on connection loss',
    },
    onSubscriptionChange: {
      action: 'subscription-changed',
      description: 'Callback when subscription status changes',
    },
    onConnectionError: {
      action: 'connection-error',
      description: 'Callback when connection error occurs',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// ICU Patient Monitoring
export const ICUPatientMonitoring: Story = {
  args: {
    subscriptions: [
      {
        id: 'vitals-pt-12345',
        type: 'patient_vitals',
        patientId: 'PT-12345',
        patientName: 'John Smith',
        room: 'ICU-204',
        status: 'active',
        lastUpdate: new Date().toISOString(),
        updateFrequency: 5000, // 5 seconds
        dataPoints: ['heart_rate', 'blood_pressure', 'oxygen_saturation', 'temperature'],
        criticalThresholds: {
          heart_rate: { min: 60, max: 100 },
          oxygen_saturation: { min: 95, max: 100 },
        },
        alertsEnabled: true,
      },
      {
        id: 'medication-pt-12345',
        type: 'medication_administration',
        patientId: 'PT-12345',
        patientName: 'John Smith',
        room: 'ICU-204',
        status: 'active',
        lastUpdate: new Date(Date.now() - 30000).toISOString(),
        updateFrequency: 60000, // 1 minute
        pendingMedications: 3,
        nextDose: new Date(Date.now() + 1800000).toISOString(),
        alertsEnabled: true,
      },
      {
        id: 'lab-results-pt-12345',
        type: 'lab_results',
        patientId: 'PT-12345',
        patientName: 'John Smith',
        status: 'active',
        lastUpdate: new Date(Date.now() - 300000).toISOString(),
        updateFrequency: 300000, // 5 minutes
        pendingResults: 2,
        alertsEnabled: true,
      },
    ],
    connectionStatus: 'connected',
    showDebugInfo: true,
    autoReconnect: true,
    connectionMetrics: {
      uptime: '2h 45m',
      reconnectAttempts: 0,
      messagesReceived: 1847,
      messagesSent: 23,
      averageLatency: '45ms',
    },
    onSubscriptionChange: (subscription) => console.log('ICU subscription changed:', subscription),
    onConnectionError: (error) => console.log('ICU connection error:', error),
  },
  parameters: {
    docs: {
      description: {
        story: 'ICU patient monitoring with real-time vital signs, medication tracking, and lab result updates.',
      },
    },
  },
};

// Emergency Department Dashboard
export const EmergencyDepartmentDashboard: Story = {
  args: {
    subscriptions: [
      {
        id: 'ed-bed-status',
        type: 'bed_availability',
        department: 'Emergency Department',
        status: 'active',
        lastUpdate: new Date(Date.now() - 15000).toISOString(),
        updateFrequency: 10000, // 10 seconds
        totalBeds: 24,
        availableBeds: 3,
        occupiedBeds: 21,
        alertsEnabled: true,
      },
      {
        id: 'trauma-alerts',
        type: 'trauma_notifications',
        department: 'Emergency Department',
        status: 'active',
        lastUpdate: new Date(Date.now() - 60000).toISOString(),
        updateFrequency: 1000, // 1 second for critical alerts
        activeTraumas: 1,
        pendingArrivals: 2,
        alertsEnabled: true,
      },
      {
        id: 'triage-queue',
        type: 'triage_queue',
        department: 'Emergency Department',
        status: 'active',
        lastUpdate: new Date(Date.now() - 30000).toISOString(),
        updateFrequency: 30000, // 30 seconds
        queueLength: 8,
        averageWaitTime: '1h 45m',
        alertsEnabled: true,
      },
      {
        id: 'resource-alerts',
        type: 'resource_management',
        department: 'Emergency Department',
        status: 'warning',
        lastUpdate: new Date(Date.now() - 120000).toISOString(),
        updateFrequency: 60000, // 1 minute
        criticalShortages: ['IV pumps', 'Wheelchairs'],
        alertsEnabled: true,
      },
    ],
    connectionStatus: 'connected',
    showDebugInfo: true,
    autoReconnect: true,
    connectionMetrics: {
      uptime: '8h 12m',
      reconnectAttempts: 2,
      messagesReceived: 15234,
      messagesSent: 89,
      averageLatency: '32ms',
    },
    onSubscriptionChange: (subscription) => console.log('ED subscription changed:', subscription),
    onConnectionError: (error) => console.log('ED connection error:', error),
  },
  parameters: {
    docs: {
      description: {
        story: 'Emergency Department dashboard with bed status, trauma alerts, triage queue, and resource management.',
      },
    },
  },
};

// Surgical Department Operations
export const SurgicalDepartmentOperations: Story = {
  args: {
    subscriptions: [
      {
        id: 'or-status-all',
        type: 'operating_room_status',
        department: 'Surgical Services',
        status: 'active',
        lastUpdate: new Date(Date.now() - 45000).toISOString(),
        updateFrequency: 30000, // 30 seconds
        totalRooms: 8,
        inUse: 6,
        scheduled: 7,
        maintenance: 1,
        alertsEnabled: true,
      },
      {
        id: 'surgery-progress',
        type: 'procedure_progress',
        department: 'Surgical Services',
        status: 'active',
        lastUpdate: new Date(Date.now() - 20000).toISOString(),
        updateFrequency: 60000, // 1 minute
        activeProcedures: 6,
        scheduledToday: 15,
        completedToday: 8,
        delayedProcedures: 2,
        alertsEnabled: true,
      },
      {
        id: 'equipment-monitoring',
        type: 'equipment_status',
        department: 'Surgical Services',
        status: 'warning',
        lastUpdate: new Date(Date.now() - 180000).toISOString(),
        updateFrequency: 120000, // 2 minutes
        equipmentIssues: 1,
        maintenanceScheduled: 3,
        criticalEquipment: ['Anesthesia Machine OR-2'],
        alertsEnabled: true,
      },
    ],
    connectionStatus: 'connected',
    showDebugInfo: true,
    autoReconnect: true,
    connectionMetrics: {
      uptime: '12h 5m',
      reconnectAttempts: 0,
      messagesReceived: 8932,
      messagesSent: 156,
      averageLatency: '28ms',
    },
    onSubscriptionChange: (subscription) => console.log('Surgical subscription changed:', subscription),
    onConnectionError: (error) => console.log('Surgical connection error:', error),
  },
  parameters: {
    docs: {
      description: {
        story: 'Surgical department operations with OR status, procedure progress, and equipment monitoring.',
      },
    },
  },
};

// Pharmacy Real-time Monitoring
export const PharmacyRealtimeMonitoring: Story = {
  args: {
    subscriptions: [
      {
        id: 'medication-orders',
        type: 'medication_orders',
        department: 'Pharmacy',
        status: 'active',
        lastUpdate: new Date(Date.now() - 10000).toISOString(),
        updateFrequency: 15000, // 15 seconds
        pendingOrders: 12,
        processingOrders: 8,
        readyForPickup: 25,
        alertsEnabled: true,
      },
      {
        id: 'inventory-alerts',
        type: 'inventory_management',
        department: 'Pharmacy',
        status: 'warning',
        lastUpdate: new Date(Date.now() - 90000).toISOString(),
        updateFrequency: 300000, // 5 minutes
        lowStockItems: 5,
        expiringSoon: 3,
        criticalShortages: 1,
        reordersPending: 7,
        alertsEnabled: true,
      },
      {
        id: 'drug-interactions',
        type: 'clinical_alerts',
        department: 'Pharmacy',
        status: 'active',
        lastUpdate: new Date(Date.now() - 45000).toISOString(),
        updateFrequency: 60000, // 1 minute
        activeInteractionAlerts: 3,
        allergyAlerts: 1,
        doseAlerts: 2,
        alertsEnabled: true,
      },
    ],
    connectionStatus: 'connected',
    showDebugInfo: true,
    autoReconnect: true,
    connectionMetrics: {
      uptime: '6h 30m',
      reconnectAttempts: 1,
      messagesReceived: 4521,
      messagesSent: 67,
      averageLatency: '41ms',
    },
    onSubscriptionChange: (subscription) => console.log('Pharmacy subscription changed:', subscription),
    onConnectionError: (error) => console.log('Pharmacy connection error:', error),
  },
  parameters: {
    docs: {
      description: {
        story: 'Pharmacy real-time monitoring with medication orders, inventory alerts, and clinical interaction monitoring.',
      },
    },
  },
};

// Connection Issues and Recovery
export const ConnectionIssuesAndRecovery: Story = {
  args: {
    subscriptions: [
      {
        id: 'vitals-pt-67890',
        type: 'patient_vitals',
        patientId: 'PT-67890',
        patientName: 'Jane Doe',
        room: 'CCU-301',
        status: 'error',
        lastUpdate: new Date(Date.now() - 300000).toISOString(),
        updateFrequency: 5000,
        connectionError: 'WebSocket timeout - attempting reconnection',
        retryCount: 3,
        alertsEnabled: true,
      },
      {
        id: 'lab-system',
        type: 'lab_results',
        department: 'Laboratory',
        status: 'disconnected',
        lastUpdate: new Date(Date.now() - 600000).toISOString(),
        updateFrequency: 60000,
        connectionError: 'Lab system maintenance - reconnecting in 15 minutes',
        nextRetry: new Date(Date.now() + 900000).toISOString(),
        alertsEnabled: true,
      },
      {
        id: 'medication-alerts',
        type: 'medication_alerts',
        department: 'Pharmacy',
        status: 'reconnecting',
        lastUpdate: new Date(Date.now() - 120000).toISOString(),
        updateFrequency: 30000,
        connectionError: 'Network connectivity issues',
        retryCount: 1,
        alertsEnabled: true,
      },
    ],
    connectionStatus: 'reconnecting',
    showDebugInfo: true,
    autoReconnect: true,
    connectionMetrics: {
      uptime: '4h 15m',
      reconnectAttempts: 5,
      messagesReceived: 2847,
      messagesSent: 43,
      averageLatency: '127ms',
      lastError: 'Network timeout - retrying connection',
    },
    onSubscriptionChange: (subscription) => console.log('Recovery subscription changed:', subscription),
    onConnectionError: (error) => console.log('Recovery connection error:', error),
  },
  parameters: {
    docs: {
      description: {
        story: 'Connection issues and recovery scenarios with error handling and automatic reconnection attempts.',
      },
    },
  },
};

// Minimal Configuration
export const MinimalConfiguration: Story = {
  args: {
    subscriptions: [
      {
        id: 'basic-alerts',
        type: 'system_alerts',
        status: 'active',
        lastUpdate: new Date().toISOString(),
        updateFrequency: 60000,
        alertsEnabled: true,
      },
    ],
    connectionStatus: 'connected',
    showDebugInfo: false,
    autoReconnect: true,
    onSubscriptionChange: (subscription) => console.log('Minimal subscription changed:', subscription),
    onConnectionError: (error) => console.log('Minimal connection error:', error),
  },
  parameters: {
    docs: {
      description: {
        story: 'Minimal subscription manager configuration for basic real-time functionality.',
      },
    },
  },
};

// No Active Subscriptions
export const NoActiveSubscriptions: Story = {
  args: {
    subscriptions: [],
    connectionStatus: 'connected',
    showDebugInfo: true,
    autoReconnect: true,
    connectionMetrics: {
      uptime: '1h 23m',
      reconnectAttempts: 0,
      messagesReceived: 0,
      messagesSent: 0,
      averageLatency: 'N/A',
    },
    onSubscriptionChange: (subscription) => console.log('No subscriptions to change'),
    onConnectionError: (error) => console.log('Connection error with no subscriptions:', error),
  },
  parameters: {
    docs: {
      description: {
        story: 'Subscription manager with no active subscriptions showing connection status only.',
      },
    },
  },
};

// High-Load Production System
export const HighLoadProductionSystem: Story = {
  args: {
    subscriptions: [
      {
        id: 'hospital-wide-alerts',
        type: 'system_wide_alerts',
        department: 'Hospital Operations',
        status: 'active',
        lastUpdate: new Date().toISOString(),
        updateFrequency: 1000, // 1 second
        activeAlerts: 23,
        criticalAlerts: 3,
        systemLoad: 'high',
        alertsEnabled: true,
      },
      {
        id: 'multi-patient-vitals',
        type: 'bulk_patient_vitals',
        department: 'Critical Care',
        status: 'active',
        lastUpdate: new Date(Date.now() - 2000).toISOString(),
        updateFrequency: 2000, // 2 seconds
        patientCount: 45,
        criticalPatients: 8,
        alertsEnabled: true,
      },
      {
        id: 'enterprise-lab-feed',
        type: 'enterprise_lab_results',
        department: 'Laboratory Network',
        status: 'active',
        lastUpdate: new Date(Date.now() - 5000).toISOString(),
        updateFrequency: 5000, // 5 seconds
        resultsPerHour: 1250,
        pendingResults: 89,
        alertsEnabled: true,
      },
    ],
    connectionStatus: 'connected',
    showDebugInfo: true,
    autoReconnect: true,
    connectionMetrics: {
      uptime: '23h 47m',
      reconnectAttempts: 3,
      messagesReceived: 156789,
      messagesSent: 892,
      averageLatency: '15ms',
      throughput: '2.3k msg/min',
    },
    performanceMode: 'optimized',
    onSubscriptionChange: (subscription) => console.log('High-load subscription changed:', subscription),
    onConnectionError: (error) => console.log('High-load connection error:', error),
  },
  parameters: {
    docs: {
      description: {
        story: 'High-load production system with multiple enterprise-level subscriptions and optimized performance metrics.',
      },
    },
  },
};