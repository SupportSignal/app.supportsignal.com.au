// @ts-nocheck
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { IncidentSummaryDisplay } from '@/components/incidents/IncidentSummaryDisplay';

// Mock Convex hooks
jest.mock('convex/react', () => ({
  useQuery: jest.fn(),
}));

// Mock auth provider
jest.mock('@/components/auth/auth-provider', () => ({
  useAuth: jest.fn(),
}));

// Mock child components
jest.mock('@/components/incidents/OriginalContentCollapse', () => ({
  OriginalContentCollapse: ({ originalContent, defaultCollapsed }: any) => (
    <div data-testid="original-content-collapse" data-collapsed={defaultCollapsed}>
      Original Content: {JSON.stringify(originalContent)}
    </div>
  ),
}));

jest.mock('@/components/incidents/QADisplayCollapse', () => ({
  QADisplayCollapse: ({ clarificationResponses, defaultCollapsed }: any) => (
    <div data-testid="qa-display-collapse" data-collapsed={defaultCollapsed}>
      Q&A: {clarificationResponses.length} responses
    </div>
  ),
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn((date) => '2 hours ago'),
}));

// Mock UI components
jest.mock('@starter/ui/tabs', () => ({
  Tabs: ({ children, defaultValue, ...props }: any) => (
    <div data-testid="tabs" data-default-value={defaultValue} {...props}>{children}</div>
  ),
  TabsList: ({ children, ...props }: any) => (
    <div data-testid="tabs-list" {...props}>{children}</div>
  ),
  TabsTrigger: ({ children, value, ...props }: any) => (
    <button data-testid={`tab-trigger-${value}`} {...props}>{children}</button>
  ),
  TabsContent: ({ children, value, ...props }: any) => (
    <div data-testid={`tab-content-${value}`} {...props}>{children}</div>
  ),
}));

jest.mock('@starter/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div data-testid="card" {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div data-testid="card-content" {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div data-testid="card-header" {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <div data-testid="card-title" {...props}>{children}</div>,
}));

jest.mock('@starter/ui/badge', () => ({
  Badge: ({ children, variant, ...props }: any) => (
    <span data-testid="badge" data-variant={variant} {...props}>{children}</span>
  ),
}));

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  FileText: () => <span data-testid="file-text">FileText</span>,
  MessageSquare: () => <span data-testid="message-square">MessageSquare</span>,
  Bot: () => <span data-testid="bot">Bot</span>,
  User: () => <span data-testid="user">User</span>,
  Calendar: () => <span data-testid="calendar">Calendar</span>,
  MapPin: () => <span data-testid="map-pin">MapPin</span>,
  Clock: () => <span data-testid="clock">Clock</span>,
}));

