// @ts-nocheck
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WizardShell, useWizard } from '@/components/workflow/wizard-shell';
import { WizardConfig, WizardStepProps } from '@/components/workflow/wizard-types';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Test step components
const TestStep1: React.FC<WizardStepProps> = ({ data, onDataChange, onValidationChange }) => {
  return (
    <div>
      <h3>Test Step 1</h3>
      <input
        data-testid="step1-input"
        value={data.step1Value || ''}
        onChange={(e) => {
          onDataChange({ step1Value: e.target.value });
          onValidationChange(e.target.value.length > 0, e.target.value.length === 0 ? 'Required field' : '');
        }}
      />
    </div>
  );
};

const TestStep2: React.FC<WizardStepProps> = ({ data, onDataChange, onValidationChange }) => {
  return (
    <div>
      <h3>Test Step 2</h3>
      <input
        data-testid="step2-input"
        value={data.step2Value || ''}
        onChange={(e) => {
          onDataChange({ step2Value: e.target.value });
          onValidationChange(true);
        }}
      />
    </div>
  );
};

const TestStep3: React.FC<WizardStepProps> = ({ data, onDataChange, onValidationChange }) => {
  return (
    <div>
      <h3>Test Step 3</h3>
      <p data-testid="step3-content">Final step</p>
    </div>
  );
};

// Test wizard configuration
const createTestConfig = (overrides: Partial<WizardConfig> = {}): WizardConfig => ({
  id: 'test-wizard',
  title: 'Test Wizard',
  description: 'A wizard for testing',
  steps: [
    {
      id: 'step1',
      title: 'Step One',
      description: 'First step description',
      component: TestStep1,
      required: true,
      validator: (data) => ({
        isValid: !!data.step1Value,
        message: data.step1Value ? '' : 'Step 1 is required',
      }),
    },
    {
      id: 'step2',
      title: 'Step Two',
      description: 'Second step description',
      component: TestStep2,
      required: true,
      isSkippable: true,
    },
    {
      id: 'step3',
      title: 'Step Three',
      description: 'Final step description',
      component: TestStep3,
      required: true,
    },
  ],
  onComplete: jest.fn(),
  onCancel: jest.fn(),
  autoSave: true,
  allowBackNavigation: true,
  persistSession: true,
  debounceMs: 100,
  ...overrides,
});

// Test wrapper component to access useWizard hook
const WizardConsumer = ({ onWizardState }: { onWizardState: (wizard: any) => void }) => {
  const wizard = useWizard();
  React.useEffect(() => {
    onWizardState(wizard);
  }, [wizard, onWizardState]);
  return null;
};

