import type { Meta, StoryObj } from '@storybook/react';
import { PermissionIndicator } from '../../../../apps/web/components/user/permission-indicator';

const meta: Meta<typeof PermissionIndicator> = {
  title: 'Healthcare Components/User/PermissionIndicator',
  component: PermissionIndicator,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Visual indicator for user permissions in healthcare environments with HIPAA compliance and role-based access control.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    permissions: {
      description: 'Array of permission strings for the current user',
    },
    role: {
      control: 'select',
      options: ['healthcare_provider', 'nurse', 'patient', 'administrator', 'visitor'],
      description: 'User role in the healthcare system',
    },
    securityLevel: {
      control: 'select', 
      options: ['low', 'medium', 'high', 'critical'],
      description: 'Security clearance level for sensitive medical data',
    },
    showDetails: {
      control: 'boolean',
      description: 'Show detailed permission breakdown',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Doctor with Full Access
export const DoctorFullAccess: Story = {
  args: {
    permissions: [
      'view_medical_records',
      'edit_medical_records', 
      'prescribe_medication',
      'order_tests',
      'access_lab_results',
      'schedule_procedures',
      'view_patient_history',
      'emergency_override'
    ],
    role: 'healthcare_provider',
    securityLevel: 'critical',
    showDetails: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Healthcare provider with full medical access including emergency override capabilities.',
      },
    },
  },
};

// Nurse with Standard Access  
export const NurseStandardAccess: Story = {
  args: {
    permissions: [
      'view_medical_records',
      'update_patient_vitals',
      'administer_medication',
      'document_care_notes',
      'schedule_appointments',
      'view_lab_results'
    ],
    role: 'nurse',
    securityLevel: 'high',
    showDetails: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Registered nurse with standard patient care permissions for bedside medical support.',
      },
    },
  },
};

// Patient Self-Access
export const PatientSelfAccess: Story = {
  args: {
    permissions: [
      'view_own_records',
      'update_personal_info', 
      'schedule_appointments',
      'view_test_results',
      'message_providers',
      'download_records'
    ],
    role: 'patient',
    securityLevel: 'medium',
    showDetails: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Patient with self-service access to their own medical records and appointment management.',
      },
    },
  },
};

// System Administrator
export const SystemAdministrator: Story = {
  args: {
    permissions: [
      'manage_users',
      'system_admin',
      'view_audit_logs',
      'manage_permissions', 
      'system_maintenance',
      'backup_restore',
      'security_monitoring'
    ],
    role: 'administrator',
    securityLevel: 'critical',
    showDetails: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'System administrator with full system management capabilities and audit access.',
      },
    },
  },
};

// Limited/Restricted Access
export const RestrictedAccess: Story = {
  args: {
    permissions: [
      'view_public_info'
    ],
    role: 'visitor',
    securityLevel: 'low',
    showDetails: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Visitor or temporary user with minimal access to public information only.',
      },
    },
  },
};

// Emergency Override Active
export const EmergencyOverride: Story = {
  args: {
    permissions: [
      'view_medical_records',
      'edit_medical_records',
      'prescribe_medication',
      'emergency_override',
      'break_glass_access',
      'critical_care_access'
    ],
    role: 'healthcare_provider', 
    securityLevel: 'critical',
    showDetails: true,
    emergencyMode: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Emergency override mode activated for critical patient care situations with enhanced audit logging.',
      },
    },
  },
};

// Compact View
export const CompactView: Story = {
  args: {
    permissions: [
      'view_medical_records',
      'update_patient_vitals',
      'administer_medication'
    ],
    role: 'nurse',
    securityLevel: 'high', 
    showDetails: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Compact permission indicator for space-constrained interfaces.',
      },
    },
  },
};