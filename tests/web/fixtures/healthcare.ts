// @ts-nocheck
import { Permission } from '@/components/user/permission-indicator';
import { UserProfile, UserRole } from '@/components/user/user-profile';
import { SessionInfo, WorkflowState } from '@/components/user/session-status';

/**
 * Healthcare Testing Fixtures
 * 
 * These fixtures provide realistic but anonymized data for testing healthcare
 * and NDIS compliance scenarios. All data is fictional and designed to test
 * privacy, accessibility, and audit requirements.
 */

// Healthcare User Roles with realistic permissions
export const healthcareUserRoles: Record<string, UserRole> = {
  system_admin: {
    id: 'role_001',
    name: 'system_admin',
    label: 'System Administrator',
    permissions: ['system:full', 'company:full', 'incidents:full', 'analysis:full', 'reports:full', 'users:full'],
    color: 'text-purple-700',
  },
  company_admin: {
    id: 'role_002', 
    name: 'company_admin',
    label: 'Company Administrator',
    permissions: ['company:admin', 'incidents:admin', 'analysis:admin', 'reports:admin', 'users:write'],
    color: 'text-blue-700',
  },
  team_lead: {
    id: 'role_003',
    name: 'team_lead', 
    label: 'Team Leader',
    permissions: ['incidents:write', 'analysis:read', 'reports:read', 'users:read'],
    color: 'text-green-700',
  },
  frontline_worker: {
    id: 'role_004',
    name: 'frontline_worker',
    label: 'Frontline Worker',
    permissions: ['incidents:read', 'analysis:read'],
    color: 'text-gray-700',
  },
};

