// @ts-nocheck
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { OriginalContentCollapse } from '@/components/incidents/OriginalContentCollapse';

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
  FileText: () => <span data-testid="file-text">FileText</span>,
}));

describe('OriginalContentCollapse', () => {
  const mockOriginalContent = {
    before_event: 'Client was calm and engaged in activities before the incident.',
    during_event: 'Client became agitated during the group discussion and raised their voice.',
    end_event: 'Client left the room and was followed by support staff.',
    post_event: 'Client was provided with one-on-one support and gradually calmed down.',
  };

  const mockEmptyContent = {
    before_event: '',
    during_event: '',
    end_event: '',
    post_event: '',
  };

  const mockPartialContent = {
    before_event: 'Some content here',
    during_event: '',
    end_event: 'Some content here too',
    post_event: '   ', // Whitespace only
  };

  describe('Component Rendering', () => {
    it('should render collapsed by default', () => {
      render(<OriginalContentCollapse originalContent={mockOriginalContent} />);

      expect(screen.getByTestId('collapsible')).toHaveAttribute('data-open', 'false');
      expect(screen.getByText('Original Narrative Content')).toBeInTheDocument();
      expect(screen.getByTestId('chevron-right')).toBeInTheDocument();
      expect(screen.queryByTestId('chevron-down')).not.toBeInTheDocument();
    });

    it('should render expanded when defaultCollapsed is false', () => {
      render(
        <OriginalContentCollapse 
          originalContent={mockOriginalContent} 
          defaultCollapsed={false} 
        />
      );

      expect(screen.getByTestId('collapsible')).toHaveAttribute('data-open', 'true');
      expect(screen.getByTestId('chevron-down')).toBeInTheDocument();
      expect(screen.queryByTestId('chevron-right')).not.toBeInTheDocument();
    });

    it('should display file text icon', () => {
      render(<OriginalContentCollapse originalContent={mockOriginalContent} />);

      expect(screen.getByTestId('file-text')).toBeInTheDocument();
    });

    it('should render all phase titles correctly', () => {
      render(
        <OriginalContentCollapse 
          originalContent={mockOriginalContent} 
          defaultCollapsed={false} 
        />
      );

      expect(screen.getByText('Before Event')).toBeInTheDocument();
      expect(screen.getByText('During Event')).toBeInTheDocument();
      expect(screen.getByText('End Event')).toBeInTheDocument();
      expect(screen.getByText('Post Event')).toBeInTheDocument();
    });

    it('should render all content text correctly', () => {
      render(
        <OriginalContentCollapse 
          originalContent={mockOriginalContent} 
          defaultCollapsed={false} 
        />
      );

      expect(screen.getByText(mockOriginalContent.before_event)).toBeInTheDocument();
      expect(screen.getByText(mockOriginalContent.during_event)).toBeInTheDocument();
      expect(screen.getByText(mockOriginalContent.end_event)).toBeInTheDocument();
      expect(screen.getByText(mockOriginalContent.post_event)).toBeInTheDocument();
    });
  });

  describe('Collapsible Behavior', () => {
    it('should toggle expansion when trigger is clicked', () => {
      render(<OriginalContentCollapse originalContent={mockOriginalContent} />);

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

    it('should maintain state through multiple toggles', () => {
      render(<OriginalContentCollapse originalContent={mockOriginalContent} />);

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

  describe('Content Filtering', () => {
    it('should not render when all content is empty', () => {
      const { container } = render(
        <OriginalContentCollapse originalContent={mockEmptyContent} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should not render when all content is whitespace only', () => {
      const whitespaceContent = {
        before_event: '   ',
        during_event: '\t\n',
        end_event: '    ',
        post_event: '',
      };

      const { container } = render(
        <OriginalContentCollapse originalContent={whitespaceContent} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render when at least one field has content', () => {
      render(<OriginalContentCollapse originalContent={mockPartialContent} />);

      expect(screen.getByText('Original Narrative Content')).toBeInTheDocument();
    });

    it('should only display phases with actual content', () => {
      render(
        <OriginalContentCollapse 
          originalContent={mockPartialContent} 
          defaultCollapsed={false} 
        />
      );

      // Should show phases with content
      expect(screen.getByText('Before Event')).toBeInTheDocument();
      expect(screen.getByText('End Event')).toBeInTheDocument();
      expect(screen.getByText('Some content here')).toBeInTheDocument();
      expect(screen.getByText('Some content here too')).toBeInTheDocument();

      // Should not show empty phases
      expect(screen.queryByText('During Event')).not.toBeInTheDocument();
      expect(screen.queryByText('Post Event')).not.toBeInTheDocument();
    });
  });

  describe('Phase Title Formatting', () => {
    it('should format underscore-separated phase names correctly', () => {
      render(
        <OriginalContentCollapse 
          originalContent={mockOriginalContent} 
          defaultCollapsed={false} 
        />
      );

      // Check that underscores are replaced with spaces and titles are capitalized
      expect(screen.getByText('Before Event')).toBeInTheDocument();
      expect(screen.getByText('During Event')).toBeInTheDocument();
      expect(screen.getByText('End Event')).toBeInTheDocument();
      expect(screen.getByText('Post Event')).toBeInTheDocument();
    });

    it('should handle edge cases in phase naming', () => {
      const edgeCaseContent = {
        before_event: 'Content 1',
        during_event: 'Content 2',
        end_event: 'Content 3',
        post_event: 'Content 4',
      };

      render(
        <OriginalContentCollapse 
          originalContent={edgeCaseContent} 
          defaultCollapsed={false} 
        />
      );

      // Verify all edge cases are handled correctly
      expect(screen.getByText('Before Event')).toBeInTheDocument();
      expect(screen.getByText('During Event')).toBeInTheDocument();
      expect(screen.getByText('End Event')).toBeInTheDocument();
      expect(screen.getByText('Post Event')).toBeInTheDocument();
    });
  });

  describe('Styling and Layout', () => {
    it('should apply proper CSS classes for collapsed state', () => {
      render(<OriginalContentCollapse originalContent={mockOriginalContent} />);

      const cardHeader = screen.getByTestId('card-header');
      expect(cardHeader).toHaveClass('cursor-pointer', 'hover:bg-muted/50', 'transition-colors');
    });

    it('should preserve whitespace in content display', () => {
      const contentWithWhitespace = {
        before_event: 'Line 1\nLine 2\n\nLine 4',
        during_event: '',
        end_event: '',
        post_event: '',
      };

      render(
        <OriginalContentCollapse 
          originalContent={contentWithWhitespace} 
          defaultCollapsed={false} 
        />
      );

      const contentElement = screen.getByText('Line 1\nLine 2\n\nLine 4');
      expect(contentElement).toHaveClass('whitespace-pre-wrap');
    });

    it('should have proper structure for content sections', () => {
      render(
        <OriginalContentCollapse 
          originalContent={mockOriginalContent} 
          defaultCollapsed={false} 
        />
      );

      // Check for proper section structure
      const contentSections = screen.getAllByText(/event/i).filter(el => 
        el.classList.contains('font-medium')
      );
      expect(contentSections).toHaveLength(4); // One for each phase
    });
  });

  describe('Accessibility', () => {
    it('should have clickable trigger area', () => {
      render(<OriginalContentCollapse originalContent={mockOriginalContent} />);

      const trigger = screen.getByTestId('collapsible-trigger');
      expect(trigger).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      render(<OriginalContentCollapse originalContent={mockOriginalContent} />);

      const button = screen.getByTestId('button');
      button.focus();
      
      expect(document.activeElement).toBe(button);
    });

    it('should have semantic structure', () => {
      render(
        <OriginalContentCollapse 
          originalContent={mockOriginalContent} 
          defaultCollapsed={false} 
        />
      );

      // Check for proper heading structure
      expect(screen.getByTestId('card-title')).toBeInTheDocument();
      expect(screen.getByTestId('card-content')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long content gracefully', () => {
      const longContent = {
        before_event: 'A'.repeat(1000),
        during_event: 'B'.repeat(500),
        end_event: 'C'.repeat(750),
        post_event: 'D'.repeat(250),
      };

      render(
        <OriginalContentCollapse 
          originalContent={longContent} 
          defaultCollapsed={false} 
        />
      );

      expect(screen.getByText(longContent.before_event)).toBeInTheDocument();
      expect(screen.getByText(longContent.during_event)).toBeInTheDocument();
      expect(screen.getByText(longContent.end_event)).toBeInTheDocument();
      expect(screen.getByText(longContent.post_event)).toBeInTheDocument();
    });

    it('should handle special characters in content', () => {
      const specialCharContent = {
        before_event: 'Content with "quotes" and <tags> & symbols',
        during_event: 'Unicode content: 你好 🎉 émojis',
        end_event: '',
        post_event: '',
      };

      render(
        <OriginalContentCollapse 
          originalContent={specialCharContent} 
          defaultCollapsed={false} 
        />
      );

      expect(screen.getByText(specialCharContent.before_event)).toBeInTheDocument();
      expect(screen.getByText(specialCharContent.during_event)).toBeInTheDocument();
    });

    it('should handle mixed empty and filled content', () => {
      const mixedContent = {
        before_event: 'Valid content here',
        during_event: '',
        end_event: 'Another valid content',
        post_event: null as any, // Edge case: null value
      };

      render(
        <OriginalContentCollapse 
          originalContent={mixedContent} 
          defaultCollapsed={false} 
        />
      );

      expect(screen.getByText('Valid content here')).toBeInTheDocument();
      expect(screen.getByText('Another valid content')).toBeInTheDocument();
      expect(screen.getByText('Before Event')).toBeInTheDocument();
      expect(screen.getByText('End Event')).toBeInTheDocument();
      
      // Should not show sections for empty/null content
      expect(screen.queryByText('During Event')).not.toBeInTheDocument();
      expect(screen.queryByText('Post Event')).not.toBeInTheDocument();
    });
  });
});