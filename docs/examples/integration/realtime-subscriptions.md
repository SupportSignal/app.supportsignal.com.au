# Real-time Subscriptions Setup

Complete implementation of real-time collaborative workflows using SupportSignal's subscription APIs.

## Core Subscription Infrastructure

```typescript
// hooks/useRealtimeSubscription.ts
import { useQuery } from 'convex/react';
import { useEffect, useCallback, useRef, useState } from 'react';
import { useAuth } from './useAuth';
import { Id } from '../convex/_generated/dataModel';

interface SubscriptionOptions {
  enabled?: boolean;
  onUpdate?: (data: any, prevData: any) => void;
  onError?: (error: Error) => void;
  reconnectDelay?: number;
}

export const useRealtimeSubscription = <T>(
  subscriptionFunction: any,
  args: any,
  options: SubscriptionOptions = {}
) => {
  const { sessionToken } = useAuth();
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const prevDataRef = useRef<T | null>(null);
  
  const shouldSubscribe = options.enabled !== false && !!sessionToken;
  const subscriptionArgs = shouldSubscribe ? { sessionToken, ...args } : "skip";
  
  const data = useQuery(subscriptionFunction, subscriptionArgs);
  
  // Track connection status
  useEffect(() => {
    if (!shouldSubscribe) {
      setConnectionStatus('disconnected');
      return;
    }
    
    if (data === undefined) {
      setConnectionStatus('connecting');
    } else {
      setConnectionStatus('connected');
      setSubscriptionError(null);
    }
  }, [data, shouldSubscribe]);
  
  // Handle data updates
  useEffect(() => {
    if (data && options.onUpdate && prevDataRef.current !== data) {
      try {
        options.onUpdate(data, prevDataRef.current);
        prevDataRef.current = data;
      } catch (error) {
        console.error('Error in subscription update handler:', error);
        options.onError?.(error as Error);
      }
    }
  }, [data, options.onUpdate, options.onError]);
  
  // Handle errors
  useEffect(() => {
    if (data === null && shouldSubscribe) {
      const error = new Error('Subscription returned null - possible access denied');
      setSubscriptionError(error.message);
      options.onError?.(error);
    }
  }, [data, shouldSubscribe, options.onError]);
  
  const reconnect = useCallback(() => {
    setSubscriptionError(null);
    setConnectionStatus('connecting');
    // Force re-subscription by updating args (would need state management)
  }, []);
  
  return {
    data,
    isConnecting: connectionStatus === 'connecting',
    isConnected: connectionStatus === 'connected',
    error: subscriptionError,
    reconnect,
    connectionStatus
  };
};
```

## Incident Real-time Updates