// Realistic Healthcare Permission Sets
export const healthcarePermissions: Record<string, Permission[]> = {
  system_admin: [
    // System permissions (dangerous)
    {
      id: 'perm_001',
      name: 'System Configuration',
      description: 'Modify system settings, security policies, and infrastructure',
      category: 'system',
      level: 'full',
      isGranted: true,
      isDangerous: true,
      inheritedFrom: 'role',
    },
    {
      id: 'perm_002',
      name: 'Database Administration',
      description: 'Direct database access and schema modifications',
      category: 'system', 
      level: 'full',
      isGranted: true,
      isDangerous: true,
      inheritedFrom: 'role',
    },
    // Company permissions
    {
      id: 'perm_003',
      name: 'Company Management',
      description: 'Create, modify, and delete company configurations',
      category: 'company',
      level: 'admin',
      isGranted: true,
      inheritedFrom: 'role',
    },
    // User permissions (dangerous)
    {
      id: 'perm_004',
      name: 'User Account Control',
      description: 'Create, suspend, and delete user accounts across all companies',
      category: 'users',
      level: 'full',
      isGranted: true,
      isDangerous: true,
      inheritedFrom: 'role',
    },
    // Incident permissions
    {
      id: 'perm_005',
      name: 'All Incident Access',
      description: 'View, modify, and delete incidents across all companies',
      category: 'incidents',
      level: 'full',
      isGranted: true,
      inheritedFrom: 'role',
    },
    // Analysis permissions
    {
      id: 'perm_006',
      name: 'System-wide Analytics',
      description: 'Access analytics and trends across all companies and participants',
      category: 'analysis',
      level: 'admin',
      isGranted: true,
      inheritedFrom: 'role',
    },
    // Reports permissions
    {
      id: 'perm_007',
      name: 'Global Reporting',
      description: 'Generate and export reports containing sensitive participant data',
      category: 'reports',
      level: 'admin',
      isGranted: true,
      inheritedFrom: 'role',
    },
  ],
  
  company_admin: [
    // Company permissions
    {
      id: 'perm_008',
      name: 'Company Settings',
      description: 'Modify company configuration and preferences',
      category: 'company',
      level: 'admin',
      isGranted: true,
      inheritedFrom: 'role',
    },
    {
      id: 'perm_009',
      name: 'Staff Management',
      description: 'Manage company staff accounts and permissions',
      category: 'users',
      level: 'write',
      isGranted: true,
      inheritedFrom: 'role',
    },
    // Incident permissions
    {
      id: 'perm_010',
      name: 'Company Incident Management',
      description: 'Full access to incidents within company boundaries',
      category: 'incidents',
      level: 'admin',
      isGranted: true,
      inheritedFrom: 'role',
    },
    // Analysis permissions
    {
      id: 'perm_011',
      name: 'Company Analytics',
      description: 'Access analytics for company participants and trends',
      category: 'analysis',
      level: 'admin',
      isGranted: true,
      inheritedFrom: 'role',
    },
    // Reports permissions
    {
      id: 'perm_012',
      name: 'Company Reporting',
      description: 'Generate company-level reports with participant data',
      category: 'reports',
      level: 'admin',
      isGranted: true,
      inheritedFrom: 'role',
    },
    // System permissions (limited)
    {
      id: 'perm_013',
      name: 'System Status View',
      description: 'View system health and status information',
      category: 'system',
      level: 'read',
      isGranted: true,
      inheritedFrom: 'role',
    },
  ],
  
  team_lead: [
    // User permissions (limited)
    {
      id: 'perm_014',
      name: 'Team Member Viewing',
      description: 'View team member profiles and basic information',
      category: 'users',
      level: 'read',
      isGranted: true,
      inheritedFrom: 'role',
    },
    // Incident permissions
    {
      id: 'perm_015',
      name: 'Team Incident Management',
      description: 'Manage incidents assigned to team members',
      category: 'incidents',
      level: 'write',
      isGranted: true,
      inheritedFrom: 'role',
    },
    {
      id: 'perm_016',
      name: 'Incident Assignment',
      description: 'Assign incidents to team members for resolution',
      category: 'incidents',
      level: 'write',
      isGranted: true,
      inheritedFrom: 'role',
    },
    // Analysis permissions (limited)
    {
      id: 'perm_017',
      name: 'Team Performance Analytics',
      description: 'View analytics for team performance and outcomes',
      category: 'analysis',
      level: 'read',
      isGranted: true,
      inheritedFrom: 'role',
    },
    // Reports permissions (limited)
    {
      id: 'perm_018',
      name: 'Team Reporting',
      description: 'Generate reports for team activities and outcomes',
      category: 'reports',
      level: 'read',
      isGranted: true,
      inheritedFrom: 'role',
    },
    // Company permissions (denied)
    {
      id: 'perm_019',
      name: 'Company Configuration',
      description: 'Modify company-wide settings and policies',
      category: 'company',
      level: 'admin',
      isGranted: false,
      inheritedFrom: 'role',
    },
    // System permissions (denied)
    {
      id: 'perm_020',
      name: 'System Administration',
      description: 'Access system-level configuration and management',
      category: 'system',
      level: 'admin',
      isGranted: false,
      isDangerous: true,
      inheritedFrom: 'role',
    },
  ],
  
  frontline_worker: [
    // Incident permissions (limited)
    {
      id: 'perm_021',
      name: 'Incident Reporting',
      description: 'Create and submit new incident reports',
      category: 'incidents',
      level: 'write',
      isGranted: true,
      inheritedFrom: 'role',
    },
    {
      id: 'perm_022',
      name: 'Assigned Incident Access',
      description: 'View and update incidents assigned to this worker',
      category: 'incidents',
      level: 'read',
      isGranted: true,
      inheritedFrom: 'role',
    },
    // Analysis permissions (very limited)
    {
      id: 'perm_023',
      name: 'Personal Performance View',
      description: 'View own performance metrics and feedback',
      category: 'analysis',
      level: 'read',
      isGranted: true,
      inheritedFrom: 'role',
    },
    // Denied permissions - many restrictions for frontline workers
    {
      id: 'perm_024',
      name: 'All Incident Access',
      description: 'View incidents not assigned to this worker',
      category: 'incidents',
      level: 'admin',
      isGranted: false,
      inheritedFrom: 'role',
    },
    {
      id: 'perm_025',
      name: 'User Management',
      description: 'View or manage other user accounts',
      category: 'users',
      level: 'read',
      isGranted: false,
      inheritedFrom: 'role',
    },
    {
      id: 'perm_026',
      name: 'Company Analytics',
      description: 'View company-wide performance and trends',
      category: 'analysis',
      level: 'admin',
      isGranted: false,
      inheritedFrom: 'role',
    },
    {
      id: 'perm_027',
      name: 'Report Generation',
      description: 'Generate reports containing participant data',
      category: 'reports',
      level: 'write',
      isGranted: false,
      inheritedFrom: 'role',
    },
    {
      id: 'perm_028',
      name: 'Company Configuration',
      description: 'Modify company settings or policies',
      category: 'company',
      level: 'write',
      isGranted: false,
      inheritedFrom: 'role',
    },
    {
      id: 'perm_029',
      name: 'System Access',
      description: 'Access system administration features',
      category: 'system',
      level: 'read',
      isGranted: false,
      isDangerous: true,
      inheritedFrom: 'role',
    },
  ],
};

