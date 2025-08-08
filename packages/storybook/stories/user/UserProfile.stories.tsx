import type { Meta, StoryObj } from '@storybook/react';
import { UserProfile } from '../../../../apps/web/components/user/user-profile';

const meta: Meta<typeof UserProfile> = {
  title: 'Healthcare Components/User/UserProfile',
  component: UserProfile,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Displays comprehensive user profile information in healthcare contexts with role-based permissions and accessibility compliance.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    user: {
      description: 'User data object containing profile information',
    },
    showContactInfo: {
      control: 'boolean',
      description: 'Show/hide contact information based on permissions',
    },
    showMedicalInfo: {
      control: 'boolean', 
      description: 'Show/hide medical information for healthcare providers',
    },
    onEdit: {
      action: 'edited',
      description: 'Callback when user profile is edited',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Healthcare Provider Story
export const HealthcareProvider: Story = {
  args: {
    user: {
      id: 'hp-001',
      name: 'Dr. Sarah Johnson',
      email: 'sarah.johnson@hospital.com',
      role: 'healthcare_provider',
      department: 'Cardiology',
      licenseNumber: 'MD-12345-CA',
      specialization: 'Interventional Cardiology',
      profileImage: '/api/placeholder/64/64',
      lastActive: new Date().toISOString(),
      permissions: ['view_medical_records', 'edit_medical_records', 'prescribe_medication'],
    },
    showContactInfo: true,
    showMedicalInfo: true,
    onEdit: () => console.log('Healthcare provider profile edited'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Healthcare provider profile with full medical information access and specialized credentials display.',
      },
    },
  },
};

// Patient Story
export const Patient: Story = {
  args: {
    user: {
      id: 'pt-001', 
      name: 'John Smith',
      email: 'john.smith@email.com',
      role: 'patient',
      dateOfBirth: '1985-03-15',
      emergencyContact: {
        name: 'Jane Smith',
        phone: '+1-555-0123',
        relationship: 'Spouse',
      },
      profileImage: '/api/placeholder/64/64',
      lastActive: new Date().toISOString(),
      permissions: ['view_own_records', 'update_personal_info'],
    },
    showContactInfo: true,
    showMedicalInfo: false,
    onEdit: () => console.log('Patient profile edited'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Patient profile with restricted access showing only personal information and emergency contacts.',
      },
    },
  },
};

// Administrator Story
export const Administrator: Story = {
  args: {
    user: {
      id: 'admin-001',
      name: 'Michael Chen',
      email: 'michael.chen@hospital.com', 
      role: 'administrator',
      department: 'IT Administration',
      clearanceLevel: 'Level 3',
      profileImage: '/api/placeholder/64/64',
      lastActive: new Date().toISOString(),
      permissions: ['manage_users', 'system_admin', 'view_audit_logs', 'manage_permissions'],
    },
    showContactInfo: true,
    showMedicalInfo: false,
    onEdit: () => console.log('Administrator profile edited'),
  },
  parameters: {
    docs: {
      description: {
        story: 'System administrator profile with elevated permissions and system management capabilities.',
      },
    },
  },
};

// Nurse Story
export const Nurse: Story = {
  args: {
    user: {
      id: 'nurse-001',
      name: 'Emily Rodriguez',
      email: 'emily.rodriguez@hospital.com',
      role: 'nurse',
      department: 'Emergency Department',
      licenseNumber: 'RN-98765-CA',
      shift: 'Night Shift',
      profileImage: '/api/placeholder/64/64',
      lastActive: new Date().toISOString(),
      permissions: ['view_medical_records', 'update_patient_vitals', 'administer_medication'],
    },
    showContactInfo: true,
    showMedicalInfo: true,
    onEdit: () => console.log('Nurse profile edited'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Registered nurse profile with patient care permissions and shift information.',
      },
    },
  },
};

// Limited Access Story
export const LimitedAccess: Story = {
  args: {
    user: {
      id: 'guest-001',
      name: 'Guest User',
      email: 'guest@hospital.com',
      role: 'visitor',
      profileImage: '/api/placeholder/64/64',
      lastActive: new Date().toISOString(),
      permissions: ['view_public_info'],
    },
    showContactInfo: false,
    showMedicalInfo: false,
    onEdit: () => console.log('Limited access profile viewed'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Limited access profile for visitors or users with restricted permissions.',
      },
    },
  },
};