import React from 'react';
import { render, screen } from '@/lib/test-utils';
import ShowcasePage from '../page';

describe('ShowcasePage', () => {
  describe('Component Rendering', () => {
    it('should render the showcase page without errors', () => {
      render(<ShowcasePage />);

      expect(
        screen.getByRole('heading', { level: 1, name: /component showcase/i })
      ).toBeInTheDocument();
    });

    it('should display the page header with correct title and description', () => {
      render(<ShowcasePage />);

      expect(
        screen.getByRole('heading', { level: 1, name: /component showcase/i })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/explore all available ui components/i)
      ).toBeInTheDocument();
    });

    it('should display back to home navigation link', () => {
      render(<ShowcasePage />);

      const backLink = screen.getByRole('link', { name: /back to home/i });
      expect(backLink).toBeInTheDocument();
      expect(backLink).toHaveAttribute('href', '/');
    });
  });

  describe('Button Components Section', () => {
    it('should render the button components section', () => {
      render(<ShowcasePage />);

      expect(
        screen.getByRole('heading', { level: 2, name: /button components/i })
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /interactive button components with multiple variants/i
        )
      ).toBeInTheDocument();
    });

    it('should display all button variants', () => {
      render(<ShowcasePage />);

      // Check for button variant headings
      expect(screen.getByText(/default variant/i)).toBeInTheDocument();
      expect(screen.getByText(/secondary variant/i)).toBeInTheDocument();
      expect(screen.getByText(/destructive variant/i)).toBeInTheDocument();
      expect(screen.getByText(/outline variant/i)).toBeInTheDocument();
      expect(screen.getByText(/ghost variant/i)).toBeInTheDocument();
      expect(screen.getByText(/link variant/i)).toBeInTheDocument();
    });

    it('should render button components with correct text', () => {
      render(<ShowcasePage />);

      // Check for specific button instances (there are multiple of each)
      expect(
        screen.getAllByRole('button', { name: /default button/i })
      ).toHaveLength(1);
      expect(
        screen.getAllByRole('button', { name: /secondary/i }).length
      ).toBeGreaterThan(0);
      expect(
        screen.getAllByRole('button', { name: /destructive/i }).length
      ).toBeGreaterThan(0);
      expect(
        screen.getAllByRole('button', { name: /outline/i }).length
      ).toBeGreaterThan(0);
      expect(
        screen.getAllByRole('button', { name: /ghost/i }).length
      ).toBeGreaterThan(0);
    });

    it('should render buttons with different sizes', () => {
      render(<ShowcasePage />);

      // Check for size variants
      expect(
        screen.getAllByRole('button', { name: /small/i }).length
      ).toBeGreaterThan(0);
      expect(
        screen.getAllByRole('button', { name: /large/i }).length
      ).toBeGreaterThan(0);
    });
  });

  describe('Input Components Section', () => {
    it('should render the input components section', () => {
      render(<ShowcasePage />);

      expect(
        screen.getByRole('heading', { level: 2, name: /input components/i })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/form input components for user data collection/i)
      ).toBeInTheDocument();
    });

    it('should display various input types', () => {
      render(<ShowcasePage />);

      // Check for input labels and types - use more specific selectors
      expect(screen.getByLabelText('Default Input')).toBeInTheDocument();
      expect(screen.getByLabelText('With Value')).toBeInTheDocument();
      expect(screen.getByLabelText('Email Input')).toBeInTheDocument();
      expect(screen.getByLabelText('Password Input')).toBeInTheDocument();
    });

    it('should display disabled input states', () => {
      render(<ShowcasePage />);

      const disabledInputs = screen.getAllByDisplayValue(
        /cannot edit this|disabled input/i
      );
      expect(disabledInputs.length).toBeGreaterThan(0);

      // Check that at least one disabled input exists
      const disabledEmpty = screen.getByPlaceholderText(/disabled input/i);
      expect(disabledEmpty).toBeDisabled();
    });

    it('should render inputs with correct placeholder text', () => {
      render(<ShowcasePage />);

      expect(
        screen.getByPlaceholderText(/enter text here/i)
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/user@example.com/i)
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/enter password/i)
      ).toBeInTheDocument();
    });
  });

  describe('Card Components Section', () => {
    it('should render the card components section', () => {
      render(<ShowcasePage />);

      expect(
        screen.getByRole('heading', { level: 2, name: /card components/i })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/flexible card containers for organizing content/i)
      ).toBeInTheDocument();
    });

    it('should display different card examples', () => {
      render(<ShowcasePage />);

      // Check for card titles (they are h6 elements, not standard headings in terms of semantic role)
      expect(screen.getByText(/simple card/i)).toBeInTheDocument();
      expect(screen.getByText(/card with actions/i)).toBeInTheDocument();
      expect(screen.getByText(/form card/i)).toBeInTheDocument();
    });

    it('should render form elements within form card', () => {
      render(<ShowcasePage />);

      // Check inputs exist by placeholder text
      expect(
        screen.getByPlaceholderText(/enter your name/i)
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/enter your email/i)
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /submit/i })
      ).toBeInTheDocument();
    });
  });

  describe('Usage Guidelines Section', () => {
    it('should render usage guidelines section', () => {
      render(<ShowcasePage />);

      expect(
        screen.getByRole('heading', { level: 2, name: /usage guidelines/i })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/best practices for using these components/i)
      ).toBeInTheDocument();
    });

    it('should display accessibility and theming information', () => {
      render(<ShowcasePage />);

      // Check for key content from both cards
      expect(
        screen.getByText(/proper aria labels and roles/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/keyboard navigation support/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/screen reader compatibility/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/css custom properties for colors/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/tailwind css utility classes/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/customizable design tokens/i)
      ).toBeInTheDocument();
    });
  });

  describe('Import Guide Section', () => {
    it('should render import guide section', () => {
      render(<ShowcasePage />);

      expect(
        screen.getByRole('heading', { level: 2, name: /import guide/i })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/how to import and use these components/i)
      ).toBeInTheDocument();
    });

    it('should display import statements', () => {
      render(<ShowcasePage />);

      // Check for the import guide content
      expect(
        screen.getByText(/copy these import statements/i)
      ).toBeInTheDocument();

      // Check that import code examples are present - there are multiple import statements
      expect(screen.getAllByText('import').length).toBeGreaterThan(0);
      expect(screen.getAllByText('"@starter/ui"').length).toBeGreaterThan(0);
    });
  });

  describe('Responsive Layout', () => {
    it('should use responsive container classes', () => {
      const { container } = render(<ShowcasePage />);

      // Check for responsive container classes
      const mainContainer = container.querySelector('.container');
      expect(mainContainer).toHaveClass('mx-auto', 'px-4', 'py-8');

      const maxWidthContainer = container.querySelector('.max-w-6xl');
      expect(maxWidthContainer).toHaveClass('mx-auto');
    });

    it('should apply grid layouts for card sections', () => {
      const { container } = render(<ShowcasePage />);

      // Check for grid classes in card sections
      const gridElements = container.querySelectorAll('[class*="grid-cols"]');
      expect(gridElements.length).toBeGreaterThan(0);
    });
  });

  describe('Content Structure', () => {
    it('should have proper heading hierarchy', () => {
      render(<ShowcasePage />);

      // Check for h1 (main title)
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);

      // Check for h2 (section titles)
      const h2Headings = screen.getAllByRole('heading', { level: 2 });
      expect(h2Headings.length).toBeGreaterThanOrEqual(5); // We have 5 main sections
    });

    it('should contain all required sections in correct order', () => {
      render(<ShowcasePage />);

      const mainElement = screen.getByRole('main');
      const textContent = mainElement.textContent || '';

      // Check that sections appear in expected order
      const buttonIndex = textContent.indexOf('Button Components');
      const inputIndex = textContent.indexOf('Input Components');
      const cardIndex = textContent.indexOf('Card Components');
      const guidelinesIndex = textContent.indexOf('Usage Guidelines');
      const importIndex = textContent.indexOf('Import Guide');

      expect(buttonIndex).toBeLessThan(inputIndex);
      expect(inputIndex).toBeLessThan(cardIndex);
      expect(cardIndex).toBeLessThan(guidelinesIndex);
      expect(guidelinesIndex).toBeLessThan(importIndex);
    });
  });

  describe('Interactive Elements', () => {
    it('should render all buttons as interactive elements', () => {
      render(<ShowcasePage />);

      const allButtons = screen.getAllByRole('button');
      // Should have many buttons from all the component examples
      expect(allButtons.length).toBeGreaterThan(15);

      // Check that buttons are not disabled (except the disabled examples)
      const enabledButtons = allButtons.filter(
        button => !button.hasAttribute('disabled')
      );
      expect(enabledButtons.length).toBeGreaterThan(10);
    });

    it('should render all inputs as interactive elements', () => {
      render(<ShowcasePage />);

      const allInputs = screen.getAllByRole('textbox');
      expect(allInputs.length).toBeGreaterThan(5);

      // Check that some inputs have proper types
      const emailInputs = screen
        .getAllByDisplayValue('')
        .filter(input => (input as HTMLInputElement).type === 'email');
      expect(emailInputs.length).toBeGreaterThan(0);
    });

    it('should maintain focus accessibility for interactive elements', () => {
      render(<ShowcasePage />);

      const focusableElements = screen
        .getAllByRole('button')
        .concat(screen.getAllByRole('textbox'))
        .concat(screen.getAllByRole('link'));

      // Ensure we have plenty of focusable elements for a good showcase
      expect(focusableElements.length).toBeGreaterThan(20);
    });
  });
});
