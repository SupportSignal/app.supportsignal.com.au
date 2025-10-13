'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@starter/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@starter/ui/card';
import { useQuery } from 'convex/react';
import { api } from '@/lib/convex-api';
import { Download, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function DatabaseExportPage() {
  const { user, sessionToken } = useAuth();
  const [isExporting, setIsExporting] = useState(false);

  // Redirect if not system admin
  if (user && user.role !== 'system_admin') {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Unauthorized Access</CardTitle>
            <CardDescription>
              System administrator access required for database exports.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin">
              <Button variant="outline">Back to Admin</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleExport = async () => {
    if (!sessionToken) {
      toast.error('Please log in to export database.');
      return;
    }

    setIsExporting(true);

    try {
      // Call the Convex query directly using fetch
      const response = await fetch(`${process.env.NEXT_PUBLIC_CONVEX_URL}/api/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: 'exports:generateDatabaseExport',
          args: { sessionToken },
          format: 'json',
        }),
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      const exportData = await response.json();

      // Create simple filename (will overwrite previous export)
      const filename = `db-export.json`;

      // Create download
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Database exported to ${filename}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error instanceof Error ? error.message : 'An error occurred during export');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <Link href="/admin">
          <Button variant="outline" size="sm">
            ← Back to Admin
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-6 w-6" />
            Database Export System
          </CardTitle>
          <CardDescription>
            Export complete database snapshot for Claude Code analysis and external workflows
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Export Information */}
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <h3 className="font-semibold text-sm">Export Details</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Full database export in JSON format</li>
              <li>• Includes all tables except debug logs</li>
              <li>• Sensitive data sanitized (passwords, tokens removed)</li>
              <li>• Ephemeral data excluded (sessions, reset tokens)</li>
              <li>• Preserves all relationships and IDs</li>
              <li>• Flat structure for easy analysis</li>
            </ul>
          </div>

          {/* Export Metadata Preview */}
          <div className="rounded-lg border p-4 space-y-2">
            <h3 className="font-semibold text-sm">Included Tables</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
              <div>• Companies</div>
              <div>• Users</div>
              <div>• Sites</div>
              <div>• Participants</div>
              <div>• Incidents</div>
              <div>• Narratives</div>
              <div>• Questions</div>
              <div>• Answers</div>
              <div>• Analysis</div>
              <div>• Classifications</div>
              <div>• AI Prompts</div>
              <div>• Request Logs</div>
              <div>• User Invitations</div>
              <div>• Workflow Handoffs</div>
              <div>• Sessions</div>
              <div>• OAuth Accounts</div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4">
            <h3 className="font-semibold text-sm text-yellow-900 dark:text-yellow-200 mb-2">
              Security Notice
            </h3>
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              This export contains sensitive business data. Handle exported files securely and do not
              share with unauthorized parties. Password fields are excluded but session tokens are
              included.
            </p>
          </div>

          {/* Export Button */}
          <div className="flex flex-col gap-4 pt-4">
            <Button
              onClick={handleExport}
              disabled={isExporting || !sessionToken}
              size="lg"
              className="w-full"
            >
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting Database...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export Full Database
                </>
              )}
            </Button>
            {!sessionToken && (
              <p className="text-sm text-muted-foreground text-center">
                Please log in to export database
              </p>
            )}
          </div>

          {/* Usage Guide */}
          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
            <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-200 mb-2">
              Claude Code Analysis Workflow
            </h3>
            <ol className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-decimal list-inside">
              <li>Export database using button above</li>
              <li>Save JSON file to your local machine</li>
              <li>Open Claude Code in your project directory</li>
              <li>Reference the exported file in your prompts</li>
              <li>Example: "Analyze incident patterns in exported-db.json"</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