describe('IncidentSummaryDisplay', () => {
  const mockIncident = {
    _id: 'test-incident-123',
    participant_name: 'John Doe',
    reporter_name: 'Jane Smith',
    location: 'Community Center',
    event_date_time: 'March 15, 2025 at 2:30 PM',
    capture_status: 'completed',
    enhanced_narrative_id: 'enhanced_123',
    created_at: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
    updated_at: Date.now(),
  };

  const mockEnhancedNarrative = {
    _id: 'enhanced_123',
    incident_id: 'test-incident-123',
    enhanced_content: '**BEFORE EVENT**: Client was calm and engaged.\n\n**DURING EVENT**: Client became agitated.\n\n**ADDITIONAL CLARIFICATIONS**\n\n**Q: What triggered the agitation?**\nA: Loud noise from nearby construction.',
    enhancement_version: 1,
    ai_model: 'claude-3-sonnet',
    processing_time_ms: 1500,
    quality_score: 0.92,
    user_edited: false,
    created_at: Date.now(),
    updated_at: Date.now(),
  };

  const mockNarratives = {
    _id: 'narratives_123',
    incident_id: 'test-incident-123',
    before_event: 'Client was calm and engaged in activities.',
    during_event: 'Client became agitated during group discussion.',
    end_event: 'Client left the room with staff.',
    post_event: 'Client was provided with one-on-one support.',
  };

  const mockClarificationAnswers = [
    {
      _id: 'answer_1',
      incident_id: 'test-incident-123',
      question_text: 'What triggered the agitation?',
      answer_text: 'Loud noise from nearby construction.',
      phase: 'during_event',
    },
    {
      _id: 'answer_2',
      incident_id: 'test-incident-123',
      question_text: 'How long did the support last?',
      answer_text: 'Approximately 15 minutes.',
      phase: 'post_event',
    },
  ];

  const mockUser = {
    sessionToken: 'test-session-token',
    name: 'Test User',
    _id: 'user_123',
  };

  const mockProps = {
    incident_id: 'test-incident-123' as any,
    incident: mockIncident,
    enhancedNarrative: mockEnhancedNarrative,
  };

  beforeEach(() => {
    // Mock useAuth
    const { useAuth } = require('@/components/auth/auth-provider');
    useAuth.mockReturnValue({ user: mockUser });

    // Mock useQuery
    const { useQuery } = require('convex/react');
    useQuery.mockImplementation((queryName: string) => {
      if (queryName.includes('narratives.getByIncidentId')) {
        return mockNarratives;
      }
      if (queryName.includes('clarificationAnswers.listByIncident')) {
        return mockClarificationAnswers;
      }
      return null;
    });

    // Clear previous call history
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render incident summary with complete data', () => {
      render(<IncidentSummaryDisplay {...mockProps} />);

      expect(screen.getByText('Complete Incident Summary')).toBeInTheDocument();
      expect(screen.getByTestId('tabs')).toBeInTheDocument();
      expect(screen.getByTestId('tab-trigger-overview')).toBeInTheDocument();
      expect(screen.getByTestId('tab-trigger-enhanced')).toBeInTheDocument();
      expect(screen.getByTestId('tab-trigger-original')).toBeInTheDocument();
    });

    it('should display incident metadata correctly', () => {
      render(<IncidentSummaryDisplay {...mockProps} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Community Center')).toBeInTheDocument();
      expect(screen.getByText('March 15, 2025 at 2:30 PM')).toBeInTheDocument();
      expect(screen.getByText('2 hours ago')).toBeInTheDocument();
    });

    it('should show proper icons for each section', () => {
      render(<IncidentSummaryDisplay {...mockProps} />);

      expect(screen.getByTestId('user')).toBeInTheDocument(); // Participant
      expect(screen.getByTestId('map-pin')).toBeInTheDocument(); // Location
      expect(screen.getByTestId('calendar')).toBeInTheDocument(); // Date/time
      expect(screen.getByTestId('clock')).toBeInTheDocument(); // Created time
      expect(screen.getByTestId('bot')).toBeInTheDocument(); // AI enhancement
    });

    it('should display enhancement information correctly', () => {
      render(<IncidentSummaryDisplay {...mockProps} />);

      expect(screen.getByText('claude-3-sonnet')).toBeInTheDocument();
      expect(screen.getByText('92%')).toBeInTheDocument(); // Quality score
      expect(screen.getByText('1.5s')).toBeInTheDocument(); // Processing time
      expect(screen.getByText('v1')).toBeInTheDocument(); // Version
    });
  });

  describe('Tab Navigation', () => {
    it('should render all tab triggers', () => {
      render(<IncidentSummaryDisplay {...mockProps} />);

      expect(screen.getByTestId('tab-trigger-overview')).toBeInTheDocument();
      expect(screen.getByTestId('tab-trigger-enhanced')).toBeInTheDocument();
      expect(screen.getByTestId('tab-trigger-original')).toBeInTheDocument();
    });

    it('should set overview as default tab', () => {
      render(<IncidentSummaryDisplay {...mockProps} />);

      expect(screen.getByTestId('tabs')).toHaveAttribute('data-default-value', 'overview');
    });

    it('should display tab content correctly', () => {
      render(<IncidentSummaryDisplay {...mockProps} />);

      expect(screen.getByTestId('tab-content-overview')).toBeInTheDocument();
      expect(screen.getByTestId('tab-content-enhanced')).toBeInTheDocument();
      expect(screen.getByTestId('tab-content-original')).toBeInTheDocument();
    });
  });

  describe('Enhanced Narrative Tab', () => {
    it('should display enhanced content in formatted sections', () => {
      render(<IncidentSummaryDisplay {...mockProps} />);

      expect(screen.getByText(/Client was calm and engaged/)).toBeInTheDocument();
      expect(screen.getByText(/Client became agitated/)).toBeInTheDocument();
    });

    it('should show user edit indicator when narrative was edited', () => {
      const editedNarrative = {
        ...mockEnhancedNarrative,
        user_edited: true,
        enhancement_version: 2,
      };

      const props = {
        ...mockProps,
        enhancedNarrative: editedNarrative,
      };

      render(<IncidentSummaryDisplay {...props} />);

      expect(screen.getByText('User Edited')).toBeInTheDocument();
      expect(screen.getByText('v2')).toBeInTheDocument();
    });

    it('should show AI generated indicator when not user edited', () => {
      render(<IncidentSummaryDisplay {...mockProps} />);

      expect(screen.getByText('AI Generated')).toBeInTheDocument();
      expect(screen.getByText('v1')).toBeInTheDocument();
    });

    it('should handle enhanced content formatting correctly', () => {
      render(<IncidentSummaryDisplay {...mockProps} />);

      // Check for markdown-style formatting preservation
      const enhancedContent = screen.getByText(/\*\*BEFORE EVENT\*\*/);
      expect(enhancedContent).toHaveClass('whitespace-pre-wrap');
    });
  });

  describe('Original Content Tab', () => {
    it('should display original content collapse component', () => {
      render(<IncidentSummaryDisplay {...mockProps} />);

      const originalContentCollapse = screen.getByTestId('original-content-collapse');
      expect(originalContentCollapse).toBeInTheDocument();
      expect(originalContentCollapse).toHaveAttribute('data-collapsed', 'true'); // Default collapsed
    });

    it('should display QA display collapse component', () => {
      render(<IncidentSummaryDisplay {...mockProps} />);

      const qaDisplayCollapse = screen.getByTestId('qa-display-collapse');
      expect(qaDisplayCollapse).toBeInTheDocument();
      expect(qaDisplayCollapse).toHaveAttribute('data-collapsed', 'true'); // Default collapsed
      expect(screen.getByText('Q&A: 2 responses')).toBeInTheDocument();
    });

    it('should pass correct data to collapsible components', () => {
      render(<IncidentSummaryDisplay {...mockProps} />);

      const originalContentText = screen.getByText(/Original Content:/);
      expect(originalContentText).toBeInTheDocument();
      
      const qaText = screen.getByText('Q&A: 2 responses');
      expect(qaText).toBeInTheDocument();
    });
  });

  describe('Data Loading States', () => {
    it('should handle missing narratives gracefully', () => {
      const { useQuery } = require('convex/react');
      useQuery.mockImplementation((queryName: string) => {
        if (queryName.includes('narratives.getByIncidentId')) {
          return null; // No narratives
        }
        if (queryName.includes('clarificationAnswers.listByIncident')) {
          return mockClarificationAnswers;
        }
        return null;
      });

      render(<IncidentSummaryDisplay {...mockProps} />);

      expect(screen.getByText('No original narratives available')).toBeInTheDocument();
    });

    it('should handle missing clarification answers gracefully', () => {
      const { useQuery } = require('convex/react');
      useQuery.mockImplementation((queryName: string) => {
        if (queryName.includes('narratives.getByIncidentId')) {
          return mockNarratives;
        }
        if (queryName.includes('clarificationAnswers.listByIncident')) {
          return []; // No clarification answers
        }
        return null;
      });

      render(<IncidentSummaryDisplay {...mockProps} />);

      expect(screen.getByText('Q&A: 0 responses')).toBeInTheDocument();
    });

    it('should show loading state when data is being fetched', () => {
      const { useQuery } = require('convex/react');
      useQuery.mockReturnValue(null);

      render(<IncidentSummaryDisplay {...mockProps} />);

      expect(screen.getByText('Loading incident details...')).toBeInTheDocument();
    });
  });

  describe('Enhancement Quality Display', () => {
    it('should handle missing quality score gracefully', () => {
      const narrativeWithoutScore = {
        ...mockEnhancedNarrative,
        quality_score: undefined,
      };

      const props = {
        ...mockProps,
        enhancedNarrative: narrativeWithoutScore,
      };

      render(<IncidentSummaryDisplay {...props} />);

      expect(screen.getByText('N/A')).toBeInTheDocument(); // Quality score
    });

    it('should format processing time correctly', () => {
      const narrativeWithLongProcessing = {
        ...mockEnhancedNarrative,
        processing_time_ms: 15000, // 15 seconds
      };

      const props = {
        ...mockProps,
        enhancedNarrative: narrativeWithLongProcessing,
      };

      render(<IncidentSummaryDisplay {...props} />);

      expect(screen.getByText('15.0s')).toBeInTheDocument();
    });

    it('should display different badges for quality scores', () => {
      const highQualityNarrative = {
        ...mockEnhancedNarrative,
        quality_score: 0.95,
      };

      const props = {
        ...mockProps,
        enhancedNarrative: highQualityNarrative,
      };

      render(<IncidentSummaryDisplay {...props} />);

      expect(screen.getByText('95%')).toBeInTheDocument();
      
      const badges = screen.getAllByTestId('badge');
      expect(badges.some(badge => badge.getAttribute('data-variant') === 'default')).toBeTruthy();
    });
  });

  describe('Authentication Handling', () => {
    it('should handle missing authentication gracefully', () => {
      const { useAuth } = require('@/components/auth/auth-provider');
      useAuth.mockReturnValue({ user: null });

      render(<IncidentSummaryDisplay {...mockProps} />);

      // Should skip queries when no user
      const { useQuery } = require('convex/react');
      expect(useQuery).toHaveBeenCalledWith(expect.any(Object), "skip");
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing incident data gracefully', () => {
      const props = {
        ...mockProps,
        incident: null,
      };

      render(<IncidentSummaryDisplay {...props} />);

      expect(screen.getByText('Incident information not available')).toBeInTheDocument();
    });

    it('should handle missing enhanced narrative gracefully', () => {
      const props = {
        ...mockProps,
        enhancedNarrative: null,
      };

      render(<IncidentSummaryDisplay {...props} />);

      expect(screen.getByText('Enhanced narrative not available')).toBeInTheDocument();
    });

    it('should handle incomplete incident metadata', () => {
      const incompleteIncident = {
        ...mockIncident,
        participant_name: undefined,
        location: '',
        reporter_name: null,
      };

      const props = {
        ...mockProps,
        incident: incompleteIncident,
      };

      render(<IncidentSummaryDisplay {...props} />);

      expect(screen.getByText('Not specified')).toBeInTheDocument(); // For missing participant
      expect(screen.getByText('No location specified')).toBeInTheDocument();
      expect(screen.getByText('Not specified')).toBeInTheDocument(); // For missing reporter
    });

    it('should handle very long enhanced content', () => {
      const longNarrative = {
        ...mockEnhancedNarrative,
        enhanced_content: 'A'.repeat(5000),
      };

      const props = {
        ...mockProps,
        enhancedNarrative: longNarrative,
      };

      render(<IncidentSummaryDisplay {...props} />);

      // Should render without issues
      expect(screen.getByTestId('tab-content-enhanced')).toBeInTheDocument();
    });

    it('should handle special characters in content', () => {
      const specialCharNarrative = {
        ...mockEnhancedNarrative,
        enhanced_content: 'Content with "quotes" and <tags> & symbols émojis 🎉',
      };

      const props = {
        ...mockProps,
        enhancedNarrative: specialCharNarrative,
      };

      render(<IncidentSummaryDisplay {...props} />);

      expect(screen.getByText(/Content with "quotes" and <tags> & symbols émojis 🎉/)).toBeInTheDocument();
    });

    it('should handle zero processing time', () => {
      const instantNarrative = {
        ...mockEnhancedNarrative,
        processing_time_ms: 0,
      };

      const props = {
        ...mockProps,
        enhancedNarrative: instantNarrative,
      };

      render(<IncidentSummaryDisplay {...props} />);

      expect(screen.getByText('0.0s')).toBeInTheDocument();
    });

    it('should handle null/undefined AI model', () => {
      const noModelNarrative = {
        ...mockEnhancedNarrative,
        ai_model: undefined,
      };

      const props = {
        ...mockProps,
        enhancedNarrative: noModelNarrative,
      };

      render(<IncidentSummaryDisplay {...props} />);

      expect(screen.getByText('Unknown model')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      render(<IncidentSummaryDisplay {...mockProps} />);

      expect(screen.getByTestId('card-title')).toBeInTheDocument();
      expect(screen.getByTestId('card-content')).toBeInTheDocument();
      expect(screen.getByTestId('tabs')).toBeInTheDocument();
      expect(screen.getByTestId('tabs-list')).toBeInTheDocument();
    });

    it('should have descriptive text for screen readers', () => {
      render(<IncidentSummaryDisplay {...mockProps} />);

      // Check for descriptive labels
      expect(screen.getByText('Participant:')).toBeInTheDocument();
      expect(screen.getByText('Reporter:')).toBeInTheDocument();
      expect(screen.getByText('Location:')).toBeInTheDocument();
      expect(screen.getByText('Date & Time:')).toBeInTheDocument();
    });
  });
});