import type { Meta, StoryObj } from '@storybook/react';
import { WorkflowWizard } from '../../../../apps/web/components/user/workflow-wizard';

const meta: Meta<typeof WorkflowWizard> = {
  title: 'Healthcare Components/User/WorkflowWizard',
  component: WorkflowWizard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Step-by-step workflow wizard for complex healthcare processes with validation, progress tracking, and accessibility support.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    workflow: {
      description: 'Workflow configuration object defining steps and validation',
    },
    currentStep: {
      control: { type: 'number', min: 0, max: 10 },
      description: 'Current active step index',
    },
    data: {
      description: 'Current workflow data being processed',
    },
    onStepChange: {
      action: 'step-changed',
      description: 'Callback when user navigates between steps',
    },
    onComplete: {
      action: 'workflow-completed',
      description: 'Callback when workflow is successfully completed',
    },
    onCancel: {
      action: 'workflow-cancelled', 
      description: 'Callback when workflow is cancelled',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Patient Registration Workflow
export const PatientRegistration: Story = {
  args: {
    workflow: {
      id: 'patient-registration',
      title: 'Patient Registration',
      description: 'Complete patient intake and registration process',
      steps: [
        {
          id: 'personal-info',
          title: 'Personal Information',
          description: 'Basic patient demographics and contact details',
          required: true,
          fields: ['firstName', 'lastName', 'dateOfBirth', 'phone', 'email'],
        },
        {
          id: 'insurance',
          title: 'Insurance Information', 
          description: 'Insurance provider and coverage details',
          required: true,
          fields: ['insuranceProvider', 'policyNumber', 'groupNumber'],
        },
        {
          id: 'medical-history',
          title: 'Medical History',
          description: 'Previous conditions, medications, and allergies',
          required: true,
          fields: ['allergies', 'medications', 'previousConditions'],
        },
        {
          id: 'emergency-contact',
          title: 'Emergency Contact',
          description: 'Emergency contact person and relationship',
          required: true, 
          fields: ['emergencyName', 'emergencyPhone', 'relationship'],
        },
        {
          id: 'review',
          title: 'Review & Submit',
          description: 'Review all information before submission',
          required: true,
          fields: [],
        },
      ],
    },
    currentStep: 0,
    data: {
      personalInfo: {
        firstName: 'John',
        lastName: 'Smith', 
        dateOfBirth: '1985-03-15',
        phone: '+1-555-0123',
        email: 'john.smith@email.com',
      },
    },
    onStepChange: (step) => console.log('Patient registration step changed to:', step),
    onComplete: (data) => console.log('Patient registration completed:', data),
    onCancel: () => console.log('Patient registration cancelled'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Complete patient registration workflow with multi-step form validation and progress tracking.',
      },
    },
  },
};

// Medication Prescribing Workflow
export const MedicationPrescribing: Story = {
  args: {
    workflow: {
      id: 'medication-prescribing',
      title: 'Medication Prescribing',
      description: 'Comprehensive medication prescription workflow with safety checks',
      steps: [
        {
          id: 'patient-selection',
          title: 'Patient Selection',
          description: 'Select and verify patient identity',
          required: true,
          fields: ['patientId', 'patientVerification'],
        },
        {
          id: 'drug-allergy-check', 
          title: 'Allergy & Interaction Check',
          description: 'Review patient allergies and drug interactions',
          required: true,
          fields: ['allergyReview', 'interactionCheck'],
        },
        {
          id: 'medication-details',
          title: 'Medication Details',
          description: 'Specify medication, dosage, and instructions',
          required: true,
          fields: ['medication', 'dosage', 'frequency', 'duration', 'instructions'],
        },
        {
          id: 'clinical-review',
          title: 'Clinical Review',
          description: 'Review prescription for clinical appropriateness',
          required: true,
          fields: ['clinicalJustification', 'contraindications'],
        },
        {
          id: 'prescription-finalize',
          title: 'Finalize Prescription',
          description: 'Electronic signature and prescription transmission',
          required: true,
          fields: ['electronicSignature', 'pharmacySelection'],
        },
      ],
    },
    currentStep: 2,
    data: {
      patientId: 'PT-12345',
      medication: 'Lisinopril',
      dosage: '10mg',
      frequency: 'Once daily',
      duration: '30 days',
    },
    onStepChange: (step) => console.log('Prescribing workflow step:', step),
    onComplete: (data) => console.log('Prescription completed:', data),
    onCancel: () => console.log('Prescription workflow cancelled'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Medication prescribing workflow with comprehensive safety checks and electronic signature requirements.',
      },
    },
  },
};

