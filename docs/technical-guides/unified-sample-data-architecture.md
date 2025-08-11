# Unified Sample Data Architecture Documentation

## Overview

The SupportSignal application currently implements **two distinct sample data systems** with different architectural approaches, capabilities, and integration patterns. This document analyzes both systems, identifies opportunities for unification, and provides recommendations for creating a cohesive sample data architecture.

## Current Sample Data Systems

### Implementation Status

**✅ Centralized Backend Service**: Implemented `generateRandomIncidentMetadata` in `apps/convex/incidents/createSampleData.ts`
- Cross-cutting capability for any form needing random incident data
- Consistent permission checking (`SAMPLE_DATA` permission required)
- Configurable field exclusion (e.g., exclude `reporter_name`)
- Company-scoped participant selection from database
- Predefined realistic locations and smart date generation

**✅ Frontend Integration Pattern**: Updated `IncidentMetadataForm` to use centralized service
- No business logic duplication in frontend
- Clean async mutation calls to backend service
- Proper error handling and user feedback
- Maintains form state management patterns

## Current Sample Data Systems

### 1. Incident Sample Data System

**Location**: `apps/convex/incidents/createSampleData.ts`  
**Architecture**: Comprehensive backend-driven system with multiple functions  
**Permission Model**: Requires `SAMPLE_DATA` permission (system_admin only)

#### Core Functions

| Function | Purpose | Capabilities |
|----------|---------|-------------|
| `createSampleIncidentScenarios` | Batch creation of multiple incident scenarios | Creates 5 realistic NDIS scenarios with full narrative data |
| `fillIncidentWithSampleData` | Fill existing incident with sample data | Updates existing incident with chosen scenario data |
| `createIncidentWithSampleData` | Create new incident with sample data | Single scenario creation with complete narrative |
| `getAvailableScenarioTypes` | Query available scenarios | Returns metadata about available scenarios |

#### Scenario Types and Data

**5 Realistic NDIS Scenarios**:

1. **Medication Error** (`medication_error`)
   - Participant: Emma Johnson
   - Severity: Medium
   - Tags: medication, administration, oversight, monitoring
   - Complete 4-phase narrative data

2. **Injury Incident** (`injury`)
   - Participant: Michael Chen
   - Severity: High
   - Tags: fall, head_injury, transfer, wheelchair, hospital
   - Hospital transport and medical assessment

3. **Behavioral Incident** (`behavioral`)
   - Participant: Sarah Williams
   - Severity: Medium
   - Tags: verbal_aggression, de-escalation, sleep_issues, behavior_support
   - De-escalation protocols and behavior management

4. **Environmental Hazard** (`environmental`)
   - Participant: James Brown
   - Severity: Medium
   - Tags: water_damage, maintenance, relocation, routine_disruption
   - Infrastructure failure and temporary relocation

5. **Medical Emergency** (`medical_emergency`)
   - Participant: Rachel Davis
   - Severity: High
   - Tags: seizure, epilepsy, medication, monitoring, medical_protocol
   - Established medical protocols and monitoring procedures

#### Architectural Features

- **Complete Narrative Structure**: 4-phase narrative (before_event, during_event, end_event, post_event)
- **Database Integration**: Direct Convex database operations with proper indexing
- **Duplicate Detection**: Checks for existing scenarios to prevent duplicates
- **Audit Logging**: Comprehensive logging with correlation IDs
- **Error Handling**: Robust error handling with ConvexError patterns
- **Permissions**: Secure permission-based access control

### 2. Participant Sample Data System

**Location**: `apps/convex/participants/createSampleData.ts`  
**Architecture**: Simple CRUD-focused system  
**Permission Model**: Requires `SAMPLE_DATA` permission (system_admin only)

#### Core Functions

| Function | Purpose | Capabilities |
|----------|---------|-------------|
| `createSampleParticipants` | Create 5 sample participants | Batch creation with duplicate detection |
| `clearAllParticipants` | Delete all company participants | Destructive operation with confirmation |

#### Participant Data

**5 Sample Participants**:

1. **Emma Johnson** (Medium Support)
   - DOB: 1995-03-15, NDIS: NDIS12345001
   - Care: Daily living assistance, routine communication

2. **Michael Chen** (High Support)
   - DOB: 1988-07-22, NDIS: NDIS12345002
   - Care: 24/7 supervision, wheelchair assistance, mobility issues

3. **Sarah Williams** (Low Support)
   - DOB: 1990-11-08, NDIS: NDIS12345003
   - Care: Independent living, day programs, social activities

4. **James Brown** (Medium Support)
   - DOB: 1992-01-30, NDIS: NDIS12345004
   - Care: Autism spectrum, structured environments, visual supports

5. **Rachel Davis** (High Support) - *Inactive*
   - DOB: 1985-09-14, NDIS: NDIS12345005
   - Care: Intellectual disability, challenging behaviors, specialized support

#### Architectural Features

- **Simple Data Model**: Basic participant fields with company association
- **Status Management**: Active/inactive status tracking
- **Duplicate Prevention**: NDIS number-based duplicate detection
- **Batch Operations**: Efficient bulk creation and deletion
- **Destructive Operations**: Safe deletion with confirmation requirements

