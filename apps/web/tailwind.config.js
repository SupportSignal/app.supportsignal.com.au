/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  prefix: '',
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
        // ShadCN UI colors (CSS variables)
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        
        // SupportSignal Official Brand Colors
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
        
        // Semantic color mappings for healthcare compliance
        'healthcare': {
          primary: '#0C2D55',        // Navy for professional appearance
          accent: '#2CC4B7',         // Teal for brand recognition
          success: '#27AE60',        // Green for positive outcomes
          warning: '#F2C94C',        // Amber for attention states
          background: '#F4F7FA',     // Light grey for clean interface
          surface: '#FFFFFF',        // White for content areas
        },

        // SupportSignal Dark Mode Healthcare Colors
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
        
        // Workflow status colors
        'workflow': {
          draft: '#6B7280',          // Grey for draft state
          progress: '#287BCB',       // Blue for in-progress
          completed: '#27AE60',      // Green for completed
          alert: '#F2C94C',          // Amber for alerts
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      
      // SupportSignal Typography Scale - Healthcare Readability
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
        'header-h1': ['2.25rem', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.025em' }], // 4xl-6xl range
        'header-h2': ['1.875rem', { lineHeight: '1.3', fontWeight: '600', letterSpacing: '-0.025em' }], // 3xl-4xl range
        'header-h3': ['1.25rem', { lineHeight: '1.4', fontWeight: '600', letterSpacing: '-0.0125em' }], // xl-2xl range
      },
      
      // SupportSignal Layout Grid System
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
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