// Discharge Planning Workflow
export const DischargePlanning: Story = {
  args: {
    workflow: {
      id: 'discharge-planning',
      title: 'Patient Discharge Planning',
      description: 'Comprehensive discharge planning with follow-up coordination',
      steps: [
        {
          id: 'medical-clearance',
          title: 'Medical Clearance',
          description: 'Physician approval for patient discharge',
          required: true,
          fields: ['physicianApproval', 'dischargeCriteria'],
        },
        {
          id: 'medication-reconciliation',
          title: 'Medication Reconciliation', 
          description: 'Review and reconcile discharge medications',
          required: true,
          fields: ['dischargeMedications', 'medicationInstructions'],
        },
        {
          id: 'follow-up-appointments',
          title: 'Follow-up Care',
          description: 'Schedule necessary follow-up appointments',
          required: true,
          fields: ['followUpAppointments', 'specialistReferrals'],
        },
        {
          id: 'patient-education',
          title: 'Patient Education',
          description: 'Provide discharge instructions and education materials',
          required: true,
          fields: ['dischargeInstructions', 'educationMaterials'],
        },
        {
          id: 'transportation',
          title: 'Transportation & Support',
          description: 'Arrange transportation and home support services',
          required: false,
          fields: ['transportationArrangement', 'homeServices'],
        },
      ],
    },
    currentStep: 1,
    data: {
      patientId: 'PT-67890',
      physicianApproval: true,
      dischargeMedications: ['Lisinopril 10mg daily', 'Metformin 500mg twice daily'],
    },
    onStepChange: (step) => console.log('Discharge planning step:', step),
    onComplete: (data) => console.log('Discharge planning completed:', data), 
    onCancel: () => console.log('Discharge planning cancelled'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Patient discharge planning workflow ensuring comprehensive care coordination and follow-up scheduling.',
      },
    },
  },
};

// Lab Order Workflow
export const LabOrderWorkflow: Story = {
  args: {
    workflow: {
      id: 'lab-order',
      title: 'Laboratory Order',
      description: 'Order laboratory tests with clinical justification',
      steps: [
        {
          id: 'patient-clinical-info',
          title: 'Patient & Clinical Info',
          description: 'Patient selection and clinical indication',
          required: true,
          fields: ['patientId', 'clinicalIndication', 'urgency'],
        },
        {
          id: 'test-selection',
          title: 'Test Selection',
          description: 'Select specific laboratory tests',
          required: true,
          fields: ['selectedTests', 'specialInstructions'],
        },
        {
          id: 'collection-details',
          title: 'Collection Details', 
          description: 'Specify collection method and timing',
          required: true,
          fields: ['collectionMethod', 'collectionTiming', 'fastingRequired'],
        },
        {
          id: 'order-review',
          title: 'Order Review',
          description: 'Review and submit laboratory order',
          required: true,
          fields: ['orderReview', 'physicianSignature'],
        },
      ],
    },
    currentStep: 0,
    data: {
      urgency: 'routine',
      clinicalIndication: 'Annual wellness check',
    },
    onStepChange: (step) => console.log('Lab order step:', step),
    onComplete: (data) => console.log('Lab order completed:', data),
    onCancel: () => console.log('Lab order cancelled'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Laboratory test ordering workflow with clinical justification and collection scheduling.',
      },
    },
  },
};

// Emergency Triage Workflow
export const EmergencyTriage: Story = {
  args: {
    workflow: {
      id: 'emergency-triage',
      title: 'Emergency Department Triage',
      description: 'Rapid patient assessment and priority classification',
      steps: [
        {
          id: 'initial-assessment',
          title: 'Initial Assessment', 
          description: 'Quick patient evaluation and vital signs',
          required: true,
          fields: ['chiefComplaint', 'vitalSigns', 'consciousnessLevel'],
        },
        {
          id: 'pain-assessment',
          title: 'Pain & Symptom Assessment',
          description: 'Detailed pain and symptom evaluation',
          required: true,
          fields: ['painScale', 'symptomDuration', 'symptomSeverity'],
        },
        {
          id: 'triage-classification',
          title: 'Triage Classification',
          description: 'Assign emergency priority level',
          required: true,
          fields: ['triageLevel', 'acuityJustification'],
        },
        {
          id: 'resource-allocation',
          title: 'Resource Allocation',
          description: 'Assign appropriate care team and location',
          required: true,
          fields: ['assignedTeam', 'bedAssignment', 'estimatedWaitTime'],
        },
      ],
    },
    currentStep: 2,
    data: {
      chiefComplaint: 'Chest pain',
      vitalSigns: {
        bloodPressure: '140/90',
        heartRate: '95',
        temperature: '98.6°F',
      },
      painScale: 7,
      triageLevel: 'Level 2 - Emergent',
    },
    onStepChange: (step) => console.log('Emergency triage step:', step),
    onComplete: (data) => console.log('Emergency triage completed:', data),
    onCancel: () => console.log('Emergency triage workflow cancelled'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Emergency department triage workflow for rapid patient assessment and priority assignment.',
      },
    },
  },
};

// Minimal Step Display
export const MinimalStepDisplay: Story = {
  args: {
    workflow: {
      id: 'simple-workflow',
      title: 'Quick Assessment',
      steps: [
        { id: 'step1', title: 'Information', required: true, fields: [] },
        { id: 'step2', title: 'Review', required: true, fields: [] },
        { id: 'step3', title: 'Complete', required: true, fields: [] },
      ],
    },
    currentStep: 1,
    compact: true,
    onStepChange: (step) => console.log('Simple workflow step:', step),
    onComplete: (data) => console.log('Simple workflow completed:', data),
  },
  parameters: {
    docs: {
      description: {
        story: 'Minimal workflow wizard display for simple processes.',
      },
    },
  },
};