// Healthcare User Profiles
export const healthcareUserProfiles: Record<string, UserProfile> = {
  system_admin: {
    id: 'user_001',
    name: 'Dr. Sarah Mitchell',
    email: 'sarah.mitchell@healthsystem.com.au',
    phone: '+61 2 9555 0123',
    avatar: undefined, // Testing without avatar
    role: healthcareUserRoles.system_admin,
    company: {
      id: 'company_001',
      name: 'Metropolitan Healthcare Systems',
    },
    department: 'Information Technology',
    title: 'Chief Information Security Officer',
    location: 'Sydney, NSW',
    joinedAt: new Date('2020-03-15'),
    lastActive: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    isOnline: true,
    stats: {
      incidentsReported: 12,
      incidentsAnalyzed: 847,
      averageResponseTime: 15,
      completionRate: 98,
    },
    preferences: {
      emailNotifications: true,
      smsNotifications: false,
      darkMode: true,
      language: 'en-AU',
    },
  },
  
  company_admin: {
    id: 'user_002', 
    name: 'Mark Thompson',
    email: 'mark.thompson@citycare.org.au',
    phone: '+61 3 8555 0456',
    avatar: undefined,
    role: healthcareUserRoles.company_admin,
    company: {
      id: 'company_002',
      name: 'CityCare NDIS Services',
    },
    department: 'Operations',
    title: 'Operations Director',
    location: 'Melbourne, VIC',
    joinedAt: new Date('2021-07-10'),
    lastActive: new Date(Date.now() - 25 * 60 * 1000), // 25 minutes ago
    isOnline: false,
    stats: {
      incidentsReported: 67,
      incidentsAnalyzed: 423,
      averageResponseTime: 28,
      completionRate: 94,
    },
    preferences: {
      emailNotifications: true,
      smsNotifications: true,
      darkMode: false,
      language: 'en-AU',
    },
  },
  
  team_lead: {
    id: 'user_003',
    name: 'Jennifer Wu',
    email: 'jennifer.wu@citycare.org.au',
    phone: '+61 3 8555 0789',
    avatar: undefined,
    role: healthcareUserRoles.team_lead,
    company: {
      id: 'company_002',
      name: 'CityCare NDIS Services',
    },
    department: 'Support Coordination',
    title: 'Senior Support Coordinator',
    location: 'Melbourne, VIC',
    joinedAt: new Date('2022-01-20'),
    lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    isOnline: false,
    stats: {
      incidentsReported: 134,
      incidentsAnalyzed: 89,
      averageResponseTime: 45,
      completionRate: 91,
    },
    preferences: {
      emailNotifications: true,
      smsNotifications: false,
      darkMode: false,
      language: 'en-AU',
    },
  },
  
  frontline_worker: {
    id: 'user_004',
    name: 'David Chen',
    email: 'david.chen@citycare.org.au',
    phone: '+61 3 8555 0321',
    avatar: undefined,
    role: healthcareUserRoles.frontline_worker,
    company: {
      id: 'company_002',
      name: 'CityCare NDIS Services',
    },
    department: 'Direct Support',
    title: 'Support Worker',
    location: 'Melbourne, VIC',
    joinedAt: new Date('2023-05-08'),
    lastActive: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
    isOnline: true,
    stats: {
      incidentsReported: 89,
      incidentsAnalyzed: 12,
      averageResponseTime: 67,
      completionRate: 87,
    },
    preferences: {
      emailNotifications: false,
      smsNotifications: true,
      darkMode: false,
      language: 'en-AU',
    },
  },
};

