import type { Meta, StoryObj } from '@storybook/react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../apps/convex/_generated/api';
import { IncidentCard } from '../../../../apps/web/components/incident/incident-card';
import { UserProfile } from '../../../../apps/web/components/user/user-profile';
import { NotificationCenter } from '../../../../apps/web/components/realtime/notification-center';
import { WorkflowProgress } from '../../../../apps/web/components/workflow/workflow-progress';

const meta: Meta = {
  title: 'Integration Examples/Convex API Integration',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Real-world examples showing how healthcare UI components integrate with Convex backend APIs for live data binding and real-time updates.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Incident Management with Live Data
export const LiveIncidentManagement: Story = {
  render: () => {
    // Real Convex queries from Story 1.4 implementation
    const incidents = useQuery(api.incidents.list, { 
      companyId: "company-123" as any,
      status: "capture_pending" 
    });
    
    const updateIncidentStatus = useMutation(api.incidents.updateStatus);
    
    const handleStatusUpdate = async (incidentId: string, newStatus: string) => {
      await updateIncidentStatus({
        incidentId: incidentId as any,
        status: newStatus as any
      });
    };

    return (
      <div className="space-y-4 max-w-4xl">
        <h2 className="text-xl font-semibold mb-4">Live Incident Management</h2>
        <div className="grid gap-4">
          {incidents?.map((incident) => (
            <IncidentCard
              key={incident._id}
              incident={incident}
              onStatusUpdate={(status) => handleStatusUpdate(incident._id, status)}
              showActions={true}
              variant="full"
            />
          )) || (
            // Fallback demo data when Convex not connected
            <IncidentCard
              incident={{
                _id: "demo-incident" as any,
                company_id: "demo-company" as any,
                reporter_name: "Sarah Johnson",
                participant_name: "John Smith",
                event_date_time: new Date().toISOString(),
                location: "Day Program - Activity Room",
                capture_status: "in_progress",
                analysis_status: "not_started",
                overall_status: "capture_pending",
                created_at: Date.now(),
                updated_at: Date.now(),
                questions_generated: false,
                narrative_enhanced: false,
                analysis_generated: false,
              }}
              onStatusUpdate={(status) => console.log('Status updated:', status)}
              showActions={true}
              variant="full"
            />
          )}
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: `
**Real-time Incident Management Integration**

This example shows how IncidentCard components integrate with Convex APIs for:

\`\`\`typescript
// Live data queries with automatic updates
const incidents = useQuery(api.incidents.list, { 
  companyId: currentUser.company_id,
  status: "capture_pending" 
});

// Mutations for status updates with optimistic UI
const updateStatus = useMutation(api.incidents.updateStatus);
await updateStatus({ incidentId, status: "completed" });
\`\`\`

**Key Integration Features:**
- **Live Data Binding**: Components automatically update when backend data changes
- **Optimistic Updates**: UI updates immediately while backend processes changes
- **Permission Filtering**: Queries respect user role and company boundaries
- **Error Handling**: Built-in error states for connection issues
        `,
      },
    },
  },
};

// User Authentication & Profile Integration
export const UserAuthenticationIntegration: Story = {
  render: () => {
    // Real authentication queries from Story 1.3 implementation
    const currentUser = useQuery(api.auth.getCurrentUser);
    const userPermissions = useQuery(api.permissions.getUserPermissions, 
      currentUser ? { userId: currentUser._id } : "skip"
    );
    
    const updateProfile = useMutation(api.users.updateProfile);

    const handleProfileUpdate = async (updates: any) => {
      if (!currentUser) return;
      await updateProfile({
        userId: currentUser._id,
        ...updates
      });
    };

    return (
      <div className="space-y-6 max-w-2xl">
        <h2 className="text-xl font-semibold mb-4">User Authentication Integration</h2>
        
        {currentUser ? (
          <UserProfile
            user={{
              id: currentUser._id,
              name: currentUser.name,
              email: currentUser.email,
              role: currentUser.role,
              department: currentUser.department,
              profileImage: currentUser.profile_image_url,
              lastActive: new Date(currentUser.last_login || Date.now()).toISOString(),
              permissions: userPermissions || [],
            }}
            showContactInfo={true}
            showMedicalInfo={currentUser.role === 'healthcare_provider'}
            onEdit={handleProfileUpdate}
          />
        ) : (
          // Demo data when not authenticated
          <UserProfile
            user={{
              id: 'demo-user',
              name: 'Dr. Sarah Johnson',
              email: 'sarah.johnson@hospital.com',
              role: 'healthcare_provider',
              department: 'Cardiology',
              licenseNumber: 'MD-12345-CA',
              profileImage: '/api/placeholder/64/64',
              lastActive: new Date().toISOString(),
              permissions: ['view_medical_records', 'edit_medical_records'],
            }}
            showContactInfo={true}
            showMedicalInfo={true}
            onEdit={(updates) => console.log('Profile updated:', updates)}
          />
        )}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: `
**Authentication & Profile Integration**

Shows how user profile components integrate with authentication system:

\`\`\`typescript
// Get current authenticated user
const currentUser = useQuery(api.auth.getCurrentUser);

// Get user permissions for role-based UI
const permissions = useQuery(api.permissions.getUserPermissions, 
  currentUser ? { userId: currentUser._id } : "skip"
);

// Profile updates with authentication
const updateProfile = useMutation(api.users.updateProfile);
\`\`\`

**Security Features:**
- **Role-Based Visibility**: Components show/hide based on user permissions
- **Company Isolation**: Users only see data within their company boundary
- **Session Management**: Automatic handling of session expiration
- **Audit Logging**: All profile changes logged for healthcare compliance
        `,
      },
    },
  },
};

