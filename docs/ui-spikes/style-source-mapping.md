# Style Source Mapping - SupportSignal Design System

## Overview
This document provides **detailed traceability** from the main SupportSignal application's design system to our simplified HTML/CSS experimentation environment. Use this as a reference for maintaining consistency and syncing changes.

## 🎯 Source of Truth Files

### Primary Configuration Source
**File**: `/apps/web/tailwind.config.js`  
**Last Synced**: 2025-01-08  
**Lines of Interest**: 56-167 (SupportSignal colors and typography)

### Supporting Design Sources  
**File**: `/docs/stories/2.0.story.md` - SupportSignal Design System Foundation  
**File**: `/apps/web/app/showcase/page.tsx` - Component usage examples  
**File**: `/apps/web/components/*/` - React component implementations

## 🎨 Color System Mapping

### SupportSignal Brand Colors
**Source**: `/apps/web/tailwind.config.js` lines 56-67

| Original Class | Hex Value | Our Usage | Purpose |
|---|---|---|---|
| `ss-teal-light` | `#3CD7C4` | Same | Primary brand gradient start |
| `ss-teal` (DEFAULT) | `#2CC4B7` | Same | Primary brand gradient middle |
| `ss-teal-deep` | `#1798A2` | Same | Primary brand gradient end |
| `ss-navy` | `#0C2D55` | Same | Primary text and headers |
| `ss-bg-grey` | `#F4F7FA` | Same | Background sections |
| `ss-cta-blue` | `#287BCB` | Same | Call-to-action buttons |
| `ss-success` | `#27AE60` | Same | Success states and confirmations |
| `ss-alert` | `#F2C94C` | Same | Warning and alert states |

### Healthcare Semantic Colors  
**Source**: `/apps/web/tailwind.config.js` lines 68-76

| Original Class | Hex Value | Our Usage | Healthcare Context |
|---|---|---|---|
| `healthcare-primary` | `#0C2D55` | Same | Navy for professional appearance |
| `healthcare-accent` | `#2CC4B7` | Same | Teal for brand recognition |
| `healthcare-success` | `#27AE60` | Same | Green for positive outcomes |
| `healthcare-warning` | `#F2C94C` | Same | Amber for attention states |
| `healthcare-background` | `#F4F7FA` | Same | Light grey for clean interface |
| `healthcare-surface` | `#FFFFFF` | Same | White for content areas |

### Dark Mode Healthcare Colors
**Source**: `/apps/web/tailwind.config.js` lines 78-89  
**Implementation**: Available in our CSS but **not actively used** in spikes (focusing on light mode)

| Original Class | Hex Value | Notes |
|---|---|---|
| `healthcare-dark-primary` | `#E2F4F2` | Light teal-tinted text |
| `healthcare-dark-accent` | `#3CD7C4` | Brighter teal for dark mode |
| `healthcare-dark-background` | `#0F1419` | Deep navy-black |
| `healthcare-dark-surface` | `#1A2332` | Navy-grey for cards |

### Workflow Status Colors
**Source**: `/apps/web/tailwind.config.js` lines 91-97

| Original Class | Hex Value | Our Usage | Workflow Context |
|---|---|---|---|
| `workflow-draft` | `#6B7280` | Same | Grey for draft state |
| `workflow-progress` | `#287BCB` | Same | Blue for in-progress |
| `workflow-completed` | `#27AE60` | Same | Green for completed |
| `workflow-alert` | `#F2C94C` | Same | Amber for alerts |

## 📝 Typography System Mapping

### Healthcare-Optimized Type Scale
**Source**: `/apps/web/tailwind.config.js` lines 110-125

| Original Class | Font Size | Line Height | Letter Spacing | Our Implementation |
|---|---|---|---|---|
| `healthcare-xs` | 0.75rem (12px) | 1.25 | 0.025em | Exact match |
| `healthcare-sm` | 0.875rem (14px) | 1.5 | 0.025em | Exact match |
| `healthcare-base` | 1rem (16px) | 1.6 | 0.0125em | Exact match |
| `healthcare-lg` | 1.125rem (18px) | 1.6 | 0.0125em | Exact match |
| `healthcare-xl` | 1.25rem (20px) | 1.5 | 0.0125em | Exact match |
| `healthcare-2xl` | 1.5rem (24px) | 1.4 | 0.0125em | Exact match |

### Header Hierarchy  
**Source**: `/apps/web/tailwind.config.js` lines 122-125

