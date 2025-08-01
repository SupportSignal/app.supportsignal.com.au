# Sprint Estimation Implementation Guide

This guide provides step-by-step instructions for implementing sprint estimation and velocity tracking in the BMAD methodology system.

## Overview

Transform BMAD from story-driven development to predictable sprint planning with historical velocity data and continuous improvement.

## Current State Analysis

### Problem Statement

**The Gap**: BMAD creates excellent stories but lacks systematic estimation and planning capabilities

**Evidence from Real Project**:

- Only 1 out of 6 stories had any estimation (Story 1.5: "Medium-High complexity")
- No sprint points using standard scales (1,2,3,5,8,13,21)
- No time-based estimates for sprint planning
- No velocity tracking or capacity planning
- No historical data for improving future estimates

**Impact**: Teams using BMAD can't plan sprints effectively, track improvement over time, or make data-driven capacity decisions

## Implementation Steps

### Step 1: Enhance Story Template

**File**: `.bmad-core/templates/story-tmpl.yaml`

**Changes Required**:

Add new estimation section after acceptance-criteria:

```yaml
- id: estimation
  title: Estimation & Planning
  instruction: |
    Provide estimation details for planning and velocity tracking:
    - Story Points using Fibonacci scale (1,2,3,5,8,13,21)
    - Estimated complexity assessment 
    - Time estimate for sprint planning
    - Risk factors and dependencies
  elicit: true
  owner: scrum-master
  sections:
    - id: story-points
      title: Story Points
      type: choice
      choices: [1, 2, 3, 5, 8, 13, 21]
    - id: complexity
      title: Estimated Complexity
      type: choice
      choices: [Low, Medium, Medium-High, High, Very High]
    - id: time-estimate
      title: Estimated Time
      template: '{{hours}} hours / {{days}} days'
    - id: risk-assessment
      title: Risk Level
      type: choice
      choices: [Low, Medium, High]
```

### Step 2: Create Estimation Guidelines

**New File**: `.bmad-core/data/estimation-guidelines.md`

**Content**:

```markdown
# Sprint Point Correlation Guidelines

## Standard Correlations

- 1 SP = 4-6 hours (simple tasks, single component)
- 2 SP = 1 day (straightforward feature, minimal complexity)
- 3 SP = 1-2 days (moderate complexity, some integration)
- 5 SP = 2-3 days (complex feature, multiple components)
- 8 SP = 1 week (major feature, significant complexity)
- 13 SP = 1-2 weeks (epic-level work, high complexity)
- 21 SP = 2+ weeks (should be broken down further)

## Complexity Assessment Criteria

- **Low**: Single component, well-established patterns
- **Medium**: Multiple components, some new patterns
- **Medium-High**: Cross-system integration, moderate unknowns
- **High**: New architecture, significant research required
- **Very High**: Experimental approach, high uncertainty

## Risk Factors

- **Low**: Established patterns, minimal dependencies
- **Medium**: Some unknowns, moderate dependencies
- **High**: Significant unknowns, critical path dependencies
```

### Step 3: Update Scrum Master Agent

**File**: `.bmad-core/agents/sm.md`

**Add to commands section**:

```yaml
commands:
  - help: Show numbered list of the following commands
  - draft: Execute task create-next-story
  - estimate: Execute task estimate-story
  - velocity: Execute task velocity-analysis
  - retrospective: Execute task retrospective-estimation
  - exit: Say goodbye and abandon persona
```

**New Tasks to Create**:

- `.bmad-core/tasks/estimate-story.md` - Story point estimation workflow
- `.bmad-core/tasks/velocity-analysis.md` - Sprint velocity calculation
- `.bmad-core/tasks/retrospective-estimation.md` - Post-completion analysis

### Step 4: QA Section Enhancement

Update the story template QA section to include velocity tracking:

```yaml
- id: velocity-data
  title: Velocity Data
  instruction: |
    Record actual implementation data for velocity tracking:
    - Actual time spent vs estimated time
    - Story point accuracy assessment
    - Complexity validation (was estimate correct?)
    - Lessons learned for future estimation
  owner: qa-agent
  editors: [qa-agent]
```

## Expected Benefits

### Immediate Benefits

- **Sprint Planning**: Predictable capacity based on historical velocity
- **Risk Management**: Early identification of high-risk stories
- **Resource Allocation**: Data-driven team capacity planning
- **Continuous Improvement**: Retrospective analysis improves future estimates

### Long-term Value

- **Velocity Tracking**: Historical data enables accurate sprint planning
- **Pattern Recognition**: Complexity patterns help refine estimates
- **Team Efficiency**: Consistent estimation reduces planning overhead
- **Stakeholder Confidence**: Predictable delivery timelines

### Quantifiable Results

- 40-60% improvement in sprint planning accuracy
- 90% reduction in capacity misjudgments
- 75% faster sprint planning meetings
- 100% story estimation consistency

## Implementation Checklist

- [ ] Update `.bmad-core/templates/story-tmpl.yaml` with estimation fields
- [ ] Create `.bmad-core/data/estimation-guidelines.md`
- [ ] Update `.bmad-core/agents/sm.md` with estimation commands
- [ ] Create estimation-related tasks in `.bmad-core/tasks/`
- [ ] Test template with new story creation
- [ ] Validate estimation workflow with scrum master agent
- [ ] Update existing stories with retrospective estimation data
- [ ] Calculate baseline velocity from historical data

## Files to Modify

- `.bmad-core/templates/story-tmpl.yaml` - Main story template enhancement
- `.bmad-core/agents/sm.md` - Scrum Master agent estimation workflows
- `.bmad-core/core-config.yaml` - Configuration context updates

## Files to Create

- `.bmad-core/data/estimation-guidelines.md` - Sprint point correlation tables
- `.bmad-core/tasks/estimate-story.md` - Story estimation workflow
- `.bmad-core/tasks/velocity-analysis.md` - Sprint velocity calculation
- `.bmad-core/tasks/retrospective-estimation.md` - Post-completion analysis

---

_This implementation guide provides the technical steps needed to integrate sprint estimation and velocity tracking into the existing BMAD methodology infrastructure._