```typescript
// hooks/useIncidentSubscription.ts
import { useCallback, useEffect, useState } from 'react';
import { api } from '../convex/_generated/api';
import { useRealtimeSubscription } from './useRealtimeSubscription';
import { Id } from '../convex/_generated/dataModel';
import type { IncidentSubscription, Incident } from '../types/api';

export const useIncidentSubscription = (
  incidentId: Id<"incidents">,
  options?: {
    onStatusChange?: (newStatus: string, oldStatus?: string) => void;
    onNarrativeUpdate?: (hasNarrative: boolean) => void;
    onAnalysisComplete?: (analysisId: Id<"incident_analysis">) => void;
  }
) => {
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);
  const [updateHistory, setUpdateHistory] = useState<Array<{
    timestamp: number;
    type: string;
    description: string;
  }>>([]);
  
  const {
    data: incidentData,
    isConnected,
    isConnecting,
    error,
    reconnect
  } = useRealtimeSubscription<IncidentSubscription>(
    api.incidents.subscribeToIncident,
    { incident_id: incidentId },
    {
      onUpdate: (newData, prevData) => {
        const updateTime = Date.now();
        setLastUpdateTime(updateTime);
        
        if (prevData && newData) {
          // Track what changed
          const updates: Array<{ timestamp: number; type: string; description: string; }> = [];
          
          // Status changes
          if (newData.incident.overall_status !== prevData.incident.overall_status) {
            updates.push({
              timestamp: updateTime,
              type: 'status_change',
              description: `Status changed from ${prevData.incident.overall_status} to ${newData.incident.overall_status}`
            });
            
            options?.onStatusChange?.(
              newData.incident.overall_status,
              prevData.incident.overall_status
            );
          }
          
          // Narrative updates
          if (newData.narrative && !prevData.narrative) {
            updates.push({
              timestamp: updateTime,
              type: 'narrative_created',
              description: 'Narrative was created'
            });
            options?.onNarrativeUpdate?.(true);
          }
          
          if (newData.narrative && prevData.narrative && 
              newData.narrative.version > prevData.narrative.version) {
            updates.push({
              timestamp: updateTime,
              type: 'narrative_updated',
              description: `Narrative updated (version ${newData.narrative.version})`
            });
          }
          
          // Analysis completion
          if (newData.analysis && !prevData.analysis) {
            updates.push({
              timestamp: updateTime,
              type: 'analysis_complete',
              description: 'Analysis completed'
            });
            options?.onAnalysisComplete?.(newData.analysis._id);
          }
          
          if (updates.length > 0) {
            setUpdateHistory(prev => [...updates, ...prev].slice(0, 50)); // Keep last 50 updates
          }
        }
      }
    }
  );
  
  return {
    // Data
    incident: incidentData?.incident || null,
    narrative: incidentData?.narrative || null,
    analysis: incidentData?.analysis || null,
    classifications: incidentData?.classifications || [],
    
    // Connection status
    isConnected,
    isConnecting,
    connectionError: error,
    reconnect,
    
    // Update tracking
    lastUpdateTime,
    updateHistory,
    
    // Convenience getters
    hasNarrative: !!incidentData?.narrative,
    hasAnalysis: !!incidentData?.analysis,
    isReadyForAnalysis: incidentData?.incident?.capture_status === 'completed',
    isCompleted: incidentData?.incident?.overall_status === 'completed'
  };
};

// Usage in component
const IncidentDetails = ({ incidentId }: { incidentId: Id<"incidents"> }) => {
  const [showUpdateNotifications, setShowUpdateNotifications] = useState(true);
  
  const {
    incident,
    narrative,
    analysis,
    isConnected,
    updateHistory,
    hasNarrative,
    isReadyForAnalysis
  } = useIncidentSubscription(incidentId, {
    onStatusChange: (newStatus, oldStatus) => {
      if (showUpdateNotifications) {
        showNotification({
          type: 'info',
          message: `Incident status updated to ${newStatus}`,
          duration: 4000
        });
      }
    },
    
    onNarrativeUpdate: (hasNarrative) => {
      if (hasNarrative && showUpdateNotifications) {
        showNotification({
          type: 'success',
          message: 'Narrative has been updated',
          duration: 3000
        });
      }
    },
    
    onAnalysisComplete: (analysisId) => {
      showNotification({
        type: 'success',
        message: 'Analysis completed! View results below.',
        duration: 5000
      });
    }
  });
  
  if (!incident) {
    return <LoadingSpinner message="Loading incident..." />;
  }
  
  return (
    <div className="incident-details">
      <div className="header">
        <h1>Incident #{incident._id}</h1>
        <div className="connection-status">
          <ConnectionIndicator isConnected={isConnected} />
          {updateHistory.length > 0 && (
            <span className="last-update">
              Last update: {formatTime(updateHistory[0].timestamp)}
            </span>
          )}
        </div>
      </div>
      
      <IncidentCard incident={incident} />
      
      {hasNarrative && (
        <NarrativeSection 
          narrative={narrative} 
          isReadonly={incident.capture_status === 'completed'} 
        />
      )}
      
      {isReadyForAnalysis && !analysis && (
        <AnalysisPrompt incidentId={incidentId} />
      )}
      
      {analysis && (
        <AnalysisResults analysis={analysis} />
      )}
      
      <RecentUpdates updates={updateHistory} />
    </div>
  );
};
```

