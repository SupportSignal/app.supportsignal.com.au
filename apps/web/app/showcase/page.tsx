// @ts-nocheck
'use client';

import React, { useState } from 'react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@starter/ui/dropdown-menu';
import { TestTube, ChevronDown } from 'lucide-react';
import { ThemeToggle } from '../../components/theme/theme-toggle';
import { AdminPageHeader } from '@/components/layout/admin-page-header';
import { IncidentCard, MetadataDisplay } from '@/components/incident';
import { StatusBadge } from '@/components/shared';
import { NarrativePhaseEditor, EnhancementIndicator, NarrativeProgress } from '@/components/narrative';
import { AutoSaveIndicator } from '@/components/ui/auto-save-indicator';
import { useAutoSave } from '@/hooks/useAutoSave';
import { ConditionsEditor, ClassificationDisplay, ConfidenceIndicator, AnalysisWorkflow } from '@/components/analysis';
import { UserProfile, PermissionIndicator, SessionStatus, WorkflowWizard } from '@/components/user';
import { LiveStatusIndicator, CollaborationBadge, NotificationCenter, RealTimeSubscriptionManager } from '@/components/realtime';
import { AutoSaveDemo } from '@/components/demo/auto-save-demo';

// Sample Data Definitions for Showcase Playground
const sampleParticipants = [
  {
    first_name: 'Emma',
    last_name: 'Johnson',
    ndis_number: 'NDIS12345001',
    support_level: 'medium',
  },
  {
    first_name: 'Michael',
    last_name: 'Chen',
    ndis_number: 'NDIS12345002',
    support_level: 'high',
  },
  {
    first_name: 'Sarah',
    last_name: 'Williams',
    ndis_number: 'NDIS12345003',
    support_level: 'low',
  },
  {
    first_name: 'James',
    last_name: 'Brown',
    ndis_number: 'NDIS12345004',
    support_level: 'medium',
  },
  {
    first_name: 'Rachel',
    last_name: 'Davis',
    ndis_number: 'NDIS12345005',
    support_level: 'high',
  }
];

const getRecentDate = (daysAgo: number, hour: number, minute: number = 0) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString().slice(0, 16);
};

