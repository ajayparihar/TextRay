import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TextComparisonArea from '../components/TextComparisonArea';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { vi } from 'vitest';

const theme = createTheme();

describe('TextComparisonArea', () => {
  const mockOnChange = vi.fn();
  const mockOnShowToast = vi.fn();
  const defaultProps = {
    value: '',
    onChange: mockOnChange,
    label: 'Test Area',
    commonWords: new Set<string>(),
    position: 'left' as const,
    onShowToast: mockOnShowToast,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
        readText: vi.fn().mockImplementation(() => Promise.resolve('Clipboard text')),
      },
    });
  });

  const renderComponent = (props = {}) => {
    return render(
      <ThemeProvider theme={theme}>
        <TextComparisonArea {...defaultProps} {...props} />
      </ThemeProvider>
    );
  };

  it('renders with basic props', () => {
    renderComponent();
    expect(screen.getByText('Test Area')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter or paste your text here...')).toBeInTheDocument();
  });

  it('handles text input', () => {
    renderComponent();
    const input = screen.getByPlaceholderText('Enter or paste your text here...');
    fireEvent.change(input, { target: { value: 'test text' } });
    expect(mockOnChange).toHaveBeenCalledWith('test text');
  });

  it('shows correct word count', () => {
    renderComponent({ value: 'test text here' });
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('words')).toBeInTheDocument();
  });

  it('highlights common words', () => {
    const commonWords = new Set(['test', 'common']);
    renderComponent({ value: 'test text common word', commonWords });
    const textArea = screen.getByPlaceholderText('Enter or paste your text here...');
    expect(textArea).toHaveValue('test text common word');
    const highlightedWords = screen.getAllByText(/test|common/);
    expect(highlightedWords.length).toBeGreaterThan(0);
  });

  it('handles paste from clipboard', async () => {
    renderComponent();
    const pasteButton = screen.getByLabelText('Paste from clipboard');
    await userEvent.click(pasteButton);
    
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith('Clipboard text');
    });
  });

  it('handles copy to clipboard', async () => {
    renderComponent({ value: 'text to copy' });
    const copyButton = screen.getByLabelText('Copy to clipboard');
    await userEvent.click(copyButton);
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('text to copy');
    expect(mockOnShowToast).toHaveBeenCalledWith('Text copied to clipboard!');
  });

  it('handles clear text button', async () => {
    renderComponent({ value: 'some text' });
    const clearButton = screen.getByText('Clear');
    await userEvent.click(clearButton);
    
    expect(mockOnChange).toHaveBeenCalledWith('');
  });

  it('handles file upload', async () => {
    renderComponent();
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByRole('textbox', { hidden: true });
    
    await fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith('test content');
    });
  });

  it('handles file download', async () => {
    const mockCreateObjectURL = vi.fn().mockReturnValue('blob:url');
    const mockRevokeObjectURL = vi.fn();
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    renderComponent({ value: 'content to download' });
    const downloadButton = screen.getByLabelText('Download text');
    await userEvent.click(downloadButton);

    expect(mockCreateObjectURL).toHaveBeenCalled();
  });

  it('handles errors during file operations', async () => {
    renderComponent();
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByRole('textbox', { hidden: true });
    
    // Mock FileReader to throw error
    const mockFileReader = {
      readAsText: vi.fn().mockImplementation(() => {
        throw new Error('File read error');
      }),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    global.FileReader = vi.fn(() => mockFileReader);
    
    await fireEvent.change(input, { target: { files: [file] } });
    
    expect(mockOnShowToast).toHaveBeenCalledWith(expect.stringContaining('Error'));
  });

  it('handles large text input gracefully', () => {
    const largeText = 'a'.repeat(10000);
    renderComponent({ value: largeText });
    const wordCount = screen.getByText('1');
    expect(wordCount).toBeInTheDocument();
  });
}); 