### 3. Frontend Sample Data Integration

**Location**: `apps/web/components/incidents/SampleDataButton.tsx`  
**Architecture**: Client-side component with local data  
**Integration**: IncidentMetadataForm and NarrativeGrid components

#### Features

- **UI Component**: Dropdown selection with scenario previews
- **Local Scenario Data**: Client-side scenario definitions (duplicates backend)
- **Name Interpolation**: Smart participant name replacement in narratives
- **Dynamic Dates**: Recent date generation for realistic testing
- **Form Integration**: Direct form field population
- **Visual Indicators**: Icons, severity colors, tag display

#### Current Integration Points

```typescript
// IncidentMetadataForm integration
<SampleDataButton
  onDataFilled={(scenarioData) => {
    setFormData(prev => ({
      ...prev,
      participant_name: scenarioData.participant_name,
      reporter_name: scenarioData.reporter_name,
      event_date_time: scenarioData.event_date_time,
      location: scenarioData.location,
    }));
  }}
  participantFirstName={selectedParticipant?.first_name}
/>
```

## Architectural Analysis

### System Comparison

| Aspect | Incident System | Participant System | Frontend Component |
|--------|----------------|-------------------|-------------------|
| **Complexity** | High - Multiple functions, scenarios | Low - Simple CRUD | Medium - UI + interpolation |
| **Data Richness** | Very rich - Complete narratives | Basic - Core participant fields | Rich - Local scenarios |
| **Integration** | Deep - Direct DB operations | Simple - Batch operations | Surface - Form filling only |
| **Flexibility** | High - Multiple creation modes | Low - Fixed participant set | High - Dynamic interpolation |
| **Maintainability** | Complex - Multiple code paths | Simple - Straightforward | Medium - Duplicated data |

### Key Architectural Differences

1. **Data Storage Strategy**
   - **Incident**: Backend-authoritative with complete database integration
   - **Participant**: Backend-authoritative with simple data model
   - **Frontend**: Client-side data with dynamic generation

2. **Use Case Coverage**
   - **Incident**: Multiple scenarios (testing, filling, creation)
   - **Participant**: Single use case (batch creation/deletion)
   - **Frontend**: Form filling and demonstration

3. **Permission Models**
   - **Backend Systems**: Consistent `SAMPLE_DATA` permission requirement
   - **Frontend**: No permission checking (relies on backend calls)

4. **Error Handling**
   - **Backend Systems**: Comprehensive ConvexError handling
   - **Frontend**: Basic error handling with user feedback

## Current Limitations

### Data Duplication Issues

1. **Scenario Definition Duplication**: Frontend component maintains local scenario data that duplicates backend scenarios
2. **Maintenance Burden**: Changes to scenarios require updates in multiple locations
3. **Consistency Risk**: Frontend and backend scenarios can drift apart

### Integration Gaps

1. **Missing Participant Integration**: Sample participants aren't automatically used with incident scenarios
2. **Limited Cross-System Coordination**: No unified sample data generation across both systems
3. **UI Limitations**: Frontend component doesn't leverage backend participant data

### Architectural Inconsistencies

1. **Different Data Patterns**: Incident system uses rich narrative data, participant system uses simple fields
2. **Inconsistent Function Naming**: Different naming conventions between systems
3. **Permission Model Gaps**: Frontend doesn't enforce permission checking independently

## Recommendations for Unified Architecture

### 1. Core Architectural Principles

**Single Source of Truth**: All sample data definitions should exist in backend with frontend consuming via API

**Modular Design**: Separate concerns of data definition, generation, and presentation

**Permission Consistency**: Unified permission model across all sample data operations

**Cross-System Integration**: Participants and incidents should work together seamlessly

### 2. Proposed Unified Structure

```typescript
// Proposed unified sample data architecture

// 1. Central Sample Data Registry
interface SampleDataRegistry {
  participants: SampleParticipant[];
  scenarios: SampleScenario[];
  integrations: SampleDataIntegration[];
}

// 2. Unified Sample Data Service
interface UnifiedSampleDataService {
  // Core operations
  generateSampleEnvironment(options: GenerationOptions): Promise<SampleEnvironment>;
  fillFormWithSample(formType: string, scenarioId: string): Promise<FormData>;
  createIntegratedDemo(participantCount: number, scenarioTypes: string[]): Promise<DemoData>;
  
  // Query operations
  getAvailableScenarios(filters?: ScenarioFilters): Promise<SampleScenario[]>;
  getAvailableParticipants(filters?: ParticipantFilters): Promise<SampleParticipant[]>;
  
  // Management operations
  clearSampleData(scope: 'all' | 'participants' | 'incidents'): Promise<ClearResult>;
  validateSampleData(): Promise<ValidationResult>;
}

// 3. Integration Layer
interface SampleDataIntegration {
  id: string;
  name: string;
  description: string;
  participantIds: string[];
  scenarioIds: string[];
  generateIntegration(): Promise<IntegrationData>;
}
```