const incidentScenarios = [
  {
    id: 'medication_error',
    icon: '💊',
    participant_name: 'Emma Johnson',
    reporter_name: 'Staff Member',
    event_date_time: getRecentDate(0, 14, 30),
    location: 'Participant\'s residence - Kitchen area',
    severity: 'medium',
    tags: ['medication', 'administration', 'oversight', 'monitoring'],
    description: 'Medication administration error with monitoring protocol',
    narratives: {
      before_event: 'Emma was scheduled to receive her afternoon medications at 2:30 PM as per her medication chart. The support worker arrived at 2:25 PM and began preparing medications. Emma was in the living room watching television and appeared in good spirits.',
      during_event: 'At 2:30 PM, the support worker administered what they believed to be Emma\'s prescribed Paracetamol 500mg. However, upon checking the medication chart immediately after administration, they realized they had given Emma two tablets instead of the prescribed one tablet.',
      end_event: 'The medication error was identified within 2 minutes of administration. Emma showed no immediate adverse reactions - her vital signs appeared normal, she was alert and responsive, and complained of no symptoms.',
      post_event: 'The on-call nurse advised monitoring Emma for the next 4 hours for any signs of overdose symptoms. Emma remained stable throughout the monitoring period. A review of medication procedures has been scheduled.'
    }
  },
  {
    id: 'injury',
    icon: '🩹',
    participant_name: 'Michael Chen',
    reporter_name: 'Support Coordinator',
    event_date_time: getRecentDate(1, 16, 45),
    location: 'Community center - Main activity hall',
    severity: 'high',
    tags: ['fall', 'head_injury', 'transfer', 'wheelchair', 'hospital'],
    description: 'Participant fall with head injury requiring hospital assessment',
    narratives: {
      before_event: 'Michael was attending his weekly social group activity at the community center. He had arrived at 3:00 PM in his wheelchair, transported by community transport. Michael was in good spirits and excited about the craft activity planned for the session.',
      during_event: 'At approximately 4:45 PM, Michael attempted to transfer from his wheelchair to a regular chair to participate in the craft activity. Despite staff assistance and following the transfer procedure, Michael lost his balance during the transfer and fell backward, hitting his head on the corner of a nearby table.',
      end_event: 'Michael was immediately assessed by the first aid qualified staff member. He remained conscious and alert but had a visible bump on the back of his head and complained of headache. Michael was kept still while emergency services were called at 4:50 PM.',
      post_event: 'Ambulance arrived at 5:10 PM. Michael was transported to the hospital for assessment and CT scan. The scan showed no serious injury, but he was advised to rest and monitor for concussion symptoms. Michael returned home that evening with instructions for 24-hour observation.'
    }
  },
  {
    id: 'behavioral',
    icon: '😤',
    participant_name: 'Sarah Williams',
    reporter_name: 'Team Leader',
    event_date_time: getRecentDate(2, 10, 15),
    location: 'Day program center - Group room 2',
    severity: 'medium',
    tags: ['verbal_aggression', 'de-escalation', 'sleep_issues', 'behavior_support'],
    description: 'Verbal aggression incident with de-escalation response',
    narratives: {
      before_event: 'Sarah arrived at the day program at 9:00 AM as usual. She seemed slightly agitated during the morning greeting but participated in the breakfast routine. Sarah mentioned she had difficulty sleeping the previous night and was feeling tired.',
      during_event: 'During the group discussion at 10:15 AM, Sarah became increasingly agitated when another participant disagreed with her weekend suggestion. Sarah raised her voice and began using inappropriate language directed at the other participant and staff.',
      end_event: 'Staff implemented the de-escalation protocol, removing other participants from the immediate area and speaking calmly to Sarah. After approximately 10 minutes, Sarah began to calm down. She was offered the opportunity to take a break in a quiet space.',
      post_event: 'Sarah spent 30 minutes in the quiet room with a support worker, using breathing techniques to calm down. She was then able to rejoin the group for the next activity. A behavior support meeting was scheduled for the following week.'
    }
  },
  {
    id: 'environmental',
    icon: '🚰',
    participant_name: 'James Brown',
    reporter_name: 'Facility Manager',
    event_date_time: getRecentDate(3, 7, 30),
    location: 'Supported accommodation - Unit 3B bathroom',
    severity: 'medium',
    tags: ['water_damage', 'maintenance', 'relocation', 'routine_disruption'],
    description: 'Water pipe burst causing accommodation disruption',
    narratives: {
      before_event: 'James was getting ready for his morning routine in his supported accommodation unit. The overnight support worker had completed the shift handover and noted everything was normal. James had slept well and was looking forward to attending his job placement.',
      during_event: 'At 7:30 AM, a pipe burst in the bathroom wall while James was getting ready. Water began flowing rapidly from behind the toilet, flooding the bathroom floor and beginning to spread into the bedroom area. James immediately called for help.',
      end_event: 'The support worker immediately turned off the water supply at the main valve and called maintenance services. James was moved to the living area to ensure his safety while the water was contained. No injuries occurred, but James was distressed about his routine being disrupted.',
      post_event: 'Emergency maintenance arrived within 45 minutes and repaired the burst pipe. Professional cleaning services were arranged to address the water damage. James was relocated to a temporary unit for 24 hours while repairs were completed.'
    }
  },
  {
    id: 'medical_emergency',
    icon: '🚨',
    participant_name: 'Rachel Davis',
    reporter_name: 'Support Worker',
    event_date_time: getRecentDate(1, 19, 20),
    location: 'Participant\'s home - Living room',
    severity: 'high',
    tags: ['seizure', 'epilepsy', 'medication', 'monitoring', 'medical_protocol'],
    description: 'Seizure incident with established medical protocols',
    narratives: {
      before_event: 'Rachel was having dinner at home with her support worker present. She had eaten well and was in good spirits, discussing plans for the weekend. Rachel has a history of epilepsy but her seizures have been well-controlled with medication for the past 6 months.',
      during_event: 'At 7:20 PM, while watching television, Rachel suddenly experienced a tonic-clonic seizure. The support worker immediately implemented the seizure management protocol, ensuring Rachel\'s safety by clearing the area and placing her in the recovery position.',
      end_event: 'The seizure ended at 7:23 PM. Rachel remained unconscious for 2 minutes post-seizure, which is typical for her seizure pattern. She gradually regained consciousness and was confused but responsive. The support worker continued to monitor her vital signs.',
      post_event: 'The support worker contacted Rachel\'s on-call doctor at 7:30 PM to report the seizure. As this was Rachel\'s first seizure in 6 months, the doctor advised monitoring but no immediate hospital visit was required. Rachel\'s seizure log was updated and her neurologist was notified.'
    }
  }
];

