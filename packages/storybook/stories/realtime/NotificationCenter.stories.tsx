import type { Meta, StoryObj } from '@storybook/react';
import { NotificationCenter } from '../../../../apps/web/components/realtime/notification-center';

const meta: Meta<typeof NotificationCenter> = {
  title: 'Healthcare Components/Realtime/NotificationCenter',
  component: NotificationCenter,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Real-time notification center for healthcare systems managing critical alerts, patient updates, and system notifications with priority-based filtering and HIPAA-compliant delivery.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    notifications: {
      description: 'Array of notification objects with healthcare-specific metadata',
    },
    maxVisible: {
      control: { type: 'number', min: 1, max: 20 },
      description: 'Maximum number of notifications to display',
    },
    filterOptions: {
      description: 'Available notification filters for healthcare contexts',
    },
    onNotificationClick: {
      action: 'notification-clicked',
      description: 'Callback when notification is clicked',
    },
    onMarkAsRead: {
      action: 'marked-as-read',
      description: 'Callback when notification is marked as read',
    },
    onDismiss: {
      action: 'notification-dismissed',
      description: 'Callback when notification is dismissed',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Critical Healthcare Notifications
export const CriticalHealthcareAlerts: Story = {
  args: {
    notifications: [
      {
        id: 'critical-001',
        type: 'critical',
        category: 'patient_emergency',
        title: 'Critical Patient Alert',
        message: 'Patient in Room 204 - Vital signs indicate immediate intervention required',
        timestamp: new Date(Date.now() - 60000).toISOString(),
        read: false,
        priority: 'critical',
        patientId: 'PT-12345',
        location: 'ICU Room 204',
        actionRequired: true,
        assignedTo: ['dr-johnson', 'nurse-rodriguez'],
      },
      {
        id: 'urgent-002',
        type: 'urgent',
        category: 'medication_alert',
        title: 'Medication Interaction Warning',
        message: 'Potential drug interaction detected for patient John Smith - Review required',
        timestamp: new Date(Date.now() - 180000).toISOString(),
        read: false,
        priority: 'high',
        patientId: 'PT-67890',
        medications: ['Warfarin', 'Aspirin'],
        actionRequired: true,
        assignedTo: ['pharmacist-wong'],
      },
      {
        id: 'lab-003',
        type: 'info',
        category: 'lab_results',
        title: 'Lab Results Available',
        message: 'CBC and Metabolic Panel results ready for Patient Emily Davis',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        read: false,
        priority: 'medium',
        patientId: 'PT-54321',
        testTypes: ['CBC', 'Metabolic Panel'],
        actionRequired: false,
        assignedTo: ['dr-martinez'],
      },
      {
        id: 'system-004',
        type: 'warning',
        category: 'system_alert',
        title: 'System Maintenance Scheduled',
        message: 'EMR system will be unavailable for maintenance tonight 11 PM - 2 AM',
        timestamp: new Date(Date.now() - 600000).toISOString(),
        read: true,
        priority: 'low',
        maintenanceWindow: { start: '23:00', end: '02:00' },
        affectedSystems: ['EMR', 'Lab Interface'],
        actionRequired: false,
      },
    ],
    maxVisible: 10,
    filterOptions: [
      { id: 'all', label: 'All Notifications', count: 4 },
      { id: 'critical', label: 'Critical', count: 1 },
      { id: 'patient_emergency', label: 'Patient Emergencies', count: 1 },
      { id: 'medication_alert', label: 'Medication Alerts', count: 1 },
      { id: 'lab_results', label: 'Lab Results', count: 1 },
      { id: 'unread', label: 'Unread', count: 3 },
    ],
    onNotificationClick: (notification) => console.log('Healthcare notification clicked:', notification),
    onMarkAsRead: (notificationId) => console.log('Marked as read:', notificationId),
    onDismiss: (notificationId) => console.log('Dismissed:', notificationId),
  },
  parameters: {
    docs: {
      description: {
        story: 'Critical healthcare notification center with emergency alerts, medication warnings, and lab results.',
      },
    },
  },
};

// Emergency Department Notifications
export const EmergencyDepartmentAlerts: Story = {
  args: {
    notifications: [
      {
        id: 'trauma-001',
        type: 'critical',
        category: 'trauma_alert',
        title: 'Level 1 Trauma Activation',
        message: 'Multi-vehicle accident incoming - ETA 8 minutes - Trauma Team assemble',
        timestamp: new Date().toISOString(),
        read: false,
        priority: 'critical',
        traumaLevel: 'Level 1',
        eta: '8 minutes',
        traumaType: 'Multi-vehicle accident',
        teamRequired: ['trauma_surgeon', 'emergency_physician', 'anesthesiologist'],
        actionRequired: true,
      },
      {
        id: 'bed-002',
        type: 'urgent',
        category: 'resource_management',
        title: 'Critical Bed Shortage',
        message: 'ICU at capacity - 3 patients waiting for admission from ED',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        read: false,
        priority: 'high',
        bedsAvailable: 0,
        waitingPatients: 3,
        estimatedWaitTime: '45 minutes',
        actionRequired: true,
      },
      {
        id: 'triage-003',
        type: 'info',
        category: 'triage_update',
        title: 'Triage Status Update',
        message: 'Current wait time for Level 3 patients: 2 hours 15 minutes',
        timestamp: new Date(Date.now() - 900000).toISOString(),
        read: true,
        priority: 'low',
        triageLevel: 'Level 3',
        waitTime: '2 hours 15 minutes',
        patientsWaiting: 12,
        actionRequired: false,
      },
    ],
    maxVisible: 8,
    filterOptions: [
      { id: 'all', label: 'All Alerts', count: 3 },
      { id: 'trauma_alert', label: 'Trauma Alerts', count: 1 },
      { id: 'resource_management', label: 'Resource Management', count: 1 },
      { id: 'critical', label: 'Critical', count: 1 },
      { id: 'unread', label: 'Unread', count: 2 },
    ],
    location: 'Emergency Department',
    onNotificationClick: (notification) => console.log('ED notification clicked:', notification),
    onMarkAsRead: (notificationId) => console.log('ED marked as read:', notificationId),
    onDismiss: (notificationId) => console.log('ED dismissed:', notificationId),
  },
  parameters: {
    docs: {
      description: {
        story: 'Emergency Department notification center with trauma alerts, resource management, and triage updates.',
      },
    },
  },
};

// Surgical Department Notifications
export const SurgicalDepartmentAlerts: Story = {
  args: {
    notifications: [
      {
        id: 'surgery-001',
        type: 'info',
        category: 'procedure_update',
        title: 'Procedure Completed Successfully',
        message: 'Cardiac bypass surgery for Patient Williams completed - Moving to Recovery',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        read: false,
        priority: 'medium',
        patientId: 'PT-78901',
        procedureType: 'Cardiac Bypass',
        surgeon: 'Dr. Thompson',
        duration: '4 hours 25 minutes',
        nextStage: 'Post-operative Recovery',
        actionRequired: false,
      },
      {
        id: 'schedule-002',
        type: 'warning',
        category: 'scheduling',
        title: 'Surgery Delayed',
        message: 'OR-3 procedure delayed 90 minutes due to equipment calibration',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        read: true,
        priority: 'medium',
        orRoom: 'OR-3',
        delayReason: 'Equipment calibration',
        delayDuration: '90 minutes',
        affectedProcedures: 2,
        actionRequired: true,
      },
      {
        id: 'equipment-003',
        type: 'urgent',
        category: 'equipment_alert',
        title: 'Critical Equipment Issue',
        message: 'Anesthesia machine malfunction in OR-2 - Immediate maintenance required',
        timestamp: new Date(Date.now() - 600000).toISOString(),
        read: false,
        priority: 'high',
        orRoom: 'OR-2',
        equipmentType: 'Anesthesia Machine',
        maintenanceTicket: 'MT-2024-001',
        estimatedRepairTime: '2 hours',
        actionRequired: true,
      },
    ],
    maxVisible: 6,
    filterOptions: [
      { id: 'all', label: 'All Updates', count: 3 },
      { id: 'procedure_update', label: 'Procedure Updates', count: 1 },
      { id: 'scheduling', label: 'Scheduling', count: 1 },
      { id: 'equipment_alert', label: 'Equipment Alerts', count: 1 },
      { id: 'unread', label: 'Unread', count: 2 },
    ],
    department: 'Surgical Services',
    onNotificationClick: (notification) => console.log('Surgical notification clicked:', notification),
    onMarkAsRead: (notificationId) => console.log('Surgical marked as read:', notificationId),
    onDismiss: (notificationId) => console.log('Surgical dismissed:', notificationId),
  },
  parameters: {
    docs: {
      description: {
        story: 'Surgical department notification center with procedure updates, scheduling alerts, and equipment monitoring.',
      },
    },
  },
};

// Pharmacy Notifications
export const PharmacyAlerts: Story = {
  args: {
    notifications: [
      {
        id: 'med-001',
        type: 'critical',
        category: 'medication_shortage',
        title: 'Critical Medication Shortage',
        message: 'Insulin supply critically low - Only 2 days remaining',
        timestamp: new Date(Date.now() - 120000).toISOString(),
        read: false,
        priority: 'critical',
        medication: 'Insulin (Humalog)',
        currentStock: '48 units',
        daysRemaining: 2,
        reorderStatus: 'Emergency order placed',
        actionRequired: true,
      },
      {
        id: 'interaction-002',
        type: 'warning',
        category: 'drug_interaction',
        title: 'Drug Interaction Alert',
        message: 'Multiple interaction warnings for Patient Johnson - Clinical review needed',
        timestamp: new Date(Date.now() - 480000).toISOString(),
        read: false,
        priority: 'high',
        patientId: 'PT-24680',
        interactionCount: 3,
        medications: ['Warfarin', 'Ibuprofen', 'Ciprofloxacin'],
        riskLevel: 'Moderate to High',
        actionRequired: true,
      },
      {
        id: 'refill-003',
        type: 'info',
        category: 'prescription_ready',
        title: 'Prescriptions Ready for Pickup',
        message: '15 prescriptions ready for patient pickup',
        timestamp: new Date(Date.now() - 1200000).toISOString(),
        read: true,
        priority: 'low',
        readyCount: 15,
        avgWaitTime: '3 hours',
        actionRequired: false,
      },
    ],
    maxVisible: 8,
    filterOptions: [
      { id: 'all', label: 'All Pharmacy', count: 3 },
      { id: 'medication_shortage', label: 'Shortages', count: 1 },
      { id: 'drug_interaction', label: 'Interactions', count: 1 },
      { id: 'prescription_ready', label: 'Ready for Pickup', count: 1 },
      { id: 'critical', label: 'Critical', count: 1 },
      { id: 'unread', label: 'Unread', count: 2 },
    ],
    department: 'Pharmacy Services',
    onNotificationClick: (notification) => console.log('Pharmacy notification clicked:', notification),
    onMarkAsRead: (notificationId) => console.log('Pharmacy marked as read:', notificationId),
    onDismiss: (notificationId) => console.log('Pharmacy dismissed:', notificationId),
  },
  parameters: {
    docs: {
      description: {
        story: 'Pharmacy notification center with medication shortages, drug interaction alerts, and prescription status updates.',
      },
    },
  },
};

// Light Notification Load
export const LightNotificationLoad: Story = {
  args: {
    notifications: [
      {
        id: 'routine-001',
        type: 'info',
        category: 'routine_update',
        title: 'Daily Census Update',
        message: 'Hospital census: 187 patients (92% occupancy)',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        read: true,
        priority: 'low',
        occupancyRate: '92%',
        totalPatients: 187,
        actionRequired: false,
      },
      {
        id: 'meeting-002',
        type: 'info',
        category: 'meeting_reminder',
        title: 'Department Meeting Reminder',
        message: 'Weekly quality improvement meeting starts in 30 minutes',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        read: false,
        priority: 'low',
        meetingType: 'Quality Improvement',
        startTime: new Date(Date.now() + 1800000).toISOString(),
        location: 'Conference Room A',
        actionRequired: false,
      },
    ],
    maxVisible: 5,
    filterOptions: [
      { id: 'all', label: 'All Notifications', count: 2 },
      { id: 'routine_update', label: 'Routine Updates', count: 1 },
      { id: 'meeting_reminder', label: 'Meetings', count: 1 },
      { id: 'unread', label: 'Unread', count: 1 },
    ],
    onNotificationClick: (notification) => console.log('Light load notification clicked:', notification),
    onMarkAsRead: (notificationId) => console.log('Light load marked as read:', notificationId),
    onDismiss: (notificationId) => console.log('Light load dismissed:', notificationId),
  },
  parameters: {
    docs: {
      description: {
        story: 'Light notification load with routine updates and meeting reminders for normal operations.',
      },
    },
  },
};

// No Notifications
export const NoNotifications: Story = {
  args: {
    notifications: [],
    maxVisible: 10,
    filterOptions: [
      { id: 'all', label: 'All Notifications', count: 0 },
    ],
    emptyMessage: 'No notifications at this time',
    onNotificationClick: () => console.log('No notifications to click'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty notification center state when no notifications are present.',
      },
    },
  },
};

// Compact Mobile View
export const CompactMobileView: Story = {
  args: {
    notifications: [
      {
        id: 'mobile-001',
        type: 'critical',
        category: 'patient_emergency',
        title: 'Critical Alert',
        message: 'Room 204 needs immediate attention',
        timestamp: new Date().toISOString(),
        read: false,
        priority: 'critical',
        actionRequired: true,
      },
      {
        id: 'mobile-002',
        type: 'urgent',
        category: 'medication_alert',
        title: 'Med Alert',
        message: 'Drug interaction for Smith, J.',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        read: false,
        priority: 'high',
        actionRequired: true,
      },
    ],
    maxVisible: 3,
    compact: true,
    mobileView: true,
    filterOptions: [
      { id: 'all', label: 'All', count: 2 },
      { id: 'critical', label: 'Critical', count: 1 },
      { id: 'unread', label: 'Unread', count: 2 },
    ],
    onNotificationClick: (notification) => console.log('Mobile notification clicked:', notification),
    onMarkAsRead: (notificationId) => console.log('Mobile marked as read:', notificationId),
  },
  parameters: {
    docs: {
      description: {
        story: 'Compact mobile-optimized notification center with essential information only.',
      },
    },
  },
};