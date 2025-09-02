/**
 * Mock for Convex generated API module
 */

// Mock API endpoints
const mockApi = {
  incidents_listing: {
    getAllCompanyIncidents: 'incidents_listing/getAllCompanyIncidents',
    getMyIncidents: 'incidents_listing/getMyIncidents',
    getIncidentCounts: 'incidents_listing/getIncidentCounts',
    getMyIncompleteIncidents: 'incidents_listing/getMyIncompleteIncidents'
  },
  permissions: {
    checkPermission: 'permissions/checkPermission',
    getUserPermissions: 'permissions/getUserPermissions',
    requirePermission: 'permissions/requirePermission'
  },
  auth: {
    registerUser: 'auth/registerUser',
    loginUser: 'auth/loginUser',
    getCurrentUser: 'auth/getCurrentUser',
    logoutUser: 'auth/logoutUser'
  }
};

module.exports = {
  api: mockApi
};