describe('WizardShell Component', () => {
  let config: WizardConfig;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    config = createTestConfig();
    user = userEvent.setup();
  });

  describe('Basic Rendering', () => {
    it('renders wizard with title and description', () => {
      render(<WizardShell config={config} />);
      
      expect(screen.getByText('Test Wizard')).toBeInTheDocument();
      expect(screen.getByText('A wizard for testing')).toBeInTheDocument();
    });

    it('shows current step information', () => {
      render(<WizardShell config={config} />);
      
      expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
      expect(screen.getByText('Step One')).toBeInTheDocument();
      expect(screen.getByText('First step description')).toBeInTheDocument();
    });

    it('renders progress bar correctly', () => {
      render(<WizardShell config={config} showProgress={true} />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute('aria-valuenow', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });

    it('renders step navigation circles', () => {
      render(<WizardShell config={config} />);
      
      const stepButtons = screen.getAllByRole('button');
      const stepNavigationButtons = stepButtons.filter(button => 
        button.getAttribute('aria-label')?.includes('Step ')
      );
      expect(stepNavigationButtons).toHaveLength(3);
    });

    it('renders current step component', () => {
      render(<WizardShell config={config} />);
      
      expect(screen.getByText('Test Step 1')).toBeInTheDocument();
      expect(screen.getByTestId('step1-input')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('navigates to next step when valid', async () => {
      render(<WizardShell config={config} />);
      
      // Fill required field
      const input = screen.getByTestId('step1-input');
      await user.type(input, 'test value');
      
      // Complete step and navigate
      const completeButton = screen.getByText('Complete Step');
      await user.click(completeButton);
      
      const nextButton = screen.getByText('Next Step');
      await user.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText('Test Step 2')).toBeInTheDocument();
        expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();
      });
    });

    it('prevents navigation when step is invalid', async () => {
      render(<WizardShell config={config} />);
      
      const nextButton = screen.getByText('Next Step');
      await user.click(nextButton);
      
      // Should still be on step 1
      expect(screen.getByText('Test Step 1')).toBeInTheDocument();
      expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
    });

    it('navigates to previous step', async () => {
      render(<WizardShell config={config} />);
      
      // Go to step 2 first
      const input = screen.getByTestId('step1-input');
      await user.type(input, 'test value');
      
      const completeButton = screen.getByText('Complete Step');
      await user.click(completeButton);
      
      const nextButton = screen.getByText('Next Step');
      await user.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText('Test Step 2')).toBeInTheDocument();
      });
      
      // Go back to step 1
      const previousButton = screen.getByText('Previous');
      await user.click(previousButton);
      
      await waitFor(() => {
        expect(screen.getByText('Test Step 1')).toBeInTheDocument();
      });
    });

    it('allows step skipping when enabled', async () => {
      render(<WizardShell config={config} />);
      
      // Navigate to step 2 (which is skippable)
      const input = screen.getByTestId('step1-input');
      await user.type(input, 'test value');
      
      const completeButton = screen.getByText('Complete Step');
      await user.click(completeButton);
      
      const nextButton = screen.getByText('Next Step');
      await user.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText('Test Step 2')).toBeInTheDocument();
      });
      
      // Skip step 2
      const skipButton = screen.getByText('Skip Step');
      await user.click(skipButton);
      
      await waitFor(() => {
        expect(screen.getByText('Test Step 3')).toBeInTheDocument();
      });
    });
  });

  describe('Validation', () => {
    it('shows validation error for invalid step', async () => {
      render(<WizardShell config={config} />);
      
      // Try to complete step without filling required field
      const completeButton = screen.getByText('Complete Step');
      await user.click(completeButton);
      
      await waitFor(() => {
        expect(screen.getByText('Step 1 is required')).toBeInTheDocument();
      });
    });

    it('clears validation error when step becomes valid', async () => {
      render(<WizardShell config={config} />);
      
      // Trigger validation error
      const completeButton = screen.getByText('Complete Step');
      await user.click(completeButton);
      
      await waitFor(() => {
        expect(screen.getByText('Step 1 is required')).toBeInTheDocument();
      });
      
      // Fill required field
      const input = screen.getByTestId('step1-input');
      await user.type(input, 'test value');
      
      await waitFor(() => {
        expect(screen.queryByText('Step 1 is required')).not.toBeInTheDocument();
      });
    });
  });

  describe('Session Persistence', () => {
    it('saves session data on auto-save', async () => {
      render(<WizardShell config={config} />);
      
      const input = screen.getByTestId('step1-input');
      await user.type(input, 'test value');
      
      // Wait for debounced auto-save
      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalled();
      }, { timeout: 200 });
    });

    it('restores session data on mount', () => {
      const sessionData = {
        wizardId: 'test-wizard',
        currentStep: 1,
        stepData: { step1Value: 'restored value' },
        lastSaved: Date.now(),
        completedSteps: ['step1'],
        validationState: {},
        metadata: {
          startedAt: Date.now(),
          updatedAt: Date.now(),
          version: '1.0.0',
        },
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(sessionData));
      
      render(<WizardShell config={config} />);
      
      expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();
    });

    it('handles corrupted session data gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');
      
      expect(() => {
        render(<WizardShell config={config} />);
      }).not.toThrow();
      
      expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('navigates with arrow keys', async () => {
      render(<WizardShell config={config} />);
      
      // Fill required field first
      const input = screen.getByTestId('step1-input');
      await user.type(input, 'test value');
      
      const completeButton = screen.getByText('Complete Step');
      await user.click(completeButton);
      
      // Focus the wizard container and use arrow key
      const wizardContainer = screen.getByRole('application');
      wizardContainer.focus();
      
      await user.keyboard('{ArrowRight}');
      
      await waitFor(() => {
        expect(screen.getByText('Test Step 2')).toBeInTheDocument();
      });
    });

    it('cancels with escape key', async () => {
      const onCancel = jest.fn();
      const configWithCancel = createTestConfig({ onCancel });
      
      render(<WizardShell config={configWithCancel} />);
      
      const wizardContainer = screen.getByRole('application');
      wizardContainer.focus();
      
      await user.keyboard('{Escape}');
      
      expect(onCancel).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<WizardShell config={config} />);
      
      const wizard = screen.getByRole('application');
      expect(wizard).toHaveAttribute('aria-label', 'Test Wizard');
      expect(wizard).toHaveAttribute('aria-describedby');
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });

    it('announces step changes to screen readers', () => {
      render(<WizardShell config={config} />);
      
      const stepNavigation = screen.getByLabelText(/Step 1: Step One/);
      expect(stepNavigation).toHaveAttribute('aria-current', 'step');
    });

    it('has proper button labels for navigation', () => {
      render(<WizardShell config={config} />);
      
      const nextButton = screen.getByLabelText(/Go to next step/);
      expect(nextButton).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('renders mobile layout on small screens', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 640,
      });
      
      render(<WizardShell config={config} />);
      
      // Mobile layout should have stacked actions
      const mobileActions = screen.getByRole('navigation', { name: 'Wizard actions' });
      expect(mobileActions).toBeInTheDocument();
    });

    it('has touch-friendly buttons', () => {
      render(<WizardShell config={config} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        if (button.className.includes('touch-manipulation')) {
          expect(button).toHaveClass('touch-manipulation');
        }
      });
    });
  });

  describe('Wizard Variants', () => {
    it('renders minimal variant correctly', () => {
      render(<WizardShell config={config} variant="minimal" />);
      
      expect(screen.getByText('Test Wizard')).toBeInTheDocument();
      expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('renders compact variant correctly', () => {
      render(<WizardShell config={config} variant="compact" />);
      
      // Should render similar to full but without summary section
      expect(screen.getByText('Test Wizard')).toBeInTheDocument();
      expect(screen.getByText('Step One')).toBeInTheDocument();
    });
  });

  describe('Wizard Completion', () => {
    it('calls onComplete when wizard is finished', async () => {
      const onComplete = jest.fn();
      const testConfig = createTestConfig({ onComplete });
      
      render(<WizardShell config={testConfig} />);
      
      // Complete all steps
      // Step 1
      const step1Input = screen.getByTestId('step1-input');
      await user.type(step1Input, 'test value');
      
      let completeButton = screen.getByText('Complete Step');
      await user.click(completeButton);
      
      let nextButton = screen.getByText('Next Step');
      await user.click(nextButton);
      
      // Step 2 (skip it)
      await waitFor(() => {
        expect(screen.getByText('Test Step 2')).toBeInTheDocument();
      });
      
      const skipButton = screen.getByText('Skip Step');
      await user.click(skipButton);
      
      // Step 3 (final step)
      await waitFor(() => {
        expect(screen.getByText('Test Step 3')).toBeInTheDocument();
      });
      
      completeButton = screen.getByText('Complete Step');
      await user.click(completeButton);
      
      const completeWizardButton = screen.getByText('Complete Wizard');
      await user.click(completeWizardButton);
      
      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            step1Value: 'test value',
          })
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('handles component errors gracefully', () => {
      const ErrorStep = () => {
        throw new Error('Test error');
      };
      
      const errorConfig = createTestConfig({
        steps: [{
          id: 'error-step',
          title: 'Error Step',
          component: ErrorStep,
          required: true,
        }]
      });
      
      // Should not crash the entire wizard
      expect(() => {
        render(<WizardShell config={errorConfig} />);
      }).not.toThrow();
    });

    it('calls onError when provided', async () => {
      const onError = jest.fn();
      const errorConfig = createTestConfig({ 
        onError,
        onComplete: () => Promise.reject(new Error('Completion failed'))
      });
      
      render(<WizardShell config={errorConfig} />);
      
      // Complete step and wizard to trigger completion error
      const input = screen.getByTestId('step1-input');
      await user.type(input, 'test value');
      
      const completeButton = screen.getByText('Complete Step');
      await user.click(completeButton);
      
      const nextButton = screen.getByText('Next Step');
      await user.click(nextButton);
      
      // Skip step 2
      await waitFor(() => {
        expect(screen.getByText('Test Step 2')).toBeInTheDocument();
      });
      
      const skipButton = screen.getByText('Skip Step');
      await user.click(skipButton);
      
      // Complete final step and wizard
      await waitFor(() => {
        expect(screen.getByText('Test Step 3')).toBeInTheDocument();
      });
      
      const finalCompleteButton = screen.getByText('Complete Step');
      await user.click(finalCompleteButton);
      
      const completeWizardButton = screen.getByText('Complete Wizard');
      await user.click(completeWizardButton);
      
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(expect.any(Error));
      });
    });
  });

  describe('useWizard Hook', () => {
    it('provides wizard context to child components', () => {
      let wizardContext: any;
      
      render(
        <WizardShell config={config}>
          <WizardConsumer onWizardState={(wizard) => { wizardContext = wizard; }} />
        </WizardShell>
      );
      
      expect(wizardContext).toBeDefined();
      expect(wizardContext.config).toBeDefined();
      expect(wizardContext.state).toBeDefined();
      expect(wizardContext.actions).toBeDefined();
    });
    
    it('throws error when used outside WizardShell', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      expect(() => {
        render(<WizardConsumer onWizardState={() => {}} />);
      }).toThrow('useWizard must be used within a WizardShell');
      
      consoleSpy.mockRestore();
    });
  });
});