// @ts-nocheck
/**
 * Test fixtures for NDIS Participants Management testing
 * Comprehensive test data for all participant management scenarios
 */

import { Id } from 'convex/_generated/dataModel';

export const mockUsers = {
  systemAdmin: {
    _id: 'user_system_admin_123' as Id<"users">,
    name: 'System Admin',
    email: 'system.admin@supportsignal.com.au',
    role: 'system_admin' as const,
    company_id: 'company_support_signal_123' as Id<"companies">,
    _creationTime: 1703123456789,
  },
  companyAdmin: {
    _id: 'user_company_admin_456' as Id<"users">,
    name: 'Company Admin',
    email: 'admin@ndisprovider.com.au',
    role: 'company_admin' as const,
    company_id: 'company_ndis_provider_456' as Id<"companies">,
    _creationTime: 1703123456790,
  },
  teamLead: {
    _id: 'user_team_lead_789' as Id<"users">,
    name: 'Team Lead',
    email: 'team.lead@ndisprovider.com.au',
    role: 'team_lead' as const,
    company_id: 'company_ndis_provider_456' as Id<"companies">,
    _creationTime: 1703123456791,
  },
  frontlineWorker: {
    _id: 'user_frontline_worker_101' as Id<"users">,
    name: 'Frontline Worker',
    email: 'worker@ndisprovider.com.au',
    role: 'frontline_worker' as const,
    company_id: 'company_ndis_provider_456' as Id<"companies">,
    _creationTime: 1703123456792,
  },
  // User from different company for multi-tenant testing
  differentCompanyUser: {
    _id: 'user_different_company_202' as Id<"users">,
    name: 'Different Company Admin',
    email: 'admin@anotherndisprovider.com.au',
    role: 'company_admin' as const,
    company_id: 'company_another_ndis_789' as Id<"companies">,
    _creationTime: 1703123456793,
  },
  // User without company association (for error testing)
  noCompanyUser: {
    _id: 'user_no_company_303' as Id<"users">,
    name: 'No Company User',
    email: 'no.company@test.com',
    role: 'frontline_worker' as const,
    company_id: undefined,
    _creationTime: 1703123456794,
  },
};

export const mockCompanies = {
  supportSignal: {
    _id: 'company_support_signal_123' as Id<"companies">,
    name: 'Support Signal',
    slug: 'support-signal',
    contact_email: 'contact@supportsignal.com.au',
    status: 'active' as const,
    created_at: 1703123456789,
    _creationTime: 1703123456789,
  },
  ndisProvider: {
    _id: 'company_ndis_provider_456' as Id<"companies">,
    name: 'NDIS Provider Co',
    slug: 'ndis-provider-co',
    contact_email: 'contact@ndisprovider.com.au',
    status: 'active' as const,
    created_at: 1703123456790,
    _creationTime: 1703123456790,
  },
  anotherNdisProvider: {
    _id: 'company_another_ndis_789' as Id<"companies">,
    name: 'Another NDIS Provider',
    slug: 'another-ndis-provider',
    contact_email: 'contact@anotherndisprovider.com.au',
    status: 'active' as const,
    created_at: 1703123456791,
    _creationTime: 1703123456791,
  },
};

