# Sprint Point Correlation Guidelines

## Standard Correlations

- **1 SP** = 4-6 hours (simple tasks, single component)
- **2 SP** = 1 day (straightforward feature, minimal complexity)
- **3 SP** = 1-2 days (moderate complexity, some integration)
- **5 SP** = 2-3 days (complex feature, multiple components)
- **8 SP** = 1 week (major feature, significant complexity)
- **13 SP** = 1-2 weeks (epic-level work, high complexity)
- **21 SP** = 2+ weeks (should be broken down further)

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

## Time Estimation Guidelines

### Factors to Consider

- Implementation complexity
- Testing requirements
- Documentation needs
- Integration points
- Code review time
- Deployment considerations

### Common Patterns

- **Authentication features**: Usually 5-8 SP (integration complexity)
- **UI components**: 2-3 SP (established patterns)
- **API endpoints**: 3-5 SP (depends on business logic)
- **Database migrations**: 2-5 SP (depends on data complexity)
- **CI/CD setup**: 8-13 SP (infrastructure complexity)

## Velocity Tracking

### Sprint Velocity Calculation

```
Sprint Velocity = Total Story Points Completed / Sprint Duration
Team Capacity = Average Sprint Velocity * Sprint Length
```

### Estimation Accuracy Tracking

- Track estimated vs actual time for each story
- Identify patterns in estimation errors
- Adjust future estimates based on historical data
- Monitor complexity assessment accuracy

### Continuous Improvement

- Review estimation accuracy during retrospectives
- Update guidelines based on team performance data
- Refine complexity criteria as team gains experience
- Share estimation insights across team members

---

_These guidelines help maintain consistent estimation standards across the team and enable accurate sprint planning through historical velocity data._
