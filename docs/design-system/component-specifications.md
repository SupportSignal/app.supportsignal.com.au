# SupportSignal Design System - Component Specifications

## Overview

The SupportSignal Design System provides a comprehensive set of healthcare-focused UI components built on proven NDIS system patterns with WCAG 2.1 AA accessibility compliance and consistent SupportSignal branding.

## Design Principles

### 1. Healthcare-First Design
- **Professional Aesthetics**: Clean, clinical interface appropriate for healthcare environments
- **Safety-Critical UX**: Clear visual hierarchy for critical vs. routine information
- **Compliance-Ready**: HIPAA visual privacy and NDIS accessibility standards built-in
- **Multi-User Coordination**: Real-time collaboration patterns for healthcare teams

### 2. SupportSignal Brand Integration
- **Color Psychology**: Teal conveys trust and calm, Navy provides authority and professionalism
- **Consistent Identity**: Logo, typography, and spacing reinforce brand recognition
- **Accessibility Excellence**: Brand colors meet WCAG contrast requirements
- **Scalable Branding**: Design tokens enable consistent application across components

### 3. Developer Experience
- **TypeScript-First**: Comprehensive type safety for healthcare data handling
- **Composable Architecture**: Components can be combined for complex workflows
- **Performance Optimized**: Lazy loading and efficient re-rendering patterns
- **Testing-Ready**: Built-in accessibility and unit testing support

## Color System

### Primary Brand Colors

```typescript
const SupportSignalColors = {
  // Teal Gradient System (Primary Brand)
  'teal-light': '#3CD7C4',    // Hover states, accents
  'teal-mid': '#2CC4B7',      // Primary CTAs, progress indicators  
  'teal-deep': '#1798A2',     // Active states, borders
  
  // Supporting Colors
  'navy': '#0C2D55',          // Headers, primary text
  'cta-blue': '#287BCB',      // Secondary actions, links
  'success-green': '#27AE60', // Success states, confirmations
  'alert-amber': '#F2C94C',   // Warnings, attention states
  'bg-grey': '#F4F7FA',       // Backgrounds, subtle sections
}
```

### Semantic Color Usage

| Context | Primary | Secondary | State Colors |
|---------|---------|-----------|--------------|
| **Critical Alerts** | `alert-amber` | `navy` | Error: `#E74C3C` |
| **Success Actions** | `success-green` | `navy` | Success: `success-green` |
| **Primary Actions** | `teal-mid` | `white` | Hover: `teal-light` |
| **Secondary Actions** | `cta-blue` | `white` | Hover: `#2068A3` |
| **Navigation** | `bg-grey` | `navy` | Active: `teal-deep` |

### Accessibility Compliance
- **Minimum Contrast**: 4.5:1 for normal text, 3:1 for large text
- **Color Independence**: Information never conveyed by color alone
- **High Contrast Mode**: Alternative color schemes for accessibility needs

## Typography System