export const mockParticipants = {
  johnDoe: {
    _id: 'participant_john_doe_001' as Id<"participants">,
    company_id: mockCompanies.ndisProvider._id,
    first_name: 'John',
    last_name: 'Doe',
    date_of_birth: '1990-05-15',
    ndis_number: '123456789',
    contact_phone: '+61 2 1234 5678',
    emergency_contact: 'Jane Doe - Mother - +61 2 8765 4321',
    support_level: 'medium' as const,
    care_notes: 'Requires assistance with daily activities and social interactions.',
    status: 'active' as const,
    created_at: 1703123456789,
    created_by: mockUsers.teamLead._id,
    updated_at: 1703123456789,
    updated_by: mockUsers.teamLead._id,
    _creationTime: 1703123456789,
  },
  janeDoe: {
    _id: 'participant_jane_doe_002' as Id<"participants">,
    company_id: mockCompanies.ndisProvider._id,
    first_name: 'Jane',
    last_name: 'Doe',
    date_of_birth: '1985-12-03',
    ndis_number: '987654321',
    contact_phone: '+61 3 9876 5432',
    emergency_contact: 'Robert Doe - Partner - +61 3 5432 1987',
    support_level: 'high' as const,
    care_notes: 'Requires intensive support. Has mobility restrictions and communication needs.',
    status: 'active' as const,
    created_at: 1703123456790,
    created_by: mockUsers.companyAdmin._id,
    updated_at: 1703123456790,
    updated_by: mockUsers.companyAdmin._id,
    _creationTime: 1703123456790,
  },
  bobSmith: {
    _id: 'participant_bob_smith_003' as Id<"participants">,
    company_id: mockCompanies.ndisProvider._id,
    first_name: 'Bob',
    last_name: 'Smith',
    date_of_birth: '1978-08-22',
    ndis_number: '456789123',
    contact_phone: undefined, // Optional field test
    emergency_contact: undefined, // Optional field test
    support_level: 'low' as const,
    care_notes: undefined, // Optional field test
    status: 'inactive' as const,
    created_at: 1703123456791,
    created_by: mockUsers.teamLead._id,
    updated_at: 1703123456800,
    updated_by: mockUsers.companyAdmin._id,
    _creationTime: 1703123456791,
  },
  // Participant for different company (multi-tenant testing)
  aliceWilson: {
    _id: 'participant_alice_wilson_004' as Id<"participants">,
    company_id: mockCompanies.anotherNdisProvider._id,
    first_name: 'Alice',
    last_name: 'Wilson',
    date_of_birth: '1992-11-10',
    ndis_number: '789123456',
    contact_phone: '+61 7 1111 2222',
    emergency_contact: 'Tom Wilson - Brother - +61 7 3333 4444',
    support_level: 'medium' as const,
    care_notes: 'Requires support with transportation and appointments.',
    status: 'active' as const,
    created_at: 1703123456792,
    created_by: mockUsers.differentCompanyUser._id,
    updated_at: 1703123456792,
    updated_by: mockUsers.differentCompanyUser._id,
    _creationTime: 1703123456792,
  },
  // Discharged participant for status testing
  dischargedParticipant: {
    _id: 'participant_discharged_005' as Id<"participants">,
    company_id: mockCompanies.ndisProvider._id,
    first_name: 'Charlie',
    last_name: 'Brown',
    date_of_birth: '1970-03-15',
    ndis_number: '321654987',
    contact_phone: '+61 8 9999 8888',
    emergency_contact: 'Lucy Brown - Sister - +61 8 7777 6666',
    support_level: 'low' as const,
    care_notes: 'Was receiving minimal support services.',
    status: 'discharged' as const,
    created_at: 1703123456793,
    created_by: mockUsers.teamLead._id,
    updated_at: 1703123456810,
    updated_by: mockUsers.companyAdmin._id,
    _creationTime: 1703123456793,
  },
};

export const mockSessions = {
  systemAdminSession: {
    _id: 'session_system_admin_123' as Id<"sessions">,
    userId: mockUsers.systemAdmin._id,
    sessionToken: 'test_session_token_system_admin_123456789',
    expires: Date.now() + 1000 * 60 * 60 * 24, // 24 hours from now
    rememberMe: false,
    _creationTime: Date.now(),
  },
  companyAdminSession: {
    _id: 'session_company_admin_456' as Id<"sessions">,
    userId: mockUsers.companyAdmin._id,
    sessionToken: 'test_session_token_company_admin_456789123',
    expires: Date.now() + 1000 * 60 * 60 * 24,
    rememberMe: false,
    _creationTime: Date.now(),
  },
  teamLeadSession: {
    _id: 'session_team_lead_789' as Id<"sessions">,
    userId: mockUsers.teamLead._id,
    sessionToken: 'test_session_token_team_lead_789123456',
    expires: Date.now() + 1000 * 60 * 60 * 24,
    rememberMe: false,
    _creationTime: Date.now(),
  },
  frontlineWorkerSession: {
    _id: 'session_frontline_worker_101' as Id<"sessions">,
    userId: mockUsers.frontlineWorker._id,
    sessionToken: 'test_session_token_frontline_worker_101234567',
    expires: Date.now() + 1000 * 60 * 60 * 24,
    rememberMe: false,
    _creationTime: Date.now(),
  },
  differentCompanySession: {
    _id: 'session_different_company_202' as Id<"sessions">,
    userId: mockUsers.differentCompanyUser._id,
    sessionToken: 'test_session_token_different_company_202345678',
    expires: Date.now() + 1000 * 60 * 60 * 24,
    rememberMe: false,
    _creationTime: Date.now(),
  },
  noCompanySession: {
    _id: 'session_no_company_303' as Id<"sessions">,
    userId: mockUsers.noCompanyUser._id,
    sessionToken: 'test_session_token_no_company_303456789',
    expires: Date.now() + 1000 * 60 * 60 * 24,
    rememberMe: false,
    _creationTime: Date.now(),
  },
  // Expired session for testing
  expiredSession: {
    _id: 'session_expired_404' as Id<"sessions">,
    userId: mockUsers.teamLead._id,
    sessionToken: 'test_session_token_expired_404567890',
    expires: Date.now() - 1000 * 60 * 60, // 1 hour ago
    rememberMe: false,
    _creationTime: Date.now() - 1000 * 60 * 60 * 25, // 25 hours ago
  },
};

