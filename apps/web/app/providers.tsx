'use client';

import React, { useMemo } from 'react';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { useAuth } from '../components/auth/auth-provider';
import { config } from '../lib/config';

export function ConvexClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sessionToken } = useAuth();

  console.log('🔧 CONVEX: ConvexClientProvider rendered with sessionToken:', sessionToken?.slice(0, 8) + '...');

  // Create a Convex client that automatically includes session tokens in all requests
  const authenticatedClient = useMemo(() => {
    console.log('🏭 CONVEX: Creating new client with sessionToken:', sessionToken?.slice(0, 8) + '...');
    const client = new ConvexReactClient(config.convexUrl!);

    // Override the client's query, mutation, and action methods to automatically inject sessionToken
    if (sessionToken) {
      const originalQuery = client.query.bind(client);
      const originalMutation = client.mutation.bind(client);
      const originalAction = client.action.bind(client);

      // Override query method to inject sessionToken
      // eslint-disable-next-line
      (client as any).query = (query: any, ...args: any[]) => {
        const [queryArgs] = args.length > 0 ? args : [{}];
        console.log('🔍 CONVEX: Executing query', query.name || 'unknown', 'with sessionToken:', sessionToken?.slice(0, 8) + '...');
        return originalQuery(query, { ...queryArgs, sessionToken });
      };

      // Override mutation method to inject sessionToken
      // eslint-disable-next-line
      (client as any).mutation = (mutation: any, ...argsAndOptions: any[]) => {
        const [args, options] = argsAndOptions;
        console.log('🔄 CONVEX: Executing mutation', mutation.name || 'unknown', 'with sessionToken:', sessionToken?.slice(0, 8) + '...');
        return originalMutation(mutation, { ...args, sessionToken }, options);
      };

      // Override action method to inject sessionToken
      // eslint-disable-next-line
      (client as any).action = (action: any, ...args: any[]) => {
        const [actionArgs] = args.length > 0 ? args : [{}];
        console.log('⚡ CONVEX: Executing action', action.name || 'unknown', 'with sessionToken:', sessionToken?.slice(0, 8) + '...');
        return originalAction(action, { ...actionArgs, sessionToken });
      };
    } else {
      console.log('⚠️ CONVEX: No sessionToken available, using unmodified client');
    }

    return client;
  }, [sessionToken]);

  console.log('🎯 CONVEX: Returning provider with client for sessionToken:', sessionToken?.slice(0, 8) + '...');

  return (
    <ConvexProvider client={authenticatedClient}>{children}</ConvexProvider>
  );
}