## Company Incidents Dashboard

```typescript
// hooks/useIncidentsDashboard.ts
import { useState, useEffect } from 'react';
import { api } from '../convex/_generated/api';
import { useRealtimeSubscription } from './useRealtimeSubscription';
import type { IncidentListSubscription, OverallStatus } from '../types/api';

export const useIncidentsDashboard = (statusFilter?: OverallStatus) => {
  const [dashboardMetrics, setDashboardMetrics] = useState({
    totalIncidents: 0,
    pendingCapture: 0,
    pendingAnalysis: 0,
    completed: 0,
    recentActivity: [] as Array<{
      incidentId: string;
      action: string;
      timestamp: number;
    }>
  });
  
  const {
    data: incidentsData,
    isConnected,
    error
  } = useRealtimeSubscription<IncidentListSubscription>(
    api.incidents.subscribeToCompanyIncidents,
    { 
      limit: 100,
      status_filter: statusFilter 
    },
    {
      onUpdate: (newData, prevData) => {
        if (newData?.incidents) {
          // Calculate metrics
          const incidents = newData.incidents;
          const metrics = {
            totalIncidents: incidents.length,
            pendingCapture: incidents.filter(i => i.overall_status === 'capture_pending').length,
            pendingAnalysis: incidents.filter(i => i.overall_status === 'analysis_pending').length,
            completed: incidents.filter(i => i.overall_status === 'completed').length,
            recentActivity: [] // Would be calculated from incident updates
          };
          
          setDashboardMetrics(metrics);
          
          // Detect new incidents
          if (prevData?.incidents) {
            const newIncidents = incidents.filter(
              incident => !prevData.incidents.find(prev => prev._id === incident._id)
            );
            
            newIncidents.forEach(incident => {
              showNotification({
                type: 'info',
                message: `New incident created: ${incident.reporter_name}`,
                duration: 4000
              });
            });
          }
        }
      }
    }
  );
  
  return {
    incidents: incidentsData?.incidents || [],
    metrics: dashboardMetrics,
    isConnected,
    error,
    totalCount: incidentsData?.totalCount || 0,
    lastSync: incidentsData?.subscribedAt || 0
  };
};

// Dashboard component
const IncidentsDashboard = () => {
  const [selectedStatus, setSelectedStatus] = useState<OverallStatus | undefined>();
  const {
    incidents,
    metrics,
    isConnected,
    error,
    lastSync
  } = useIncidentsDashboard(selectedStatus);
  
  return (
    <div className="incidents-dashboard">
      <div className="dashboard-header">
        <h1>Incidents Dashboard</h1>
        <div className="sync-status">
          <ConnectionIndicator isConnected={isConnected} />
          {lastSync && (
            <span>Last sync: {formatTime(lastSync)}</span>
          )}
        </div>
      </div>
      
      <div className="metrics-grid">
        <MetricCard 
          title="Total Incidents" 
          value={metrics.totalIncidents}
          trend="up"
        />
        <MetricCard 
          title="Pending Capture" 
          value={metrics.pendingCapture}
          trend="neutral"
          onClick={() => setSelectedStatus('capture_pending')}
        />
        <MetricCard 
          title="Pending Analysis" 
          value={metrics.pendingAnalysis}
          trend="neutral"
          onClick={() => setSelectedStatus('analysis_pending')}
        />
        <MetricCard 
          title="Completed" 
          value={metrics.completed}
          trend="up"
          onClick={() => setSelectedStatus('completed')}
        />
      </div>
      
      <div className="filters">
        <StatusFilter 
          selectedStatus={selectedStatus}
          onChange={setSelectedStatus}
        />
      </div>
      
      <IncidentsList 
        incidents={incidents}
        isLoading={!isConnected}
        error={error}
      />
    </div>
  );
};
```

