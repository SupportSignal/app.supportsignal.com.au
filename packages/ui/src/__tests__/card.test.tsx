import { render, screen } from '@testing-library/react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../card'

describe('Card Components', () => {
  describe('Card', () => {
    it('renders correctly', () => {
      render(<Card data-testid="card">Card Content</Card>)
      
      const card = screen.getByTestId('card')
      expect(card).toBeInTheDocument()
      expect(card).toHaveClass('rounded-lg', 'border', 'bg-card', 'text-card-foreground', 'shadow-sm')
    })

    it('applies custom className', () => {
      render(<Card className="custom-card" data-testid="card">Content</Card>)
      
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('custom-card')
    })

    it('forwards ref correctly', () => {
      const ref = { current: null }
      render(<Card ref={ref}>Card</Card>)
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement)
    })
  })

  describe('CardHeader', () => {
    it('renders correctly', () => {
      render(<CardHeader data-testid="card-header">Header Content</CardHeader>)
      
      const header = screen.getByTestId('card-header')
      expect(header).toBeInTheDocument()
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6')
    })
  })

  describe('CardTitle', () => {
    it('renders correctly', () => {
      render(<CardTitle data-testid="card-title">Test Title</CardTitle>)
      
      const title = screen.getByTestId('card-title')
      expect(title).toBeInTheDocument()
      expect(title).toHaveClass('text-2xl', 'font-semibold', 'leading-none', 'tracking-tight')
      expect(title).toHaveTextContent('Test Title')
    })
  })

  describe('CardDescription', () => {
    it('renders correctly', () => {
      render(<CardDescription data-testid="card-description">Test Description</CardDescription>)
      
      const description = screen.getByTestId('card-description')
      expect(description).toBeInTheDocument()
      expect(description).toHaveClass('text-sm', 'text-muted-foreground')
      expect(description).toHaveTextContent('Test Description')
    })
  })

  describe('CardContent', () => {
    it('renders correctly', () => {
      render(<CardContent data-testid="card-content">Content Text</CardContent>)
      
      const content = screen.getByTestId('card-content')
      expect(content).toBeInTheDocument()
      expect(content).toHaveClass('p-6', 'pt-0')
      expect(content).toHaveTextContent('Content Text')
    })
  })

  describe('CardFooter', () => {
    it('renders correctly', () => {
      render(<CardFooter data-testid="card-footer">Footer Content</CardFooter>)
      
      const footer = screen.getByTestId('card-footer')
      expect(footer).toBeInTheDocument()
      expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0')
      expect(footer).toHaveTextContent('Footer Content')
    })
  })

  describe('Full Card Structure', () => {
    it('renders complete card with all components', () => {
      render(
        <Card data-testid="full-card">
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card description text</CardDescription>
          </CardHeader>
          <CardContent>
            Main card content goes here
          </CardContent>
          <CardFooter>
            Footer actions
          </CardFooter>
        </Card>
      )

      expect(screen.getByTestId('full-card')).toBeInTheDocument()
      expect(screen.getByText('Card Title')).toBeInTheDocument()
      expect(screen.getByText('Card description text')).toBeInTheDocument()
      expect(screen.getByText('Main card content goes here')).toBeInTheDocument()
      expect(screen.getByText('Footer actions')).toBeInTheDocument()
    })

    it('maintains proper hierarchy and styling', () => {
      render(
        <Card className="w-full max-w-sm" data-testid="hierarchical-card">
          <CardHeader>
            <CardTitle>Test Card</CardTitle>
            <CardDescription>Test Description</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Test content paragraph</p>
          </CardContent>
        </Card>
      )

      const card = screen.getByTestId('hierarchical-card')
      expect(card).toHaveClass('w-full', 'max-w-sm')
      
      // Verify content is accessible
      expect(screen.getByText('Test Card')).toBeInTheDocument()
      expect(screen.getByText('Test Description')).toBeInTheDocument()
      expect(screen.getByText('Test content paragraph')).toBeInTheDocument()
    })
  })
})