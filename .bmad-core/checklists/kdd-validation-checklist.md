# KDD (Knowledge-Driven Development) Validation Checklist

## Overview

This checklist ensures that Knowledge-Driven Development principles are properly implemented throughout the story development lifecycle, focusing on pattern validation, knowledge capture, and documentation synchronization.

## Pre-Implementation Pattern Validation

### Pattern Discovery

- [ ] **Check existing patterns**: Review `docs/patterns/` for established architectural patterns
- [ ] **Review existing examples**: Check `docs/examples/` for similar implementations
- [ ] **Validate approach**: Confirm implementation approach aligns with established patterns
- [ ] **Document deviations**: Note any necessary deviations from existing patterns with justification

### Pattern Compliance Planning

- [ ] **Reference compliance**: Ensure Documentation Impact Assessment identifies relevant patterns
- [ ] **Implementation alignment**: Confirm development approach follows established conventions
- [ ] **New pattern identification**: Identify potential new patterns that may emerge
- [ ] **Example creation planning**: Plan what examples should be created from this implementation

## During Implementation Validation

### Development Agent Responsibilities

- [ ] **Pattern adherence**: Verify implementation follows referenced patterns
- [ ] **Code consistency**: Ensure code style matches existing examples
- [ ] **Documentation updates**: Update inline documentation as needed
- [ ] **File organization**: Follow established file and directory conventions

### Pattern Emergence Detection

- [ ] **New pattern recognition**: Identify novel approaches that could become patterns
- [ ] **Anti-pattern detection**: Flag problematic approaches that should be avoided
- [ ] **Implementation insights**: Capture insights about what works well or poorly
- [ ] **Documentation gaps**: Note missing documentation that would help future developers

## Post-Implementation Knowledge Capture

### QA Agent Responsibilities

- [ ] **Pattern compliance review**: Validate implementation follows established patterns correctly
- [ ] **New pattern documentation**: Document new patterns that emerged during implementation
- [ ] **Example creation**: Create reference examples from successful implementations
- [ ] **Lesson learned capture**: Document insights for future development

### Documentation Synchronization

- [ ] **Architecture updates**: Update architecture documents if patterns changed
- [ ] **Pattern library updates**: Add new patterns to `docs/patterns/`
- [ ] **Example library updates**: Add new examples to `docs/examples/`
- [ ] **Lessons learned updates**: Add insights to `docs/lessons-learned/`

### TOC Maintenance (Knowledge Base Discoverability)

- [ ] **Category TOC updates**: Update relevant category TOCs (`docs/patterns/index.md`, `docs/examples/index.md`, `docs/lessons-learned/index.md`)
- [ ] **Master TOC updates**: Update `docs/index.md` KDD sections if significant additions or new categories
- [ ] **Cross-reference validation**: Ensure bidirectional links between related knowledge assets
- [ ] **TOC entry templates**: Use standardized TOC entry templates from `.bmad-core/templates/toc-update-tmpl.md`
- [ ] **Metadata inclusion**: Include timestamps, categories, and relationship metadata in TOC entries

## Knowledge Quality Assurance

### Pattern Documentation Quality

- [ ] **Clarity**: Patterns are clearly documented with rationale
- [ ] **Completeness**: All necessary implementation details are captured
- [ ] **Examples**: Each pattern includes concrete examples
- [ ] **Cross-references**: Patterns reference related documentation appropriately

### Example Quality

- [ ] **Representativeness**: Examples accurately represent best practices
- [ ] **Completeness**: Examples include all necessary context and code
- [ ] **Documentation**: Examples are well-documented with explanations
- [ ] **Maintainability**: Examples will remain relevant and accurate

### Knowledge Transfer Effectiveness

- [ ] **Accessibility**: New knowledge is easy to find and understand
- [ ] **Searchability**: Knowledge is properly indexed and cross-referenced
- [ ] **Actionability**: Knowledge provides clear guidance for future implementations
- [ ] **Sustainability**: Knowledge capture process is sustainable and scalable

### TOC System Health Validation

- [ ] **Orphaned file detection**: Verify no knowledge assets exist without TOC references
- [ ] **Broken link validation**: Check all cross-references point to existing files
- [ ] **TOC completeness**: Ensure all new knowledge assets are properly indexed
- [ ] **Cross-reference integrity**: Validate bidirectional linking between related assets
- [ ] **TOC template compliance**: Confirm entries follow standardized format from templates

## Cross-Story Learning Validation

### Institutional Learning

- [ ] **Pattern evolution**: Track how patterns evolve across stories
- [ ] **Knowledge gaps**: Identify areas where documentation is insufficient
- [ ] **Process improvement**: Note opportunities to improve KDD process
- [ ] **Success metrics**: Track benefits of pattern reuse and knowledge capture

### Future Story Preparation

- [ ] **Pattern library completeness**: Ensure patterns are ready for next story
- [ ] **Example library readiness**: Confirm examples support upcoming development
- [ ] **Documentation debt management**: Address any accumulated documentation debt
- [ ] **Process refinement**: Update KDD process based on lessons learned

## Success Criteria

A story successfully implements KDD when:

- All relevant patterns have been identified and followed
- Any new patterns have been properly documented
- Quality examples have been created for future reference
- Lessons learned have been captured for future stories
- Documentation remains synchronized with implementation
- Knowledge is accessible and actionable for future development
- **TOC system is properly maintained**: All knowledge assets are indexed in relevant TOCs with proper cross-references
- **Knowledge base health**: No orphaned files, broken links, or missing cross-references

## Notes

This checklist should be used by:

- **Scrum Master**: During story planning and Documentation Impact Assessment
- **Dev Agent**: During implementation for pattern validation
- **QA Agent**: During review for knowledge capture and pattern compliance
- **Product Owner**: For documentation debt management and process oversight

### TOC Maintenance Tools

- **TOC Update Templates**: Use `.bmad-core/templates/toc-update-tmpl.md` for standardized TOC entries
- **Health Check Commands**: Run validation commands for orphaned files and broken links
- **Cross-Reference Validation**: Ensure bidirectional linking between knowledge assets

### Integration with KDD Process

- **TOC maintenance is mandatory** in KDD execution (Step 9 of `capture-kdd-knowledge.md`)
- **Knowledge base statistics** tracked in `docs/index.md` master TOC
- **Quarterly reviews** planned for TOC health and consolidation

The goal is to create a self-improving development environment where each story contributes to and validates against the collective knowledge base, with systematic TOC maintenance ensuring knowledge remains discoverable and actionable.