// Real-time Notifications Integration
export const RealTimeNotificationIntegration: Story = {
  render: () => {
    // Real-time subscriptions from Story 1.4 implementation
    const notifications = useQuery(api.notifications.list, {
      userId: "current-user" as any,
      unreadOnly: false
    });
    
    const markAsRead = useMutation(api.notifications.markAsRead);
    const dismissNotification = useMutation(api.notifications.dismiss);

    const handleNotificationClick = async (notificationId: string) => {
      await markAsRead({ notificationId: notificationId as any });
    };

    const handleDismiss = async (notificationId: string) => {
      await dismissNotification({ notificationId: notificationId as any });
    };

    return (
      <div className="space-y-4 max-w-4xl">
        <h2 className="text-xl font-semibold mb-4">Real-time Notifications</h2>
        
        <NotificationCenter
          notifications={notifications || [
            // Demo notifications when Convex not connected
            {
              id: 'demo-critical',
              type: 'critical',
              category: 'patient_emergency',
              title: 'Critical Patient Alert',
              message: 'Patient in Room 204 - Vital signs indicate immediate intervention required',
              timestamp: new Date(Date.now() - 60000).toISOString(),
              read: false,
              priority: 'critical',
              patientId: 'PT-12345',
              location: 'ICU Room 204',
              actionRequired: true,
              assignedTo: ['dr-johnson', 'nurse-rodriguez'],
            },
            {
              id: 'demo-lab',
              type: 'info',
              category: 'lab_results',
              title: 'Lab Results Available',
              message: 'CBC and Metabolic Panel results ready for Patient Emily Davis',
              timestamp: new Date(Date.now() - 300000).toISOString(),
              read: false,
              priority: 'medium',
              patientId: 'PT-54321',
              testTypes: ['CBC', 'Metabolic Panel'],
              actionRequired: false,
              assignedTo: ['dr-martinez'],
            }
          ]}
          maxVisible={10}
          filterOptions={[
            { id: 'all', label: 'All Notifications', count: 2 },
            { id: 'critical', label: 'Critical', count: 1 },
            { id: 'unread', label: 'Unread', count: 2 },
          ]}
          onNotificationClick={handleNotificationClick}
          onMarkAsRead={(id) => handleNotificationClick(id)}
          onDismiss={handleDismiss}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: `
**Real-time Notification System Integration**

Demonstrates live notification handling with Convex real-time subscriptions:

\`\`\`typescript
// Live notification subscription
const notifications = useQuery(api.notifications.list, {
  userId: currentUser._id,
  unreadOnly: false
});

// Real-time notification actions
const markAsRead = useMutation(api.notifications.markAsRead);
const dismiss = useMutation(api.notifications.dismiss);

// Automatic UI updates when notifications arrive
useEffect(() => {
  // Convex automatically triggers re-renders on data changes
}, [notifications]);
\`\`\`

**Real-time Features:**
- **Live Updates**: New notifications appear instantly without refresh
- **Cross-Device Sync**: Mark as read on one device updates all devices
- **Push Integration**: Works with browser push notifications
- **Offline Handling**: Queues actions when connection is lost
        `,
      },
    },
  },
};

