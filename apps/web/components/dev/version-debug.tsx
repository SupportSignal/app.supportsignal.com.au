'use client';

import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/lib/convex-api';
import { useAuth } from '@/components/auth/auth-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@starter/ui';

/**
 * Debug component to help test version tracking access
 * Shows current user info and access status
 */
export function VersionDebug() {
  const { user, sessionToken } = useAuth();

  // Check owner access
  const ownerAccess = useQuery(
    api.auth.verifyOwnerAccess,
    sessionToken ? { sessionToken } : 'skip'
  );

  return (
    <Card className="max-w-md mx-auto mt-8 border-blue-200">
      <CardHeader>
        <CardTitle className="text-blue-800">Version System Debug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold text-gray-700">Authentication Status</h4>
          <p>Logged in: {user ? '✅ Yes' : '❌ No'}</p>
          {user && (
            <>
              <p>Email: {user.email}</p>
              <p>Name: {user.name}</p>
            </>
          )}
        </div>

        <div>
          <h4 className="font-semibold text-gray-700">Owner Access Check</h4>
          {ownerAccess === undefined ? (
            <p>Loading...</p>
          ) : ownerAccess === null ? (
            <p>❌ No session token</p>
          ) : (
            <>
              <p>Has Access: {ownerAccess.hasAccess ? '✅ Yes' : '❌ No'}</p>
              <p>Reason: {ownerAccess.reason}</p>
              {ownerAccess.userEmail && (
                <p>User Email: {ownerAccess.userEmail}</p>
              )}
            </>
          )}
        </div>

        <div>
          <h4 className="font-semibold text-gray-700">Expected Behavior</h4>
          <p>Version indicator will show if:</p>
          <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
            <li>You&apos;re logged in</li>
            <li>Your email is: david@ideasmen.com.au</li>
            <li>Version manifest exists</li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-gray-700">Troubleshooting</h4>
          <p className="text-sm text-gray-600">
            If you don&apos;t see the version indicator:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
            <li>Log in with david@ideasmen.com.au</li>
            <li>Check browser console for errors</li>
            <li>Verify version manifest exists at /version-manifest.json</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

export default VersionDebug;
