import './globals.css';
import { Inter } from 'next/font/google';
import React from 'react';
import { ConvexClientProvider } from './providers';
import { AuthProvider } from '@/components/auth/auth-provider';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { LoggingProvider } from '@/components/logging/logging-provider';
import { VersionProvider } from '@/components/dev/version-provider';
import { MainLayout } from '@/components/layout/main-layout';
import { Toaster } from 'sonner';

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
                // Suppress hydration warnings and error toasts in development
                const originalError = console.error;
                console.error = (...args) => {
                  if (
                    typeof args[0] === 'string' &&
                    (args[0].includes('Hydration failed') ||
                     args[0].includes('There was an error while hydrating') ||
                     args[0].includes('server HTML to contain a matching') ||
                     args[0].includes('Extra attributes from the server'))
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
                     args[0].includes('An error occurred during hydration') ||
                     args[0].includes('Extra attributes from the server'))
                  ) {
                    return;
                  }
                  originalWarn.apply(console, args);
                };

                // Suppress React error boundary from showing hydration errors as toasts
                window.addEventListener('error', function(event) {
                  const error = event.error;
                  if (error && error.message && (
                    error.message.includes('Hydration failed') ||
                    error.message.includes('There was an error while hydrating') ||
                    error.message.includes('server HTML to contain a matching') ||
                    error.message.includes('Extra attributes from the server')
                  )) {
                    event.preventDefault();
                    event.stopPropagation();
                    return false;
                  }
                });

                // Also handle unhandled promise rejections related to hydration
                window.addEventListener('unhandledrejection', function(event) {
                  if (event.reason && event.reason.message && (
                    event.reason.message.includes('Hydration failed') ||
                    event.reason.message.includes('There was an error while hydrating') ||
                    event.reason.message.includes('server HTML to contain a matching') ||
                    event.reason.message.includes('Extra attributes from the server')
                  )) {
                    event.preventDefault();
                    return false;
                  }
                });
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
                  showFlashNotifications={false}
                  indicatorPosition="bottom-left"
                  maxVersions={20}
                >
                  <MainLayout>
                    {children}
                  </MainLayout>
                </VersionProvider>
              </ConvexClientProvider>
            </LoggingProvider>
          </AuthProvider>
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
