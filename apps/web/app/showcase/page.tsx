'use client';

import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@starter/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@starter/ui';
import { Input } from '@starter/ui';
import { ThemeToggle } from '../../components/theme/theme-toggle';
import { AdminPageHeader } from '@/components/layout/admin-page-header';
import { IncidentCard, MetadataDisplay } from '@/components/incident';
import { StatusBadge } from '@/components/shared';
import { WorkflowProgress } from '@/components/workflow';
import { NarrativePhaseEditor, EnhancementIndicator, AutoSaveStatus, NarrativeProgress } from '@/components/narrative';
import { ConditionsEditor, ClassificationDisplay, ConfidenceIndicator, AnalysisWorkflow } from '@/components/analysis';
import { UserProfile, PermissionIndicator, SessionStatus, WorkflowWizard } from '@/components/user';
import { LiveStatusIndicator, CollaborationBadge, NotificationCenter, RealTimeSubscriptionManager } from '@/components/realtime';

// Mock incident data for component demonstrations
const mockIncident = {
  _id: 'incident_123' as any,
  _creationTime: Date.now(),
  company_id: 'company_123' as any,
  reporter_name: 'Sarah Wilson',
  participant_name: 'John Smith',
  event_date_time: new Date().toISOString(),
  location: 'Community Center - Activity Room 2',
  capture_status: 'in_progress' as const,
  analysis_status: 'not_started' as const,
  overall_status: 'capture_pending' as const,
  created_at: Date.now() - 3600000,
  created_by: 'user_123' as any,
  updated_at: Date.now() - 1800000,
  questions_generated: true,
  narrative_enhanced: false,
  analysis_generated: false,
};

// Mock analysis data for component demonstrations
const mockClassification = {
  incidentType: 'behavioral' as const,
  severity: 'medium' as const,
  confidence: 87,
  supportingEvidence: [
    'Participant showed signs of distress before the incident',
    'Environmental factors contributed to escalation',
    'Similar incidents occurred in the same location'
  ],
  riskLevel: 'moderate' as const,
  recommendedActions: [
    'Implement environmental modifications',
    'Review support strategies',
    'Provide additional training to staff'
  ],
  reviewRequired: false,
  aiGenerated: true,
  lastUpdated: new Date(),
};

const mockConditions = [
  {
    id: '1',
    type: 'environmental' as const,
    title: 'Noise Level',
    description: 'High noise levels in the activity room may have contributed to participant distress',
    severity: 'medium' as const,
    isModifiable: true,
    recommendedActions: ['Install sound dampening materials', 'Implement quiet hours'],
    status: 'confirmed' as const,
  },
  {
    id: '2', 
    type: 'behavioral' as const,
    title: 'Routine Change',
    description: 'Unexpected change to daily routine caused participant anxiety',
    severity: 'high' as const,
    isModifiable: true,
    recommendedActions: ['Provide advance notice of changes', 'Use visual schedules'],
    status: 'identified' as const,
  },
];

// Mock user data for component demonstrations
const mockUserProfile = {
  id: 'user_123',
  name: 'Sarah Wilson',
  email: 'sarah.wilson@supportorganization.com',
  phone: '+61 2 9123 4567',
  role: {
    id: 'role_team_lead',
    name: 'team_lead' as const,
    label: 'Team Leader',
    permissions: ['incident.read', 'incident.write', 'analysis.read'],
    color: 'text-green-700',
  },
  company: {
    id: 'company_123',
    name: 'Melbourne Support Services',
  },
  department: 'Community Programs',
  title: 'Senior Support Coordinator',
  location: 'Melbourne, VIC',
  joinedAt: new Date('2022-03-15'),
  lastActive: new Date(Date.now() - 180000),
  isOnline: true,
  stats: {
    incidentsReported: 47,
    incidentsAnalyzed: 23,
    averageResponseTime: 12,
    completionRate: 94,
  },
  preferences: {
    emailNotifications: true,
    smsNotifications: false,
    darkMode: false,
    language: 'English',
  },
};

