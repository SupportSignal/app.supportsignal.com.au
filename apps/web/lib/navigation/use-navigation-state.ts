'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { NavigationState } from '@/components/layout/navigation-types';

interface NavigationStore extends NavigationState {
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setActivePath: (path: string) => void;
  toggleSection: (sectionId: string) => void;
  setExpandedSections: (sections: string[]) => void;
  setMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
}

export const useNavigationState = create<NavigationStore>()(
  persist(
    (set, get) => ({
      // Initial state
      sidebarCollapsed: false,
      activePath: '/',
      expandedSections: [],
      mobileMenuOpen: false,

      // Actions
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setSidebarCollapsed: (collapsed: boolean) =>
        set({ sidebarCollapsed: collapsed }),

      setActivePath: (path: string) =>
        set({ activePath: path }),

      toggleSection: (sectionId: string) =>
        set((state) => ({
          expandedSections: state.expandedSections.includes(sectionId)
            ? state.expandedSections.filter((id) => id !== sectionId)
            : [...state.expandedSections, sectionId],
        })),

      setExpandedSections: (sections: string[]) =>
        set({ expandedSections: sections }),

      setMobileMenuOpen: (open: boolean) =>
        set({ mobileMenuOpen: open }),

      toggleMobileMenu: () =>
        set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
    }),
    {
      name: 'navigation-state',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        expandedSections: state.expandedSections,
      }),
    }
  )
);