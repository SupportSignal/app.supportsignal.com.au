// @ts-nocheck
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { QADisplayCollapse } from '@/components/incidents/QADisplayCollapse';

// Mock UI components
jest.mock('@starter/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div data-testid="card" {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div data-testid="card-content" {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div data-testid="card-header" {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <div data-testid="card-title" {...props}>{children}</div>,
}));

jest.mock('@starter/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button data-testid="button" {...props}>{children}</button>,
}));

jest.mock('@starter/ui/collapsible', () => ({
  Collapsible: ({ children, open, onOpenChange, ...props }: any) => (
    <div data-testid="collapsible" data-open={open} {...props}>
      {children}
    </div>
  ),
  CollapsibleContent: ({ children, ...props }: any) => (
    <div data-testid="collapsible-content" {...props}>{children}</div>
  ),
  CollapsibleTrigger: ({ children, asChild, ...props }: any) => (
    <div data-testid="collapsible-trigger" {...props}>{children}</div>
  ),
}));

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  ChevronDown: () => <span data-testid="chevron-down">ChevronDown</span>,
  ChevronRight: () => <span data-testid="chevron-right">ChevronRight</span>,
  HelpCircle: () => <span data-testid="help-circle">HelpCircle</span>,
  Badge: () => <span data-testid="badge">Badge</span>,
}));

