import type { Meta, StoryObj } from '@storybook/react';
import { CollaborationBadge } from '../../../../apps/web/components/realtime/collaboration-badge';

const meta: Meta<typeof CollaborationBadge> = {
  title: 'Healthcare Components/Realtime/CollaborationBadge',
  component: CollaborationBadge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Real-time collaboration indicator showing active users working on healthcare records with role identification and activity status.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    activeUsers: {
      description: 'Array of users currently collaborating on the healthcare record',
    },
    maxDisplayUsers: {
      control: { type: 'number', min: 1, max: 10 },
      description: 'Maximum number of user avatars to display before showing count',
    },
    recordType: {
      control: 'select',
      options: ['patient_record', 'care_plan', 'medication_order', 'lab_results', 'surgical_notes'],
      description: 'Type of healthcare record being collaborated on',
    },
    showActivity: {
      control: 'boolean',
      description: 'Display recent activity indicators and timestamps',
    },
    onUserClick: {
      action: 'user-clicked',
      description: 'Callback when a collaborating user is clicked',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Active Healthcare Team Collaboration
export const HealthcareTeamActive: Story = {
  args: {
    activeUsers: [
      {
        id: 'dr-johnson',
        name: 'Dr. Sarah Johnson',
        role: 'attending_physician',
        avatar: '/api/placeholder/32/32',
        status: 'editing',
        lastActivity: new Date(Date.now() - 30000).toISOString(),
        section: 'treatment_plan',
      },
      {
        id: 'nurse-rodriguez', 
        name: 'Emily Rodriguez',
        role: 'registered_nurse',
        avatar: '/api/placeholder/32/32',
        status: 'viewing',
        lastActivity: new Date(Date.now() - 60000).toISOString(),
        section: 'medication_administration',
      },
      {
        id: 'pharm-chen',
        name: 'Michael Chen',
        role: 'pharmacist',
        avatar: '/api/placeholder/32/32', 
        status: 'reviewing',
        lastActivity: new Date(Date.now() - 120000).toISOString(),
        section: 'medication_orders',
      },
    ],
    maxDisplayUsers: 5,
    recordType: 'patient_record',
    showActivity: true,
    patientId: 'PT-12345',
    onUserClick: (user) => console.log('Healthcare team member clicked:', user),
  },
  parameters: {
    docs: {
      description: {
        story: 'Active healthcare team collaborating on patient record with real-time editing indicators.',
      },
    },
  },
};

// Surgical Team Planning
export const SurgicalTeamPlanning: Story = {
  args: {
    activeUsers: [
      {
        id: 'surgeon-williams',
        name: 'Dr. James Williams',
        role: 'surgeon',
        avatar: '/api/placeholder/32/32',
        status: 'editing',
        lastActivity: new Date(Date.now() - 15000).toISOString(),
        section: 'surgical_procedure',
      },
      {
        id: 'anesthesiologist-kim',
        name: 'Dr. Lisa Kim',
        role: 'anesthesiologist', 
        avatar: '/api/placeholder/32/32',
        status: 'reviewing',
        lastActivity: new Date(Date.now() - 45000).toISOString(),
        section: 'anesthesia_plan',
      },
      {
        id: 'nurse-patel',
        name: 'Raj Patel',
        role: 'surgical_nurse',
        avatar: '/api/placeholder/32/32',
        status: 'viewing',
        lastActivity: new Date(Date.now() - 90000).toISOString(),
        section: 'equipment_checklist',
      },
      {
        id: 'tech-davis',
        name: 'Amanda Davis',
        role: 'surgical_tech',
        avatar: '/api/placeholder/32/32',
        status: 'preparing',
        lastActivity: new Date(Date.now() - 180000).toISOString(),
        section: 'instrument_preparation',
      },
    ],
    maxDisplayUsers: 4,
    recordType: 'surgical_notes',
    showActivity: true,
    procedureType: 'Cardiac Bypass',
    scheduledTime: new Date(Date.now() + 3600000).toISOString(),
    onUserClick: (user) => console.log('Surgical team member clicked:', user),
  },
  parameters: {
    docs: {
      description: {
        story: 'Surgical team collaboration on pre-operative planning with specialized roles and status indicators.',
      },
    },
  },
};

// Emergency Response Team
export const EmergencyResponseTeam: Story = {
  args: {
    activeUsers: [
      {
        id: 'er-doc-martinez',
        name: 'Dr. Carlos Martinez',
        role: 'emergency_physician',
        avatar: '/api/placeholder/32/32',
        status: 'critical_editing',
        lastActivity: new Date().toISOString(),
        section: 'triage_assessment',
      },
      {
        id: 'nurse-thompson',
        name: 'Jennifer Thompson',
        role: 'emergency_nurse',
        avatar: '/api/placeholder/32/32',
        status: 'monitoring',
        lastActivity: new Date(Date.now() - 10000).toISOString(),
        section: 'vital_signs',
      },
      {
        id: 'tech-garcia',
        name: 'Luis Garcia',
        role: 'emergency_tech',
        avatar: '/api/placeholder/32/32',
        status: 'documenting',
        lastActivity: new Date(Date.now() - 20000).toISOString(),
        section: 'procedures_performed',
      },
    ],
    maxDisplayUsers: 5,
    recordType: 'patient_record',
    showActivity: true,
    emergencyLevel: 'critical',
    triageTime: new Date(Date.now() - 600000).toISOString(),
    onUserClick: (user) => console.log('Emergency team member clicked:', user),
  },
  parameters: {
    docs: {
      description: {
        story: 'Emergency response team with critical status indicators and real-time collaboration during patient care.',
      },
    },
  },
};

// Large Collaboration Team
export const LargeCollaborationTeam: Story = {
  args: {
    activeUsers: [
      {
        id: 'user-1',
        name: 'Dr. Anderson',
        role: 'attending_physician',
        avatar: '/api/placeholder/32/32',
        status: 'editing',
        lastActivity: new Date().toISOString(),
      },
      {
        id: 'user-2',
        name: 'Nurse Wilson',
        role: 'registered_nurse',
        avatar: '/api/placeholder/32/32',
        status: 'viewing',
        lastActivity: new Date(Date.now() - 30000).toISOString(),
      },
      {
        id: 'user-3',
        name: 'Dr. Brown',
        role: 'specialist',
        avatar: '/api/placeholder/32/32',
        status: 'reviewing',
        lastActivity: new Date(Date.now() - 60000).toISOString(),
      },
      {
        id: 'user-4',
        name: 'Pharmacist Lee',
        role: 'pharmacist',
        avatar: '/api/placeholder/32/32',
        status: 'consulting',
        lastActivity: new Date(Date.now() - 90000).toISOString(),
      },
      {
        id: 'user-5',
        name: 'Therapist Jones',
        role: 'therapist',
        avatar: '/api/placeholder/32/32',
        status: 'planning',
        lastActivity: new Date(Date.now() - 120000).toISOString(),
      },
      {
        id: 'user-6',
        name: 'Social Worker',
        role: 'social_worker',
        avatar: '/api/placeholder/32/32',
        status: 'coordinating',
        lastActivity: new Date(Date.now() - 150000).toISOString(),
      },
      {
        id: 'user-7',
        name: 'Case Manager',
        role: 'case_manager',
        avatar: '/api/placeholder/32/32',
        status: 'reviewing',
        lastActivity: new Date(Date.now() - 180000).toISOString(),
      },
    ],
    maxDisplayUsers: 3,
    recordType: 'care_plan',
    showActivity: true,
    patientComplexity: 'high',
    onUserClick: (user) => console.log('Team member clicked:', user),
  },
  parameters: {
    docs: {
      description: {
        story: 'Large multidisciplinary team collaboration with overflow indicator showing total count.',
      },
    },
  },
};

// Medication Review Session
export const MedicationReviewSession: Story = {
  args: {
    activeUsers: [
      {
        id: 'pharmacist-wong',
        name: 'Dr. Angela Wong',
        role: 'clinical_pharmacist',
        avatar: '/api/placeholder/32/32',
        status: 'reviewing',
        lastActivity: new Date(Date.now() - 60000).toISOString(),
        section: 'drug_interactions',
      },
      {
        id: 'physician-taylor',
        name: 'Dr. Michael Taylor',
        role: 'attending_physician',
        avatar: '/api/placeholder/32/32',
        status: 'approving',
        lastActivity: new Date(Date.now() - 30000).toISOString(),
        section: 'prescription_approval',
      },
    ],
    maxDisplayUsers: 3,
    recordType: 'medication_order',
    showActivity: true,
    reviewType: 'comprehensive_medication_review',
    onUserClick: (user) => console.log('Medication review participant clicked:', user),
  },
  parameters: {
    docs: {
      description: {
        story: 'Medication review collaboration between clinical pharmacist and attending physician.',
      },
    },
  },
};

// Single User Active
export const SingleUserActive: Story = {
  args: {
    activeUsers: [
      {
        id: 'nurse-single',
        name: 'Patricia Wilson',
        role: 'registered_nurse',
        avatar: '/api/placeholder/32/32',
        status: 'documenting',
        lastActivity: new Date().toISOString(),
        section: 'patient_assessment',
      },
    ],
    maxDisplayUsers: 5,
    recordType: 'patient_record',
    showActivity: true,
    onUserClick: (user) => console.log('Single user clicked:', user),
  },
  parameters: {
    docs: {
      description: {
        story: 'Single user working on healthcare record with activity status indicator.',
      },
    },
  },
};

// Inactive/No Collaboration
export const NoActiveCollaboration: Story = {
  args: {
    activeUsers: [],
    maxDisplayUsers: 5,
    recordType: 'patient_record',
    showActivity: false,
    lastAccessed: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    onUserClick: (user) => console.log('No active users'),
  },
  parameters: {
    docs: {
      description: {
        story: 'No active collaboration state showing when record is not being accessed.',
      },
    },
  },
};

// Minimal Compact Display
export const MinimalCompactDisplay: Story = {
  args: {
    activeUsers: [
      {
        id: 'compact-user',
        name: 'Dr. Smith',
        role: 'physician',
        avatar: '/api/placeholder/24/24',
        status: 'active',
        lastActivity: new Date().toISOString(),
      },
    ],
    maxDisplayUsers: 2,
    recordType: 'patient_record',
    showActivity: false,
    compact: true,
    onUserClick: (user) => console.log('Compact user clicked:', user),
  },
  parameters: {
    docs: {
      description: {
        story: 'Compact collaboration badge for space-constrained interfaces.',
      },
    },
  },
};