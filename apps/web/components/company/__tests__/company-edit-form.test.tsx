// @ts-nocheck
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CompanyEditForm } from '@/components/company/company-edit-form';
import { Company } from '@/types/company';

// Mock company data for testing
const mockCompany: Company = {
  _id: 'test-company-id' as any,
  name: 'Test Company',
  contact_email: 'test@company.com',
  status: 'active',
  created_at: Date.now() - 1000000,
  created_by: 'test-user-id' as any,
  _creationTime: Date.now() - 1000000,
};

describe('CompanyEditForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render all form fields with current company data', () => {
      render(
        <CompanyEditForm 
          company={mockCompany}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Check if form fields are populated with current data
      expect(screen.getByDisplayValue('Test Company')).toBeInTheDocument();
      expect(screen.getByDisplayValue('test@company.com')).toBeInTheDocument();
    });

    it('should show form title and description', () => {
      render(
        <CompanyEditForm 
          company={mockCompany}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Edit Company Information')).toBeInTheDocument();
      expect(screen.getByText('Update your organization\'s details and settings')).toBeInTheDocument();
    });

    it('should render Save and Cancel buttons', () => {
      render(
        <CompanyEditForm 
          company={mockCompany}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Save Changes')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show validation error for empty company name', async () => {
      render(
        <CompanyEditForm 
          company={mockCompany}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByDisplayValue('Test Company');
      fireEvent.change(nameInput, { target: { value: '' } });
      
      const submitButton = screen.getByText('Save Changes');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Company name is required')).toBeInTheDocument();
      });
    });

    it('should prevent form submission with invalid email and not call onSubmit', async () => {
      render(
        <CompanyEditForm 
          company={mockCompany}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const emailInput = screen.getByDisplayValue('test@company.com');
      
      // Change to invalid email format
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      
      // Submit form to trigger validation
      const submitButton = screen.getByText('Save Changes');
      fireEvent.click(submitButton);

      // The form should not call onSubmit due to validation failure
      // This is the core behavior we care about - preventing invalid submissions
      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
      
      // Verify the email input still contains the invalid value
      expect(screen.getByDisplayValue('invalid-email')).toBeInTheDocument();
    });

    it('should show validation error for short company name', async () => {
      render(
        <CompanyEditForm 
          company={mockCompany}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByDisplayValue('Test Company');
      fireEvent.change(nameInput, { target: { value: 'A' } });
      
      const submitButton = screen.getByText('Save Changes');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Company name must be at least 2 characters')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should call onSubmit with valid data', async () => {
      render(
        <CompanyEditForm 
          company={mockCompany}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByDisplayValue('Test Company');
      fireEvent.change(nameInput, { target: { value: 'Updated Company Name' } });

      const submitButton = screen.getByText('Save Changes');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'Updated Company Name',
          contact_email: 'test@company.com',
          status: 'active',
        });
      });
    });

    it('should not submit form with validation errors', async () => {
      render(
        <CompanyEditForm 
          company={mockCompany}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByDisplayValue('Test Company');
      fireEvent.change(nameInput, { target: { value: '' } });
      
      const submitButton = screen.getByText('Save Changes');
      fireEvent.click(submitButton);

      // Should not call onSubmit when there are validation errors
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should call onCancel when Cancel button is clicked', () => {
      render(
        <CompanyEditForm 
          company={mockCompany}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Loading and Error States', () => {
    it('should show loading state when isSubmitting is true', () => {
      render(
        <CompanyEditForm 
          company={mockCompany}
          isSubmitting={true}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('should disable form fields when isSubmitting is true', () => {
      render(
        <CompanyEditForm 
          company={mockCompany}
          isSubmitting={true}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByDisplayValue('Test Company');
      expect(nameInput).toBeDisabled();
    });

    it('should display error message when error prop is provided', () => {
      const errorMessage = 'Failed to update company';
      render(
        <CompanyEditForm 
          company={mockCompany}
          error={errorMessage}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  describe('Change Detection', () => {
    it('should disable save button when no changes are made', () => {
      render(
        <CompanyEditForm 
          company={mockCompany}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const saveButton = screen.getByText('Save Changes');
      expect(saveButton).toBeDisabled();
    });

    it('should enable save button when changes are made', () => {
      render(
        <CompanyEditForm 
          company={mockCompany}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByDisplayValue('Test Company');
      fireEvent.change(nameInput, { target: { value: 'Updated Name' } });

      const saveButton = screen.getByText('Save Changes');
      expect(saveButton).not.toBeDisabled();
    });
  });
});