// Healthcare Session Information
export const healthcareSessionInfo: Record<string, SessionInfo> = {
  active_connected: {
    id: 'session_001',
    userId: 'user_002',
    startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    lastActivity: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    isActive: true,
    connectionStatus: 'connected',
    workflowState: {
      incidentId: 'incident_123',
      currentStep: 'incident-analysis',
      stepData: {
        participantId: 'participant_456',
        analysisType: 'safety-review',
        priority: 'high',
      },
      lastSaved: new Date(Date.now() - 3 * 60 * 1000), // 3 minutes ago
      autoSaveEnabled: true,
      unsavedChanges: true,
    },
    deviceInfo: {
      browser: 'Chrome 120.0.6099.109',
      os: 'Windows 11',
      ip: '10.0.2.45',
    },
    permissions: ['incidents:write', 'analysis:read', 'reports:read'],
    expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
    warningThreshold: 30, // 30 minutes
  },
  
  disconnected_recovering: {
    id: 'session_002',
    userId: 'user_003',
    startTime: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    lastActivity: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    isActive: false,
    connectionStatus: 'reconnecting',
    workflowState: {
      incidentId: 'incident_789',
      currentStep: 'participant-contact',
      stepData: {
        participantId: 'participant_789',
        contactType: 'follow-up',
        urgency: 'medium',
      },
      lastSaved: new Date(Date.now() - 20 * 60 * 1000), // 20 minutes ago
      autoSaveEnabled: false,
      unsavedChanges: true,
    },
    deviceInfo: {
      browser: 'Safari 17.1',
      os: 'macOS Sonoma',
      ip: '10.0.3.12',
    },
    permissions: ['incidents:write', 'analysis:read'],
    expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    warningThreshold: 30,
  },
  
  expiring_soon: {
    id: 'session_003',
    userId: 'user_004',
    startTime: new Date(Date.now() - 7 * 60 * 60 * 1000), // 7 hours ago
    lastActivity: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
    isActive: true,
    connectionStatus: 'connected',
    workflowState: undefined, // No active workflow
    deviceInfo: {
      browser: 'Firefox 121.0',
      os: 'Ubuntu 22.04',
      ip: '10.0.1.78',
    },
    permissions: ['incidents:read'],
    expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
    warningThreshold: 30,
  },
  
  expired_session: {
    id: 'session_004', 
    userId: 'user_001',
    startTime: new Date(Date.now() - 10 * 60 * 60 * 1000), // 10 hours ago
    lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    isActive: false,
    connectionStatus: 'error',
    workflowState: {
      incidentId: 'incident_001',
      currentStep: 'system-maintenance',
      stepData: {
        maintenanceType: 'security-update',
        systemArea: 'authentication',
      },
      lastSaved: new Date(Date.now() - 2.5 * 60 * 60 * 1000), // 2.5 hours ago
      autoSaveEnabled: true,
      unsavedChanges: false,
    },
    deviceInfo: {
      browser: 'Chrome 120.0.6099.62',
      os: 'Windows 11',
      ip: '10.0.4.201',
    },
    permissions: ['system:full', 'company:full'],
    expiresAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago (expired)
    warningThreshold: 30,
  },
};

