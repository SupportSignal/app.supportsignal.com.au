'use client';

import React, { useMemo } from 'react';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { useAuth } from '@/components/auth/auth-provider';
import { config } from '@/lib/config';

export function ConvexClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sessionToken } = useAuth();

  // Create a Convex client that automatically includes session tokens in all requests
  const authenticatedClient = useMemo(() => {
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
        return originalQuery(query, { ...queryArgs, sessionToken });
      };

      // Override mutation method to inject sessionToken
      // eslint-disable-next-line
      (client as any).mutation = (mutation: any, ...argsAndOptions: any[]) => {
        const [args, options] = argsAndOptions;
        return originalMutation(mutation, { ...args, sessionToken }, options);
      };

      // Override action method to inject sessionToken
      // eslint-disable-next-line
      (client as any).action = (action: any, ...args: any[]) => {
        const [actionArgs] = args.length > 0 ? args : [{}];
        return originalAction(action, { ...actionArgs, sessionToken });
      };
    }

    return client;
  }, [sessionToken]);

  return (
    <ConvexProvider client={authenticatedClient}>{children}</ConvexProvider>
  );
}