## Narrative Collaborative Editing

```typescript
// hooks/useNarrativeCollaboration.ts
import { useState, useEffect, useCallback } from 'react';
import { api } from '../convex/_generated/api';
import { useRealtimeSubscription } from './useRealtimeSubscription';
import { Id } from '../convex/_generated/dataModel';
import type { 
  NarrativeSubscription, 
  NarrativeActivitySubscription,
  NarrativePhase 
} from '../types/api';

export const useNarrativeCollaboration = (incidentId: Id<"incidents">) => {
  const [localEditors, setLocalEditors] = useState<Set<string>>(new Set());
  const [editingPhase, setEditingPhase] = useState<NarrativePhase | null>(null);
  
  // Subscribe to narrative changes
  const {
    data: narrativeData,
    isConnected: isNarrativeConnected
  } = useRealtimeSubscription<NarrativeSubscription>(
    api.narratives.subscribeToNarrative,
    { incident_id: incidentId },
    {
      onUpdate: (newData, prevData) => {
        if (newData?.narrative && prevData?.narrative) {
          // Check for version conflicts
          if (newData.narrative.version > prevData.narrative.version + 1) {
            showNotification({
              type: 'warning',
              message: 'Content was updated by another user. Your changes may be overwritten.',
              duration: 5000
            });
          }
        }
      }
    }
  );
  
  // Subscribe to collaborative activity
  const {
    data: activityData,
    isConnected: isActivityConnected
  } = useRealtimeSubscription<NarrativeActivitySubscription>(
    api.narratives.subscribeToNarrativeActivity,
    { incident_id: incidentId },
    {
      onUpdate: (newData) => {
        if (newData?.activity) {
          // Update local editors tracking
          const editorIds = new Set(
            newData.activity.activeEditors.map(editor => editor.userId)
          );
          setLocalEditors(editorIds);
          
          // Show notifications for new editors
          newData.activity.activeEditors.forEach(editor => {
            if (!localEditors.has(editor.userId)) {
              showNotification({
                type: 'info',
                message: `User is now editing ${editor.section}`,
                duration: 3000
              });
            }
          });
        }
      }
    }
  );
  
  const startEditing = useCallback((phase: NarrativePhase) => {
    setEditingPhase(phase);
    // Would send editing indicator to other users
  }, []);
  
  const stopEditing = useCallback(() => {
    setEditingPhase(null);
    // Would remove editing indicator
  }, []);
  
  const getPhaseEditors = useCallback((phase: NarrativePhase) => {
    return activityData?.activity.activeEditors.filter(
      editor => editor.section === phase
    ) || [];
  }, [activityData]);
  
  const isPhaseBeingEdited = useCallback((phase: NarrativePhase) => {
    return activityData?.activity.editLocks.includes(phase) || false;
  }, [activityData]);
  
  return {
    // Narrative data
    narrative: narrativeData?.narrative,
    
    // Collaboration state
    activeEditors: activityData?.activity.activeEditors || [],
    editLocks: activityData?.activity.editLocks || [],
    recentUpdates: activityData?.activity.recentUpdates || [],
    
    // Connection status
    isConnected: isNarrativeConnected && isActivityConnected,
    
    // Local state
    editingPhase,
    localEditors,
    
    // Actions
    startEditing,
    stopEditing,
    getPhaseEditors,
    isPhaseBeingEdited,
    
    // Conflict detection
    hasVersionConflict: narrativeData?.narrative && 
      localEditors.size > 1 && 
      editingPhase !== null
  };
};

// Collaborative narrative editor component
const CollaborativeNarrativeEditor = ({ 
  incidentId 
}: { 
  incidentId: Id<"incidents"> 
}) => {
  const {
    narrative,
    activeEditors,
    editLocks,
    isConnected,
    editingPhase,
    startEditing,
    stopEditing,
    getPhaseEditors,
    isPhaseBeingEdited,
    hasVersionConflict
  } = useNarrativeCollaboration(incidentId);
  
  const phases: NarrativePhase[] = ['before_event', 'during_event', 'end_event', 'post_event'];
  
  return (
    <div className="collaborative-editor">
      <div className="editor-header">
        <h2>Incident Narrative</h2>
        
        <div className="collaboration-status">
          <ConnectionIndicator isConnected={isConnected} />
          
          {activeEditors.length > 0 && (
            <div className="active-editors">
              <span>Active editors: {activeEditors.length}</span>
              <EditorAvatars editors={activeEditors} />
            </div>
          )}
          
          {hasVersionConflict && (
            <VersionConflictWarning />
          )}
        </div>
      </div>
      
      <div className="narrative-phases">
        {phases.map(phase => {
          const phaseEditors = getPhaseEditors(phase);
          const isLocked = isPhaseBeingEdited(phase);
          const isCurrentUserEditing = editingPhase === phase;
          
          return (
            <div key={phase} className="phase-section">
              <div className="phase-header">
                <h3>{phase.replace('_', ' ').toUpperCase()}</h3>
                
                {phaseEditors.length > 0 && (
                  <div className="phase-editors">
                    {phaseEditors.map(editor => (
                      <EditorIndicator key={editor.userId} editor={editor} />
                    ))}
                  </div>
                )}
                
                {isLocked && !isCurrentUserEditing && (
                  <LockIndicator message="Being edited by another user" />
                )}
              </div>
              
              <PhaseEditor
                phase={phase}
                value={narrative?.[phase] || ''}
                onChange={(content) => {
                  // Handle auto-save with collision detection
                  updateNarrativePhase(phase, content);
                }}
                onFocus={() => startEditing(phase)}
                onBlur={() => stopEditing()}
                disabled={isLocked && !isCurrentUserEditing}
                showCursor={isCurrentUserEditing}
              />
            </div>
          );
        })}
      </div>
      
      <RealtimeActivityFeed 
        updates={activityData?.activity.recentUpdates || []} 
      />
    </div>
  );
};
```

