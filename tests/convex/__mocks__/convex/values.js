/**
 * Mock for Convex values module
 */

// Mock validation functions
const v = {
  string: () => ({ type: 'string' }),
  number: () => ({ type: 'number' }),
  boolean: () => ({ type: 'boolean' }),
  array: (itemType) => ({ type: 'array', itemType }),
  object: (schema) => ({ type: 'object', schema }),
  optional: (type) => ({ type: 'optional', innerType: type }),
  union: (...types) => ({ type: 'union', types }),
  literal: (value) => ({ type: 'literal', value }),
  id: (table) => ({ type: 'id', table }),
  any: () => ({ type: 'any' }),
};

// Mock ConvexError
class ConvexError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConvexError';
  }
}

module.exports = {
  v,
  ConvexError,
};