const mockPermissions = [
  {
    id: 'incident.read',
    name: 'View Incidents',
    description: 'Can view and read incident reports',
    category: 'incidents' as const,
    level: 'read' as const,
    isGranted: true,
    inheritedFrom: 'role' as const,
  },
  {
    id: 'incident.write',
    name: 'Edit Incidents',
    description: 'Can create and modify incident reports',
    category: 'incidents' as const,
    level: 'write' as const,
    isGranted: true,
    inheritedFrom: 'role' as const,
  },
  {
    id: 'analysis.admin',
    name: 'Manage Analysis',
    description: 'Can approve and manage incident analysis',
    category: 'analysis' as const,
    level: 'admin' as const,
    isGranted: false,
    isDangerous: true,
  },
  {
    id: 'system.admin',
    name: 'System Administration',
    description: 'Full system access and configuration',
    category: 'system' as const,
    level: 'full' as const,
    isGranted: false,
    isDangerous: true,
  },
];

const mockSessionInfo = {
  id: 'session_abc123',
  userId: 'user_123',
  startTime: new Date(Date.now() - 7200000), // 2 hours ago
  lastActivity: new Date(Date.now() - 180000), // 3 minutes ago
  isActive: true,
  connectionStatus: 'connected' as const,
  workflowState: {
    incidentId: 'incident_456',
    currentStep: 'narrative-collection',
    stepData: { completedPhases: ['initial', 'details'] },
    lastSaved: new Date(Date.now() - 300000), // 5 minutes ago
    autoSaveEnabled: true,
    unsavedChanges: true,
  },
  deviceInfo: {
    browser: 'Chrome 118.0',
    os: 'macOS 14.1',
    ip: '203.45.67.89',
  },
  permissions: ['incident.read', 'incident.write', 'analysis.read'],
  expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
  warningThreshold: 15, // 15 minutes
};

const mockWizardSteps = [
  {
    id: 'initial-details',
    title: 'Basic Incident Details',
    description: 'Collect participant information and incident overview',
    isComplete: true,
    estimatedTime: 5,
    helpContent: 'Ensure all required fields are completed accurately.',
  },
  {
    id: 'narrative-collection',
    title: 'Incident Narrative',
    description: 'Detailed description of what occurred',
    isComplete: false,
    estimatedTime: 15,
    helpContent: 'Provide a comprehensive account of the incident sequence.',
  },
  {
    id: 'analysis-review',
    title: 'Analysis & Classification',
    description: 'Review AI-generated analysis and make adjustments',
    isComplete: false,
    isOptional: true,
    estimatedTime: 10,
    helpContent: 'Verify the AI analysis matches your professional assessment.',
  },
  {
    id: 'final-review',
    title: 'Final Review & Submission',
    description: 'Review all information before submitting',
    isComplete: false,
    estimatedTime: 5,
  },
];

// Note: metadata export removed since this is now a client component
// Metadata is handled by layout or individual page head elements