### 3. Implementation Phases

#### Phase 1: Backend Unification
- Merge participant and incident sample data into unified service
- Create cross-references between participants and scenarios
- Implement unified permission and error handling patterns

#### Phase 2: Frontend Modernization  
- Remove local scenario data from frontend components
- Implement API-driven sample data consumption
- Add unified UI components for sample data selection

#### Phase 3: Advanced Features
- Dynamic scenario generation based on participant characteristics
- Sample data validation and consistency checking
- Advanced integration scenarios (multi-participant incidents, etc.)

### 4. Benefits of Unified Architecture

**Reduced Maintenance**: Single location for all sample data definitions
**Better Consistency**: Guaranteed alignment between frontend and backend data
**Enhanced Testing**: Comprehensive sample data coverage for all testing scenarios
**Improved UX**: Richer sample data options with better participant/scenario integration
**Scalable Design**: Easy addition of new sample data types and integration patterns

## Migration Strategy

### Step 1: Analysis and Planning
- [ ] Audit all current sample data usage patterns
- [ ] Identify dependencies and integration points
- [ ] Design unified data schema and API contracts

### Step 2: Backend Implementation
- [ ] Create unified sample data service
- [ ] Migrate existing functions to unified architecture
- [ ] Implement cross-system integrations
- [ ] Add comprehensive testing coverage

### Step 3: Frontend Migration
- [ ] Update components to use unified API
- [ ] Remove duplicated client-side data
- [ ] Implement enhanced UI components
- [ ] Add proper permission checking

### Step 4: Validation and Cleanup
- [ ] Comprehensive testing of unified system
- [ ] Remove deprecated functions and components
- [ ] Update documentation and usage patterns
- [ ] Performance optimization and monitoring

## Conclusion

The current sample data architecture serves its intended purposes but suffers from duplication, inconsistency, and limited integration between systems. A unified architecture would provide significant benefits in maintainability, consistency, and functionality while enabling advanced features like integrated participant/incident scenarios and dynamic sample data generation.

The proposed migration strategy provides a path to unification while maintaining current functionality throughout the transition, ensuring minimal disruption to development workflows and testing processes.

---

## ✅ Implemented Pattern: Random Form Data Generation

### Backend Service (Cross-Cutting Capability)

```typescript
// Backend: generateRandomIncidentMetadata in createSampleData.ts
export const generateRandomIncidentMetadata = mutation({
  args: {
    sessionToken: v.string(),
    excludeFields: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // ✅ Permission checking
    const { user } = await requirePermission(ctx, args.sessionToken, PERMISSIONS.SAMPLE_DATA);
    
    // ✅ Database-driven participant selection (company-scoped)
    const participants = await ctx.db.query("participants")
      .withIndex("by_company", (q) => q.eq("company_id", user.company_id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();
    
    // ✅ Centralized business logic
    const randomParticipant = participants[Math.floor(Math.random() * participants.length)];
    const randomLocation = sampleLocations[Math.floor(Math.random() * sampleLocations.length)];
    const randomDate = generateRandomDate();
    
    // ✅ Configurable field exclusion
    const result = {};
    if (!excludeFields.includes('participant_name')) result.participant_name = ...;
    
    return { success: true, data: result, metadata: {...} };
  }
});
```

### Frontend Integration Pattern

```typescript
// Frontend: Any component can use this pattern
const generateRandomData = useMutation(api.incidents.createSampleData.generateRandomIncidentMetadata);

const handleRandomSample = async () => {
  const sessionToken = localStorage.getItem('auth_session_token');
  
  try {
    const result = await generateRandomData({
      sessionToken,
      excludeFields: ['reporter_name'] // Configure what NOT to update
    });
    
    if (result.success) {
      setFormData(prev => ({ ...prev, ...result.data }));
      // Handle any component-specific state updates
    }
  } catch (error) {
    console.error('Sample data generation failed:', error);
  }
};

// UI: Preferred Style Button
<Button 
  className="text-xs text-gray-500 hover:text-white hover:bg-ss-teal border-b border-dashed border-gray-300 rounded-none hover:border-ss-teal transition-all duration-200"
  onClick={handleRandomSample}
>
  Random Sample
</Button>
```

### Benefits of This Pattern

1. **Cross-Cutting**: Any form can use `generateRandomIncidentMetadata` without code duplication
2. **Consistent**: Same permission model, error handling, and data generation logic everywhere
3. **Database-Driven**: Uses real participants from the current company, not hardcoded data
4. **Configurable**: `excludeFields` allows customization per use case
5. **Maintainable**: Single source of truth for locations, date logic, participant selection
6. **Secure**: Proper permission checking and company scoping

### Usage Guidelines

- **Always exclude fields that shouldn't be randomized** (e.g., `reporter_name`)
- **Use the preferred button style** for consistency across administrative functions
- **Handle errors gracefully** with proper user feedback
- **Log results for debugging** but not sensitive data

---

**Next Steps**: Extend this pattern to other form types (participant forms, other metadata forms) and continue implementing the full unified architecture vision.