# UI Spikes - SupportSignal Design System Experimentation

## Purpose

This folder provides a **pure HTML/CSS experimentation environment** for testing UI concepts, comparing design variations, and rapid prototyping **outside the main React application**. It uses simplified versions of the SupportSignal design system for quick iteration and side-by-side comparisons.

## 🎯 Key Objectives

- **Component Concept Testing**: Test UI patterns without React/ShadCN complexity
- **Design Variation Comparison**: Create multiple implementations of the same requirements
- **Agent-Friendly Development**: Clear requirements → multiple HTML implementations
- **Style System Validation**: Verify design system patterns in simplified form

## 📁 Directory Structure

```
/docs/ui-spikes/
├── README.md                    # This file - usage and maintenance guide
├── style-source-mapping.md     # Detailed mapping of style origins
├── tailwind.config.js          # Simplified Tailwind config (derived from main app)
├── styles.css                  # Base SupportSignal healthcare theme
├── _template.html               # Base HTML template for new spikes
├── wizard/                      # Wizard experiment folder
│   ├── requirements.md          # Clean wizard requirements
│   ├── version-01-basic.html    # Implementation variations
│   └── version-02-minimal.html  # Additional implementations
└── comparison-viewer.html       # Side-by-side comparison tool
```

## 🔗 Source of Truth References

### Primary Sources (Main Application)
- **Colors & Typography**: `/apps/web/tailwind.config.js` (lines 56-148)
- **Component Examples**: `/apps/web/app/showcase/page.tsx` 
- **Design Specifications**: `/docs/stories/2.0.story.md` (SupportSignal Design System Foundation)
- **Component Implementations**: `/apps/web/components/*/` (React patterns for simplification)

### Style System Origins
- **SupportSignal Brand Colors**: `ss-teal`, `ss-navy`, `ss-cta-blue`, `ss-success`, `ss-alert`
- **Healthcare Colors**: `healthcare-primary`, `healthcare-accent`, `healthcare-dark-*`
- **Typography Scale**: `healthcare-xs` to `healthcare-4xl`, `header-h1` to `header-h3`
- **Spacing System**: `ss-xs` (8px) to `ss-3xl` (64px)
- **Layout Constants**: `sidebar` (240px), `ss-content` (1400px max-width)

## 🤖 Agent Guidelines

### For BMAD Method Agents

**When Creating New Spikes:**
1. **Reference Requirements**: Start with clear, implementation-agnostic requirements
2. **Use Template**: Copy `_template.html` and modify for your specific use case
3. **Follow Style System**: Use only colors/typography defined in our simplified config
4. **Multiple Variants**: Create numbered versions (version-01, version-02, etc.)
5. **Document Decisions**: Add comments explaining design choices

**When Maintaining This Folder:**
1. **Check Source Changes**: Monitor main app for Tailwind config updates
2. **Sync Style Changes**: Update simplified configs when source of truth changes
3. **Validate Examples**: Ensure spikes still match main application styling
4. **Update Mapping**: Keep `style-source-mapping.md` current with changes

### Maintenance Triggers

**Update This Folder When:**
- New colors added to main `/apps/web/tailwind.config.js`
- Typography scale changes in main application
- Spacing system modifications in source files
- New SupportSignal brand guidelines established
- Healthcare compliance requirements change

## 🛠 Usage Workflow

### Creating a New Spike
1. Copy `_template.html` to your folder (e.g., `wizard/version-03-cards.html`)
2. Update the `<title>` and main content area
3. Use only predefined SupportSignal classes
4. Add to `comparison-viewer.html` for side-by-side testing

### Comparing Variations
1. Open `comparison-viewer.html` in browser
2. Add new variations to the iframe list
3. Use browser dev tools for responsive testing
4. Document findings in the related requirements.md

### Converting to Main Application
1. Use spike as reference for React component implementation
2. Map HTML patterns to ShadCN UI components
3. Ensure accessibility patterns transfer correctly
4. Validate with existing TypeScript interfaces

## 📋 Maintenance Checklist

### Monthly Review (For Agents)
- [ ] Compare `/apps/web/tailwind.config.js` with our simplified version
- [ ] Check if new SupportSignal colors have been added
- [ ] Verify typography scale matches main application
- [ ] Update `style-source-mapping.md` if changes detected
- [ ] Test existing spikes still render correctly

### When Source of Truth Changes
- [ ] Identify specific changes in main Tailwind config
- [ ] Update our simplified `tailwind.config.js`
- [ ] Modify `styles.css` if base styles affected
- [ ] Update affected spike HTML files
- [ ] Document changes in `style-source-mapping.md`

## 🎨 Style Guidelines

### Approved Color Palette (Simplified)
```css
/* SupportSignal Brand */
ss-teal-light: #3CD7C4    /* Primary brand gradient start */
ss-teal: #2CC4B7          /* Primary brand gradient middle */
ss-teal-deep: #1798A2     /* Primary brand gradient end */
ss-navy: #0C2D55          /* Primary text and headers */
ss-cta-blue: #287BCB      /* Call-to-action buttons */
ss-success: #27AE60       /* Success states */
ss-alert: #F2C94C         /* Warning states */

/* Healthcare Semantic */
healthcare-primary: #0C2D55    /* Navy for professional appearance */
healthcare-accent: #2CC4B7     /* Teal for brand recognition */
healthcare-background: #F4F7FA /* Light grey for clean interface */
```

### Typography Hierarchy
```css
/* Headers */
header-h1: 2.25rem (36px) - Main page titles
header-h2: 1.875rem (30px) - Section headings  
header-h3: 1.25rem (20px) - Subsection headings

/* Body Text */
healthcare-lg: 1.125rem (18px) - Important content
healthcare-base: 1rem (16px) - Standard readable content
healthcare-sm: 0.875rem (14px) - Secondary information
healthcare-xs: 0.75rem (12px) - Labels and supplementary
```

## 📞 Support & Questions

For questions about this folder structure or maintenance:
1. Check `style-source-mapping.md` for detailed origins
2. Review main application files referenced above
3. Consult SupportSignal design system documentation in `/docs/stories/2.0.story.md`
4. For complex component patterns, examine `/apps/web/components/*/` implementations

---

**Last Updated**: 2025-01-08  
**Source Sync Version**: Based on `/apps/web/tailwind.config.js` as of 2025-01-08  
**Maintained By**: BMAD Method Agents