export default function ShowcasePage() {
  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-6 py-12">
        <AdminPageHeader
          title="Component Showcase"
          description="Browse and test UI components and design patterns"
          icon={<span className="text-2xl">🧪</span>}
        >
          <ThemeToggle />
        </AdminPageHeader>

        <main className="max-w-4xl mx-auto">
          {/* SupportSignal Button Components Section */}
        <section className="mb-ss-3xl">
          <Card className="dark:bg-card dark:border-border">
            <CardHeader>
              <h2 className="text-header-h2 text-healthcare-primary dark:text-healthcare-dark-primary font-semibold">
                SupportSignal Button Components
              </h2>
              <p className="text-healthcare-base text-gray-600 dark:text-healthcare-dark-muted">
                Healthcare-compliant button variants with SupportSignal branding
              </p>
            </CardHeader>
            <CardContent className="space-y-ss-lg">
              {/* Primary Healthcare Buttons */}
              <div>
                <h4 className="text-healthcare-sm font-semibold text-healthcare-primary dark:text-healthcare-dark-primary mb-ss-sm">
                  Healthcare Action Buttons
                </h4>
                <div className="flex flex-wrap gap-ss-sm">
                  <Button className="bg-ss-cta-blue hover:bg-ss-cta-blue/90 text-white">Create Incident</Button>
                  <Button className="bg-ss-teal hover:bg-ss-teal-deep text-white">Generate Analysis</Button>
                  <Button className="bg-ss-success hover:bg-ss-success/90 text-white">Complete Review</Button>
                </div>
              </div>

              {/* Status Action Buttons */}
              <div>
                <h4 className="text-healthcare-sm font-semibold text-healthcare-primary dark:text-healthcare-dark-primary mb-ss-sm">
                  Status Action Buttons
                </h4>
                <div className="flex flex-wrap gap-ss-sm">
                  <Button variant="outline" className="border-ss-navy text-ss-navy hover:bg-ss-navy hover:text-white">
                    Draft Incident
                  </Button>
                  <Button variant="outline" className="border-ss-alert text-ss-alert hover:bg-ss-alert hover:text-black">
                    Request Review
                  </Button>
                  <Button variant="secondary" className="bg-healthcare-surface dark:bg-healthcare-dark-surface border">
                    Cancel Action
                  </Button>
                </div>
              </div>

              {/* Healthcare Form Buttons */}
              <div>
                <h4 className="text-healthcare-sm font-semibold text-healthcare-primary dark:text-healthcare-dark-primary mb-ss-sm">
                  Form Controls
                </h4>
                <div className="flex flex-wrap gap-ss-sm">
                  <Button size="sm" className="bg-ss-teal hover:bg-ss-teal-deep">Save Draft</Button>
                  <Button size="lg" className="bg-ss-cta-blue hover:bg-ss-cta-blue/90">Submit Report</Button>
                  <Button variant="ghost" className="text-gray-600 hover:text-ss-navy">Reset Form</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Healthcare Input Components */}
        <section className="mb-ss-3xl">
          <Card className="dark:bg-card dark:border-border">
            <CardHeader>
              <h2 className="text-header-h2 text-healthcare-primary dark:text-healthcare-dark-primary font-semibold">
                Healthcare Form Components
              </h2>
              <p className="text-healthcare-base text-gray-600 dark:text-healthcare-dark-muted">
                Professional form inputs designed for healthcare data collection
              </p>
            </CardHeader>
            <CardContent className="space-y-ss-lg">
              {/* Healthcare Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-ss-md">
                <div>
                  <label htmlFor="participant-name" className="block text-healthcare-sm font-medium text-healthcare-primary dark:text-healthcare-dark-primary mb-2">
                    Participant Name *
                  </label>
                  <Input
                    id="participant-name"
                    placeholder="Enter participant name"
                    className="border-gray-300 focus:border-ss-teal focus:ring-ss-teal dark:bg-healthcare-dark-surface"
                  />
                </div>
                <div>
                  <label htmlFor="incident-location" className="block text-healthcare-sm font-medium text-healthcare-primary dark:text-healthcare-dark-primary mb-2">
                    Incident Location *
                  </label>
                  <Input
                    id="incident-location"
                    placeholder="Community Center - Room 2"
                    className="border-gray-300 focus:border-ss-teal focus:ring-ss-teal dark:bg-healthcare-dark-surface"
                  />
                </div>
                <div>
                  <label htmlFor="reporter-email" className="block text-healthcare-sm font-medium text-healthcare-primary dark:text-healthcare-dark-primary mb-2">
                    Reporter Email
                  </label>
                  <Input
                    id="reporter-email"
                    type="email"
                    placeholder="staff@organization.com"
                    className="border-gray-300 focus:border-ss-teal focus:ring-ss-teal dark:bg-healthcare-dark-surface"
                  />
                </div>
                <div>
                  <label htmlFor="incident-date" className="block text-healthcare-sm font-medium text-healthcare-primary dark:text-healthcare-dark-primary mb-2">
                    Incident Date & Time *
                  </label>
                  <Input
                    id="incident-date"
                    type="datetime-local"
                    className="border-gray-300 focus:border-ss-teal focus:ring-ss-teal dark:bg-healthcare-dark-surface"
                  />
                </div>
              </div>
              
              <div className="pt-ss-sm border-t dark:border-healthcare-dark-border">
                <p className="text-healthcare-xs text-gray-500 dark:text-healthcare-dark-muted mb-ss-sm">
                  * Required fields for NDIS incident reporting compliance
                </p>
                <div className="flex gap-ss-sm">
                  <Button className="bg-ss-cta-blue hover:bg-ss-cta-blue/90">Save & Continue</Button>
                  <Button variant="outline" className="border-ss-navy text-ss-navy">Save as Draft</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Dark Mode Toggle Demo */}
        <section className="mb-ss-3xl">
          <Card className="border-2 border-ss-teal/20 dark:border-healthcare-dark-accent/30">
            <CardHeader>
              <h2 className="text-header-h2 text-healthcare-primary dark:text-healthcare-dark-primary font-semibold">
                🌙 Healthcare Dark Mode
              </h2>
              <p className="text-healthcare-base text-gray-600 dark:text-healthcare-dark-muted">
                Professional dark mode with SupportSignal branding - try the toggle in the header!
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-ss-lg">
                <div className="p-ss-md bg-healthcare-surface dark:bg-healthcare-dark-surface rounded-lg border dark:border-healthcare-dark-border">
                  <h3 className="font-semibold text-healthcare-primary dark:text-healthcare-dark-primary mb-2">Light Mode</h3>
                  <p className="text-healthcare-sm text-gray-600 dark:text-healthcare-dark-muted mb-3">Clean, professional healthcare interface</p>
                  <div className="space-y-2">
                    <div className="w-full h-6 bg-ss-navy rounded flex items-center px-2">
                      <span className="text-white text-xs">Navy Headers #0C2D55</span>
                    </div>
                    <div className="w-full h-6 bg-ss-teal rounded flex items-center px-2">
                      <span className="text-white text-xs">Teal Accents #2CC4B7</span>
                    </div>
                    <div className="w-full h-6 bg-healthcare-background dark:bg-healthcare-dark-background border rounded flex items-center px-2">
                      <span className="text-gray-600 dark:text-healthcare-dark-muted text-xs">Light Background</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-ss-md bg-healthcare-dark-surface rounded-lg border border-healthcare-dark-border">
                  <h3 className="font-semibold text-healthcare-dark-primary mb-2">Dark Mode</h3>
                  <p className="text-healthcare-sm text-healthcare-dark-muted mb-3">Eye-friendly dark interface for extended use</p>
                  <div className="space-y-2">
                    <div className="w-full h-6 bg-healthcare-dark-primary rounded flex items-center px-2">
                      <span className="text-healthcare-dark-background text-xs">Light Teal Text #E2F4F2</span>
                    </div>
                    <div className="w-full h-6 bg-healthcare-dark-accent rounded flex items-center px-2">
                      <span className="text-healthcare-dark-background text-xs">Bright Teal #3CD7C4</span>
                    </div>
                    <div className="w-full h-6 bg-healthcare-dark-background border border-healthcare-dark-border rounded flex items-center px-2">
                      <span className="text-healthcare-dark-muted text-xs">Deep Navy Background</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* SupportSignal Brand Colors Section */}
        <section className="mb-ss-3xl">
          <Card className="dark:bg-card dark:border-border">
            <CardHeader>
              <h2 className="text-header-h2 text-healthcare-primary dark:text-healthcare-dark-primary font-semibold">
                SupportSignal Brand Colors
              </h2>
              <p className="text-healthcare-base text-gray-600 dark:text-healthcare-dark-muted">
                Healthcare-compliant color system with accessibility considerations
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-ss-md">
                {/* Teal Gradient System */}
                <div className="space-y-ss-sm">
                  <h3 className="font-semibold text-healthcare-primary">Teal System</h3>
                  <div className="space-y-2">
                    <div className="w-full h-16 bg-ss-teal-light rounded-md flex items-end p-2">
                      <span className="text-white text-xs font-medium">Light #3CD7C4</span>
                    </div>
                    <div className="w-full h-16 bg-ss-teal rounded-md flex items-end p-2">
                      <span className="text-white text-xs font-medium">Mid #2CC4B7</span>
                    </div>
                    <div className="w-full h-16 bg-ss-teal-deep rounded-md flex items-end p-2">
                      <span className="text-white text-xs font-medium">Deep #1798A2</span>
                    </div>
                  </div>
                </div>

                {/* Primary Colors */}
                <div className="space-y-ss-sm">
                  <h3 className="font-semibold text-healthcare-primary">Primary</h3>
                  <div className="space-y-2">
                    <div className="w-full h-16 bg-ss-navy rounded-md flex items-end p-2">
                      <span className="text-white text-xs font-medium">Navy #0C2D55</span>
                    </div>
                    <div className="w-full h-16 bg-ss-cta-blue rounded-md flex items-end p-2">
                      <span className="text-white text-xs font-medium">CTA Blue #287BCB</span>
                    </div>
                  </div>
                </div>

                {/* Status Colors */}
                <div className="space-y-ss-sm">
                  <h3 className="font-semibold text-healthcare-primary">Status</h3>
                  <div className="space-y-2">
                    <div className="w-full h-16 bg-ss-success rounded-md flex items-end p-2">
                      <span className="text-white text-xs font-medium">Success #27AE60</span>
                    </div>
                    <div className="w-full h-16 bg-ss-alert rounded-md flex items-end p-2">
                      <span className="text-black text-xs font-medium">Alert #F2C94C</span>
                    </div>
                  </div>
                </div>

                {/* Background */}
                <div className="space-y-ss-sm">
                  <h3 className="font-semibold text-healthcare-primary">Background</h3>
                  <div className="space-y-2">
                    <div className="w-full h-16 bg-ss-bg-grey rounded-md border border-gray-300 flex items-end p-2">
                      <span className="text-gray-700 text-xs font-medium">Grey #F4F7FA</span>
                    </div>
                    <div className="w-full h-16 bg-healthcare-surface rounded-md border border-gray-300 flex items-end p-2">
                      <span className="text-gray-700 text-xs font-medium">Surface #FFFFFF</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Healthcare Typography Section */}
        <section className="mb-ss-3xl">
          <Card>
            <CardHeader>
              <h2 className="text-header-h2 text-healthcare-primary font-semibold">
                Healthcare Typography Scale
              </h2>
              <p className="text-healthcare-base text-gray-600">
                Inter font family with optimized readability for healthcare professionals
              </p>
            </CardHeader>
            <CardContent className="space-y-ss-lg">
              <div className="text-header-h1 text-healthcare-primary font-bold">
                H1 Header - Main Page Titles
              </div>
              <div className="text-header-h2 text-healthcare-primary font-semibold">
                H2 Header - Section Headings
              </div>
              <div className="text-header-h3 text-healthcare-primary font-semibold">
                H3 Header - Subsection Headings
              </div>
              <div className="text-healthcare-lg text-healthcare-primary">
                Large Body - Important content and emphasis text
              </div>
              <div className="text-healthcare-base text-gray-700">
                Base Body - Standard readable content with optimal line height for healthcare documentation
              </div>
              <div className="text-healthcare-sm text-gray-600">
                Small Body - Secondary information and metadata
              </div>
              <div className="text-healthcare-xs text-gray-500">
                Extra Small - Labels, timestamps, and supplementary information
              </div>
            </CardContent>
          </Card>
        </section>

        {/* SupportSignal Status Badges */}
        <section className="mb-ss-3xl">
          <Card>
            <CardHeader>
              <h2 className="text-header-h2 text-healthcare-primary font-semibold">
                Status Badge Components
              </h2>
              <p className="text-healthcare-base text-gray-600">
                Healthcare workflow status indicators with brand colors
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-ss-md">
                <StatusBadge status="capture_pending" />
                <StatusBadge status="analysis_pending" />
                <StatusBadge status="completed" />
                <StatusBadge status="in_progress" />
                <StatusBadge status="draft" />
                <StatusBadge status="error" />
                <StatusBadge status="warning" />
                <StatusBadge status="success" />
              </div>

              <h3 className="font-semibold text-healthcare-primary mt-ss-lg mb-ss-sm">Variants</h3>
              <div className="flex flex-wrap gap-ss-md">
                <StatusBadge status="completed" variant="default" />
                <StatusBadge status="completed" variant="outline" />
                <StatusBadge status="completed" variant="pill" />
                <StatusBadge status="completed" variant="dot" />
                <StatusBadge status="completed" variant="minimal" />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Healthcare Incident Components */}
        <section className="mb-16">
          <div className="mb-8">
            <h2 className="text-3xl font-semibold text-ss-navy mb-2">
              Healthcare Incident Components
            </h2>
            <p className="text-gray-600">
              Specialized components for NDIS incident management workflows
            </p>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <IncidentCard 
                  incident={{
                    _id: 'incident_123' as any,
                    _creationTime: Date.now(),
                    company_id: 'company_123' as any,
                    reporter_name: 'Sarah Wilson',
                    participant_name: 'John Smith',
                    event_date_time: new Date().toISOString(),
                    location: 'Community Center - Activity Room 2',
                    capture_status: 'in_progress' as const,
                    analysis_status: 'not_started' as const,
                    overall_status: 'capture_pending' as const,
                    created_at: Date.now() - 3600000,
                    created_by: 'user_123' as any,
                    updated_at: Date.now() - 1800000,
                    questions_generated: true,
                    narrative_enhanced: false,
                    analysis_generated: false,
                  }}
                  variant="full"
                  onView={(id) => console.log('View incident:', id)}
                  onEdit={(id) => console.log('Edit incident:', id)}
                />
                <IncidentCard 
                  incident={{
                    _id: 'incident_456' as any,
                    _creationTime: Date.now(),
                    company_id: 'company_123' as any,
                    reporter_name: 'Mike Johnson',
                    participant_name: 'Emma Davis',
                    event_date_time: new Date(Date.now() - 86400000).toISOString(),
                    location: 'Support Group Meeting',
                    capture_status: 'completed' as const,
                    analysis_status: 'completed' as const,
                    overall_status: 'completed' as const,
                    created_at: Date.now() - 172800000,
                    created_by: 'user_456' as any,
                    updated_at: Date.now() - 7200000,
                    questions_generated: true,
                    narrative_enhanced: true,
                    analysis_generated: true,
                  }}
                  variant="compact"
                />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Workflow Progress Component */}
        <section className="mb-16">
          <div className="mb-8">
            <h2 className="text-3xl font-semibold text-ss-navy mb-2">
              Healthcare Workflow Progress
            </h2>
            <p className="text-gray-600">
              Visual progress tracking for incident capture and analysis workflows
            </p>
          </div>

          <Card>
            <CardContent className="p-6">
              <WorkflowProgress 
                incident={{
                  _id: 'incident_789' as any,
                  _creationTime: Date.now(),
                  company_id: 'company_123' as any,
                  reporter_name: 'Lisa Chen',
                  participant_name: 'Alex Thompson',
                  event_date_time: new Date().toISOString(),
                  location: 'Day Program - Art Therapy Room',
                  capture_status: 'in_progress' as const,
                  analysis_status: 'not_started' as const,
                  overall_status: 'capture_pending' as const,
                  created_at: Date.now() - 1800000,
                  created_by: 'user_789' as any,
                  updated_at: Date.now() - 900000,
                  questions_generated: true,
                  narrative_enhanced: false,
                  analysis_generated: false,
                }}
                showStepDetails={true}
                showEstimates={true}
                variant="full"
              />
            </CardContent>
          </Card>
        </section>

        {/* Healthcare Narrative Workflow Components */}
        <section className="mb-16">
          <div className="mb-8">
            <h2 className="text-3xl font-semibold text-ss-navy mb-2">
              Healthcare Narrative Workflow Components
            </h2>
            <p className="text-gray-600">
              Specialized components for managing multi-phase incident narratives with AI enhancement
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Narrative Progress Component */}
            <Card>
              <CardHeader>
                <CardTitle>Narrative Progress Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <NarrativeProgress
                  overallProgress={60}
                  qualityScore={78}
                  totalWordCount={423}
                  targetWordCount={600}
                  estimatedTimeRemaining={12}
                  variant="compact"
                />
              </CardContent>
            </Card>

            {/* Enhancement Indicator Component */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold text-healthcare-primary mb-4">AI Enhancement Indicators</h3>
                
                <EnhancementIndicator 
                  type="enhanced"
                  confidence={92}
                  timestamp={new Date(Date.now() - 300000)}
                  variant="compact"
                />
                
                <EnhancementIndicator 
                  type="processing"
                  variant="compact"
                />
                
                <EnhancementIndicator 
                  type="generated"
                  confidence={87}
                  timestamp={new Date(Date.now() - 600000)}
                  variant="compact"
                />
              </CardContent>
            </Card>

            {/* Auto-save Status Component */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold text-healthcare-primary mb-4">Auto-save Status</h3>
                
                <AutoSaveStatus 
                  status="saved"
                  lastSaved={new Date(Date.now() - 30000)}
                  variant="compact"
                />
                
                <AutoSaveStatus 
                  status="saving"
                  variant="compact"
                />
                
                <AutoSaveStatus 
                  status="error"
                  error="Network connection lost"
                  variant="compact"
                />
              </CardContent>
            </Card>

            {/* Narrative Phase Editor Component */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-healthcare-primary mb-4">Narrative Phase Editor</h3>
                <NarrativePhaseEditor
                  currentPhase="narrative-collection"
                  onPhaseUpdate={() => {}}
                  onPhaseComplete={() => {}}
                  onPhaseSelect={() => {}}
                  variant="minimal"
                  showProgress={true}
                />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Healthcare Analysis Workflow Components */}
        <section className="mb-16">
          <div className="mb-8">
            <h2 className="text-3xl font-semibold text-ss-navy mb-2">
              Healthcare Analysis Workflow Components
            </h2>
            <p className="text-gray-600">
              Specialized components for incident analysis, classification, and workflow management
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Classification Display Component */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-healthcare-primary mb-4">Incident Classification</h3>
                <ClassificationDisplay
                  classification={mockClassification}
                  variant="compact"
                  showDetails={false}
                />
              </CardContent>
            </Card>

            {/* Confidence Indicator Component */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold text-healthcare-primary mb-4">AI Confidence Indicators</h3>
                
                <div className="grid grid-cols-3 gap-4">
                  <ConfidenceIndicator 
                    confidence={92}
                    variant="circular"
                    size="sm"
                    showDetails={false}
                  />
                  <ConfidenceIndicator 
                    confidence={76}
                    variant="circular"
                    size="sm"
                    showDetails={false}
                  />
                  <ConfidenceIndicator 
                    confidence={54}
                    variant="circular"
                    size="sm"
                    showDetails={false}
                  />
                </div>

                <div className="space-y-2">
                  <ConfidenceIndicator 
                    confidence={87}
                    label="Classification Confidence"
                    variant="compact"
                  />
                  <ConfidenceIndicator 
                    confidence={92}
                    label="Risk Assessment"
                    variant="minimal"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Conditions Editor Component */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-healthcare-primary mb-4">Contributing Conditions Editor</h3>
                  <ConditionsEditor
                    conditions={mockConditions}
                    onConditionAdd={() => {}}
                    onConditionEdit={() => {}}
                    onConditionRemove={() => {}}
                    onConditionStatusChange={() => {}}
                    variant="full"
                    readOnly={true}
                    showSuggestions={false}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Analysis Workflow Component */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-healthcare-primary mb-4">Analysis Workflow Management</h3>
                  <AnalysisWorkflow
                    overallStatus="in_progress"
                    onStepStart={() => {}}
                    onStepComplete={() => {}}
                    onStepSkip={() => {}}
                    onStepEdit={() => {}}
                    readOnly={true}
                    showTimestamps={false}
                    variant="full"
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* User & Session Management Components */}
        <section className="mb-16">
          <div className="mb-8">
            <h2 className="text-3xl font-semibold text-ss-navy mb-2">
              User & Session Management Components
            </h2>
            <p className="text-gray-600">
              Comprehensive user management with role-based permissions and session handling
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Profile Component */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-healthcare-primary mb-4">User Profile Display</h3>
                <UserProfile
                  user={mockUserProfile}
                  currentUserId="user_123"
                  onEdit={() => {}}
                  onSettings={() => {}}
                  onViewPermissions={() => {}}
                  variant="compact"
                  showStats={true}
                />
              </CardContent>
            </Card>

            {/* Permission Indicator Component */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-healthcare-primary mb-4">Permission Management</h3>
                <PermissionIndicator
                  userRole="team_lead"
                  permissions={mockPermissions}
                  onPermissionToggle={() => {}}
                  onViewDetails={() => {}}
                  variant="summary"
                  readOnly={true}
                />
              </CardContent>
            </Card>

            {/* Session Status Component */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-healthcare-primary mb-4">Session Management</h3>
                <SessionStatus
                  session={mockSessionInfo}
                  onReconnect={() => {}}
                  onSaveSession={() => {}}
                  onRestoreWorkflow={() => {}}
                  onExtendSession={() => {}}
                  variant="compact"
                  showWorkflowState={true}
                />
              </CardContent>
            </Card>

            {/* Workflow Wizard Component */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-healthcare-primary mb-4">Guided Workflow Process</h3>
                <WorkflowWizard
                  steps={mockWizardSteps}
                  currentStepIndex={1}
                  onStepChange={() => {}}
                  onComplete={() => {}}
                  onStepComplete={() => {}}
                  title="Incident Reporting Wizard"
                  variant="minimal"
                  showProgress={true}
                  showEstimates={true}
                />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Component Import Guide */}
        <section>
          <div className="mb-8">
            <h2 className="text-3xl font-semibold text-ss-navy mb-2">
              Component Import Guide
            </h2>
            <p className="text-gray-600">
              How to import and use SupportSignal components in your code.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Import Statements</CardTitle>
              <CardDescription>
                Copy these import statements to use SupportSignal components in your project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 rounded-md p-4 font-mono text-sm space-y-4">
                <div>
                  <div className="text-gray-600 mb-2">{/* Base UI Components */}</div>
                  <div className="space-y-1">
                    <div className="text-gray-800">
                      <span className="text-blue-600">import</span> {`{ Button }`}{' '}
                      <span className="text-blue-600">from</span>{' '}
                      <span className="text-green-600">
                        &quot;@starter/ui&quot;
                      </span>
                    </div>
                    <div className="text-gray-800">
                      <span className="text-blue-600">import</span>{' '}
                      {`{ Card, CardContent, CardHeader, CardTitle }`}{' '}
                      <span className="text-blue-600">from</span>{' '}
                      <span className="text-green-600">
                        &quot;@starter/ui&quot;
                      </span>
                    </div>
                    <div className="text-gray-800">
                      <span className="text-blue-600">import</span> {`{ Input }`}{' '}
                      <span className="text-blue-600">from</span>{' '}
                      <span className="text-green-600">
                        &quot;@starter/ui&quot;
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="text-gray-600 mb-2">{/* SupportSignal Healthcare Components */}</div>
                  <div className="space-y-1">
                    <div className="text-gray-800">
                      <span className="text-blue-600">import</span> {`{ IncidentCard, MetadataDisplay }`}{' '}
                      <span className="text-blue-600">from</span>{' '}
                      <span className="text-green-600">
                        &quot;@/components/incident&quot;
                      </span>
                    </div>
                    <div className="text-gray-800">
                      <span className="text-blue-600">import</span> {`{ StatusBadge, ActionButton }`}{' '}
                      <span className="text-blue-600">from</span>{' '}
                      <span className="text-green-600">
                        &quot;@/components/shared&quot;
                      </span>
                    </div>
                    <div className="text-gray-800">
                      <span className="text-blue-600">import</span> {`{ WorkflowProgress }`}{' '}
                      <span className="text-blue-600">from</span>{' '}
                      <span className="text-green-600">
                        &quot;@/components/workflow&quot;
                      </span>
                    </div>
                    <div className="text-gray-800">
                      <span className="text-blue-600">import</span> {`{ NarrativePhaseEditor, EnhancementIndicator }`}{' '}
                      <span className="text-blue-600">from</span>{' '}
                      <span className="text-green-600">
                        &quot;@/components/narrative&quot;
                      </span>
                    </div>
                    <div className="text-gray-800">
                      <span className="text-blue-600">import</span> {`{ AutoSaveStatus, NarrativeProgress }`}{' '}
                      <span className="text-blue-600">from</span>{' '}
                      <span className="text-green-600">
                        &quot;@/components/narrative&quot;
                      </span>
                    </div>
                    <div className="text-gray-800">
                      <span className="text-blue-600">import</span> {`{ ConditionsEditor, ClassificationDisplay }`}{' '}
                      <span className="text-blue-600">from</span>{' '}
                      <span className="text-green-600">
                        &quot;@/components/analysis&quot;
                      </span>
                    </div>
                    <div className="text-gray-800">
                      <span className="text-blue-600">import</span> {`{ ConfidenceIndicator, AnalysisWorkflow }`}{' '}
                      <span className="text-blue-600">from</span>{' '}
                      <span className="text-green-600">
                        &quot;@/components/analysis&quot;
                      </span>
                    </div>
                    <div className="text-gray-800">
                      <span className="text-blue-600">import</span> {`{ UserProfile, PermissionIndicator }`}{' '}
                      <span className="text-blue-600">from</span>{' '}
                      <span className="text-green-600">
                        &quot;@/components/user&quot;
                      </span>
                    </div>
                    <div className="text-gray-800">
                      <span className="text-blue-600">import</span> {`{ SessionStatus, WorkflowWizard }`}{' '}
                      <span className="text-blue-600">from</span>{' '}
                      <span className="text-green-600">
                        &quot;@/components/user&quot;
                      </span>
                    </div>
                    <div className="text-gray-800">
                      <span className="text-blue-600">import</span> {`{ LiveStatusIndicator, CollaborationBadge }`}{' '}
                      <span className="text-blue-600">from</span>{' '}
                      <span className="text-green-600">
                        &quot;@/components/realtime&quot;
                      </span>
                    </div>
                    <div className="text-gray-800">
                      <span className="text-blue-600">import</span> {`{ NotificationCenter, RealTimeSubscriptionManager }`}{' '}
                      <span className="text-blue-600">from</span>{' '}
                      <span className="text-green-600">
                        &quot;@/components/realtime&quot;
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
        </main>
      </div>
    </div>
  );
}
