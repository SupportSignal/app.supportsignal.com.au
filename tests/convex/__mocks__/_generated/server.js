/**
 * Mock for Convex generated server module
 */

// Jest is already available globally, no need to re-declare

// Mock database context with comprehensive CRUD operations and multi-tenant support
const createMockDb = () => {
  const mockData = new Map();
  const mockIndexData = new Map(); // For index-based queries
  const mockPermissions = new Map(); // For permission mocking
  let idCounter = 0;

  return {
    query: jest.fn((tableName) => {
      const queryBuilder = {
        withIndex: jest.fn((indexName, callback) => {
          // Enhanced mock for multi-tenant index queries
          const mockQuery = {
            eq: jest.fn((field, value) => {
              // Store the query parameters for security validation
              queryBuilder._lastQueryParams = queryBuilder._lastQueryParams || {};
              queryBuilder._lastQueryParams[field] = value;
              
              // For multi-tenant security testing, return data based on index + parameters
              let resultKey = `${tableName}_${indexName}`;
              
              if (indexName === 'by_company') {
                resultKey = `${tableName}_${indexName}_${value}`;
              } else if (indexName === 'by_company_user') {
                // Handle compound key for by_company_user index
                resultKey = queryBuilder._compoundKey || resultKey;
              }
              
              const indexData = mockIndexData.get(indexName);
              let results = [];
              
              if (indexData && indexName === 'by_company') {
                results = indexData[value] || [];
              } else if (indexData && indexName === 'by_company_user') {
                // For compound keys, look for specific company_user combination
                const companyId = queryBuilder._lastQueryParams.company_id;
                const userId = queryBuilder._lastQueryParams.created_by;
                if (companyId && userId) {
                  const compoundKey = `${companyId}_${userId}`;
                  results = indexData[compoundKey] || [];
                }
              } else {
                results = mockData.get(`${tableName}_collect`) || [];
              }
              
              return {
                eq: queryBuilder.eq, // Allow chaining for compound queries
                collect: jest.fn(async () => results),
                first: jest.fn(async () => results[0] || null),
                filter: jest.fn(() => ({
                  order: jest.fn(() => ({
                    take: jest.fn(async (limit) => results.slice(0, limit))
                  })),
                  collect: jest.fn(async () => results)
                }))
              };
            })
          };
          
          // Call the callback with the mock query builder
          if (typeof callback === 'function') {
            return callback(mockQuery);
          }
          
          return {
            ...queryBuilder,
            first: jest.fn(async () => mockData.get(`${tableName}_first`) || null),
            collect: jest.fn(async () => mockData.get(`${tableName}_collect`) || []),
          };
        }),
        filter: jest.fn(() => ({
          ...queryBuilder,
          first: jest.fn(async () => mockData.get(`${tableName}_first`) || null),
          collect: jest.fn(async () => mockData.get(`${tableName}_collect`) || []),
        })),
        order: jest.fn(() => ({
          ...queryBuilder,
          take: jest.fn(async (limit) => 
            (mockData.get(`${tableName}_collect`) || []).slice(0, limit)
          ),
        })),
        first: jest.fn(async () => mockData.get(`${tableName}_first`) || null),
        collect: jest.fn(async () => mockData.get(`${tableName}_collect`) || []),
      };
      
      // Store reference to queryBuilder for security testing
      queryBuilder.eq = jest.fn();
      return queryBuilder;
    }),
    insert: jest.fn(async (tableName, data) => {
      const id = `${tableName}_${++idCounter}`;
      const record = { _id: id, ...data, _creationTime: Date.now() };
      
      // Store in collections
      const existing = mockData.get(`${tableName}_collect`) || [];
      existing.push(record);
      mockData.set(`${tableName}_collect`, existing);
      
      // Store as first result for single queries
      mockData.set(`${tableName}_first`, record);
      
      return id;
    }),
    patch: jest.fn(async (id, updates) => {
      // Update mock data
      const tableName = id.split('_')[0];
      const collection = mockData.get(`${tableName}_collect`) || [];
      const index = collection.findIndex(item => item._id === id);
      if (index >= 0) {
        collection[index] = { ...collection[index], ...updates };
        mockData.set(`${tableName}_collect`, collection);
      }
    }),
    delete: jest.fn(async (id) => {
      const tableName = id.split('_')[0];
      const collection = mockData.get(`${tableName}_collect`) || [];
      const filtered = collection.filter(item => item._id !== id);
      mockData.set(`${tableName}_collect`, filtered);
    }),
    get: jest.fn(async (id) => {
      const tableName = id.split('_')[0];
      const collection = mockData.get(`${tableName}_collect`) || [];
      return collection.find(item => item._id === id) || null;
    }),
    
    // Helper methods for tests
    _setMockData: (tableName, data) => mockData.set(tableName, data),
    _getMockData: (tableName) => mockData.get(tableName),
    _clearMockData: () => mockData.clear(),
    
    // Enhanced helpers for multi-tenant security testing
    _setMockIndexData: (indexName, data) => mockIndexData.set(indexName, data),
    _getMockIndexData: (indexName) => mockIndexData.get(indexName),
    _clearMockIndexData: () => mockIndexData.clear(),
    
    // Permission mocking helpers
    _setPermissionMockResult: (user, permission, hasPermission) => {
      const key = `${user._id}_${permission}`;
      mockPermissions.set(key, hasPermission);
    },
    _getPermissionMockResult: (user, permission) => {
      const key = `${user._id}_${permission}`;
      return mockPermissions.get(key);
    },
    _clearPermissionMocks: () => mockPermissions.clear(),
  };
};

// Mock context with comprehensive functionality
const createMockCtx = () => {
  const mockDb = createMockDb();
  
  return {
    db: mockDb,
    runQuery: jest.fn(),
    runMutation: jest.fn(),
    runAction: jest.fn(),
    
    // Session resolver mocking for multi-tenant security tests
    mockSessionResolver: {},
    
    // Store reference to queryBuilder for validation in tests
    queryBuilder: mockDb.query().withIndex(),
  };
};

// Export mock functions
module.exports = {
  query: jest.fn((config) => config.handler),
  mutation: jest.fn((config) => config.handler),
  internalMutation: jest.fn((config) => config.handler),
  action: jest.fn((config) => config.handler),
  httpAction: jest.fn((config) => config.handler),
  
  // Helper to create mock context for tests
  createMockCtx,
};