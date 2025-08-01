import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Button } from '../../ui/src/button';

const meta: Meta<typeof Button> = {
  title: 'UI Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A versatile button component built with Radix UI primitives and class-variance-authority for consistent styling and behavior.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'default',
        'destructive',
        'outline',
        'secondary',
        'ghost',
        'link',
      ],
      description: 'The visual style variant of the button',
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
      description: 'The size variant of the button',
    },
    asChild: {
      control: 'boolean',
      description:
        'Change the default rendered element for the one passed as a child, merging their props and behavior.',
    },
    disabled: {
      control: 'boolean',
      description:
        'When true, prevents the user from interacting with the button.',
    },
  },
  args: {
    onClick: fn(),
    children: 'Button',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Primary button story - default variant
export const Default: Story = {
  args: {
    variant: 'default',
    children: 'Default Button',
  },
  parameters: {
    docs: {
      description: {
        story: 'The primary button style with dark background and white text.',
      },
    },
  },
};

// Secondary button variant
export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
  },
  parameters: {
    docs: {
      description: {
        story: 'A secondary button style with a lighter background.',
      },
    },
  },
};

// Destructive button variant
export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Delete Item',
  },
  parameters: {
    docs: {
      description: {
        story:
          'A destructive button style typically used for dangerous actions like deleting.',
      },
    },
  },
};

// Outline button variant
export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline Button',
  },
  parameters: {
    docs: {
      description: {
        story: 'An outline button style with border and no background fill.',
      },
    },
  },
};

// Ghost button variant
export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost Button',
  },
  parameters: {
    docs: {
      description: {
        story:
          'A ghost button style with no background, only showing on hover.',
      },
    },
  },
};

// Link button variant
export const Link: Story = {
  args: {
    variant: 'link',
    children: 'Link Button',
  },
  parameters: {
    docs: {
      description: {
        story: 'A link-styled button that appears as underlined text.',
      },
    },
  },
};

// Size variants story
export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Small Button',
  },
  parameters: {
    docs: {
      description: {
        story: 'A smaller button size variant.',
      },
    },
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Large Button',
  },
  parameters: {
    docs: {
      description: {
        story: 'A larger button size variant with more padding.',
      },
    },
  },
};

export const Icon: Story = {
  args: {
    size: 'icon',
    children: '★',
  },
  parameters: {
    docs: {
      description: {
        story: 'An icon-sized button variant with equal width and height.',
      },
    },
  },
};

// Interactive states
export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled Button',
  },
  parameters: {
    docs: {
      description: {
        story: 'A disabled button that cannot be interacted with.',
      },
    },
  },
};

// All variants showcase
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="default">Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Showcase of all button variants side by side.',
      },
    },
  },
};

// All sizes showcase
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon">★</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Showcase of all button sizes side by side.',
      },
    },
  },
};