export const validParticipantData = {
  minimal: {
    first_name: 'Test',
    last_name: 'Participant',
    date_of_birth: '1995-06-20',
    ndis_number: '111222333',
    support_level: 'medium' as const,
  },
  complete: {
    first_name: 'Complete',
    last_name: 'Test',
    date_of_birth: '1988-09-12',
    ndis_number: '444555666',
    contact_phone: '+61 2 1111 2222',
    emergency_contact: 'Emergency Contact - Relation - +61 2 3333 4444',
    support_level: 'high' as const,
    care_notes: 'Comprehensive care notes for testing purposes.',
  },
  lowSupport: {
    first_name: 'Low',
    last_name: 'Support',
    date_of_birth: '2000-01-01',
    ndis_number: '777888999',
    support_level: 'low' as const,
  },
};

export const invalidParticipantData = {
  shortFirstName: {
    first_name: 'X', // Too short
    last_name: 'Valid',
    date_of_birth: '1990-01-01',
    ndis_number: '123456789',
    support_level: 'medium' as const,
  },
  longFirstName: {
    first_name: 'A'.repeat(51), // Too long
    last_name: 'Valid',
    date_of_birth: '1990-01-01',
    ndis_number: '123456789',
    support_level: 'medium' as const,
  },
  shortLastName: {
    first_name: 'Valid',
    last_name: 'Y', // Too short
    date_of_birth: '1990-01-01',
    ndis_number: '123456789',
    support_level: 'medium' as const,
  },
  invalidNdisNumber: {
    first_name: 'Valid',
    last_name: 'Valid',
    date_of_birth: '1990-01-01',
    ndis_number: '12345678', // Too short
    support_level: 'medium' as const,
  },
  nonNumericNdisNumber: {
    first_name: 'Valid',
    last_name: 'Valid',
    date_of_birth: '1990-01-01',
    ndis_number: '12345678A', // Contains letter
    support_level: 'medium' as const,
  },
  futureDateOfBirth: {
    first_name: 'Valid',
    last_name: 'Valid',
    date_of_birth: '2030-01-01', // Future date
    ndis_number: '123456789',
    support_level: 'medium' as const,
  },
  invalidDateOfBirth: {
    first_name: 'Valid',
    last_name: 'Valid',
    date_of_birth: 'invalid-date',
    ndis_number: '123456789',
    support_level: 'medium' as const,
  },
  invalidPhoneNumber: {
    first_name: 'Valid',
    last_name: 'Valid',
    date_of_birth: '1990-01-01',
    ndis_number: '123456789',
    contact_phone: 'abc-def-ghij', // Invalid format
    support_level: 'medium' as const,
  },
  longCareNotes: {
    first_name: 'Valid',
    last_name: 'Valid',
    date_of_birth: '1990-01-01',
    ndis_number: '123456789',
    care_notes: 'A'.repeat(501), // Too long
    support_level: 'medium' as const,
  },
};

