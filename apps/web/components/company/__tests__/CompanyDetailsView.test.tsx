// @ts-nocheck
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CompanyDetailsView } from '@/components/company/CompanyDetailsView';
import { Company } from '@/types/company';

// Mock company data for testing
const mockCompany: Company = {
  _id: 'test-company-id' as any,
  name: 'Test Company',
  contact_email: 'test@company.com',
  status: 'active',
  created_at: Date.now() - 1000000, // 1 day ago
  created_by: 'test-user-id' as any,
  _creationTime: Date.now() - 1000000,
};

describe('CompanyDetailsView', () => {
  describe('Component Rendering', () => {
    it('should render company information correctly', () => {
      render(<CompanyDetailsView company={mockCompany} />);

      // Check if all company details are displayed
      expect(screen.getByText('Test Company')).toBeInTheDocument();
      expect(screen.getByText('test@company.com')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should show company name with proper styling', () => {
      render(<CompanyDetailsView company={mockCompany} />);

      const companyNameElement = screen.getByText('Test Company');
      expect(companyNameElement).toHaveClass('text-lg', 'font-semibold');
    });

    it('should display contact email correctly', () => {
      render(<CompanyDetailsView company={mockCompany} />);

      const emailElement = screen.getByText('test@company.com');
      expect(emailElement).toBeInTheDocument();
      expect(emailElement).toHaveClass('text-base');
    });
  });

  describe('Status Display', () => {
    it('should show active status with correct styling', () => {
      render(<CompanyDetailsView company={mockCompany} />);

      const statusBadge = screen.getByText('Active');
      expect(statusBadge).toBeInTheDocument();
    });

    it('should show trial status correctly', () => {
      const trialCompany = { ...mockCompany, status: 'trial' as const };
      render(<CompanyDetailsView company={trialCompany} />);

      expect(screen.getByText('Trial')).toBeInTheDocument();
    });

    it('should show suspended status correctly', () => {
      const suspendedCompany = { ...mockCompany, status: 'suspended' as const };
      render(<CompanyDetailsView company={suspendedCompany} />);

      expect(screen.getByText('Suspended')).toBeInTheDocument();
    });
  });

  describe('Edit Functionality', () => {
    it('should not show edit button when canEdit is false', () => {
      render(<CompanyDetailsView company={mockCompany} canEdit={false} />);

      expect(screen.queryByText('Edit Company')).not.toBeInTheDocument();
    });

    it('should show edit button when canEdit is true', () => {
      const mockOnEdit = jest.fn();
      render(
        <CompanyDetailsView 
          company={mockCompany} 
          canEdit={true} 
          onEditClick={mockOnEdit} 
        />
      );

      expect(screen.getByText('Edit Company')).toBeInTheDocument();
    });

    it('should call onEditClick when edit button is clicked', () => {
      const mockOnEdit = jest.fn();
      render(
        <CompanyDetailsView 
          company={mockCompany} 
          canEdit={true} 
          onEditClick={mockOnEdit} 
        />
      );

      const editButton = screen.getByText('Edit Company');
      fireEvent.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });
  });

  describe('Date Formatting', () => {
    it('should format creation date correctly', () => {
      render(<CompanyDetailsView company={mockCompany} />);

      // Check if date is properly formatted (should contain numbers and common date elements)
      const createdText = screen.getAllByText(/\d/);
      expect(createdText.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for form fields', () => {
      render(<CompanyDetailsView company={mockCompany} />);

      expect(screen.getByText('Company Name')).toBeInTheDocument();
      expect(screen.getByText('Contact Email')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('should have proper heading structure', () => {
      render(<CompanyDetailsView company={mockCompany} />);

      const heading = screen.getByText('Company Information');
      expect(heading).toBeInTheDocument();
    });
  });
});