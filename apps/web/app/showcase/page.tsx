import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@starter/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@starter/ui';
import { Input } from '@starter/ui';
import { ThemeToggle } from '../../components/theme/theme-toggle';

export const metadata: Metadata = {
  title: 'Component Showcase | Starter Template',
  description:
    'A comprehensive showcase of all available UI components in the starter template',
};

export default function ShowcasePage() {
  return (
    <main className="container mx-auto px-4 py-8 bg-background text-foreground">
      <div className="max-w-6xl mx-auto">
        {/* Navigation */}
        <div className="mb-8 flex justify-between items-center">
          <Link
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            ← Back to Home
          </Link>
          <ThemeToggle />
        </div>

        {/* Page Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Component Showcase
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Explore all available UI components from our design system. Each
            component is built with accessibility and theming in mind.
          </p>
        </div>

        {/* Button Components Section */}
        <section className="mb-16">
          <div className="mb-8">
            <h2 className="text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Button Components
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Interactive button components with multiple variants and sizes.
            </p>
          </div>

          <Card className="p-6">
            <CardHeader>
              <CardTitle>Button Variants</CardTitle>
              <CardDescription>
                Different button styles for various use cases
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Default Buttons */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                  Default Variant
                </h4>
                <div className="flex flex-wrap gap-3">
                  <Button>Default Button</Button>
                  <Button size="sm">Small</Button>
                  <Button size="lg">Large</Button>
                </div>
              </div>

              {/* Secondary Buttons */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                  Secondary Variant
                </h4>
                <div className="flex flex-wrap gap-3">
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="secondary" size="sm">
                    Small
                  </Button>
                  <Button variant="secondary" size="lg">
                    Large
                  </Button>
                </div>
              </div>

              {/* Destructive Buttons */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                  Destructive Variant
                </h4>
                <div className="flex flex-wrap gap-3">
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="destructive" size="sm">
                    Small
                  </Button>
                  <Button variant="destructive" size="lg">
                    Large
                  </Button>
                </div>
              </div>

              {/* Outline Buttons */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                  Outline Variant
                </h4>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline">Outline</Button>
                  <Button variant="outline" size="sm">
                    Small
                  </Button>
                  <Button variant="outline" size="lg">
                    Large
                  </Button>
                </div>
              </div>

              {/* Ghost Buttons */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                  Ghost Variant
                </h4>
                <div className="flex flex-wrap gap-3">
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="ghost" size="sm">
                    Small
                  </Button>
                  <Button variant="ghost" size="lg">
                    Large
                  </Button>
                </div>
              </div>

              {/* Link Buttons */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                  Link Variant
                </h4>
                <div className="flex flex-wrap gap-3">
                  <Button variant="link">Link Button</Button>
                  <Button variant="link" size="sm">
                    Small
                  </Button>
                  <Button variant="link" size="lg">
                    Large
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Input Components Section */}
        <section className="mb-16">
          <div className="mb-8">
            <h2 className="text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Input Components
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Form input components for user data collection.
            </p>
          </div>

          <Card className="p-6">
            <CardHeader>
              <CardTitle>Input Variants</CardTitle>
              <CardDescription>
                Different input types and states for forms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Text Inputs */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                  Text Inputs
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="default-input"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Default Input
                    </label>
                    <Input
                      id="default-input"
                      placeholder="Enter text here..."
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="value-input"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      With Value
                    </label>
                    <Input
                      id="value-input"
                      defaultValue="Sample text content"
                    />
                  </div>
                </div>
              </div>

              {/* Email and Password */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                  Specialized Inputs
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="email-input"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Email Input
                    </label>
                    <Input
                      id="email-input"
                      type="email"
                      placeholder="user@example.com"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="password-input"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Password Input
                    </label>
                    <Input
                      id="password-input"
                      type="password"
                      placeholder="Enter password"
                    />
                  </div>
                </div>
              </div>

              {/* Disabled State */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                  Disabled State
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="disabled-empty"
                      className="block text-sm font-medium text-gray-400 mb-2"
                    >
                      Disabled Empty
                    </label>
                    <Input
                      id="disabled-empty"
                      disabled
                      placeholder="Disabled input"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="disabled-value"
                      className="block text-sm font-medium text-gray-400 mb-2"
                    >
                      Disabled with Value
                    </label>
                    <Input
                      id="disabled-value"
                      disabled
                      defaultValue="Cannot edit this"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Card Components Section */}
        <section className="mb-16">
          <div className="mb-8">
            <h2 className="text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Card Components
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Flexible card containers for organizing content.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Simple Card */}
            <Card>
              <CardHeader>
                <CardTitle>Simple Card</CardTitle>
                <CardDescription>
                  A basic card with header and description
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  This is the main content area of the card where you can place
                  any type of content.
                </p>
              </CardContent>
            </Card>

            {/* Card with Footer */}
            <Card>
              <CardHeader>
                <CardTitle>Card with Actions</CardTitle>
                <CardDescription>
                  A card that includes action buttons
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  This card demonstrates how to include interactive elements.
                </p>
                <div className="flex gap-2">
                  <Button size="sm">Primary</Button>
                  <Button variant="outline" size="sm">
                    Secondary
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Complex Card */}
            <Card>
              <CardHeader>
                <CardTitle>Form Card</CardTitle>
                <CardDescription>
                  A card containing form elements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label
                    htmlFor="form-name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Name
                  </label>
                  <Input id="form-name" placeholder="Enter your name" />
                </div>
                <div>
                  <label
                    htmlFor="form-email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email
                  </label>
                  <Input
                    id="form-email"
                    type="email"
                    placeholder="Enter your email"
                  />
                </div>
                <Button className="w-full">Submit</Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Usage Guidelines */}
        <section className="mb-16">
          <div className="mb-8">
            <h2 className="text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Usage Guidelines
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Best practices for using these components in your application.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Accessibility</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  All components are built with accessibility in mind:
                </p>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>Proper ARIA labels and roles</li>
                  <li>Keyboard navigation support</li>
                  <li>High contrast color schemes</li>
                  <li>Screen reader compatibility</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Theming</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  Components support consistent theming:
                </p>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>CSS custom properties for colors</li>
                  <li>Tailwind CSS utility classes</li>
                  <li>Dark/light mode support</li>
                  <li>Customizable design tokens</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Component Import Guide */}
        <section>
          <div className="mb-8">
            <h2 className="text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Import Guide
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              How to import and use these components in your code.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Import Statements</CardTitle>
              <CardDescription>
                Copy these import statements to use components in your project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 rounded-md p-4 font-mono text-sm">
                <div className="space-y-2">
                  <div className="text-gray-800">
                    <span className="text-blue-600">import</span> {`{ Button }`}{' '}
                    <span className="text-blue-600">from</span>{' '}
                    <span className="text-green-600">
                      &quot;@starter/ui&quot;
                    </span>
                  </div>
                  <div className="text-gray-800">
                    <span className="text-blue-600">import</span>{' '}
                    {`{ Card, CardContent, CardHeader, CardTitle }`}{' '}
                    <span className="text-blue-600">from</span>{' '}
                    <span className="text-green-600">
                      &quot;@starter/ui&quot;
                    </span>
                  </div>
                  <div className="text-gray-800">
                    <span className="text-blue-600">import</span> {`{ Input }`}{' '}
                    <span className="text-blue-600">from</span>{' '}
                    <span className="text-green-600">
                      &quot;@starter/ui&quot;
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
