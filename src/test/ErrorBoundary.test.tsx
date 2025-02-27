import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from '../components/ErrorBoundary';
import { vi } from 'vitest';

// Mock console.error to avoid test output noise
const originalError = console.error;
beforeAll(() => {
  console.error = vi.fn();
});

afterAll(() => {
  console.error = originalError;
});

describe('ErrorBoundary', () => {
  const ThrowError = () => {
    throw new Error('Test error');
  };

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test Content</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders error UI when there is an error', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('logs error information to console', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(console.error).toHaveBeenCalled();
  });

  it('resets error state when Try Again button is clicked', () => {
    const TestComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <div>Normal Content</div>;
    };

    const { rerender } = render(
      <ErrorBoundary>
        <TestComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
    
    const tryAgainButton = screen.getByText('Try Again');
    fireEvent.click(tryAgainButton);

    rerender(
      <ErrorBoundary>
        <TestComponent shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Normal Content')).toBeInTheDocument();
  });

  it('handles errors without error messages', () => {
    const ThrowEmptyError = () => {
      throw new Error();
    };

    render(
      <ErrorBoundary>
        <ThrowEmptyError />
      </ErrorBoundary>
    );

    expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
  });
}); 