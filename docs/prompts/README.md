# AI Prompt Templates Documentation

This directory contains comprehensive documentation of AI prompt templates used in both the original NDIS incident capture system and the SupportSignal implementation.

## Directory Structure

```
docs/prompts/
├── README.md                           # This file
├── ndis-original/                      # Original NDIS application templates
│   ├── generate-clarification-questions.md
│   ├── enhance-narrative-content.md
│   ├── generate-mock-answers.md
│   └── analyze-contributing-conditions.md
└── supportsignal-seed/                # SupportSignal seed templates
    ├── generate_clarification_questions.md
    ├── enhance_narrative.md
    └── system_test_template.md
```

## Template Comparison Overview

| Feature | NDIS Original | SupportSignal |
|---------|---------------|---------------|
| **Clarification Questions** | Multi-phase (4 phases) | Single-phase |
| **Narrative Enhancement** | Light grammar cleanup | Comprehensive integration |
| **Mock Data Generation** | ✅ Available | ❌ Missing |
| **Analysis Capabilities** | ✅ Contributing conditions | ❌ Missing |
| **System Testing** | ❌ Not present | ✅ Available |
| **Admin Management** | ❌ Not present | ✅ Full UI |

## NDIS Original Templates (4 templates)

### 1. Generate Clarification Questions
- **Multi-phase workflow**: Processes all 4 incident phases simultaneously
- **Comprehensive scope**: Before/During/End/Post-event sections
- **JSON structure**: Output organized by phase
- **Context awareness**: Uses full incident metadata

### 2. Enhance Narrative Content
- **Phase-specific**: Processes individual phases
- **Light touch editing**: Grammar cleanup while preserving tone
- **Q&A format**: Maintains question/answer structure
- **Minimal transformation**: Does not rewrite or summarize

### 3. Generate Mock Answers
- **Development tool**: Creates realistic test data
- **Context-aware**: Uses narrative and metadata for consistency
- **Variable responses**: Mix of brief and detailed answers
- **Testing enablement**: Rapid test scenario population

### 4. Analyze Contributing Conditions
- **Advanced analysis**: Identifies patterns and contributing factors
- **Evidence-based**: Only includes conditions supported by data
- **Professional output**: Structured markdown format
- **Quality improvement**: Supports organizational learning

## SupportSignal Seed Templates (3 templates)

### 1. generate_clarification_questions
- **Single-phase approach**: Works with one narrative phase at a time
- **Purpose explanation**: Each question includes rationale
- **NDIS compliance**: Considers reporting requirements
- **Focused questioning**: 3-5 targeted questions

### 2. enhance_narrative
- **Comprehensive integration**: Creates unified narrative from multiple sources
- **Professional standards**: Designed for formal NDIS reporting
- **Seamless output**: Produces flowing paragraph text
- **Quality guidelines**: Multiple standards ensure consistent output

### 3. system_test_template
- **System validation**: Tests prompt management functionality
- **Variable testing**: Validates different parameter types
- **Admin capability**: Unique to SupportSignal system
- **Development tool**: Enables system integrity checking

## Key Architectural Differences

### Workflow Approach
- **NDIS**: Multi-phase workflow (7-step wizard)
- **SupportSignal**: Unified single-incident approach

### Enhancement Philosophy
- **NDIS**: Preserve original voice, minimal editing
- **SupportSignal**: Professional transformation, comprehensive integration

### System Capabilities
- **NDIS**: Focused on incident capture and analysis
- **SupportSignal**: Includes administrative management and system testing

## Template Quality Assessment

### NDIS Strengths
- **Proven workflow**: Battle-tested in real NDIS environment
- **Complete feature set**: All necessary capabilities for incident management
- **Advanced analysis**: Contributing conditions analysis for quality improvement
- **Development support**: Mock data generation for testing

### SupportSignal Strengths
- **Administrative capabilities**: Full template management system
- **Professional output**: Higher quality narrative integration
- **System monitoring**: Built-in testing and validation
- **Type safety**: Comprehensive TypeScript validation

### Missing from SupportSignal
1. **Mock data generation**: No equivalent to `generate-mock-answers`
2. **Advanced analysis**: No `analyze-contributing-conditions` capability
3. **Multi-phase workflow**: Simplified to single-incident approach
4. **Complete workflow**: Missing Epic 5 analysis capabilities

## Implementation Status

### Current State (SupportSignal)
- ✅ Template storage system (database)
- ✅ Admin interface for management
- ✅ Variable validation and substitution
- ✅ Basic clarification and enhancement templates
- ✅ System testing template

### Potential Enhancements
- 🔄 Add mock data generation template
- 🔄 Implement contributing conditions analysis
- 🔄 Support multi-phase workflow templates
- 🔄 Add Epic 5 analysis capabilities
- 🔄 Enhance variable validation system

## Usage Guidelines

### For Developers
1. **Reference Implementation**: Use NDIS templates as reference for proven patterns
2. **Quality Standards**: Compare SupportSignal output quality against NDIS approach
3. **Feature Gaps**: Identify missing capabilities for future development
4. **Testing Patterns**: Use both mock data and system test approaches

### For Product Managers
1. **Feature Comparison**: Understand capabilities gap between systems
2. **Quality Assessment**: Evaluate prompt effectiveness and output quality
3. **Workflow Decisions**: Choose between single-phase vs multi-phase approaches
4. **Development Priority**: Prioritize missing features based on user needs

### For Content Designers
1. **Prompt Engineering**: Study both approaches for best practices
2. **User Experience**: Understand how template design affects user workflow
3. **Output Quality**: Compare narrative enhancement approaches
4. **Variable Design**: Learn effective variable structure patterns

## Integration Recommendations

### Phase 1: Quality Improvement
- Compare output quality between NDIS and SupportSignal approaches
- Refine SupportSignal templates based on NDIS proven patterns
- Implement A/B testing for template effectiveness

### Phase 2: Feature Parity
- Add mock data generation capability
- Implement contributing conditions analysis
- Consider multi-phase workflow support

### Phase 3: Advanced Capabilities
- Enhance variable validation system
- Add dynamic template generation
- Implement template versioning and rollback

## File Maintenance

### Adding New Templates
1. Create template file in appropriate directory
2. Follow established documentation format
3. Include comprehensive metadata and examples
4. Update this README with new template information

### Updating Existing Templates
1. Maintain version history in template files
2. Document changes and rationale
3. Update comparison tables in this README
4. Test template changes thoroughly before deployment

## Related Documentation

- **Implementation KDD**: `docs/testing/technical/ai-prompt-template-implementation-kdd.md`
- **Security Pattern KDD**: `docs/testing/technical/story-3.4-authentication-security-pattern-kdd.md`
- **NDIS Documentation**: `docs/stories/3.x-NDIS-documentation.md`
- **Template Service**: `apps/web/lib/prompts/prompt-template-service.ts`
- **Default Templates**: `apps/convex/lib/prompts/default_prompts.ts`