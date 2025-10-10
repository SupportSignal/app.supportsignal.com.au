# Example: Sonner Toast Notifications for CRUD Operations

## Overview

This example demonstrates the complete pattern for using Sonner toast notifications to provide user feedback for Create, Read, Update, Delete (CRUD) operations.

**Source**: Story 7.3 - Site Management implementation
**Files**:
- `apps/web/app/layout.tsx` - Toast setup
- `apps/web/app/admin/companies/[id]/sites/page.tsx` - CRUD handlers
- `apps/convex/sites/admin.ts` - Backend with structured errors

## Complete Implementation Pattern

### Step 1: Setup Toaster in Root Layout

**File**: `apps/web/app/layout.tsx`

```typescript
import { Toaster } from 'sonner';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          {children}

          {/* CRITICAL: Required for toast notifications to work */}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### Step 2: Backend Structured Error Handling

**File**: `apps/convex/sites/admin.ts`

```typescript
import { mutation } from '../_generated/server';
import { v, ConvexError } from 'convex/values';
import { requirePermission, PERMISSIONS } from '../permissions';

export const deleteSite = mutation({
  args: {
    sessionToken: v.string(),
    siteId: v.id('sites'),
  },
  handler: async (ctx, args) => {
    // Authentication
    const { user } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.MANAGE_COMPANY
    );

    // Get the site
    const site = await ctx.db.get(args.siteId);
    if (!site) {
      throw new ConvexError({
        message: 'Site not found',
        code: 'SITE_NOT_FOUND'
      });
    }

    // Business logic validation
    const companySites = await ctx.db
      .query('sites')
      .withIndex('by_company', (q) => q.eq('company_id', site.company_id))
      .collect();

    if (companySites.length === 1) {
      throw new ConvexError({
        message: 'Cannot delete the last site for a company. Each company must have at least one site.',
        code: 'LAST_SITE_DELETE_FORBIDDEN'
      });
    }

    // Delete the site
    await ctx.db.delete(args.siteId);

    console.log('🏢 SITE DELETED', {
      siteId: args.siteId,
      siteName: site.name,
      deletedBy: user._id,
    });

    return { success: true };
  },
});

export const createSite = mutation({
  args: {
    sessionToken: v.string(),
    companyId: v.id('companies'),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.MANAGE_COMPANY
    );

    // Validate input
    if (args.name.trim().length < 2) {
      throw new ConvexError({
        message: 'Site name must be at least 2 characters',
        code: 'INVALID_SITE_NAME'
      });
    }

    // Check for duplicates
    const existingSite = await ctx.db
      .query('sites')
      .withIndex('by_name', (q) =>
        q.eq('company_id', args.companyId).eq('name', args.name)
      )
      .first();

    if (existingSite) {
      throw new ConvexError({
        message: 'A site with this name already exists for this company',
        code: 'DUPLICATE_SITE_NAME'
      });
    }

    // Create the site
    const siteId = await ctx.db.insert('sites', {
      company_id: args.companyId,
      name: args.name.trim(),
      created_at: Date.now(),
      created_by: user._id,
    });

    console.log('🏢 SITE CREATED', {
      siteId,
      companyId: args.companyId,
      siteName: args.name,
    });

    return { siteId };
  },
});
```

### Step 3: Frontend CRUD Handlers with Toast Notifications

**File**: `apps/web/app/admin/companies/[id]/sites/page.tsx`

```typescript
'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/components/auth/auth-provider';
import { toast } from 'sonner';

