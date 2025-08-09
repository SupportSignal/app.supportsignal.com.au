// @ts-nocheck
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PermissionIndicator, Permission } from '@/components/user/permission-indicator';
import { 
  healthcarePermissions, 
  healthcareTestUtils,
  healthcareUserRoles 
} from '../../../fixtures/healthcare';
import { 
  testHealthcareAccessibility,
  testKeyboardNavigation,
  testScreenReaderAnnouncements,
  healthcareA11yUtils
} from '../../../utils/accessibility';

// Mock UI components
jest.mock('@starter/ui', () => ({
  Badge: ({ children, className, variant, ...props }: any) => (
    <span className={`badge ${variant || 'default'} ${className}`} {...props}>
      {children}
    </span>
  ),
  Button: ({ children, className, size, variant, onClick, ...props }: any) => (
    <button 
      className={`button ${size || 'default'} ${variant || 'default'} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  ),
  Card: ({ children, className, ...props }: any) => (
    <div className={`card ${className}`} {...props}>{children}</div>
  ),
  CardContent: ({ children, className, ...props }: any) => (
    <div className={`card-content ${className}`} {...props}>{children}</div>
  ),
  CardHeader: ({ children, className, ...props }: any) => (
    <div className={`card-header ${className}`} {...props}>{children}</div>
  ),
  CardTitle: ({ children, className, ...props }: any) => (
    <h3 className={`card-title ${className}`} {...props}>{children}</h3>
  ),
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Shield: ({ className, ...props }: any) => <div className={`icon shield ${className}`} {...props} data-testid="shield-icon" />,
  Crown: ({ className, ...props }: any) => <div className={`icon crown ${className}`} {...props} data-testid="crown-icon" />,
  Users: ({ className, ...props }: any) => <div className={`icon users ${className}`} {...props} data-testid="users-icon" />,
  UserCheck: ({ className, ...props }: any) => <div className={`icon user-check ${className}`} {...props} data-testid="usercheck-icon" />,
  AlertTriangle: ({ className, ...props }: any) => <div className={`icon alert-triangle ${className}`} {...props} data-testid="alert-triangle-icon" />,
  CheckCircle: ({ className, ...props }: any) => <div className={`icon check-circle ${className}`} {...props} data-testid="check-circle-icon" />,
  X: ({ className, ...props }: any) => <div className={`icon x ${className}`} {...props} data-testid="x-icon" />,
  Eye: ({ className, ...props }: any) => <div className={`icon eye ${className}`} {...props} data-testid="eye-icon" />,
  Lock: ({ className, ...props }: any) => <div className={`icon lock ${className}`} {...props} data-testid="lock-icon" />,
  Unlock: ({ className, ...props }: any) => <div className={`icon unlock ${className}`} {...props} data-testid="unlock-icon" />,
  Settings: ({ className, ...props }: any) => <div className={`icon settings ${className}`} {...props} data-testid="settings-icon" />,
  FileText: ({ className, ...props }: any) => <div className={`icon file-text ${className}`} {...props} data-testid="filetext-icon" />,
  BarChart3: ({ className, ...props }: any) => <div className={`icon bar-chart ${className}`} {...props} data-testid="barchart-icon" />,
  Database: ({ className, ...props }: any) => <div className={`icon database ${className}`} {...props} data-testid="database-icon" />,
}));

// Mock utils
jest.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

describe('PermissionIndicator - Healthcare Compliance', () => {
  const mockOnPermissionToggle = jest.fn();
  const mockOnViewDetails = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Healthcare Role-Based Access Control', () => {
    it('renders system admin with dangerous permissions correctly', () => {
      const permissions = healthcarePermissions.system_admin;
      
      render(
        <PermissionIndicator
          userRole="system_admin"
          permissions={permissions}
          onPermissionToggle={mockOnPermissionToggle}
          onViewDetails={mockOnViewDetails}
        />
      );

      // Verify system admin role display
      expect(screen.getByText('System Administrator')).toBeInTheDocument();
      expect(screen.getByTestId('crown-icon')).toBeInTheDocument();

      // Check dangerous permissions warning
      const dangerousPermissions = permissions.filter(p => p.isDangerous && p.isGranted);
      expect(screen.getByText(/elevated permissions/i)).toBeInTheDocument();
      expect(screen.getByText(dangerousPermissions.length.toString())).toBeInTheDocument();
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
    });

    it('renders company admin with restricted system access', () => {
      const permissions = healthcarePermissions.company_admin;
      
      render(
        <PermissionIndicator
          userRole="company_admin"
          permissions={permissions}
          onPermissionToggle={mockOnPermissionToggle}
        />
      );

      expect(screen.getByText('Company Administrator')).toBeInTheDocument();
      expect(screen.getByTestId('shield-icon')).toBeInTheDocument();

      // Should have company permissions but not system admin permissions
      expect(screen.getByText('Company Settings')).toBeInTheDocument();
      expect(screen.queryByText('Database Administration')).not.toBeInTheDocument();
    });

    it('renders team lead with limited access', () => {
      const permissions = healthcarePermissions.team_lead;
      
      render(
        <PermissionIndicator
          userRole="team_lead"
          permissions={permissions}
          onPermissionToggle={mockOnPermissionToggle}
        />
      );

      expect(screen.getByText('Team Leader')).toBeInTheDocument();
      expect(screen.getByTestId('users-icon')).toBeInTheDocument();

      // Should have incident management but not company admin permissions
      expect(screen.getByText('Team Incident Management')).toBeInTheDocument();
      expect(screen.queryByText('Company Configuration')).not.toBeInTheDocument();
    });

    it('renders frontline worker with minimal permissions', () => {
      const permissions = healthcarePermissions.frontline_worker;
      
      render(
        <PermissionIndicator
          userRole="frontline_worker"
          permissions={permissions}
          onPermissionToggle={mockOnPermissionToggle}
        />
      );

      expect(screen.getByText('Frontline Worker')).toBeInTheDocument();
      expect(screen.getByTestId('usercheck-icon')).toBeInTheDocument();

      // Should have very limited permissions
      expect(screen.getByText('Incident Reporting')).toBeInTheDocument();
      expect(screen.queryByText('User Management')).not.toBeInTheDocument();
      expect(screen.queryByText('Company Analytics')).not.toBeInTheDocument();

      // Many permissions should be denied
      const deniedPermissions = permissions.filter(p => !p.isGranted);
      expect(deniedPermissions.length).toBeGreaterThan(3);
    });

    it('correctly categorizes permissions by healthcare domains', () => {
      const permissions = healthcarePermissions.system_admin;
      
      render(
        <PermissionIndicator
          userRole="system_admin"
          permissions={permissions}
          showCategories={true}
        />
      );

      // Check for healthcare-specific categories
      expect(screen.getByText('System')).toBeInTheDocument();
      expect(screen.getByText('Company')).toBeInTheDocument();
      expect(screen.getByText('Incidents')).toBeInTheDocument();
      expect(screen.getByText('Analysis')).toBeInTheDocument();
      expect(screen.getByText('Reports')).toBeInTheDocument();
      expect(screen.getByText('Users')).toBeInTheDocument();

      // Check category icons are present
      expect(screen.getByTestId('settings-icon')).toBeInTheDocument(); // System
      expect(screen.getByTestId('filetext-icon')).toBeInTheDocument(); // Incidents
      expect(screen.getByTestId('barchart-icon')).toBeInTheDocument(); // Analysis
      expect(screen.getByTestId('database-icon')).toBeInTheDocument(); // Reports
    });
  });

  describe('Healthcare Data Privacy & Security', () => {
    it('does not expose sensitive permission details in DOM attributes', () => {
      const permissions = healthcarePermissions.system_admin;
      
      render(
        <PermissionIndicator
          userRole="system_admin"
          permissions={permissions}
        />
      );

      // Check that sensitive data is not exposed in data attributes or IDs
      const domElement = screen.getByRole('main') || document.body;
      const htmlContent = domElement.innerHTML;

      // Should not contain sensitive identifiers
      expect(htmlContent).not.toMatch(/perm_\d{3}/); // Permission IDs
      expect(htmlContent).not.toMatch(/user_\d{3}/); // User IDs
      expect(htmlContent).not.toMatch(/company_\d{3}/); // Company IDs

      // Permission names should be displayed but not internal IDs
      expect(screen.getByText('System Configuration')).toBeInTheDocument();
      expect(screen.getByText('Database Administration')).toBeInTheDocument();
    });

    it('masks dangerous permission details appropriately', () => {
      const permissions = healthcarePermissions.system_admin;
      
      render(
        <PermissionIndicator
          userRole="system_admin"
          permissions={permissions}
          showDangerous={true}
        />
      );

      // Dangerous permissions should be clearly marked
      const dangerousSection = screen.getByText(/elevated permissions/i).closest('div');
      expect(dangerousSection).toHaveClass('bg-red-50');
      expect(dangerousSection).toContainElement(screen.getByTestId('alert-triangle-icon'));

      // Should list dangerous permissions but not expose internal structure
      expect(screen.getByText('System Configuration')).toBeInTheDocument();
      expect(screen.getByText('Database Administration')).toBeInTheDocument();
    });

    it('properly handles permission inheritance indicators', () => {
      const permissions = healthcareTestUtils.createPermissions('team_lead', [
        { id: 'perm_015', inheritedFrom: 'role' },
        { id: 'perm_016', inheritedFrom: 'direct' },
      ]);
      
      render(
        <PermissionIndicator
          userRole="team_lead"
          permissions={permissions}
          showInheritance={true}
        />
      );

      // Check inheritance badges are present
      expect(screen.getByText('Role')).toBeInTheDocument();
      expect(screen.getByText('Direct')).toBeInTheDocument();

      // Should not expose inheritance implementation details
      const container = screen.getByRole('main') || document.body;
      expect(container.innerHTML).not.toMatch(/inheritedFrom/);
    });
  });

  describe('WCAG 2.1 AA Accessibility Compliance', () => {
    it('meets healthcare accessibility standards', async () => {
      const permissions = healthcarePermissions.company_admin;
      const { container } = render(
        <PermissionIndicator
          userRole="company_admin"
          permissions={permissions}
        />
      );

      // Run comprehensive accessibility tests
      await testHealthcareAccessibility(container, 'PermissionIndicator');
    });

    it('supports keyboard navigation for healthcare users', async () => {
      const permissions = healthcarePermissions.team_lead;
      const { container } = render(
        <PermissionIndicator
          userRole="team_lead"
          permissions={permissions}
          onPermissionToggle={mockOnPermissionToggle}
          onViewDetails={mockOnViewDetails}
        />
      );

      // Count expected interactive elements
      const grantedPermissions = permissions.filter(p => p.isGranted);
      const deniedPermissions = permissions.filter(p => !p.isGranted);
      const expectedButtons = grantedPermissions.length * 2 + deniedPermissions.length * 2; // Toggle + View for each

      // Test keyboard navigation
      const focusableElements = await testKeyboardNavigation(container, expectedButtons);
      
      // All buttons should be keyboard accessible
      focusableElements.forEach(element => {
        expect(element).not.toHaveAttribute('tabindex', '-1');
      });
    });

    it('provides proper screen reader announcements', () => {
      const permissions = healthcarePermissions.frontline_worker;
      const { container } = render(
        <PermissionIndicator
          userRole="frontline_worker"
          permissions={permissions}
        />
      );

      const announcements = testScreenReaderAnnouncements(container);
      
      // Should have status regions for permission counts
      expect(announcements.hasAnnouncements).toBe(true);
      
      // Check for accessible role descriptions
      expect(screen.getByText('Frontline Worker')).toHaveAttribute('class', expect.stringContaining('font-semibold'));
      
      // Permission status should be accessible
      const grantedCount = permissions.filter(p => p.isGranted).length;
      expect(screen.getByText(grantedCount.toString())).toBeInTheDocument();
    });

    it('has proper ARIA labels for healthcare context', () => {
      const permissions = healthcarePermissions.system_admin;
      
      render(
        <PermissionIndicator
          userRole="system_admin"
          permissions={permissions}
          onPermissionToggle={mockOnPermissionToggle}
          onViewDetails={mockOnViewDetails}
        />
      );

      // Check for healthcare-specific ARIA labels
      const toggleButtons = screen.getAllByRole('button');
      const viewButtons = toggleButtons.filter(btn => btn.textContent?.includes('View') || btn.innerHTML?.includes('eye'));
      const permissionButtons = toggleButtons.filter(btn => 
        btn.textContent?.includes('Grant') || btn.textContent?.includes('Revoke')
      );

      // View buttons should have accessible names
      viewButtons.forEach(button => {
        expect(button).toHaveAccessibleName();
      });

      // Permission toggle buttons should be clearly labeled
      permissionButtons.forEach(button => {
        expect(button).toHaveAccessibleName();
        expect(button.textContent).toMatch(/Grant|Revoke/);
      });
    });

    it('provides proper focus management', async () => {
      const user = userEvent.setup();
      const permissions = healthcarePermissions.team_lead;
      
      render(
        <PermissionIndicator
          userRole="team_lead"
          permissions={permissions}
          onPermissionToggle={mockOnPermissionToggle}
          onViewDetails={mockOnViewDetails}
        />
      );

      // Focus should be manageable with keyboard
      const firstButton = screen.getAllByRole('button')[0];
      firstButton.focus();
      
      expect(document.activeElement).toBe(firstButton);

      // Tab navigation should work
      await user.tab();
      expect(document.activeElement).not.toBe(firstButton);
      expect(document.activeElement).toBeInstanceOf(HTMLButtonElement);
    });
  });

  describe('Healthcare Permission Management Actions', () => {
    it('calls permission toggle with audit context', async () => {
      const user = userEvent.setup();
      const permissions = healthcarePermissions.team_lead;
      
      render(
        <PermissionIndicator
          userRole="team_lead"
          permissions={permissions}
          onPermissionToggle={mockOnPermissionToggle}
        />
      );

      // Find a revoke button for granted permission
      const revokeButton = screen.getAllByText('Revoke')[0];
      await user.click(revokeButton);

      expect(mockOnPermissionToggle).toHaveBeenCalledWith(
        expect.stringMatching(/perm_\d+/),
        false
      );
    });

    it('calls view details with permission context', async () => {
      const user = userEvent.setup();
      const permissions = healthcarePermissions.company_admin;
      
      render(
        <PermissionIndicator
          userRole="company_admin"
          permissions={permissions}
          onViewDetails={mockOnViewDetails}
        />
      );

      // Find a view button
      const viewButtons = screen.getAllByTestId('eye-icon');
      const firstViewButton = viewButtons[0].closest('button');
      
      await user.click(firstViewButton!);

      expect(mockOnViewDetails).toHaveBeenCalledWith(
        expect.stringMatching(/perm_\d+/)
      );
    });

    it('respects read-only mode for healthcare compliance', () => {
      const permissions = healthcarePermissions.system_admin;
      
      render(
        <PermissionIndicator
          userRole="system_admin"
          permissions={permissions}
          readOnly={true}
          onPermissionToggle={mockOnPermissionToggle}
        />
      );

      // Should not show toggle buttons in read-only mode
      expect(screen.queryByText('Grant')).not.toBeInTheDocument();
      expect(screen.queryByText('Revoke')).not.toBeInTheDocument();
      expect(screen.queryByTestId('lock-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('unlock-icon')).not.toBeInTheDocument();
    });

    it('prevents unauthorized permission modifications', () => {
      const permissions = healthcarePermissions.frontline_worker;
      
      render(
        <PermissionIndicator
          userRole="frontline_worker"
          permissions={permissions}
          onPermissionToggle={mockOnPermissionToggle}
        />
      );

      // Frontline worker should have very limited granted permissions
      const grantedPermissions = permissions.filter(p => p.isGranted);
      expect(grantedPermissions.length).toBeLessThan(5);

      // Most permissions should be denied and not toggleable
      const deniedPermissions = permissions.filter(p => !p.isGranted);
      expect(deniedPermissions.length).toBeGreaterThan(grantedPermissions.length);
    });
  });

  describe('Healthcare Component Variants', () => {
    it('renders minimal variant for space-constrained healthcare UI', () => {
      const permissions = healthcarePermissions.team_lead;
      
      render(
        <PermissionIndicator
          userRole="team_lead"
          permissions={permissions}
          variant="minimal"
        />
      );

      // Should show condensed information
      const grantedCount = permissions.filter(p => p.isGranted).length;
      expect(screen.getByText(`${grantedCount} permissions`)).toBeInTheDocument();
      
      // Should show dangerous permission count if any
      const dangerousCount = permissions.filter(p => p.isDangerous && p.isGranted).length;
      if (dangerousCount > 0) {
        expect(screen.getByText(`${dangerousCount} elevated`)).toBeInTheDocument();
      }

      // Should not show detailed categories in minimal mode
      expect(screen.queryByText('System')).not.toBeInTheDocument();
      expect(screen.queryByText('Company')).not.toBeInTheDocument();
    });

    it('renders summary variant with healthcare metrics', () => {
      const permissions = healthcarePermissions.company_admin;
      
      render(
        <PermissionIndicator
          userRole="company_admin"
          permissions={permissions}
          variant="summary"
        />
      );

      // Should show role information
      expect(screen.getByText('Company Administrator')).toBeInTheDocument();
      
      // Should show permission coverage percentage
      const grantedCount = permissions.filter(p => p.isGranted).length;
      const coverage = Math.round((grantedCount / permissions.length) * 100);
      expect(screen.getByText(`${coverage}%`)).toBeInTheDocument();
      expect(screen.getByText('Coverage')).toBeInTheDocument();

      // Should show dangerous permission warning if applicable
      const dangerousCount = permissions.filter(p => p.isDangerous && p.isGranted).length;
      if (dangerousCount > 0) {
        expect(screen.getByText(`${dangerousCount} elevated permissions granted`)).toBeInTheDocument();
      }
    });

    it('renders compact variant for healthcare dashboards', () => {
      const permissions = healthcarePermissions.frontline_worker;
      
      render(
        <PermissionIndicator
          userRole="frontline_worker"
          permissions={permissions}
          variant="compact"
        />
      );

      // Should show role badge
      expect(screen.getByText('Frontline Worker')).toBeInTheDocument();

      // Should show permission statistics
      const grantedCount = permissions.filter(p => p.isGranted).length;
      const deniedCount = permissions.length - grantedCount;
      const dangerousCount = permissions.filter(p => p.isDangerous && p.isGranted).length;

      expect(screen.getByText(grantedCount.toString())).toBeInTheDocument();
      expect(screen.getByText(deniedCount.toString())).toBeInTheDocument();
      expect(screen.getByText(dangerousCount.toString())).toBeInTheDocument();

      expect(screen.getByText('Granted')).toBeInTheDocument();
      expect(screen.getByText('Denied')).toBeInTheDocument();
      expect(screen.getByText('Elevated')).toBeInTheDocument();
    });
  });

  describe('Healthcare Error Handling & Edge Cases', () => {
    it('handles empty permissions gracefully', () => {
      render(
        <PermissionIndicator
          userRole="frontline_worker"
          permissions={[]}
        />
      );

      // Should show zero permissions
      expect(screen.getByText('0 permissions')).toBeInTheDocument();
      expect(screen.getByText('0/0 granted')).toBeInTheDocument();

      // Should show 100% coverage for empty set
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('handles missing permission categories', () => {
      const incompletePermissions: Permission[] = [
        {
          id: 'test_001',
          name: 'Test Permission',
          description: 'Test permission without standard category',
          category: 'unknown' as any,
          level: 'read',
          isGranted: true,
        },
      ];

      render(
        <PermissionIndicator
          userRole="frontline_worker"
          permissions={incompletePermissions}
          showCategories={true}
        />
      );

      // Should handle unknown categories gracefully
      expect(screen.getByText('Test Permission')).toBeInTheDocument();
    });

    it('maintains accessibility with dynamic permission changes', async () => {
      const initialPermissions = healthcarePermissions.team_lead;
      const { rerender, container } = render(
        <PermissionIndicator
          userRole="team_lead"
          permissions={initialPermissions}
        />
      );

      // Initial accessibility check
      await testHealthcareAccessibility(container);

      // Update permissions and recheck accessibility
      const updatedPermissions = healthcareTestUtils.createPermissions('team_lead', [
        { id: 'perm_015', isGranted: false }, // Revoke a permission
      ]);

      rerender(
        <PermissionIndicator
          userRole="team_lead"
          permissions={updatedPermissions}
        />
      );

      // Should maintain accessibility after changes
      await testHealthcareAccessibility(container);
    });
  });

  describe('Healthcare Audit Trail & Compliance', () => {
    it('generates audit-friendly permission change events', async () => {
      const user = userEvent.setup();
      const permissions = healthcarePermissions.team_lead;
      
      const mockAuditHandler = jest.fn();
      
      render(
        <PermissionIndicator
          userRole="team_lead"
          permissions={permissions}
          onPermissionToggle={mockAuditHandler}
        />
      );

      // Perform permission change
      const toggleButton = screen.getAllByText('Grant')[0];
      await user.click(toggleButton);

      // Should call with parameters suitable for audit logging
      expect(mockAuditHandler).toHaveBeenCalledWith(
        expect.stringMatching(/perm_\d+/), // Permission ID
        true // New state
      );

      // Audit handler should be called with consistent parameters
      expect(mockAuditHandler).toHaveBeenCalledTimes(1);
    });

    it('tracks dangerous permission visibility for compliance', () => {
      const permissions = healthcarePermissions.system_admin;
      
      render(
        <PermissionIndicator
          userRole="system_admin"
          permissions={permissions}
          showDangerous={true}
        />
      );

      // Should clearly identify dangerous permissions for audit purposes
      const dangerousPermissions = permissions.filter(p => p.isDangerous && p.isGranted);
      expect(dangerousPermissions.length).toBeGreaterThan(0);

      // Each dangerous permission should be clearly marked
      dangerousPermissions.forEach(permission => {
        expect(screen.getByText(permission.name)).toBeInTheDocument();
      });

      // Warning should be prominently displayed
      expect(screen.getByText(/elevated permissions/i)).toBeInTheDocument();
      expect(screen.getByText(dangerousPermissions.length.toString())).toBeInTheDocument();
    });

    it('provides permission summary for healthcare reporting', () => {
      const permissions = healthcarePermissions.company_admin;
      
      render(
        <PermissionIndicator
          userRole="company_admin"
          permissions={permissions}
          variant="summary"
        />
      );

      // Summary should include key metrics for reporting
      const grantedCount = permissions.filter(p => p.isGranted).length;
      const totalCount = permissions.length;
      const coverage = Math.round((grantedCount / totalCount) * 100);

      expect(screen.getByText(`${grantedCount} active permissions`)).toBeInTheDocument();
      expect(screen.getByText(`${coverage}%`)).toBeInTheDocument();
      expect(screen.getByText('Coverage')).toBeInTheDocument();
    });
  });
});