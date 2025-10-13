/**
 * Validation Helpers for Convex Mutations
 * Story 7.5 - Company Update Validation
 */

interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate company update data
 */
export function validateCompanyUpdate(updates: {
  name?: string;
  contact_email?: string;
  status?: 'active' | 'trial' | 'suspended' | 'test';
}): ValidationResult {
  const errors: Record<string, string> = {};

  // Validate name
  if (updates.name !== undefined) {
    if (!updates.name || updates.name.trim().length === 0) {
      errors.name = 'Company name is required';
    } else if (updates.name.length > 100) {
      errors.name = 'Company name must be 100 characters or less';
    }
  }

  // Validate contact_email
  if (updates.contact_email !== undefined) {
    if (!updates.contact_email || !isValidEmail(updates.contact_email)) {
      errors.contact_email = 'Valid email address is required';
    }
  }

  // Validate status
  if (updates.status !== undefined) {
    const validStatuses = ['active', 'trial', 'suspended', 'test'];
    if (!validStatuses.includes(updates.status)) {
      errors.status = 'Invalid status. Must be one of: active, trial, suspended, test';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