const severityColors = {
  low: 'text-green-600 bg-green-100',
  medium: 'text-yellow-600 bg-yellow-100',
  high: 'text-red-600 bg-red-100',
};

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

// Working Sample Data Playground Component
function SampleDataPlayground() {
  // Pattern 1: Simple Button State
  const [participantFields, setParticipantFields] = useState({
    first_name: '',
    last_name: '',
    ndis_number: ''
  });

  // Pattern 2: Random Selection State  
  const [incidentMetadata, setIncidentMetadata] = useState({
    reporter_name: '',
    participant_name: '',
    location: '',
    event_date_time: ''
  });

  // Pattern 3: Rich Dropdown State
  const [narrativeSections, setNarrativeSections] = useState({
    before_event: '',
    during_event: '',
    end_event: '',
    post_event: ''
  });
  const [selectedScenario, setSelectedScenario] = useState(null);

  // Pattern 1: Load Sample Participants (bulk creation simulation)
  const handleLoadParticipants = () => {
    // Simulate loading the first participant for display
    const firstParticipant = sampleParticipants[0];
    setParticipantFields({
      first_name: firstParticipant.first_name,
      last_name: firstParticipant.last_name,
      ndis_number: firstParticipant.ndis_number
    });
  };

  // Pattern 2: Random Sample Selection
  const handleRandomSample = () => {
    const randomScenario = incidentScenarios[Math.floor(Math.random() * incidentScenarios.length)];
    setIncidentMetadata({
      reporter_name: randomScenario.reporter_name,
      participant_name: randomScenario.participant_name,
      location: randomScenario.location,
      event_date_time: randomScenario.event_date_time
    });
  };

  // Pattern 3: Rich Dropdown Selection
  const handleScenarioSelect = (scenario) => {
    setSelectedScenario(scenario);
    setNarrativeSections({
      before_event: scenario.narratives.before_event,
      during_event: scenario.narratives.during_event,
      end_event: scenario.narratives.end_event,
      post_event: scenario.narratives.post_event
    });
  };

  const clearAllData = () => {
    setParticipantFields({ first_name: '', last_name: '', ndis_number: '' });
    setIncidentMetadata({ reporter_name: '', participant_name: '', location: '', event_date_time: '' });
    setNarrativeSections({ before_event: '', during_event: '', end_event: '', post_event: '' });
    setSelectedScenario(null);
  };

  return (
    <section className="mb-16">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-ss-navy mb-2">
              Sample Data UI Patterns - Working Playground
            </h2>
            <p className="text-gray-600">
              Interactive sample data loading patterns with real functionality for evaluation and testing
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={clearAllData}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            🗑️ Clear All Data
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Pattern 1: Simple Button (Working) */}
        <Card>
          <CardHeader>
            <CardTitle>Pattern 1: Simple Load Button</CardTitle>
            <CardDescription>
              Basic sample data loading (participants page pattern)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-200">
              <p className="text-sm text-gray-600 mb-3">Participant form fields:</p>
              <div className="space-y-2">
                <Input 
                  placeholder="First Name" 
                  value={participantFields.first_name}
                  onChange={(e) => setParticipantFields(prev => ({ ...prev, first_name: e.target.value }))}
                  className="bg-white" 
                />
                <Input 
                  placeholder="Last Name" 
                  value={participantFields.last_name}
                  onChange={(e) => setParticipantFields(prev => ({ ...prev, last_name: e.target.value }))}
                  className="bg-white" 
                />
                <Input 
                  placeholder="NDIS Number" 
                  value={participantFields.ndis_number}
                  onChange={(e) => setParticipantFields(prev => ({ ...prev, ndis_number: e.target.value }))}
                  className="bg-white" 
                />
              </div>
            </div>
            
            {/* Preferred Style: Underlined with teal hover effect */}
            <Button 
              variant="ghost"
              size="sm"
              className="w-full text-xs text-gray-500 hover:text-white hover:bg-ss-teal border-b border-dashed border-gray-300 rounded-none hover:border-ss-teal transition-all duration-200"
              onClick={handleLoadParticipants}
            >
              Load Sample Data
            </Button>
            
            <div className="text-xs text-gray-500 space-y-1 bg-blue-50 p-2 rounded">
              <div><strong>Simulates:</strong> Creating 5 participants, showing first one</div>
              <div><strong>Real Use:</strong> Bulk backend creation with database insertion</div>
              <div><strong>Best For:</strong> Initial system setup, testing data creation</div>
            </div>
          </CardContent>
        </Card>

        {/* Pattern 2: Random Selection (Working) */}
        <Card>
          <CardHeader>
            <CardTitle>Pattern 2: Random Sample Button</CardTitle>
            <CardDescription>
              Random selection from array (incident step 1 pattern)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-200">
              <p className="text-sm text-gray-600 mb-3">Incident metadata fields:</p>
              <div className="grid grid-cols-2 gap-2">
                <Input 
                  placeholder="Reporter Name" 
                  value={incidentMetadata.reporter_name}
                  onChange={(e) => setIncidentMetadata(prev => ({ ...prev, reporter_name: e.target.value }))}
                  className="bg-white text-xs" 
                />
                <Input 
                  placeholder="Participant" 
                  value={incidentMetadata.participant_name}
                  onChange={(e) => setIncidentMetadata(prev => ({ ...prev, participant_name: e.target.value }))}
                  className="bg-white text-xs" 
                />
                <Input 
                  placeholder="Location" 
                  value={incidentMetadata.location}
                  onChange={(e) => setIncidentMetadata(prev => ({ ...prev, location: e.target.value }))}
                  className="bg-white text-xs" 
                />
                <Input 
                  placeholder="Date/Time" 
                  type="datetime-local"
                  value={incidentMetadata.event_date_time}
                  onChange={(e) => setIncidentMetadata(prev => ({ ...prev, event_date_time: e.target.value }))}
                  className="bg-white text-xs" 
                />
              </div>
            </div>
            
            {/* Preferred Style: Underlined with teal hover effect */}
            <Button 
              variant="ghost"
              size="sm"
              className="w-full text-xs text-gray-500 hover:text-white hover:bg-ss-teal border-b border-dashed border-gray-300 rounded-none hover:border-ss-teal transition-all duration-200"
              onClick={handleRandomSample}
            >
              Random Sample
            </Button>
            
            <div className="text-xs text-gray-500 space-y-1 bg-yellow-50 p-2 rounded">
              <div><strong>Pattern:</strong> Quick random data for fast form testing</div>
              <div><strong>Real Use:</strong> Development workflow, QA testing</div>
              <div><strong>Best For:</strong> Rapid iteration, form validation testing</div>
            </div>
          </CardContent>
        </Card>

        {/* Pattern 3: Rich Dropdown (Working) */}
        <Card>
          <CardHeader>
            <CardTitle>Pattern 3: Rich Dropdown Selection</CardTitle>
            <CardDescription>
              User choice with preview (incident step 2 pattern)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-200">
              <p className="text-sm text-gray-600 mb-3">Narrative form sections:</p>
              <div className="grid grid-cols-2 gap-2">
                <textarea 
                  placeholder="Before Event..." 
                  value={narrativeSections.before_event}
                  onChange={(e) => setNarrativeSections(prev => ({ ...prev, before_event: e.target.value }))}
                  className="h-16 p-2 bg-white border rounded text-xs resize-none"
                />
                <textarea 
                  placeholder="During Event..." 
                  value={narrativeSections.during_event}
                  onChange={(e) => setNarrativeSections(prev => ({ ...prev, during_event: e.target.value }))}
                  className="h-16 p-2 bg-white border rounded text-xs resize-none"
                />
                <textarea 
                  placeholder="End Event..." 
                  value={narrativeSections.end_event}
                  onChange={(e) => setNarrativeSections(prev => ({ ...prev, end_event: e.target.value }))}
                  className="h-16 p-2 bg-white border rounded text-xs resize-none"
                />
                <textarea 
                  placeholder="Post Event..." 
                  value={narrativeSections.post_event}
                  onChange={(e) => setNarrativeSections(prev => ({ ...prev, post_event: e.target.value }))}
                  className="h-16 p-2 bg-white border rounded text-xs resize-none"
                />
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                {/* Preferred Style: Underlined with teal hover effect */}
                <Button 
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between text-left text-xs text-gray-500 hover:text-white hover:bg-ss-teal border-b border-dashed border-gray-300 rounded-none hover:border-ss-teal transition-all duration-200"
                >
                  <div className="flex items-center gap-2">
                    <span>
                      {selectedScenario ? `${selectedScenario.icon} ${selectedScenario.participant_name}` : 'Sample Scenarios'}
                    </span>
                  </div>
                  <ChevronDown className="h-3 w-3 opacity-60" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-96">
                <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
                  Fill Narrative with Sample Scenario
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {incidentScenarios.map((scenario) => (
                  <DropdownMenuItem
                    key={scenario.id}
                    onClick={() => handleScenarioSelect(scenario)}
                    className="flex flex-col items-start p-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <span className="text-base">{scenario.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{scenario.participant_name}</span>
                          <span className={`text-xs font-medium px-2 py-1 rounded ${severityColors[scenario.severity]}`}>
                            {scenario.severity}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
                          {scenario.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mt-2 w-full">
                      {scenario.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-block bg-muted px-1.5 py-0.5 rounded text-xs text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {selectedScenario && (
              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs">
                <div className="flex items-center gap-2 mb-2">
                  <span>{selectedScenario.icon}</span>
                  <span className="font-medium">{selectedScenario.participant_name} - {selectedScenario.id.replace('_', ' ')}</span>
                  <span className={`px-2 py-1 rounded text-xs ${severityColors[selectedScenario.severity]}`}>
                    {selectedScenario.severity}
                  </span>
                </div>
                <div className="text-gray-600 mb-2">{selectedScenario.description}</div>
                <div className="flex flex-wrap gap-1">
                  {selectedScenario.tags.map((tag) => (
                    <span key={tag} className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{tag}</span>
                  ))}
                </div>
              </div>
            )}
            
            <div className="text-xs text-gray-500 space-y-1 bg-green-50 p-2 rounded">
              <div><strong>Pattern:</strong> Rich selection with detailed preview</div>
              <div><strong>Real Use:</strong> Training scenarios, demo presentations</div>
              <div><strong>Best For:</strong> Educational content, informed decision making</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pattern Analysis */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Design Pattern Analysis - Live Comparison</CardTitle>
          <CardDescription>
            Evaluate each pattern by testing them above, then use this analysis for implementation decisions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold text-healthcare-primary mb-3">Pattern Strengths</h4>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="font-medium text-ss-teal">Simple Button</div>
                  <div className="text-gray-600">• Fastest for bulk operations<br/>• No decision fatigue<br/>• Clear single action</div>
                </div>
                <div>
                  <div className="font-medium text-ss-cta-blue">Random Selection</div>
                  <div className="text-gray-600">• Good for quick testing<br/>• Lightweight implementation<br/>• Variety without choice</div>
                </div>
                <div>
                  <div className="font-medium text-ss-navy">Rich Dropdown</div>
                  <div className="text-gray-600">• Informed decisions<br/>• Rich context display<br/>• Professional appearance</div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-healthcare-primary mb-3">Use Case Mapping</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Bulk data setup:</span>
                  <span className="font-medium text-ss-teal">Simple Button</span>
                </div>
                <div className="flex justify-between">
                  <span>Quick testing:</span>
                  <span className="font-medium text-ss-cta-blue">Random Selection</span>
                </div>
                <div className="flex justify-between">
                  <span>Demo scenarios:</span>
                  <span className="font-medium text-ss-navy">Rich Dropdown</span>
                </div>
                <div className="flex justify-between">
                  <span>Form filling:</span>
                  <span className="font-medium text-ss-cta-blue">Random/Dropdown</span>
                </div>
                <div className="flex justify-between">
                  <span>Training/Education:</span>
                  <span className="font-medium text-ss-navy">Rich Dropdown</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-healthcare-primary mb-3">Unified Approach</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Recommendation:</strong> Context-driven pattern selection</p>
                <p>• <strong>Management pages:</strong> Simple buttons for bulk operations</p>
                <p>• <strong>Form fields:</strong> Dropdown with preview for specific selection</p>
                <p>• <strong>Quick actions:</strong> Random selection for rapid testing</p>
                <p>• <strong>Implementation:</strong> Single unified component with variant prop</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Button Style Variations */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Sample Data Button Style Variations</CardTitle>
          <CardDescription>
            Administrative/testing buttons that should be subtle and non-distracting to customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Row 1 */}
            {/* Preferred Style: Underlined with teal hover */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-center">Preferred Style</h4>
              <Button 
                variant="ghost"
                size="sm"
                className="w-full text-xs text-gray-500 hover:text-white hover:bg-ss-teal border-b border-dashed border-gray-300 rounded-none hover:border-ss-teal transition-all duration-200"
              >
                Sample Data
              </Button>
              <p className="text-xs text-gray-500 text-center">Underlined + teal hover</p>
            </div>

            {/* Variation 1: Ghost with subtle badge - CURRENT IMPLEMENTATION */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-center">1. Subtle Badge</h4>
              <Button 
                variant="ghost"
                size="sm"
                className="w-full text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 border border-dashed border-gray-200 hover:border-gray-300"
              >
                <span className="w-2 h-2 bg-blue-400 rounded-full mr-2 opacity-60"></span>
                Sample Data
              </Button>
              <p className="text-xs text-gray-500 text-center">Current implementation - very subtle</p>
            </div>

            {/* Variation 2: Minimal icon corner */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-center">2. Corner Icon</h4>
              <div className="relative">
                <Button 
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                >
                  Sample Data
                </Button>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full opacity-50"></span>
              </div>
              <p className="text-xs text-gray-500 text-center">Small indicator in corner</p>
            </div>

            {/* Variation 3: Underlined text style */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-center">3. Underlined</h4>
              <Button 
                variant="ghost"
                size="sm"
                className="w-full text-xs text-gray-400 hover:text-gray-600 border-b border-dashed border-gray-300 rounded-none hover:border-gray-400"
              >
                Sample Data
              </Button>
              <p className="text-xs text-gray-500 text-center">Underlined link style</p>
            </div>

            {/* Row 2 - Visual break */}
            <div className="md:col-span-3 border-t border-gray-200 my-2"></div>

            {/* Variation 4: Faded with opacity */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-center">4. Opacity</h4>
              <Button 
                variant="outline"
                size="sm"
                className="w-full text-xs opacity-30 hover:opacity-70 border-gray-200 text-gray-500"
              >
                Sample Data
              </Button>
              <p className="text-xs text-gray-500 text-center">Low opacity, hover reveals</p>
            </div>

            {/* Variation 5: Text-only with icon */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-center">5. Text Only</h4>
              <button 
                className="w-full text-xs text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-50 rounded transition-colors"
              >
                ⚡ Sample Data
              </button>
              <p className="text-xs text-gray-500 text-center">Plain text with subtle icon</p>
            </div>

          </div>

          {/* Usage Context */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Design Context</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <p><strong>Purpose:</strong> Administrative/testing buttons for system admins, testers, sales reps</p>
              <p><strong>Visibility:</strong> Should be subtle, non-distracting to customers</p>
              <p><strong>Discovery:</strong> Known to authorized users, minimal visual interference</p>
              <p><strong>Behavior:</strong> Quick access without drawing attention</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

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

        <main className="max-w-7xl mx-auto">
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
              <WorkflowWizard
                steps={[
                  {
                    id: 'incident-reported',
                    title: 'Incident Reported',
                    description: 'Basic incident details captured',
                    isComplete: true,
                    estimatedTime: 2
                  },
                  {
                    id: 'narrative-collection',
                    title: 'Narrative Collection',
                    description: 'Multi-phase incident narrative',
                    isComplete: true,
                    estimatedTime: 12
                  },
                  {
                    id: 'ai-questions',
                    title: 'AI Questions',
                    description: 'Clarification questions generated',
                    isComplete: true,
                    estimatedTime: 1
                  },
                  {
                    id: 'ai-enhancement',
                    title: 'AI Enhancement',
                    description: 'Narrative enhanced with AI',
                    isComplete: false,
                    estimatedTime: 2
                  },
                  {
                    id: 'analysis-phase',
                    title: 'Analysis Phase',
                    description: 'Team lead analysis begins',
                    isComplete: false,
                    estimatedTime: 8
                  }
                ]}
                currentStepIndex={3}
                onStepChange={() => {}}
                onComplete={() => {}}
                onStepComplete={() => {}}
                title="Healthcare Workflow Progress"
                description="Visual progress tracking for incident capture and analysis workflows"
                readonly={true}
                showEstimates={true}
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
              <CardContent className="p-6 space-y-6">
                <h3 className="font-semibold text-healthcare-primary mb-4">Auto-save System</h3>
                
                {/* Interactive Demo */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-medium mb-3">Interactive Demo</h4>
                  <AutoSaveDemo />
                </div>
                
                {/* Static Examples */}
                <div className="space-y-3">
                  <h4 className="font-medium">Visual Variants</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border rounded p-3">
                      <p className="text-sm font-medium mb-2">Status Bar</p>
                      <AutoSaveIndicator 
                        autoSaveState={{
                          isSaving: false,
                          lastSaveTime: new Date(Date.now() - 30000),
                          error: null,
                          hasUnsavedChanges: false,
                        }}
                        variant="status-bar" 
                      />
                    </div>
                    
                    <div className="border rounded p-3">
                      <p className="text-sm font-medium mb-2">Saving State</p>
                      <AutoSaveIndicator 
                        autoSaveState={{
                          isSaving: true,
                          lastSaveTime: null,
                          error: null,
                          hasUnsavedChanges: true,
                        }}
                        variant="inline" 
                      />
                    </div>
                    
                    <div className="border rounded p-3">
                      <p className="text-sm font-medium mb-2">Error State</p>
                      <AutoSaveIndicator 
                        autoSaveState={{
                          isSaving: false,
                          lastSaveTime: null,
                          error: "Network error",
                          hasUnsavedChanges: false,
                        }}
                        variant="badge" 
                      />
                    </div>
                  </div>
                </div>
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
                  readonly={true}
                  showProgress={true}
                  showEstimates={true}
                />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Sample Data UI Patterns - Working Playground */}
        <SampleDataPlayground />

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
                      <span className="text-blue-600">import</span> {`{ WorkflowWizard }`}{' '}
                      <span className="text-blue-600">from</span>{' '}
                      <span className="text-green-600">
                        &quot;@/components/user&quot;
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
                      <span className="text-blue-600">import</span> {`{ AutoSaveIndicator, NarrativeProgress }`}{' '}
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