### Font Family
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
```

### Type Scale
```typescript
const TypographyScale = {
  // Display Headers
  'display-xl': { fontSize: '4.5rem', lineHeight: '1.1', fontWeight: '700' },   // 72px
  'display-lg': { fontSize: '3.75rem', lineHeight: '1.1', fontWeight: '700' },  // 60px
  'display-md': { fontSize: '3rem', lineHeight: '1.2', fontWeight: '700' },     // 48px
  
  // Content Headers
  'heading-xl': { fontSize: '2.25rem', lineHeight: '1.3', fontWeight: '600' },  // 36px - Page titles
  'heading-lg': { fontSize: '1.875rem', lineHeight: '1.3', fontWeight: '600' }, // 30px - Section headers
  'heading-md': { fontSize: '1.5rem', lineHeight: '1.4', fontWeight: '600' },   // 24px - Component titles
  'heading-sm': { fontSize: '1.25rem', lineHeight: '1.4', fontWeight: '600' },  // 20px - Subsections
  
  // Body Text
  'body-xl': { fontSize: '1.25rem', lineHeight: '1.6', fontWeight: '400' },     // 20px - Large body
  'body-lg': { fontSize: '1.125rem', lineHeight: '1.6', fontWeight: '400' },    // 18px - Primary body
  'body-md': { fontSize: '1rem', lineHeight: '1.6', fontWeight: '400' },        // 16px - Standard body
  'body-sm': { fontSize: '0.875rem', lineHeight: '1.5', fontWeight: '400' },    // 14px - Secondary text
  'body-xs': { fontSize: '0.75rem', lineHeight: '1.4', fontWeight: '400' },     // 12px - Captions, labels
}
```

### Healthcare Typography Guidelines
- **Readability First**: Minimum 16px for body text in healthcare applications
- **Hierarchy Clarity**: Clear distinction between header levels for screen readers
- **Professional Tone**: Semi-bold (600) for headers, regular (400) for body content
- **Sufficient Line Height**: 1.6 for body text to support dyslexic users

## Spacing System

### Base Spacing Scale
```typescript
const SpacingScale = {
  'xs': '0.5rem',    // 8px - Tight spacing, form elements
  'sm': '0.75rem',   // 12px - Component internal spacing
  'md': '1rem',      // 16px - Standard component spacing
  'lg': '1.5rem',    // 24px - Section spacing
  'xl': '2rem',      // 32px - Layout spacing
  '2xl': '3rem',     // 48px - Large section breaks
  '3xl': '4rem',     // 64px - Page section spacing
}
```

### Layout Grid
```typescript
const LayoutSystem = {
  // Container Widths
  maxWidth: '1400px',      // Maximum content width
  sidebarWidth: '240px',   // Fixed navigation sidebar
  contentPadding: '2rem',  // Main content padding
  
  // Responsive Breakpoints
  breakpoints: {
    'sm': '640px',   // Mobile landscape
    'md': '768px',   // Tablet
    'lg': '1024px',  // Desktop
    'xl': '1280px',  // Large desktop
    '2xl': '1536px', // Extra large
  }
}
```

### Healthcare Spacing Guidelines
- **Touch Targets**: Minimum 48px for interactive elements
- **Form Spacing**: 24px vertical spacing between form groups
- **Card Spacing**: 16px internal padding, 24px between cards
- **Emergency Elements**: Increased spacing (32px+) for critical actions

## Component Architecture

### Base Component Pattern
```typescript
interface BaseComponentProps {
  // Standard React props
  children?: React.ReactNode;
  className?: string;
  
  // SupportSignal standard props
  variant?: 'default' | 'compact' | 'full' | 'minimal';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  
  // Accessibility props
  'aria-label'?: string;
  'aria-describedby'?: string;
  
  // Healthcare context props
  priority?: 'low' | 'medium' | 'high' | 'critical';
  confidential?: boolean;
  
  // Permission props
  requiredPermission?: string;
  userRole?: 'system_admin' | 'company_admin' | 'team_lead' | 'frontline_worker';
}
```

### Component Categories

#### 1. Foundation Components
**Purpose**: Core building blocks for all healthcare interfaces

##### StatusBadge
```typescript
interface StatusBadgeProps extends BaseComponentProps {
  status: 'draft' | 'in_progress' | 'completed' | 'error' | 'warning';
  showIcon?: boolean;
  showTimestamp?: boolean;
  lastUpdated?: string;
  workflow?: 'capture' | 'analysis' | 'review';
}
```

**Usage Examples**:
- Incident capture status indicators
- Analysis workflow progress markers  
- User session status displays
- System health monitoring

**Accessibility Features**:
- `role="status"` for status announcements
- `aria-live="polite"` for non-critical updates
- Color-independent status communication

##### ActionButton
```typescript
interface ActionButtonProps extends BaseComponentProps {
  intent: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ComponentType;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  
  // Healthcare specific
  requireConfirmation?: boolean;
  confirmationMessage?: string;
  auditAction?: string;
}
```

#### 2. Workflow Components  
**Purpose**: Multi-step process management for healthcare workflows

##### WorkflowProgress
```typescript
interface WorkflowProgressProps extends BaseComponentProps {
  workflow: {
    id: string;
    title: string;
    currentPhase: string;
    phases: WorkflowPhase[];
    metadata?: Record<string, any>;
  };
  orientation?: 'horizontal' | 'vertical';
  showMetadata?: boolean;
  allowNavigation?: boolean;
  onPhaseClick?: (phaseId: string) => void;
  onStepUpdate?: (stepId: string, completed: boolean) => void;
}

interface WorkflowPhase {
  id: string;
  name: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'error';
  progress: number; // 0-100
  steps: WorkflowStep[];
  estimatedTime?: string;
  assignedTo?: string;
}
```

**Use Cases**:
- Incident capture workflow (5-7 steps)
- Analysis and classification process
- User onboarding and training
- Compliance audit workflows

##### WorkflowWizard
```typescript
interface WorkflowWizardProps extends BaseComponentProps {
  workflow: WizardWorkflow;
  currentStep: number;
  data: Record<string, any>;
  validation?: Record<string, (value: any) => boolean>;
  
  // Navigation controls
  allowSkipSteps?: boolean;
  allowBackNavigation?: boolean;
  autoSave?: boolean;
  
