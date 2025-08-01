import { ConvexReactClient } from 'convex/react';
import { config } from './config';

if (!config.convexUrl) {
  throw new Error(
    'Missing NEXT_PUBLIC_CONVEX_URL environment variable.\n' +
      'Make sure to add NEXT_PUBLIC_CONVEX_URL to your .env.local file.'
  );
}

export const convex = new ConvexReactClient(config.convexUrl);