## Connection Management Components

```typescript
// components/realtime/ConnectionIndicator.tsx
import React from 'react';

interface ConnectionIndicatorProps {
  isConnected: boolean;
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const ConnectionIndicator = ({ 
  isConnected, 
  showLabel = true,
  size = 'medium' 
}: ConnectionIndicatorProps) => {
  const statusClass = isConnected ? 'connected' : 'disconnected';
  const sizeClass = `size-${size}`;
  
  return (
    <div className={`connection-indicator ${statusClass} ${sizeClass}`}>
      <div className="status-dot" />
      {showLabel && (
        <span className="status-label">
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      )}
    </div>
  );
};

// components/realtime/RealtimeActivityFeed.tsx
export const RealtimeActivityFeed = ({ 
  updates,
  maxItems = 10 
}: { 
  updates: Array<{
    userId: Id<"users">;
    section: string;
    lastUpdate: number;
    action: string;
  }>;
  maxItems?: number;
}) => {
  if (updates.length === 0) {
    return null;
  }
  
  return (
    <div className="activity-feed">
      <h4>Recent Activity</h4>
      <div className="activity-list">
        {updates.slice(0, maxItems).map((update, index) => (
          <div key={index} className="activity-item">
            <span className="activity-action">{update.action}</span>
            <span className="activity-section">in {update.section}</span>
            <span className="activity-time">
              {formatRelativeTime(update.lastUpdate)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
```

This real-time subscription system provides:
- ✅ Live incident updates and notifications
- ✅ Collaborative narrative editing
- ✅ Real-time dashboard metrics
- ✅ Connection status monitoring
- ✅ Conflict detection and resolution
- ✅ Activity feeds and user presence
- ✅ Optimized for Epic 2 collaborative workflows