  // Event handlers
  onStepChange: (step: number) => void;
  onComplete: (data: Record<string, any>) => void;
  onCancel: () => void;
  onDataChange: (data: Record<string, any>) => void;
}
```

#### 3. Data Display Components
**Purpose**: Healthcare data presentation with proper hierarchy

##### IncidentCard
```typescript
interface IncidentCardProps extends BaseComponentProps {
  incident: Incident;
  variant: 'full' | 'compact' | 'summary';
  showActions?: boolean;
  showMetadata?: boolean;
  actionPermissions?: string[];
  
  // Real-time features
  collaborators?: User[];
  lastModified?: string;
  syncStatus?: 'synced' | 'syncing' | 'conflict';
  
  // Event handlers
  onStatusUpdate?: (status: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onClick?: () => void;
}
```

**Visual Hierarchy**:
1. **Primary**: Participant name, incident status
2. **Secondary**: Location, date/time, reporter
3. **Tertiary**: Workflow progress, collaboration indicators
4. **Actions**: Edit, delete, view details (permission-aware)

##### UserProfile
```typescript
interface UserProfileProps extends BaseComponentProps {
  user: User;
  editable?: boolean;
  showContactInfo?: boolean;
  showMedicalInfo?: boolean;
  showPermissions?: boolean;
  
  // Healthcare context
  department?: string;
  licenseInfo?: LicenseInformation;
  certifications?: Certification[];
  
  // Event handlers
  onEdit?: (updates: Partial<User>) => void;
  onPasswordChange?: () => void;
  onPermissionRequest?: (permission: string) => void;
}
```

#### 4. Real-time Components
**Purpose**: Live collaboration and system monitoring

##### LiveStatusIndicator
```typescript
interface LiveStatusIndicatorProps extends BaseComponentProps {
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  dataType: 'patient_vitals' | 'lab_results' | 'medication_orders' | 'system_alerts';
  lastUpdate?: string;
  updateFrequency?: number;
  showTimestamp?: boolean;
  criticalLevel?: boolean;
  
  // Healthcare specific
  patientId?: string;
  location?: string;
  monitoringType?: string;
}
```

##### NotificationCenter
```typescript
interface NotificationCenterProps extends BaseComponentProps {
  notifications: Notification[];
  maxVisible?: number;
  filterOptions?: NotificationFilter[];
  groupByCategory?: boolean;
  showPriority?: boolean;
  
  // Healthcare features
  emergencyMode?: boolean;
  hipaaCompliant?: boolean;
  auditLogging?: boolean;
  
