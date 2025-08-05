import './globals.css';
import { Inter } from 'next/font/google';
import React from 'react';
import { ConvexClientProvider } from './providers';
import { AuthProvider } from '../components/auth/auth-provider';
import { ThemeProvider } from '../components/theme/theme-provider';
import { LoggingProvider } from '../components/logging/logging-provider';
import { VersionProvider } from '../components/dev/version-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Agentic Starter Template',
  description: 'A production-grade starter template for AI-native applications',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {process.env.NODE_ENV === 'development' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                // Suppress hydration warnings in development
                const originalError = console.error;
                console.error = (...args) => {
                  if (
                    typeof args[0] === 'string' &&
                    (args[0].includes('Hydration failed') ||
                     args[0].includes('There was an error while hydrating') ||
                     args[0].includes('server HTML to contain a matching'))
                  ) {
                    return;
                  }
                  originalError.apply(console, args);
                };
                
                const originalWarn = console.warn;
                console.warn = (...args) => {
                  if (
                    typeof args[0] === 'string' &&
                    (args[0].includes('Expected server HTML') ||
                     args[0].includes('An error occurred during hydration'))
                  ) {
                    return;
                  }
                  originalWarn.apply(console, args);
                };
              `,
            }}
          />
        )}
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <LoggingProvider>
              <ConvexClientProvider>
                <VersionProvider
                  showIndicator={true}
                  showFlashNotifications={true}
                  indicatorPosition="bottom-left"
                  maxVersions={20}
                >
                  {children}
                </VersionProvider>
              </ConvexClientProvider>
            </LoggingProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
