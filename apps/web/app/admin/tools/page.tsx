'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@starter/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@starter/ui/card';
import { Download, Wrench } from 'lucide-react';

export default function AdminToolsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href="/admin">
          <Button variant="outline" size="sm">
            ← Back to Administration
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Wrench className="h-8 w-8" />
          Admin Tools
        </h1>
        <p className="text-muted-foreground mt-2">
          Advanced administrative utilities and system management tools
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Database Export Tool */}
        <Link href="/admin/developer-tools/export">
          <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Database Export
              </CardTitle>
              <CardDescription>
                Export complete database for external analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Export full database snapshot in JSON format for Claude Code analysis and debugging workflows.
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Future Tools - Coming Soon */}
        <Card className="h-full opacity-60">
          <CardHeader>
            <CardTitle className="text-muted-foreground">Database Maintenance</CardTitle>
            <CardDescription>Coming soon</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Database cleanup, optimization, and maintenance utilities
            </p>
          </CardContent>
        </Card>

        <Card className="h-full opacity-60">
          <CardHeader>
            <CardTitle className="text-muted-foreground">System Diagnostics</CardTitle>
            <CardDescription>Coming soon</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              System health checks and performance monitoring tools
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}