export const searchTestData = {
  // Test data for search functionality
  participants: [
    {
      ...mockParticipants.johnDoe,
      _id: 'search_john_001' as Id<"participants">,
      first_name: 'John',
      last_name: 'Smith',
      ndis_number: '111111111',
    },
    {
      ...mockParticipants.janeDoe,
      _id: 'search_jane_002' as Id<"participants">,
      first_name: 'Jane',
      last_name: 'Johnson',
      ndis_number: '222222222',
    },
    {
      ...mockParticipants.bobSmith,
      _id: 'search_bob_003' as Id<"participants">,
      first_name: 'Robert',
      last_name: 'Smith',
      ndis_number: '333333333',
    },
    {
      ...mockParticipants.johnDoe,
      _id: 'search_alice_004' as Id<"participants">,
      first_name: 'Alice',
      last_name: 'Brown',
      ndis_number: '444444444',
      date_of_birth: '2000-01-01', // Younger for age range testing
    },
  ],
};

export const updateTestData = {
  validUpdate: {
    first_name: 'Updated First',
    last_name: 'Updated Last',
    contact_phone: '+61 2 9999 8888',
    support_level: 'high' as const,
  },
  partialUpdate: {
    contact_phone: '+61 3 7777 6666',
    care_notes: 'Updated care notes only.',
  },
  statusUpdate: {
    status: 'inactive' as const,
  },
  invalidUpdate: {
    first_name: 'X', // Too short
    ndis_number: '12345', // Invalid format
  },
};

export const permissionTestScenarios = {
  // Test scenarios for role-based access control
  createParticipant: {
    allowed: ['system_admin', 'company_admin', 'team_lead'],
    denied: ['frontline_worker'],
  },
  updateParticipant: {
    allowed: ['system_admin', 'company_admin', 'team_lead'],
    denied: ['frontline_worker'],
  },
  updateParticipantStatus: {
    allowed: ['system_admin', 'company_admin', 'team_lead'],
    denied: ['frontline_worker'],
  },
  viewParticipant: {
    allowed: ['system_admin', 'company_admin', 'team_lead', 'frontline_worker'],
    denied: [],
  },
  listParticipants: {
    allowed: ['system_admin', 'company_admin', 'team_lead', 'frontline_worker'],
    denied: [],
  },
  searchParticipants: {
    allowed: ['system_admin', 'company_admin', 'team_lead', 'frontline_worker'],
    denied: [],
  },
};

export const multiTenantTestData = {
  // Test data for multi-tenant isolation
  companyA: {
    company: mockCompanies.ndisProvider,
    users: [mockUsers.companyAdmin, mockUsers.teamLead, mockUsers.frontlineWorker],
    participants: [mockParticipants.johnDoe, mockParticipants.janeDoe, mockParticipants.bobSmith],
    sessions: [mockSessions.companyAdminSession, mockSessions.teamLeadSession, mockSessions.frontlineWorkerSession],
  },
  companyB: {
    company: mockCompanies.anotherNdisProvider,
    users: [mockUsers.differentCompanyUser],
    participants: [mockParticipants.aliceWilson],
    sessions: [mockSessions.differentCompanySession],
  },
};

// Helper functions for test data creation
export const createMockParticipant = (overrides: Partial<typeof mockParticipants.johnDoe> = {}) => ({
  ...mockParticipants.johnDoe,
  ...overrides,
});

export const createMockUser = (overrides: Partial<typeof mockUsers.teamLead> = {}) => ({
  ...mockUsers.teamLead,
  ...overrides,
});

export const createMockSession = (overrides: Partial<typeof mockSessions.teamLeadSession> = {}) => ({
  ...mockSessions.teamLeadSession,
  ...overrides,
});

// Age calculation test data
export const ageTestData = [
  {
    dateOfBirth: '1990-01-01',
    referenceDate: new Date('2024-01-01'),
    expectedYears: 34,
    expectedMonths: 0,
  },
  {
    dateOfBirth: '1990-06-15',
    referenceDate: new Date('2024-01-01'),
    expectedYears: 33,
    expectedMonths: 6,
  },
  {
    dateOfBirth: '2000-12-25',
    referenceDate: new Date('2024-01-01'),
    expectedYears: 23,
    expectedMonths: 0,
  },
];