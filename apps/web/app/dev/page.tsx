import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@starter/ui';
import { Button } from '@starter/ui';
import { ExternalLink, Github, Code2, Settings, Globe } from 'lucide-react';

export default function DevPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              🚀 Development Center
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Quick access to development tools and resources
            </p>
          </div>

          {/* Quick Links Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Public App Link */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-600" />
                  Live App
                </CardTitle>
                <CardDescription>Visit the public deployment</CardDescription>
              </CardHeader>
              <CardContent>
                <a
                  href="https://starter-nextjs-convex-ai.pages.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  starter-nextjs-convex-ai.pages.dev
                  <ExternalLink className="h-4 w-4" />
                </a>
              </CardContent>
            </Card>

            {/* GitHub Repository */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Github className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                  Repository
                </CardTitle>
                <CardDescription>View source code and issues</CardDescription>
              </CardHeader>
              <CardContent>
                <a
                  href="https://github.com/appydave-templates/starter-nextjs-convex-ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  GitHub Repository
                  <ExternalLink className="h-4 w-4" />
                </a>
              </CardContent>
            </Card>

            {/* Admin Panel */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-purple-600" />
                  Admin Panel
                </CardTitle>
                <CardDescription>System monitoring and logs</CardDescription>
              </CardHeader>
              <CardContent>
                <Link
                  href="/admin/logs"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Admin Dashboard
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Development Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tech Stack */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code2 className="h-5 w-5 text-green-600" />
                  Tech Stack
                </CardTitle>
                <CardDescription>
                  Technologies used in this project
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Frontend:
                    </span>
                    <span className="font-medium">Next.js 14 + TypeScript</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Backend:
                    </span>
                    <span className="font-medium">Convex</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Styling:
                    </span>
                    <span className="font-medium">Tailwind CSS + ShadCN</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Auth:
                    </span>
                    <span className="font-medium">BetterAuth</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Deployment:
                    </span>
                    <span className="font-medium">Cloudflare Pages</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Package Manager:
                    </span>
                    <span className="font-medium">Bun</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Updates */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Updates</CardTitle>
                <CardDescription>
                  Latest improvements and features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="border-l-2 border-green-500 pl-3">
                    <div className="font-medium text-green-700 dark:text-green-400">
                      ✅ ESLint Three-Tier Architecture
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">
                      Solved recurring ESLint configuration conflicts with
                      environment-specific rules
                    </div>
                  </div>
                  <div className="border-l-2 border-blue-500 pl-3">
                    <div className="font-medium text-blue-700 dark:text-blue-400">
                      🔧 TypeScript Compilation Fixed
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">
                      Resolved all TypeScript errors for stable CI pipeline
                    </div>
                  </div>
                  <div className="border-l-2 border-purple-500 pl-3">
                    <div className="font-medium text-purple-700 dark:text-purple-400">
                      🚀 CI/CD Improvements
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">
                      Enhanced monitoring and smart push scripts
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 text-center">
            <div className="space-x-4">
              <Link href="/">
                <Button variant="outline">← Back to Home</Button>
              </Link>
              <Link href="/showcase">
                <Button variant="default">View Components</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