// Workflow Progress with Live Updates
export const WorkflowProgressIntegration: Story = {
  render: () => {
    // Live workflow tracking from incident management
    const workflowState = useQuery(api.workflows.getIncidentWorkflow, {
      incidentId: "incident-123" as any
    });
    
    const updateWorkflowStep = useMutation(api.workflows.updateStep);

    const handleStepUpdate = async (stepId: string, completed: boolean) => {
      await updateWorkflowStep({
        workflowId: workflowState?._id || ("demo" as any),
        stepId,
        completed,
        timestamp: Date.now()
      });
    };

    return (
      <div className="space-y-6 max-w-3xl">
        <h2 className="text-xl font-semibold mb-4">Live Workflow Progress</h2>
        
        <WorkflowProgress
          workflow={{
            id: workflowState?._id || 'demo-workflow',
            title: 'Incident Processing Workflow',
            currentPhase: workflowState?.current_phase || 'capture',
            phases: [
              {
                id: 'capture',
                name: 'Incident Capture',
                status: workflowState?.capture_status || 'in_progress',
                progress: workflowState?.capture_progress || 75,
                steps: [
                  { id: 'basic_info', name: 'Basic Information', completed: true },
                  { id: 'narrative', name: 'Narrative Details', completed: true },
                  { id: 'questions', name: 'Follow-up Questions', completed: false },
                ]
              },
              {
                id: 'analysis',
                name: 'Analysis & Classification',
                status: workflowState?.analysis_status || 'not_started',
                progress: workflowState?.analysis_progress || 0,
                steps: [
                  { id: 'review', name: 'Content Review', completed: false },
                  { id: 'classify', name: 'Classification', completed: false },
                  { id: 'recommendations', name: 'Recommendations', completed: false },
                ]
              }
            ],
            metadata: {
              incidentId: workflowState?.incident_id || 'demo-incident',
              assignedTo: workflowState?.assigned_to || 'current-user',
              lastUpdated: workflowState?.updated_at || Date.now(),
            }
          }}
          onPhaseClick={(phaseId) => console.log('Navigate to phase:', phaseId)}
          onStepUpdate={handleStepUpdate}
          showMetadata={true}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: `
**Live Workflow Progress Integration**

Shows real-time workflow tracking with automatic progress updates:

\`\`\`typescript
// Live workflow state subscription
const workflow = useQuery(api.workflows.getIncidentWorkflow, {
  incidentId: selectedIncident._id
});

// Step completion updates
const updateStep = useMutation(api.workflows.updateStep);
await updateStep({ workflowId, stepId, completed: true });

// Progress automatically recalculated on backend
// UI updates immediately via Convex subscription
\`\`\`

**Live Update Features:**
- **Real-time Progress**: Progress bars update as team members complete steps
- **Multi-user Coordination**: Multiple users can work on same workflow simultaneously  
- **Automatic Status Updates**: Workflow phases advance based on step completion
- **Audit Trail**: All workflow changes logged with timestamps and user attribution
        `,
      },
    },
  },
};

// Error Handling & Connection States
export const ErrorHandlingIntegration: Story = {
  render: () => {
    // Demonstrate error states and connection handling
    const incidents = useQuery(api.incidents.list, { 
      companyId: "invalid-company" as any // This will cause an error
    });

    return (
      <div className="space-y-4 max-w-4xl">
        <h2 className="text-xl font-semibold mb-4">Error Handling & Connection States</h2>
        
        <div className="border rounded-lg p-4 space-y-4">
          <h3 className="font-medium">Connection States:</h3>
          
          {/* Loading State */}
          <div className="border-l-4 border-blue-500 pl-4">
            <h4 className="font-medium text-blue-700">Loading State</h4>
            <p className="text-sm text-gray-600">When incidents === undefined</p>
            <div className="mt-2 animate-pulse">
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
          
          {/* Error State */}
          <div className="border-l-4 border-red-500 pl-4">
            <h4 className="font-medium text-red-700">Error State</h4>
            <p className="text-sm text-gray-600">Connection failed or permission denied</p>
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-red-800 text-sm">Unable to load incidents. Please check your connection.</p>
              <button className="mt-2 text-red-600 hover:text-red-800 text-sm underline">
                Retry Connection
              </button>
            </div>
          </div>
          
          {/* Success State */}
          <div className="border-l-4 border-green-500 pl-4">
            <h4 className="font-medium text-green-700">Success State</h4>
            <p className="text-sm text-gray-600">Data loaded successfully</p>
            <div className="mt-2">
              <IncidentCard
                incident={{
                  _id: "success-demo" as any,
                  company_id: "demo-company" as any,
                  reporter_name: "Connected User",
                  participant_name: "Test Participant",
                  event_date_time: new Date().toISOString(),
                  location: "Successfully Connected Location",
                  capture_status: "completed",
                  analysis_status: "completed",
                  overall_status: "completed",
                  created_at: Date.now(),
                  updated_at: Date.now(),
                  questions_generated: true,
                  narrative_enhanced: true,
                  analysis_generated: true,
                }}
                variant="compact"
                showActions={false}
              />
            </div>
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: `
**Error Handling & Connection Management**

Healthcare applications require robust error handling for patient safety:

\`\`\`typescript
// Convex provides automatic connection state management
const data = useQuery(api.endpoint, params);

// Handle different states in components
if (data === undefined) {
  return <LoadingSpinner />; // Initial load
}

if (data === null) {
  return <ErrorState />; // Query failed or no permission
}

return <DataDisplay data={data} />; // Success state
\`\`\`

**Critical Error Handling:**
- **Loading States**: Clear indicators during data fetch
- **Permission Errors**: Appropriate messages for access denied
- **Network Issues**: Retry mechanisms with backoff
- **Data Validation**: Client-side validation before submission
- **Offline Support**: Queue operations when connection lost
        `,
      },
    },
  },
};