export default function SitesManagementPage() {
  const { user, sessionToken } = useAuth();
  const companyId = params.id as Id<'companies'>;

  // State for dialogs
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState<any>(null);
  const [siteName, setSiteName] = useState('');

  // Mutations
  const createSite = useMutation(api.sites.admin.createSite);
  const updateSite = useMutation(api.sites.admin.updateSite);
  const deleteSite = useMutation(api.sites.admin.deleteSite);

  // CREATE handler with toast feedback
  const handleCreate = async () => {
    if (!sessionToken) return;

    try {
      await createSite({
        sessionToken,
        companyId,
        name: siteName.trim(),
      });

      // ✅ Success feedback
      toast.success('Site created successfully');

      // Reset form and close dialog
      setSiteName('');
      setIsCreateOpen(false);
    } catch (err: any) {
      // ❌ Error feedback - extract clean message
      const errorMessage = err.data?.message || 'Failed to create site';
      toast.error(errorMessage);
    }
  };

  // UPDATE handler with toast feedback
  const handleUpdate = async () => {
    if (!sessionToken || !selectedSite) return;

    try {
      await updateSite({
        sessionToken,
        siteId: selectedSite._id,
        name: siteName.trim(),
      });

      // ✅ Success feedback
      toast.success('Site updated successfully');

      // Reset and close
      setSiteName('');
      setSelectedSite(null);
      setIsEditOpen(false);
    } catch (err: any) {
      // ❌ Error feedback
      const errorMessage = err.data?.message || 'Failed to update site';
      toast.error(errorMessage);
    }
  };

  // DELETE handler with toast feedback
  const handleDelete = async () => {
    if (!sessionToken || !selectedSite) return;

    try {
      await deleteSite({
        sessionToken,
        siteId: selectedSite._id,
      });

      // ✅ Success feedback
      toast.success('Site deleted successfully');

      // Reset and close
      setSelectedSite(null);
      setIsDeleteOpen(false);
    } catch (err: any) {
      // ❌ Error feedback
      const errorMessage = err.data?.message || 'Failed to delete site';
      toast.error(errorMessage);

      // Close dialog - toast shows the error
      setIsDeleteOpen(false);
    }
  };

  return (
    <div>
      {/* UI components with button handlers */}
      <Button onClick={handleCreate}>Create Site</Button>
      <Button onClick={handleUpdate}>Update Site</Button>
      <Button onClick={handleDelete}>Delete Site</Button>
    </div>
  );
}
```

## Key Patterns Demonstrated

### 1. **Consistent Error Extraction Pattern**
```typescript
const errorMessage = err.data?.message || 'Fallback message';
toast.error(errorMessage);
```

### 2. **Success + Error Paths Both Use Toasts**
```typescript
try {
  await mutation({...});
  toast.success('Operation succeeded');  // ✅ Green toast
} catch (err: any) {
  toast.error(errorMessage);             // ❌ Red toast
}
```

### 3. **Dialog Closes After Toast (Non-Blocking)**
```typescript
catch (err: any) {
  toast.error(errorMessage);
  setIsDeleteOpen(false);  // Close dialog, user sees toast
}
```

### 4. **Structured Backend Errors**
```typescript
// Backend throws structured error
throw new ConvexError({
  message: 'User-friendly message',  // This appears in toast
  code: 'ERROR_CODE'                 // For programmatic handling
});

// Frontend extracts clean message
const errorMessage = err.data?.message;
```

## Visual Result

### Success Toast (Green)
```
✓ Site created successfully
```

### Error Toast (Red)
```
✗ Cannot delete the last site for a company. Each company must have at least one site.
```

### Info Toast (Blue)
```
ℹ Processing your request...
```

## Common Mistakes to Avoid

### ❌ Missing Toaster Component
```typescript
// This will fail silently!
toast.error('Error message');

// Without <Toaster /> in layout, nothing appears
```

### ❌ Using Alert Components in Dialogs
```typescript
// Old pattern - requires state management
const [error, setError] = useState('');

{error && (
  <Alert variant="destructive">
    <AlertDescription>{error}</AlertDescription>
  </Alert>
)}
```

### ❌ Not Extracting Clean Error Messages
```typescript
// Shows: "[CONVEX M(...)] [Request ID: ...] Server Error"
toast.error(err.message);  // Wrong!

// Shows: "Cannot delete the last site..."
toast.error(err.data?.message);  // Correct!
```

## Testing Checklist

- [ ] Toast appears visually (not just in console)
- [ ] Success toasts are green with checkmark
- [ ] Error toasts are red with error icon
- [ ] Toasts auto-dismiss after ~4 seconds
- [ ] Multiple toasts stack properly
- [ ] Error messages are clean (no [CONVEX M(...)])
- [ ] Dialogs close immediately, toast remains visible

## Related Patterns

- [Sonner Toast Configuration](../patterns/sonner-toast-configuration.md)
- [ConvexError Handling](../patterns/convex-error-handling.md)
- [Frontend Error Handling](../patterns/frontend-patterns.md)

## Implementation Story

**Story**: 7.3 - Site Management (System Admin)
**Date**: October 2025
**Key Learning**: Required `<Toaster />` component in layout for any toast notifications to work