// Mock Participant Data for Testing (anonymized)
export const mockParticipantData = {
  participant_001: {
    _id: 'participant_001',
    first_name: 'Alex',
    last_name: 'Williams', 
    ndis_number: 'NDIS123456789',
    date_of_birth: '1995-07-15',
    support_level: 'medium',
    status: 'active',
    contact_phone: '+61 3 8555 9876',
    emergency_contact: 'Sarah Williams: +61 3 8555 9877',
    care_notes: 'Requires assistance with daily living activities. Regular check-ins every Tuesday and Friday.',
    updated_at: new Date('2024-01-15T10:30:00Z').toISOString(),
  },
  
  participant_002: {
    _id: 'participant_002',
    first_name: 'Jamie',
    last_name: 'Park',
    ndis_number: 'NDIS987654321', 
    date_of_birth: '1988-12-03',
    support_level: 'high',
    status: 'active',
    contact_phone: '+61 2 9555 1234',
    emergency_contact: 'Dr. Kim Park: +61 2 9555 1235',
    care_notes: 'Complex care needs. Medical equipment required for mobility. Weekly physiotherapy appointments.',
    updated_at: new Date('2024-01-20T14:15:00Z').toISOString(),
  },
  
  participant_003: {
    _id: 'participant_003',
    first_name: 'Taylor',
    last_name: 'Johnson',
    ndis_number: 'NDIS456789123',
    date_of_birth: '2001-03-28',
    support_level: 'low',
    status: 'inactive',
    contact_phone: undefined, // Testing optional fields
    emergency_contact: 'Maria Johnson: +61 7 3555 4567',
    care_notes: undefined, // Testing optional fields
    updated_at: new Date('2023-11-08T09:45:00Z').toISOString(),
  },
};

// Healthcare Testing Utilities
export const healthcareTestUtils = {
  /**
   * Create a user profile for testing with specific role
   */
  createUserProfile: (roleType: keyof typeof healthcareUserRoles, overrides: Partial<UserProfile> = {}): UserProfile => {
    const baseProfile = healthcareUserProfiles[roleType];
    return {
      ...baseProfile,
      ...overrides,
      id: overrides.id || `test_user_${Date.now()}`,
    };
  },

  /**
   * Create permissions array for testing specific scenarios
   */
  createPermissions: (roleType: keyof typeof healthcarePermissions, overrides: Partial<Permission>[] = []): Permission[] => {
    const basePermissions = [...healthcarePermissions[roleType]];
    
    // Apply overrides
    overrides.forEach(override => {
      const index = basePermissions.findIndex(p => p.id === override.id);
      if (index >= 0) {
        basePermissions[index] = { ...basePermissions[index], ...override };
      }
    });
    
    return basePermissions;
  },

  /**
   * Create session info for testing various connection states
   */
  createSessionInfo: (
    connectionStatus: SessionInfo['connectionStatus'], 
    overrides: Partial<SessionInfo> = {}
  ): SessionInfo => {
    const baseSession = healthcareSessionInfo.active_connected;
    return {
      ...baseSession,
      connectionStatus,
      ...overrides,
      id: overrides.id || `test_session_${Date.now()}`,
    };
  },

  /**
   * Create mock participant data for testing
   */
  createParticipant: (overrides: any = {}) => {
    const baseParticipant = mockParticipantData.participant_001;
    return {
      ...baseParticipant,
      ...overrides,
      _id: overrides._id || `test_participant_${Date.now()}`,
    };
  },

  /**
   * Healthcare compliance test helpers
   */
  compliance: {
    /**
     * Check if sensitive data is properly masked in test outputs
     */
    isSensitiveDataMasked: (output: string): boolean => {
      // Check for NDIS numbers, full names, phone numbers, etc.
      const sensitivePatterns = [
        /NDIS\d{9}/, // Full NDIS numbers
        /\+61\s?\d+\s?\d{4}\s?\d{4}/, // Full phone numbers
        /\d{2}\/\d{2}\/\d{4}/, // Full dates of birth
      ];
      
      return !sensitivePatterns.some(pattern => pattern.test(output));
    },

    /**
     * Validate accessibility attributes are present
     */
    hasAccessibilityAttributes: (element: any): boolean => {
      // Check for ARIA labels, roles, etc.
      return element.getAttribute('role') || 
             element.getAttribute('aria-label') ||
             element.getAttribute('aria-labelledby') ||
             element.getAttribute('aria-describedby');
    },

    /**
     * Check audit trail requirements
     */
    hasAuditTrail: (actionData: any): boolean => {
      return actionData.timestamp && 
             actionData.userId &&
             actionData.action &&
             actionData.correlationId;
    },
  },
};