  // Event handlers
  onNotificationClick: (notification: Notification) => void;
  onMarkAsRead: (notificationId: string) => void;
  onDismiss: (notificationId: string) => void;
  onFilter: (filter: NotificationFilter) => void;
}
```

## Component States

### Standard States
All components support these standard interaction states:

```typescript
type ComponentState = {
  default: boolean;     // Normal, interactive state
  hover: boolean;       // Mouse hover state
  focus: boolean;       // Keyboard focus state  
  active: boolean;      // Click/press state
  disabled: boolean;    // Non-interactive state
  loading: boolean;     // Async operation state
  error: boolean;       // Error condition state
}
```

### Healthcare-Specific States
```typescript
type HealthcareState = {
  critical: boolean;    // Requires immediate attention
  confidential: boolean; // HIPAA-protected information
  collaborative: boolean; // Multi-user editing active
  audit: boolean;       // Action requires audit logging
  emergency: boolean;   // Emergency/crisis mode
  offline: boolean;     // Offline mode with sync pending
}
```

## Responsive Design Patterns

### Mobile-First Approach
```scss
// Component responsive pattern
.incident-card {
  // Mobile base styles (320px+)
  padding: 1rem;
  font-size: 0.875rem;
  
  @media (min-width: 768px) {
    // Tablet styles
    padding: 1.5rem;
    font-size: 1rem;
  }
  
  @media (min-width: 1024px) {
    // Desktop styles
    padding: 2rem;
    font-size: 1.125rem;
  }
}
```

### Touch Target Guidelines
- **Minimum Size**: 48px × 48px for all interactive elements
- **Spacing**: 8px minimum between adjacent touch targets
- **Emergency Actions**: 56px × 56px minimum for critical healthcare actions
- **Accessibility**: Compatible with assistive touch devices

### Layout Adaptation
```typescript
const ResponsiveLayout = {
  // Sidebar behavior
  mobile: 'hidden', // Off-canvas drawer
  tablet: 'collapsible', // Toggle sidebar
  desktop: 'persistent', // Always visible
  
  // Grid systems
  incidentCards: {
    mobile: '1-column',
    tablet: '2-column', 
    desktop: '3-column',
    ultrawide: '4-column'
  },
  
  // Form layouts
  forms: {
    mobile: 'single-column',
    tablet: '2-column',
    desktop: '3-column'
  }
}
```

## Performance Guidelines

### Code Splitting
```typescript
// Lazy load heavy components
const NotificationCenter = React.lazy(() => 
  import('./notification-center').then(module => ({
    default: module.NotificationCenter
  }))
);

const WorkflowWizard = React.lazy(() => 
  import('./workflow-wizard')
);
```

### Memoization Patterns
```typescript
// Expensive computation memoization
const IncidentCard = React.memo<IncidentCardProps>(({ incident, ...props }) => {
  const formattedMetadata = useMemo(() => 
    formatIncidentMetadata(incident), 
    [incident._id, incident.updated_at]
  );
  
  const permissionCheck = useMemo(() =>
    checkUserPermissions(props.userRole, props.requiredPermission),
    [props.userRole, props.requiredPermission]
  );
  
  return (
    // Component JSX
  );
});
```

### Bundle Size Optimization
- **Tree Shaking**: Export individual components, not barrel exports
- **Icon Optimization**: Use icon libraries with tree shaking support
- **CSS Optimization**: Purge unused Tailwind classes in production
- **Component Chunking**: Group related components for optimal loading

## Testing Standards

### Unit Testing Requirements
```typescript
describe('Component Testing Standards', () => {
  // 1. Rendering tests
  it('should render with default props', () => {
    render(<Component />);
    expect(screen.getByRole('...')).toBeInTheDocument();
  });
  
  // 2. Accessibility tests
  it('should have no accessibility violations', async () => {
    const { container } = render(<Component />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  // 3. Interaction tests
  it('should handle user interactions', async () => {
    const handleClick = jest.fn();
    render(<Component onClick={handleClick} />);
    
    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });
  
  // 4. Healthcare-specific tests
  it('should respect permission requirements', () => {
    render(<Component requiredPermission="admin" userRole="frontline_worker" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
```

### Visual Regression Testing
```typescript
// Storybook visual testing
export default {
  title: 'Healthcare Components/IncidentCard',
  component: IncidentCard,
  parameters: {
    chromatic: { 
      viewports: [320, 768, 1200], // Test responsive designs
      modes: {
        light: { theme: 'light' },
        dark: { theme: 'dark' },
        'high-contrast': { theme: 'high-contrast' }
      }
    }
  }
};
```

## Migration and Upgrade Path

### Version Compatibility
- **Semantic Versioning**: Major.Minor.Patch format
- **Breaking Changes**: Only in major versions with migration guides
- **Deprecation Policy**: 2 minor versions notice before removal
- **LTS Support**: Long-term support for healthcare-critical versions

### Component Evolution
```typescript
// Version 1.x - Legacy prop support with warnings
interface ComponentProps {
  /** @deprecated Use 'variant' instead */
  type?: 'primary' | 'secondary';
  
  /** New unified variant system */
  variant?: 'default' | 'compact' | 'full';
}

// Migration helper utilities
const migrateProps = (legacyProps: LegacyProps): ModernProps => {
  if (process.env.NODE_ENV === 'development' && legacyProps.type) {
    console.warn('Prop "type" is deprecated, use "variant" instead');
  }
  
  return {
    ...legacyProps,
    variant: legacyProps.variant || mapLegacyType(legacyProps.type)
  };
};
```

## Implementation Checklist

### New Component Checklist
- [ ] **Component Structure**: Proper TypeScript interfaces and prop definitions
- [ ] **Accessibility**: WCAG 2.1 AA compliance with aria attributes
- [ ] **Responsive Design**: Mobile-first responsive behavior
- [ ] **Brand Compliance**: SupportSignal colors, typography, spacing
- [ ] **Permission Integration**: Role-based visibility where applicable
- [ ] **Testing**: Unit tests, accessibility tests, visual regression tests
- [ ] **Documentation**: Storybook stories with healthcare use cases
- [ ] **Performance**: Memoization and optimization where needed

### Healthcare Compliance Checklist
- [ ] **HIPAA Visual Privacy**: No sensitive data in hover/focus states visible to others
- [ ] **Professional Aesthetics**: Appropriate for clinical environment
- [ ] **Emergency Accessibility**: Enhanced accessibility for critical workflows
- [ ] **Multi-User Support**: Collaboration features accessible to all users
- [ ] **Audit Logging**: User actions properly logged for compliance
- [ ] **Data Validation**: Input validation prevents harmful data entry

---

*This specification document should be updated with each component addition or modification. All new components must follow these specifications for consistent user experience and healthcare compliance.*