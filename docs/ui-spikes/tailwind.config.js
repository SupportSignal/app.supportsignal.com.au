/** @type {import('tailwindcss').Config} */
// SupportSignal UI Spikes - Simplified Tailwind Configuration
// Source: /apps/web/tailwind.config.js (extracted 2025-01-08)
// Simplified for HTML/CSS experimentation - no React/ShadCN dependencies

module.exports = {
  content: [
    './docs/ui-spikes/**/*.{html,js}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        // SupportSignal Official Brand Colors (Source: lines 56-67)
        'ss-teal': {
          light: '#3CD7C4',   // Primary brand gradient start
          DEFAULT: '#2CC4B7', // Primary brand gradient middle  
          deep: '#1798A2',    // Primary brand gradient end
        },
        'ss-navy': '#0C2D55',        // Primary text and headers
        'ss-bg-grey': '#F4F7FA',     // Background sections
        'ss-cta-blue': '#287BCB',    // Call-to-action buttons
        'ss-success': '#27AE60',     // Success states and confirmations
        'ss-alert': '#F2C94C',       // Warning and alert states
        
        // Semantic color mappings for healthcare compliance (Source: lines 68-76)
        'healthcare': {
          primary: '#0C2D55',        // Navy for professional appearance
          accent: '#2CC4B7',         // Teal for brand recognition
          success: '#27AE60',        // Green for positive outcomes
          warning: '#F2C94C',        // Amber for attention states
          background: '#F4F7FA',     // Light grey for clean interface
          surface: '#FFFFFF',        // White for content areas
        },

        // SupportSignal Dark Mode Healthcare Colors (Source: lines 78-89)
        // Note: Available but not actively used in HTML spikes
        'healthcare-dark': {
          primary: '#E2F4F2',        // Light teal-tinted text for readability
          accent: '#3CD7C4',         // Brighter teal for dark mode visibility
          success: '#4ADE80',        // Lighter green for dark mode
          warning: '#FBBF24',        // Lighter amber for dark mode
          background: '#0F1419',     // Deep navy-black for professional dark mode
          surface: '#1A2332',        // Navy-grey for cards and surfaces
          'surface-hover': '#243447', // Slightly lighter for hover states
          border: '#334155',         // Subtle borders in dark mode
          muted: '#64748B',          // Muted text color
        },
        
        // Workflow status colors (Source: lines 91-97)
        'workflow': {
          draft: '#6B7280',          // Grey for draft state
          progress: '#287BCB',       // Blue for in-progress
          completed: '#27AE60',      // Green for completed
          alert: '#F2C94C',          // Amber for alerts
        },

        // Standard color palette for general use
        'gray': {
          50: '#f9fafb',
          100: '#f3f4f6', 
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        'blue': {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        'green': {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        'red': {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        'amber': {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
      },
      
      // SupportSignal Typography Scale - Healthcare Readability (Source: lines 105-125)
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'], // Clean, modern healthcare font
        'healthcare': ['Inter', 'system-ui', 'sans-serif'], // Semantic healthcare font
      },
      fontSize: {
        // Healthcare-optimized type scale
        'healthcare-xs': ['0.75rem', { lineHeight: '1.25', letterSpacing: '0.025em' }],
        'healthcare-sm': ['0.875rem', { lineHeight: '1.5', letterSpacing: '0.025em' }],
        'healthcare-base': ['1rem', { lineHeight: '1.6', letterSpacing: '0.0125em' }],
        'healthcare-lg': ['1.125rem', { lineHeight: '1.6', letterSpacing: '0.0125em' }],
        'healthcare-xl': ['1.25rem', { lineHeight: '1.5', letterSpacing: '0.0125em' }],
        'healthcare-2xl': ['1.5rem', { lineHeight: '1.4', letterSpacing: '0.0125em' }],
        'healthcare-3xl': ['1.875rem', { lineHeight: '1.3', letterSpacing: '0.0125em' }],
        'healthcare-4xl': ['2.25rem', { lineHeight: '1.2', letterSpacing: '0.0125em' }],
        
        // Header hierarchy from story requirements
        'header-h1': ['2.25rem', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.025em' }], // Main page titles
        'header-h2': ['1.875rem', { lineHeight: '1.3', fontWeight: '600', letterSpacing: '-0.025em' }], // Section headings
        'header-h3': ['1.25rem', { lineHeight: '1.4', fontWeight: '600', letterSpacing: '-0.0125em' }], // Subsection headings
      },
      
      // SupportSignal Layout Grid System (Source: lines 127-148)
      spacing: {
        // Component spacing scale: 8px (xs), 12px (sm), 16px (md), 24px (lg), 32px (xl)
        'ss-xs': '0.5rem',    // 8px
        'ss-sm': '0.75rem',   // 12px
        'ss-md': '1rem',      // 16px
        'ss-lg': '1.5rem',    // 24px
        'ss-xl': '2rem',      // 32px
        'ss-2xl': '3rem',     // 48px
        'ss-3xl': '4rem',     // 64px
        
        // Layout-specific spacing
        'sidebar': '15rem',   // 240px fixed sidebar
        'content-max': '87.5rem', // 1400px max content width
      },
      
      // Healthcare-compliant layout patterns
      maxWidth: {
        'ss-content': '87.5rem', // 1400px container max-width
        'ss-form': '32rem',      // 512px for form containers
        'ss-card': '24rem',      // 384px for card components
      },

      // Border radius (simplified)
      borderRadius: {
        'lg': '0.5rem',
        'md': '0.375rem', 
        'sm': '0.25rem',
      },

      // Basic animations (simplified from source)
      keyframes: {
        'fadeIn': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slideIn': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      animation: {
        'fadeIn': 'fadeIn 0.3s ease-in-out',
        'slideIn': 'slideIn 0.3s ease-out',
      },
    },
  },
  plugins: [],
};

/*
MAINTENANCE NOTES FOR AGENTS:
- Source file: /apps/web/tailwind.config.js 
- Last synced: 2025-01-08
- Removed: ShadCN CSS variables, complex animations, build plugins
- Preserved: All SupportSignal colors, typography, spacing exactly
- Changes to monitor: New ss-* colors, healthcare-* semantic colors, spacing system
- Update trigger: Any changes to main app Tailwind config lines 56-167
*/