// Mock Incident Data for UI Component Testing
export const mockIncidentData = {
  basic_incident: {
    _id: 'incident_001',
    participant_name: 'Alex Williams',
    reporter_name: 'Jennifer Wu',
    event_date_time: '2024-01-15T14:30:00Z',
    location: 'Community Center - Activity Room',
    overall_status: 'capture_pending' as const,
    capture_status: 'draft' as const,
    analysis_status: 'not_started' as const,
    company_id: 'company_002',
    created_at: Date.now() - (2 * 60 * 60 * 1000), // 2 hours ago
    updated_at: Date.now() - (30 * 60 * 1000), // 30 minutes ago
    narrative_enhanced: false,
    questions_generated: false,
    analysis_generated: false,
    narrative_hash: 'hash_incident_001_narrative',
  },

  completed_incident: {
    _id: 'incident_002', 
    participant_name: 'Jamie Park',
    reporter_name: 'David Chen',
    event_date_time: '2024-01-10T09:15:00Z',
    location: 'Participant Home - Living Room',
    overall_status: 'completed' as const,
    capture_status: 'completed' as const,
    analysis_status: 'completed' as const,
    company_id: 'company_002',
    created_at: Date.now() - (5 * 24 * 60 * 60 * 1000), // 5 days ago
    updated_at: Date.now() - (1 * 24 * 60 * 60 * 1000), // 1 day ago
    narrative_enhanced: true,
    questions_generated: true,
    analysis_generated: true,
    narrative_hash: 'hash_incident_002_narrative_enhanced',
  },

  analysis_pending_incident: {
    _id: 'incident_003',
    participant_name: 'Taylor Johnson',
    reporter_name: 'Mark Thompson',
    event_date_time: '2024-01-18T16:45:00Z', 
    location: 'NDIS Office - Meeting Room B',
    overall_status: 'analysis_pending' as const,
    capture_status: 'completed' as const,
    analysis_status: 'in_progress' as const,
    company_id: 'company_001',
    created_at: Date.now() - (6 * 60 * 60 * 1000), // 6 hours ago
    updated_at: Date.now() - (1 * 60 * 60 * 1000), // 1 hour ago
    narrative_enhanced: true,
    questions_generated: true,
    analysis_generated: false,
    narrative_hash: 'hash_incident_003_narrative_captured',
  },

  urgent_incident: {
    _id: 'incident_004',
    participant_name: 'Morgan Smith',
    reporter_name: 'Dr. Sarah Mitchell',
    event_date_time: '2024-01-20T08:00:00Z',
    location: 'Healthcare Facility - Emergency Department',
    overall_status: 'capture_pending' as const,
    capture_status: 'in_progress' as const,
    analysis_status: 'not_started' as const,
    company_id: 'company_001',
    created_at: Date.now() - (30 * 60 * 1000), // 30 minutes ago
    updated_at: Date.now() - (5 * 60 * 1000), // 5 minutes ago
    narrative_enhanced: false,
    questions_generated: false,
    analysis_generated: false,
    narrative_hash: undefined,
  },

  long_location_incident: {
    _id: 'incident_005',
    participant_name: 'Casey Davis',
    reporter_name: 'Jennifer Wu',
    event_date_time: '2024-01-12T13:20:00Z',
    location: 'Metropolitan Healthcare Systems - Rehabilitation Center - Physical Therapy Wing - Room 245A',
    overall_status: 'analysis_pending' as const,
    capture_status: 'completed' as const,
    analysis_status: 'not_started' as const,
    company_id: 'company_001',
    created_at: Date.now() - (3 * 24 * 60 * 60 * 1000), // 3 days ago
    updated_at: Date.now() - (2 * 24 * 60 * 60 * 1000), // 2 days ago
    narrative_enhanced: true,
    questions_generated: true,
    analysis_generated: false,
    narrative_hash: 'hash_incident_005_long_location',
  },
};

