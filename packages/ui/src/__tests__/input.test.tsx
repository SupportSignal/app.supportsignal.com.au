import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { Input } from '../input'

describe('Input Component', () => {
  it('renders correctly with default props', () => {
    render(<Input data-testid="input" />)
    
    const input = screen.getByTestId('input')
    expect(input).toBeInTheDocument()
    expect(input).toHaveClass(
      'flex',
      'h-10',
      'w-full',
      'rounded-md',
      'border',
      'border-input',
      'bg-background',
      'px-3',
      'py-2',
      'text-sm'
    )
  })

  it('renders with placeholder text', () => {
    render(<Input placeholder="Enter text here" />)
    
    const input = screen.getByPlaceholderText('Enter text here')
    expect(input).toBeInTheDocument()
  })

  it('handles different input types', () => {
    const { rerender } = render(<Input type="email" data-testid="input" />)
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'email')

    rerender(<Input type="password" data-testid="input" />)
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'password')

    rerender(<Input type="number" data-testid="input" />)
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'number')
  })

  it('handles value prop in controlled mode', () => {
    const { rerender } = render(<Input value="test value" readOnly />)
    
    const input = screen.getByDisplayValue('test value')
    expect(input).toBeInTheDocument()

    rerender(<Input value="updated value" readOnly />)
    expect(screen.getByDisplayValue('updated value')).toBeInTheDocument()
  })

  it('handles onChange events', async () => {
    const user = userEvent.setup()
    const handleChange = jest.fn()
    
    render(<Input onChange={handleChange} />)
    
    const input = screen.getByRole('textbox')
    await user.type(input, 'test')
    
    expect(handleChange).toHaveBeenCalledTimes(4) // Called for each character
  })

  it('can be disabled', () => {
    render(<Input disabled data-testid="input" />)
    
    const input = screen.getByTestId('input')
    expect(input).toBeDisabled()
    expect(input).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50')
  })

  it('applies custom className', () => {
    render(<Input className="custom-input" data-testid="input" />)
    
    const input = screen.getByTestId('input')
    expect(input).toHaveClass('custom-input')
  })

  it('forwards ref correctly', () => {
    const ref = { current: null }
    render(<Input ref={ref} />)
    
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })

  it('handles focus and blur events', async () => {
    const user = userEvent.setup()
    const handleFocus = jest.fn()
    const handleBlur = jest.fn()
    
    render(<Input onFocus={handleFocus} onBlur={handleBlur} />)
    
    const input = screen.getByRole('textbox')
    
    await user.click(input)
    expect(handleFocus).toHaveBeenCalledTimes(1)
    
    await user.tab()
    expect(handleBlur).toHaveBeenCalledTimes(1)
  })

  it('supports required attribute', () => {
    render(<Input required data-testid="input" />)
    
    const input = screen.getByTestId('input')
    expect(input).toBeRequired()
  })

  it('supports various HTML input attributes', () => {
    render(
      <Input
        id="test-input"
        name="testName"
        autoComplete="email"
        maxLength={50}
        data-testid="input"
      />
    )
    
    const input = screen.getByTestId('input')
    expect(input).toHaveAttribute('id', 'test-input')
    expect(input).toHaveAttribute('name', 'testName')
    expect(input).toHaveAttribute('autocomplete', 'email')
    expect(input).toHaveAttribute('maxlength', '50')
  })

  it('handles file input styling correctly', () => {
    render(<Input type="file" data-testid="input" />)
    
    const input = screen.getByTestId('input')
    expect(input).toHaveClass(
      'file:border-0',
      'file:bg-transparent', 
      'file:text-sm',
      'file:font-medium',
      'file:text-foreground'
    )
  })
})