'use client';

import React, { useState } from 'react';
import { WizardShell } from '@/components/workflow/wizard-shell';
import { createWizardConfig, createWizardStep } from '@/lib/wizard/wizard-utils';
import { WizardShellProps } from '@/components/workflow/wizard-types';
import { Button } from '@starter/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@starter/ui';
import { Badge } from '@starter/ui';
import { ArrowLeft, User, Briefcase, Settings, CheckCircle } from 'lucide-react';
import Link from 'next/link';

// Demo step components
const PersonalInfoStep: React.FC<any> = ({ data, onDataChange, onValidationChange }) => {
  React.useEffect(() => {
    const isValid = !!(data.name && data.email); // Convert to boolean
    const validationMessage = isValid ? undefined : 'Name and email are required';
    onValidationChange(isValid, validationMessage);
  }, [data.name, data.email]); // Remove onValidationChange from dependencies to prevent recursion

  return (
    <div className="space-y-4">
      {/* Required Fields Notice */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-sm text-blue-700">
          <strong>Required:</strong> Fill in your name and email address to continue
        </p>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          className={`w-full px-3 py-2 border rounded-md ${data.name ? 'border-green-300 bg-green-50' : 'border-gray-300'}`}
          value={data.name || ''}
          onChange={(e) => onDataChange({ name: e.target.value })}
          placeholder="Enter your full name"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">
          Email Address <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          className={`w-full px-3 py-2 border rounded-md ${data.email ? 'border-green-300 bg-green-50' : 'border-gray-300'}`}
          value={data.email || ''}
          onChange={(e) => onDataChange({ email: e.target.value })}
          placeholder="Enter your email"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Phone (Optional)</label>
        <input
          type="tel"
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          value={data.phone || ''}
          onChange={(e) => onDataChange({ phone: e.target.value })}
          placeholder="Enter your phone number"
        />
      </div>
    </div>
  );
};

const ProfessionalInfoStep: React.FC<any> = ({ data, onDataChange, onValidationChange }) => {
  React.useEffect(() => {
    const isValid = !!(data.jobTitle && data.company); // Convert to boolean
    const validationMessage = isValid ? undefined : 'Job title and company are required';
    onValidationChange(isValid, validationMessage);
  }, [data.jobTitle, data.company]); // Remove onValidationChange from dependencies to prevent recursion

  return (
    <div className="space-y-4">
      {/* Required Fields Notice */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-sm text-blue-700">
          <strong>Required:</strong> Fill in your job title and company to continue
        </p>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">
          Job Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          className={`w-full px-3 py-2 border rounded-md ${data.jobTitle ? 'border-green-300 bg-green-50' : 'border-gray-300'}`}
          value={data.jobTitle || ''}
          onChange={(e) => onDataChange({ jobTitle: e.target.value })}
          placeholder="Enter your job title"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">
          Company <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          className={`w-full px-3 py-2 border rounded-md ${data.company ? 'border-green-300 bg-green-50' : 'border-gray-300'}`}
          value={data.company || ''}
          onChange={(e) => onDataChange({ company: e.target.value })}
          placeholder="Enter your company name"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Years of Experience</label>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          value={data.experience || ''}
          onChange={(e) => onDataChange({ experience: e.target.value })}
        >
          <option value="">Select experience level</option>
          <option value="0-1">0-1 years</option>
          <option value="2-5">2-5 years</option>
          <option value="6-10">6-10 years</option>
          <option value="10+">10+ years</option>
        </select>
      </div>
    </div>
  );
};

const PreferencesStep: React.FC<any> = ({ data, onDataChange, onValidationChange }) => {
  React.useEffect(() => {
    onValidationChange(true); // This step is optional, always valid
  }, []); // Empty deps array since this step is always valid

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Preferred Contact Method</label>
        <div className="space-y-2">
          {['email', 'phone', 'text'].map((method) => (
            <label key={method} className="flex items-center">
              <input
                type="radio"
                name="contactMethod"
                value={method}
                checked={data.contactMethod === method}
                onChange={(e) => onDataChange({ contactMethod: e.target.value })}
                className="mr-2"
              />
              <span className="capitalize">{method}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={data.newsletter || false}
            onChange={(e) => onDataChange({ newsletter: e.target.checked })}
            className="mr-2"
          />
          Subscribe to our newsletter
        </label>
      </div>
      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={data.notifications || false}
            onChange={(e) => onDataChange({ notifications: e.target.checked })}
            className="mr-2"
          />
          Enable push notifications
        </label>
      </div>
    </div>
  );
};

const ReviewStep: React.FC<any> = ({ data, onValidationChange }) => {
  React.useEffect(() => {
    onValidationChange(true); // Review step is always valid
  }, []); // Empty deps array since this step is always valid

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Review Your Information</h3>
      
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <User className="w-4 h-4 mr-2" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Name:</strong> {data.name || 'Not provided'}</p>
            <p><strong>Email:</strong> {data.email || 'Not provided'}</p>
            <p><strong>Phone:</strong> {data.phone || 'Not provided'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <Briefcase className="w-4 h-4 mr-2" />
              Professional Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Job Title:</strong> {data.jobTitle || 'Not provided'}</p>
            <p><strong>Company:</strong> {data.company || 'Not provided'}</p>
            <p><strong>Experience:</strong> {data.experience || 'Not provided'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <Settings className="w-4 h-4 mr-2" />
              Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Contact Method:</strong> {data.contactMethod || 'Not selected'}</p>
            <p><strong>Newsletter:</strong> {data.newsletter ? 'Yes' : 'No'}</p>
            <p><strong>Notifications:</strong> {data.notifications ? 'Yes' : 'No'}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default function WizardDemoPage() {
  const [completedData, setCompletedData] = useState<any>(null);
  const [variant, setVariant] = useState<'full' | 'minimal'>('full');

  // Create wizard configuration
  const wizardConfig = createWizardConfig(
    'demo-wizard',
    [
      createWizardStep(
        'personal',
        'Personal Information',
        PersonalInfoStep,
        {
          required: true,
          estimatedTime: 3,
          helpContent: 'Enter your basic personal information. All fields marked as required must be filled out.',
          description: 'We need some basic information about you to get started.',
          validator: (data: any) => {
            const isValid = !!(data.name && data.email); // Convert to boolean
            return {
              isValid,
              message: isValid ? undefined : 'Name and email are required'
            };
          }
        }
      ),
      createWizardStep(
        'professional',
        'Professional Details',
        ProfessionalInfoStep,
        {
          required: true,
          estimatedTime: 5,
          dependencies: ['personal'],
          helpContent: 'Tell us about your professional background and current role.',
          description: 'Help us understand your professional background.',
          validator: (data: any) => {
            const isValid = !!(data.jobTitle && data.company); // Convert to boolean
            return {
              isValid,
              message: isValid ? undefined : 'Job title and company are required'
            };
          }
        }
      ),
      createWizardStep(
        'preferences',
        'Preferences',
        PreferencesStep,
        {
          required: false,
          isOptional: true,
          isSkippable: true,
          estimatedTime: 2,
          helpContent: 'Set your communication preferences. These can be changed later.',
          description: 'Customize how we communicate with you.',
          validator: (data: any) => {
            return { isValid: true }; // Always valid since it's optional
          }
        }
      ),
      createWizardStep(
        'review',
        'Review & Confirm',
        ReviewStep,
        {
          required: true,
          estimatedTime: 2,
          canNavigateBack: true,
          helpContent: 'Review all the information you have entered before submitting.',
          description: 'Please review your information before completing the process.',
          validator: (data: any) => {
            return { isValid: true }; // Always valid - review step
          }
        }
      ),
    ],
    async (data) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setCompletedData(data);
      console.log('Wizard completed with data:', data);
    },
    {
      title: 'User Onboarding Wizard',
      description: 'Complete your profile setup to get started',
      autoSave: true,
      persistSession: true,
      allowBackNavigation: true,
      debounceMs: 300,
      onCancel: () => {
        console.log('Wizard cancelled');
      },
    }
  );

  const handleReset = () => {
    setCompletedData(null);
    // Force wizard to reinitialize by changing key
    window.location.reload();
  };

  if (completedData) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <Link 
              href="/"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
            
            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl">Wizard Completed!</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-gray-600 mb-6">
                  Thank you for completing the onboarding process. Here's the data that was collected:
                </p>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(completedData, null, 2)}
                  </pre>
                </div>
                
                <div className="flex justify-center space-x-4">
                  <Button onClick={handleReset}>
                    Try Again
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/">Go Home</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link 
              href="/"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
            
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Wizard Framework Demo</h1>
                <p className="text-gray-600">Interactive demo of the reusable wizard component</p>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Variant:</span>
                <Button
                  size="sm"
                  variant={variant === 'full' ? 'default' : 'outline'}
                  onClick={() => setVariant('full')}
                >
                  Full
                </Button>
                <Button
                  size="sm"
                  variant={variant === 'minimal' ? 'default' : 'outline'}
                  onClick={() => setVariant('minimal')}
                >
                  Minimal
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card>
                <CardContent className="p-4">
                  <Badge className="mb-2">Auto-save</Badge>
                  <p className="text-sm text-gray-600">Changes are automatically saved after 300ms</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <Badge className="mb-2">Session Recovery</Badge>
                  <p className="text-sm text-gray-600">Progress is restored if you refresh the page</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <Badge className="mb-2">Keyboard Navigation</Badge>
                  <p className="text-sm text-gray-600">Use arrow keys, Ctrl+Enter, and Escape</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <WizardShell
            config={wizardConfig}
            variant={variant}
            showProgress={true}
            showEstimates={true}
            showHelp={true}
            allowNonLinear={false}
            onStepChange={(stepIndex, stepId) => {
              console.log('Step changed:', stepIndex, stepId);
            }}
            onDataChange={(data) => {
              console.log('Data changed:', data);
            }}
            onSessionRestore={(session) => {
              console.log('Session restored:', session);
            }}
          />
        </div>
      </div>
    </div>
  );
}