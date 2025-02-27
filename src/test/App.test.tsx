import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { vi } from 'vitest';

// Mock the media query hook
vi.mock('@mui/material/useMediaQuery', () => ({
  __esModule: true,
  default: () => false, // default to light mode
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the application title and description', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });

  it('renders two TextComparisonArea components', () => {
    render(<App />);
    const textAreas = screen.getAllByPlaceholderText('Enter your text here...');
    expect(textAreas).toHaveLength(2);
  });

  it('updates common words when text changes', async () => {
    render(<App />);
    const [textArea1, textArea2] = screen.getAllByPlaceholderText('Enter your text here...');

    await userEvent.type(textArea1, 'hello world');
    await userEvent.type(textArea2, 'hello there');

    // Wait for debounce
    await waitFor(() => {
      const commonWord = screen.getByText('hello', { exact: false });
      expect(commonWord).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('shows error toast when text comparison fails', async () => {
    render(<App />);
    const textArea = screen.getAllByPlaceholderText('Enter your text here...')[0];
    
    // Trigger an error by simulating very large text input
    const largeText = 'a'.repeat(1000000); // Some implementations might have limits
    await userEvent.type(textArea, largeText);

    await waitFor(() => {
      const errorToast = screen.getByRole('alert');
      expect(errorToast).toBeInTheDocument();
    });
  });

  it('handles theme switching based on system preference', () => {
    render(<App />);
    const container = screen.getByRole('main');
    expect(container).toHaveStyle({ backgroundColor: expect.any(String) });
  });

  it('clears text areas when clear button is clicked', async () => {
    render(<App />);
    const [textArea1, textArea2] = screen.getAllByPlaceholderText('Enter your text here...');
    
    await userEvent.type(textArea1, 'test text');
    await userEvent.type(textArea2, 'another test');
    
    const clearButtons = screen.getAllByLabelText('Clear text');
    await userEvent.click(clearButtons[0]);
    await userEvent.click(clearButtons[1]);

    expect(textArea1).toHaveValue('');
    expect(textArea2).toHaveValue('');
  });

  it('copies text to clipboard when copy button is clicked', async () => {
    // Mock clipboard API
    const mockClipboard = {
      writeText: vi.fn().mockImplementation(() => Promise.resolve()),
    };
    Object.assign(navigator, { clipboard: mockClipboard });

    render(<App />);
    const textArea = screen.getAllByPlaceholderText('Enter your text here...')[0];
    await userEvent.type(textArea, 'test text');
    
    const copyButton = screen.getAllByLabelText('Copy to clipboard')[0];
    await userEvent.click(copyButton);

    expect(mockClipboard.writeText).toHaveBeenCalledWith('test text');
  });
}); 