| Original Class | Font Size | Weight | Letter Spacing | Usage |
|---|---|---|---|---|
| `header-h1` | 2.25rem (36px) | 700 | -0.025em | Main page titles |
| `header-h2` | 1.875rem (30px) | 600 | -0.025em | Section headings |
| `header-h3` | 1.25rem (20px) | 600 | -0.0125em | Subsection headings |

### Font Family
**Source**: `/apps/web/tailwind.config.js` lines 106-109  
**Original**: `Inter, system-ui, sans-serif`  
**Our Implementation**: Using Google Fonts CDN for Inter font

## 📏 Spacing System Mapping  

### SupportSignal Spacing Scale
**Source**: `/apps/web/tailwind.config.js` lines 128-137

| Original Class | Value | Pixels | Our Usage | Context |
|---|---|---|---|---|
| `ss-xs` | 0.5rem | 8px | Same | Minimal spacing |
| `ss-sm` | 0.75rem | 12px | Same | Small spacing |
| `ss-md` | 1rem | 16px | Same | Standard spacing |
| `ss-lg` | 1.5rem | 24px | Same | Large spacing |
| `ss-xl` | 2rem | 32px | Same | Extra large spacing |
| `ss-2xl` | 3rem | 48px | Same | Section spacing |
| `ss-3xl` | 4rem | 64px | Same | Major section spacing |

### Layout-Specific Spacing
**Source**: `/apps/web/tailwind.config.js` lines 139-141

| Original Class | Value | Pixels | Purpose |
|---|---|---|---|
| `sidebar` | 15rem | 240px | Fixed sidebar width |
| `content-max` | 87.5rem | 1400px | Max content width |

### Container Max Widths  
**Source**: `/apps/web/tailwind.config.js` lines 144-148

| Original Class | Value | Pixels | Usage |
|---|---|---|---|
| `ss-content` | 87.5rem | 1400px | Main container max-width |
| `ss-form` | 32rem | 512px | Form containers |
| `ss-card` | 24rem | 384px | Card components |

## 🔄 Change Tracking

### Version History
| Date | Changes | Source Lines | Updated Files |
|---|---|---|---|
| 2025-01-08 | Initial mapping created | All | All spike files created |

### Monitoring Checklist
**For Agents maintaining this folder:**

**Colors** (Check `/apps/web/tailwind.config.js` lines 56-97):
- [ ] New `ss-*` brand colors added?
- [ ] `healthcare-*` semantic colors modified?
- [ ] `workflow-*` status colors changed?
- [ ] Dark mode colors updated?

**Typography** (Check `/apps/web/tailwind.config.js` lines 106-125):
- [ ] `healthcare-*` font sizes modified?
- [ ] `header-*` hierarchy changed?
- [ ] Font family updates?
- [ ] Line height or letter spacing adjustments?

**Spacing** (Check `/apps/web/tailwind.config.js` lines 128-148):
- [ ] `ss-*` spacing scale modified?
- [ ] Layout constants changed?
- [ ] Max-width values updated?

## 📋 Implementation Notes

### What We Simplified
- **CSS Variables**: Converted from HSL CSS variables to direct hex values
- **ShadCN Integration**: Removed ShadCN-specific color mappings
- **Complex Animations**: Kept only basic transitions
- **Plugin Dependencies**: Using CDN Tailwind instead of build process

### What We Preserved Exactly
- **All SupportSignal brand colors and hex values**
- **Complete healthcare typography scale**
- **Exact spacing system and layout constants**
- **Component naming conventions**

### What We Document But Don't Implement
- **Dark mode variants**: Available but not actively used in spikes
- **Complex keyframes**: Documented but simplified in HTML
- **React-specific patterns**: Converted to vanilla HTML/CSS

## 🚨 Breaking Change Alerts

**If These Change in Main App, Update Immediately:**
1. **Primary brand colors** (`ss-teal`, `ss-navy`) - Core identity
2. **Healthcare semantic colors** - Compliance requirements  
3. **Typography scale** - Readability standards
4. **Layout constants** - Responsive behavior

**Monitor But Less Critical:**
1. Dark mode colors (not used in spikes)
2. Animation keyframes (simplified anyway)
3. Plugin configurations (using CDN)

---

**Next Review Date**: 2025-02-08 (Monthly)  
**Maintenance Agent**: Use this document for systematic sync checks  
**Source Version**: Based on main app as of 2025-01-08