describe('QADisplayCollapse', () => {
  const mockClarificationResponses = [
    {
      question_text: 'What specific trigger caused the client\'s agitation?',
      answer_text: 'Another participant raised their voice during the group discussion.',
      phase: 'during_event',
    },
    {
      question_text: 'How long did the one-on-one support session last?',
      answer_text: 'Approximately 15 minutes until the client was completely calm.',
      phase: 'post_event',
    },
    {
      question_text: 'Were there any warning signs before the incident?',
      answer_text: 'The client seemed slightly restless but was still engaged.',
      phase: 'before_event',
    },
  ];

  const mockMixedResponses = [
    ...mockClarificationResponses,
    {
      question_text: 'What was the weather like?',
      answer_text: '', // Empty answer - should be filtered out
      phase: 'before_event',
    },
    {
      question_text: 'Were there other participants present?',
      answer_text: '   ', // Whitespace only - should be filtered out
      phase: 'during_event',
    },
  ];

  const mockEmptyResponses = [
    {
      question_text: 'Question 1',
      answer_text: '',
      phase: 'before_event',
    },
    {
      question_text: 'Question 2',
      answer_text: '   ',
      phase: 'during_event',
    },
  ];

  describe('Component Rendering', () => {
    it('should render collapsed by default with answered questions', () => {
      render(<QADisplayCollapse clarificationResponses={mockClarificationResponses} />);

      expect(screen.getByTestId('collapsible')).toHaveAttribute('data-open', 'false');
      expect(screen.getByText('Clarification Questions & Answers')).toBeInTheDocument();
      expect(screen.getByText('3 answered')).toBeInTheDocument();
      expect(screen.getByTestId('chevron-right')).toBeInTheDocument();
      expect(screen.queryByTestId('chevron-down')).not.toBeInTheDocument();
    });

    it('should render expanded when defaultCollapsed is false', () => {
      render(
        <QADisplayCollapse 
          clarificationResponses={mockClarificationResponses} 
          defaultCollapsed={false} 
        />
      );

      expect(screen.getByTestId('collapsible')).toHaveAttribute('data-open', 'true');
      expect(screen.getByTestId('chevron-down')).toBeInTheDocument();
      expect(screen.queryByTestId('chevron-right')).not.toBeInTheDocument();
    });

    it('should display help circle icon', () => {
      render(<QADisplayCollapse clarificationResponses={mockClarificationResponses} />);

      expect(screen.getByTestId('help-circle')).toBeInTheDocument();
    });

    it('should show correct count of answered questions', () => {
      render(<QADisplayCollapse clarificationResponses={mockClarificationResponses} />);

      expect(screen.getByText('3 answered')).toBeInTheDocument();
    });

    it('should filter out empty answers and show correct count', () => {
      render(<QADisplayCollapse clarificationResponses={mockMixedResponses} />);

      expect(screen.getByText('3 answered')).toBeInTheDocument(); // Only non-empty answers
    });
  });

  describe('Content Filtering', () => {
    it('should not render when no questions have answers', () => {
      const { container } = render(
        <QADisplayCollapse clarificationResponses={mockEmptyResponses} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should not render when clarificationResponses is empty', () => {
      const { container } = render(
        <QADisplayCollapse clarificationResponses={[]} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should only display questions with non-empty answers', () => {
      render(
        <QADisplayCollapse 
          clarificationResponses={mockMixedResponses} 
          defaultCollapsed={false} 
        />
      );

      // Should show answered questions
      expect(screen.getByText('What specific trigger caused the client\'s agitation?')).toBeInTheDocument();
      expect(screen.getByText('How long did the one-on-one support session last?')).toBeInTheDocument();
      expect(screen.getByText('Were there any warning signs before the incident?')).toBeInTheDocument();

      // Should not show empty questions
      expect(screen.queryByText('What was the weather like?')).not.toBeInTheDocument();
      expect(screen.queryByText('Were there other participants present?')).not.toBeInTheDocument();
    });

    it('should handle whitespace-only answers as empty', () => {
      const whitespaceResponses = [
        {
          question_text: 'Valid question',
          answer_text: 'Valid answer',
          phase: 'before_event',
        },
        {
          question_text: 'Whitespace question',
          answer_text: '\t\n   \r\n',
          phase: 'during_event',
        },
      ];

      render(
        <QADisplayCollapse 
          clarificationResponses={whitespaceResponses} 
          defaultCollapsed={false} 
        />
      );

      expect(screen.getByText('Valid question')).toBeInTheDocument();
      expect(screen.getByText('Valid answer')).toBeInTheDocument();
      expect(screen.queryByText('Whitespace question')).not.toBeInTheDocument();
    });
  });

  describe('Phase Grouping', () => {
    it('should group questions by phase correctly', () => {
      render(
        <QADisplayCollapse 
          clarificationResponses={mockClarificationResponses} 
          defaultCollapsed={false} 
        />
      );

      expect(screen.getByText('Before Event')).toBeInTheDocument();
      expect(screen.getByText('During Event')).toBeInTheDocument();
      expect(screen.getByText('Post Event')).toBeInTheDocument();
    });

    it('should show question counts for each phase', () => {
      render(
        <QADisplayCollapse 
          clarificationResponses={mockClarificationResponses} 
          defaultCollapsed={false} 
        />
      );

      // Each phase should show question count
      const questionCounts = screen.getAllByText('1 question');
      expect(questionCounts).toHaveLength(3); // One for each phase
    });

    it('should handle multiple questions in same phase', () => {
      const multipleInPhase = [
        {
          question_text: 'Question 1 in during',
          answer_text: 'Answer 1',
          phase: 'during_event',
        },
        {
          question_text: 'Question 2 in during',
          answer_text: 'Answer 2',
          phase: 'during_event',
        },
        {
          question_text: 'Question in before',
          answer_text: 'Answer 3',
          phase: 'before_event',
        },
      ];

      render(
        <QADisplayCollapse 
          clarificationResponses={multipleInPhase} 
          defaultCollapsed={false} 
        />
      );

      expect(screen.getByText('2 questions')).toBeInTheDocument(); // During event phase
      expect(screen.getByText('1 question')).toBeInTheDocument(); // Before event phase
    });
  });

  describe('Question and Answer Display', () => {
    it('should display questions and answers with proper formatting', () => {
      render(
        <QADisplayCollapse 
          clarificationResponses={mockClarificationResponses} 
          defaultCollapsed={false} 
        />
      );

      // Check for Q: and A: prefixes
      const questions = screen.getAllByText(/^Q:/);
      const answers = screen.getAllByText(/^A:/);
      
      expect(questions).toHaveLength(3);
      expect(answers).toHaveLength(3);
    });

    it('should preserve whitespace in answers', () => {
      const responseWithWhitespace = [
        {
          question_text: 'Multi-line question?',
          answer_text: 'Line 1\nLine 2\n\nLine 4',
          phase: 'during_event',
        },
      ];

      render(
        <QADisplayCollapse 
          clarificationResponses={responseWithWhitespace} 
          defaultCollapsed={false} 
        />
      );

      const answerElement = screen.getByText('Line 1\nLine 2\n\nLine 4');
      expect(answerElement).toHaveClass('whitespace-pre-wrap');
    });

    it('should display all question and answer content correctly', () => {
      render(
        <QADisplayCollapse 
          clarificationResponses={mockClarificationResponses} 
          defaultCollapsed={false} 
        />
      );

      // Check all questions are displayed
      expect(screen.getByText('What specific trigger caused the client\'s agitation?')).toBeInTheDocument();
      expect(screen.getByText('How long did the one-on-one support session last?')).toBeInTheDocument();
      expect(screen.getByText('Were there any warning signs before the incident?')).toBeInTheDocument();

      // Check all answers are displayed
      expect(screen.getByText('Another participant raised their voice during the group discussion.')).toBeInTheDocument();
      expect(screen.getByText('Approximately 15 minutes until the client was completely calm.')).toBeInTheDocument();
      expect(screen.getByText('The client seemed slightly restless but was still engaged.')).toBeInTheDocument();
    });
  });

  describe('Collapsible Behavior', () => {
    it('should toggle expansion when trigger is clicked', () => {
      render(<QADisplayCollapse clarificationResponses={mockClarificationResponses} />);

      const trigger = screen.getByTestId('collapsible-trigger');
      const collapsible = screen.getByTestId('collapsible');

      // Initially collapsed
      expect(collapsible).toHaveAttribute('data-open', 'false');
      expect(screen.getByTestId('chevron-right')).toBeInTheDocument();

      // Click to expand
      fireEvent.click(trigger);
      
      // Should be expanded now
      expect(collapsible).toHaveAttribute('data-open', 'true');
      expect(screen.getByTestId('chevron-down')).toBeInTheDocument();
      expect(screen.queryByTestId('chevron-right')).not.toBeInTheDocument();

      // Click to collapse
      fireEvent.click(trigger);
      
      // Should be collapsed again
      expect(collapsible).toHaveAttribute('data-open', 'false');
      expect(screen.getByTestId('chevron-right')).toBeInTheDocument();
      expect(screen.queryByTestId('chevron-down')).not.toBeInTheDocument();
    });

    it('should maintain expanded state through multiple toggles', () => {
      render(<QADisplayCollapse clarificationResponses={mockClarificationResponses} />);

      const trigger = screen.getByTestId('collapsible-trigger');
      const collapsible = screen.getByTestId('collapsible');

      // Multiple toggles
      fireEvent.click(trigger); // Expand
      expect(collapsible).toHaveAttribute('data-open', 'true');
      
      fireEvent.click(trigger); // Collapse
      expect(collapsible).toHaveAttribute('data-open', 'false');
      
      fireEvent.click(trigger); // Expand again
      expect(collapsible).toHaveAttribute('data-open', 'true');
    });
  });

  describe('Phase Title Formatting', () => {
    it('should format underscore-separated phase names correctly', () => {
      render(
        <QADisplayCollapse 
          clarificationResponses={mockClarificationResponses} 
          defaultCollapsed={false} 
        />
      );

      expect(screen.getByText('Before Event')).toBeInTheDocument();
      expect(screen.getByText('During Event')).toBeInTheDocument();
      expect(screen.getByText('Post Event')).toBeInTheDocument();
    });

    it('should handle edge cases in phase naming', () => {
      const edgeCasePhases = [
        {
          question_text: 'Test question 1',
          answer_text: 'Test answer 1',
          phase: 'during_event',
        },
        {
          question_text: 'Test question 2',
          answer_text: 'Test answer 2',
          phase: 'end_event',
        },
      ];

      render(
        <QADisplayCollapse 
          clarificationResponses={edgeCasePhases} 
          defaultCollapsed={false} 
        />
      );

      expect(screen.getByText('During Event')).toBeInTheDocument();
      expect(screen.getByText('End Event')).toBeInTheDocument();
    });
  });

  describe('Styling and Layout', () => {
    it('should apply proper CSS classes for interactive elements', () => {
      render(<QADisplayCollapse clarificationResponses={mockClarificationResponses} />);

      const cardHeader = screen.getByTestId('card-header');
      expect(cardHeader).toHaveClass('cursor-pointer', 'hover:bg-muted/50', 'transition-colors');
    });

    it('should have proper styling for question and answer layout', () => {
      render(
        <QADisplayCollapse 
          clarificationResponses={mockClarificationResponses} 
          defaultCollapsed={false} 
        />
      );

      // Check for proper Q: and A: styling classes
      const questionElements = screen.getAllByText(/^Q:/);
      questionElements.forEach(element => {
        expect(element).toHaveClass('text-primary');
      });

      const answerElements = screen.getAllByText(/^A:/);
      answerElements.forEach(element => {
        expect(element).toHaveClass('text-green-600', 'font-medium');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have clickable trigger area', () => {
      render(<QADisplayCollapse clarificationResponses={mockClarificationResponses} />);

      const trigger = screen.getByTestId('collapsible-trigger');
      expect(trigger).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      render(<QADisplayCollapse clarificationResponses={mockClarificationResponses} />);

      const button = screen.getByTestId('button');
      button.focus();
      
      expect(document.activeElement).toBe(button);
    });

    it('should have semantic structure', () => {
      render(
        <QADisplayCollapse 
          clarificationResponses={mockClarificationResponses} 
          defaultCollapsed={false} 
        />
      );

      expect(screen.getByTestId('card-title')).toBeInTheDocument();
      expect(screen.getByTestId('card-content')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long questions and answers', () => {
      const longContent = [
        {
          question_text: 'Q'.repeat(500) + '?',
          answer_text: 'A'.repeat(1000) + '.',
          phase: 'during_event',
        },
      ];

      render(
        <QADisplayCollapse 
          clarificationResponses={longContent} 
          defaultCollapsed={false} 
        />
      );

      expect(screen.getByText(longContent[0].question_text)).toBeInTheDocument();
      expect(screen.getByText(longContent[0].answer_text)).toBeInTheDocument();
    });

    it('should handle special characters in questions and answers', () => {
      const specialCharContent = [
        {
          question_text: 'Question with "quotes" and <tags> & symbols?',
          answer_text: 'Answer with émojis 🎉 and unicode 你好',
          phase: 'before_event',
        },
      ];

      render(
        <QADisplayCollapse 
          clarificationResponses={specialCharContent} 
          defaultCollapsed={false} 
        />
      );

      expect(screen.getByText(specialCharContent[0].question_text)).toBeInTheDocument();
      expect(screen.getByText(specialCharContent[0].answer_text)).toBeInTheDocument();
    });

    it('should handle mixed null and valid content', () => {
      const mixedContent = [
        {
          question_text: 'Valid question',
          answer_text: 'Valid answer',
          phase: 'before_event',
        },
        {
          question_text: null as any,
          answer_text: 'Answer without question',
          phase: 'during_event',
        },
        {
          question_text: 'Question without answer',
          answer_text: null as any,
          phase: 'post_event',
        },
      ];

      render(
        <QADisplayCollapse 
          clarificationResponses={mixedContent} 
          defaultCollapsed={false} 
        />
      );

      // Should only show valid Q&A pairs
      expect(screen.getByText('Valid question')).toBeInTheDocument();
      expect(screen.getByText('Valid answer')).toBeInTheDocument();
      
      // Should show answered question count correctly
      expect(screen.getByText('1 answered')).toBeInTheDocument();
    });

    it('should handle phase with no answered questions', () => {
      const noAnsweredInPhase = [
        {
          question_text: 'Question 1',
          answer_text: 'Answer 1',
          phase: 'before_event',
        },
        {
          question_text: 'Question 2',
          answer_text: '', // Empty
          phase: 'during_event',
        },
        {
          question_text: 'Question 3',
          answer_text: 'Answer 3',
          phase: 'post_event',
        },
      ];

      render(
        <QADisplayCollapse 
          clarificationResponses={noAnsweredInPhase} 
          defaultCollapsed={false} 
        />
      );

      // Should show phases with answered questions
      expect(screen.getByText('Before Event')).toBeInTheDocument();
      expect(screen.getByText('Post Event')).toBeInTheDocument();
      
      // Should not show phase with no answered questions
      expect(screen.queryByText('During Event')).not.toBeInTheDocument();
    });
  });
});