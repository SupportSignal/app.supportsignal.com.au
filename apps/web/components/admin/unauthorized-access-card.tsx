import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@starter/ui/card';
import { Button } from '@starter/ui/button';
import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';

interface UnauthorizedAccessCardProps {
  message: string;
  showHomeButton?: boolean;
  customActions?: React.ReactNode;
}

export function UnauthorizedAccessCard({
  message,
  showHomeButton = true,
  customActions
}: UnauthorizedAccessCardProps) {
  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-600" />
            Unauthorized Access
          </CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            You don't have the required permissions to access this resource.
          </p>
          {customActions || (
            <div className="flex gap-3">
              <Link href="/admin">
                <Button variant="outline">Return to Admin Dashboard</Button>
              </Link>
              {showHomeButton && (
                <Link href="/">
                  <Button variant="default">Go to Home</Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