// Healthcare Component Testing Utilities
export const healthcareComponentTestUtils = {
  /**
   * Create incident data for testing with specific variations
   */
  createIncidentData: (baseIncident: keyof typeof mockIncidentData, overrides: any = {}) => {
    const base = mockIncidentData[baseIncident];
    return {
      ...base,
      ...overrides,
      _id: overrides._id || `test_incident_${Date.now()}`,
    };
  },

  /**
   * Create various incident status combinations for testing
   */
  createStatusVariations: () => {
    const variations = [];
    const overallStatuses = ['capture_pending', 'analysis_pending', 'completed'] as const;
    const captureStatuses = ['draft', 'in_progress', 'completed'] as const;
    const analysisStatuses = ['not_started', 'in_progress', 'completed'] as const;

    overallStatuses.forEach(overall => {
      captureStatuses.forEach(capture => {
        analysisStatuses.forEach(analysis => {
          // Only create logical combinations
          const isLogical = 
            (overall === 'capture_pending' && capture !== 'completed') ||
            (overall === 'analysis_pending' && capture === 'completed' && analysis !== 'completed') ||
            (overall === 'completed' && capture === 'completed' && analysis === 'completed');

          if (isLogical) {
            variations.push({
              overall_status: overall,
              capture_status: capture,
              analysis_status: analysis,
            });
          }
        });
      });
    });

    return variations;
  },

  /**
   * Create test incidents for different user roles and permissions
   */
  createRoleBasedIncidents: () => {
    return {
      system_admin_incident: healthcareComponentTestUtils.createIncidentData('basic_incident', {
        reporter_name: 'Dr. Sarah Mitchell',
        company_id: 'company_001',
      }),
      company_admin_incident: healthcareComponentTestUtils.createIncidentData('analysis_pending_incident', {
        reporter_name: 'Mark Thompson',
        company_id: 'company_002',
      }),
      team_lead_incident: healthcareComponentTestUtils.createIncidentData('completed_incident', {
        reporter_name: 'Jennifer Wu',
        company_id: 'company_002',
      }),
      frontline_worker_incident: healthcareComponentTestUtils.createIncidentData('urgent_incident', {
        reporter_name: 'David Chen',
        company_id: 'company_002',
      }),
    };
  },

  /**
   * Generate incidents with different time scenarios
   */
  createTimeBasedIncidents: () => {
    const now = Date.now();
    return {
      recent_incident: healthcareComponentTestUtils.createIncidentData('basic_incident', {
        created_at: now - (10 * 60 * 1000), // 10 minutes ago
        updated_at: now - (5 * 60 * 1000), // 5 minutes ago
      }),
      today_incident: healthcareComponentTestUtils.createIncidentData('analysis_pending_incident', {
        created_at: now - (4 * 60 * 60 * 1000), // 4 hours ago
        updated_at: now - (1 * 60 * 60 * 1000), // 1 hour ago
      }),
      yesterday_incident: healthcareComponentTestUtils.createIncidentData('completed_incident', {
        created_at: now - (25 * 60 * 60 * 1000), // 25 hours ago (yesterday)
        updated_at: now - (20 * 60 * 60 * 1000), // 20 hours ago
      }),
      week_old_incident: healthcareComponentTestUtils.createIncidentData('completed_incident', {
        created_at: now - (5 * 24 * 60 * 60 * 1000), // 5 days ago
        updated_at: now - (3 * 24 * 60 * 60 * 1000), // 3 days ago
      }),
    };
  },

  /**
   * Create AI enhancement variation scenarios
   */
  createAIEnhancementVariations: () => {
    return [
      { narrative_enhanced: false, questions_generated: false, analysis_generated: false },
      { narrative_enhanced: true, questions_generated: false, analysis_generated: false },
      { narrative_enhanced: true, questions_generated: true, analysis_generated: false },
      { narrative_enhanced: true, questions_generated: true, analysis_generated: true },
      { narrative_enhanced: false, questions_generated: true, analysis_generated: false }, // Edge case
    ];
  },
};

export default {
  healthcareUserRoles,
  healthcarePermissions,
  healthcareUserProfiles,
  healthcareSessionInfo,
  mockParticipantData,
  healthcareTestUtils,
  mockIncidentData,
  healthcareComponentTestUtils,
};