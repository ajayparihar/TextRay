import { Paper, Button, Typography, CircularProgress, IconButton, Tooltip, Fade, TextField, Snackbar, Alert, Badge, Select, MenuItem, FormControl, InputLabel, Box, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import ClearIcon from '@mui/icons-material/Clear';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import CodeIcon from '@mui/icons-material/Code';
import Editor, { useMonaco } from '@monaco-editor/react';
import { useState, useCallback, memo, useMemo, useEffect, useRef } from 'react';

// Language options for the editor
const LANGUAGE_OPTIONS = {
  'plaintext': 'Plain Text',
  'javascript': 'JavaScript',
  'typescript': 'TypeScript',
  'html': 'HTML',
  'css': 'CSS',
  'json': 'JSON',
  'markdown': 'Markdown',
  'python': 'Python',
  'java': 'Java',
  'cpp': 'C++',
  'csharp': 'C#',
  'php': 'PHP',
  'ruby': 'Ruby',
  'sql': 'SQL',
  'xml': 'XML',
  'yaml': 'YAML'
};

interface TextComparisonAreaProps {
  value: string;
  onChange: (text: string) => void;
  label: string;
  commonWords: Set<string>;
  position: 'left' | 'right';
  onShowToast: (message: string) => void;
  onScroll?: (scrollTop: number) => void;
  syncScroll?: boolean;
  scrollTop?: number;
}

const StyledPaper = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'position'
})<{ position: 'left' | 'right' }>(({ theme, position }) => ({
  padding: theme.spacing(3),
  backgroundColor: theme.palette.mode === 'dark' 
    ? theme.palette.grey[900] 
    : theme.palette.grey[50],
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  flexGrow: 1,
  borderRadius: theme.spacing(2),
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  transform: position === 'left' ? 'translateX(-20px)' : 'translateX(20px)',
  opacity: 0,
  animation: `slideIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards ${position === 'left' ? '0s' : '0.2s'}`,
  '@keyframes slideIn': {
    to: {
      transform: 'translateX(0)',
      opacity: 1,
    },
  },
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[8],
  },
  border: `1px solid ${theme.palette.divider}`,
}));

const TextAreaContainer = styled('div')(({ theme }) => ({
  position: 'relative',
  width: '100%',
  maxWidth: '100%',
  margin: '0 auto',
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
  minHeight: '300px',
  maxHeight: 'calc(100vh - 300px)',
  overflow: 'hidden',
  '& .MuiInputBase-root': {
    position: 'relative',
    backgroundColor: 'transparent',
    fontFamily: '"Roboto Mono", monospace',
    fontSize: '0.9rem',
    letterSpacing: '0.025em',
    overflowY: 'auto',
    overflowX: 'hidden',
    '&::-webkit-scrollbar': {
      width: '8px',
      display: 'none',
    },
    '&:hover::-webkit-scrollbar': {
      display: 'block',
    },
    '&::-webkit-scrollbar-track': {
      background: 'transparent',
    },
    '&::-webkit-scrollbar-thumb': {
      background: theme.palette.mode === 'dark' 
        ? theme.palette.grey[700] 
        : theme.palette.grey[300],
      borderRadius: '4px',
    },
  },
}));

const ButtonContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '16px',
  gap: '12px',
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(1),
  textTransform: 'none',
  padding: '8px 16px',
  fontWeight: 500,
  '&:hover': {
    transform: 'translateY(-1px)',
  },
  transition: 'all 0.2s ease-in-out',
}));

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  borderRadius: theme.spacing(1),
  padding: '8px',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '.MuiInputBase-root': {
    height: '100%',
    overflowY: 'auto',
    overflowX: 'hidden',
    '& textarea': {
      height: '100% !important',
      fontFamily: theme.typography.fontFamily,
      fontSize: '1rem',
      lineHeight: '1.5',
      color: theme.palette.text.primary,
      backgroundColor: 'transparent',
      transition: 'all 0.2s ease-in-out',
      position: 'relative',
      zIndex: 1,
      whiteSpace: 'pre-wrap',
      wordWrap: 'break-word',
      overflowWrap: 'break-word',
      padding: theme.spacing(2),
      '&::-webkit-scrollbar': {
        width: '8px',
        display: 'none',
      },
      '&:hover::-webkit-scrollbar': {
        display: 'block',
      },
      '&::-webkit-scrollbar-track': {
        background: 'transparent',
      },
      '&::-webkit-scrollbar-thumb': {
        background: theme.palette.mode === 'dark' 
          ? theme.palette.grey[700] 
          : theme.palette.grey[300],
        borderRadius: '4px',
      },
    },
  },
  flexGrow: 1,
  '& .MuiOutlinedInput-root': {
    '&:hover fieldset': {
      borderColor: theme.palette.primary.main,
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main,
      borderWidth: '2px',
      boxShadow: `0 0 0 2px ${theme.palette.primary.main}25`,
    },
  },
}));

const HighlightLayer = styled('div')(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  padding: '16.5px 14px',
  fontFamily: theme.typography.fontFamily,
  fontSize: '1rem',
  lineHeight: '1.5',
  color: 'transparent',
  pointerEvents: 'none',
  whiteSpace: 'pre-wrap',
  wordWrap: 'break-word',
  userSelect: 'none',
  zIndex: 2,
  '& .highlight': {
    backgroundColor: `${theme.palette.primary.main}40`,
    padding: '0 2px',
    margin: '0 -2px',
    borderRadius: '3px',
    transition: 'background-color 0.3s ease-in-out',
    animation: 'highlightFade 0.5s ease-in-out',
  },
  '& .word': {
    display: 'inline-block',
    padding: '2px',
    margin: '-2px',
    transition: 'all 0.15s ease-in-out',
    pointerEvents: 'auto',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: `${theme.palette.action.hover}`,
      border: `1px solid ${theme.palette.text.primary}`,
      padding: '1px',
      borderRadius: '2px',
    },
  },
  '@keyframes highlightFade': {
    '0%': {
      backgroundColor: `${theme.palette.primary.main}60`,
    },
    '100%': {
      backgroundColor: `${theme.palette.primary.main}40`,
    },
  },
}));

const Label = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary,
  fontSize: '1.2rem',
  fontWeight: 600,
  marginBottom: '16px',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  letterSpacing: '-0.01em',
}));

const StatsContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  color: theme.palette.text.secondary,
  fontSize: '0.875rem',
  marginTop: '12px',
  padding: theme.spacing(1.5),
  backgroundColor: theme.palette.mode === 'dark' 
    ? theme.palette.grey[800] 
    : theme.palette.grey[100],
  borderRadius: theme.shape.borderRadius,
  transition: 'opacity 0.3s ease-in-out',
  gap: theme.spacing(2),
  '& > span': {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    '&:not(:last-child)::after': {
      content: '"•"',
      marginLeft: theme.spacing(2),
      opacity: 0.5,
    }
  }
}));

const TextComparisonArea = memo(({
  value,
  onChange,
  label,
  commonWords,
  position,
  onShowToast,
  onScroll,
  syncScroll,
  scrollTop,
}: TextComparisonAreaProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState('plaintext');
  const [isEditorReady, setIsEditorReady] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<any>(null);
  const monaco = useMonaco();
  const theme = useTheme();

  const handleEditorDidMount = (editor: any, monaco: any) => {
    if (!editor || !monaco) return;
    
    editorRef.current = editor;
    
    try {
      // Add scroll listener
      const scrollDisposable = editor.onDidScrollChange((e: any) => {
        if (syncScroll && onScroll && typeof onScroll === 'function') {
          requestAnimationFrame(() => {
            onScroll(e.scrollTop);
          });
        }
      });

      // Configure Monaco Editor
      monaco.editor.defineTheme('muiDark', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
          'editor.background': '#121212',
          'editor.foreground': '#ffffff',
          'editor.lineHighlightBackground': '#1e1e1e',
          'editorLineNumber.foreground': '#858585',
          'editor.selectionBackground': '#264f78',
          'editorCursor.foreground': '#ffffff',
          'editor.inactiveSelectionBackground': '#3a3d41'
        }
      });

      monaco.editor.defineTheme('muiLight', {
        base: 'vs',
        inherit: true,
        rules: [],
        colors: {
          'editor.background': '#ffffff',
          'editor.foreground': '#000000',
          'editor.lineHighlightBackground': '#f5f5f5',
          'editorLineNumber.foreground': '#666666',
          'editor.selectionBackground': '#add6ff',
          'editorCursor.foreground': '#000000',
          'editor.inactiveSelectionBackground': '#e5ebf1'
        }
      });

      // Set the theme immediately
      monaco.editor.setTheme(theme.palette.mode === 'dark' ? 'muiDark' : 'muiLight');

      // Cleanup function
      const cleanup = () => {
        scrollDisposable.dispose();
      };

      // Add cleanup to component unmount
      return cleanup;
    } catch (error) {
      console.warn('Failed to configure editor:', error);
    }
    
    setIsEditorReady(true);
  };

  const handleClear = useCallback(() => {
    onChange('');
    onShowToast('Text cleared');
  }, [onChange, onShowToast]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      onShowToast('Text copied to clipboard');
    } catch (err) {
      setError('Failed to copy text to clipboard');
    }
  }, [value, onShowToast]);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      onChange(text);
      onShowToast('Text pasted from clipboard');
    } catch (err) {
      setError('Failed to paste from clipboard');
    }
  }, [onChange, onShowToast]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const text = await file.text();
      onChange(text);
      
      // Set language based on file extension
      const extension = file.name.split('.').pop()?.toLowerCase();
      const languageMap: { [key: string]: string } = {
        'js': 'javascript',
        'ts': 'typescript',
        'html': 'html',
        'css': 'css',
        'json': 'json',
        'md': 'markdown',
        'py': 'python',
        'java': 'java',
        'cpp': 'cpp',
        'cs': 'csharp',
        'php': 'php',
        'rb': 'ruby',
        'sql': 'sql',
        'xml': 'xml',
        'yaml': 'yaml',
        'yml': 'yaml',
        'txt': 'plaintext'
      };
      
      if (extension && languageMap[extension]) {
        setLanguage(languageMap[extension]);
      }
      
      onShowToast(`File "${file.name}" uploaded successfully`);
    } catch (err) {
      setError('Failed to read file');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [onChange, onShowToast]);

  const handleDownload = useCallback(() => {
    try {
      const blob = new Blob([value], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const extension = language === 'plaintext' ? 'txt' : language;
      const a = document.createElement('a');
      a.href = url;
      a.download = `text-comparison.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onShowToast('Text downloaded successfully');
    } catch (err) {
      setError('Failed to download text');
    }
  }, [value, language, onShowToast]);

  const handleLanguageChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setLanguage(event.target.value as string);
  };

  const wordCount = useMemo(() => {
    return value.trim() ? value.trim().split(/\s+/).length : 0;
  }, [value]);

  const commonWordCount = useMemo(() => {
    if (!value.trim()) return 0;
    const words = value.trim().split(/\s+/);
    return words.filter(word => commonWords.has(word.toLowerCase())).length;
  }, [value, commonWords]);

  // Update Monaco decorations for common words
  useEffect(() => {
    if (!editorRef.current || !monaco || !isEditorReady) return;

    const model = editorRef.current.getModel();
    if (!model) return;

    const decorations = [];
    const words = value.split(/\s+/);
    let offset = 0;

    for (const word of words) {
      if (commonWords.has(word.toLowerCase())) {
        const startPos = model.getPositionAt(value.indexOf(word, offset));
        const endPos = model.getPositionAt(value.indexOf(word, offset) + word.length);
        
        decorations.push({
          range: new monaco.Range(
            startPos.lineNumber,
            startPos.column,
            endPos.lineNumber,
            endPos.column
          ),
          options: {
            inlineClassName: 'monaco-highlight',
            hoverMessage: { value: 'Common word' }
          }
        });
      }
      offset = value.indexOf(word, offset) + word.length;
    }

    editorRef.current.deltaDecorations([], decorations);
  }, [value, commonWords, monaco, isEditorReady]);

  // Add Monaco Editor options
  const editorOptions = useMemo(() => ({
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    scrollbar: {
      vertical: 'visible',
      horizontal: 'visible',
      useShadows: false,
      verticalScrollbarSize: 8,
      horizontalScrollbarSize: 8
    },
    automaticLayout: true,
    fontSize: 14,
    lineNumbers: 'on',
    roundedSelection: true,
    wordWrap: 'on',
    wrappingStrategy: 'advanced',
    quickSuggestions: false,
    renderWhitespace: 'none',
    contextmenu: false,
    fixedOverflowWidgets: true,
    overviewRulerLanes: 0,
    hideCursorInOverviewRuler: true,
    overviewRulerBorder: false,
    renderValidationDecorations: 'off',
    suggest: {
      showWords: false
    }
  }), []);

  // Add cleanup effect
  useEffect(() => {
    return () => {
      if (editorRef.current) {
        try {
          editorRef.current.dispose();
        } catch (error) {
          console.warn('Failed to dispose editor:', error);
        }
        editorRef.current = null;
      }
    };
  }, []);

  // Add useEffect for scroll synchronization
  useEffect(() => {
    if (!editorRef.current || !syncScroll || typeof scrollTop !== 'number') return;
    
    try {
      const editor = editorRef.current;
      const currentScrollTop = editor.getScrollTop();
      
      // Only update if the difference is significant to prevent loops
      if (Math.abs(currentScrollTop - scrollTop) > 0.5) {
        requestAnimationFrame(() => {
          editor.setScrollTop(scrollTop);
        });
      }
    } catch (error) {
      console.warn('Failed to sync scroll:', error);
    }
  }, [scrollTop, syncScroll]);

  // Update Monaco theme when the app theme changes
  useEffect(() => {
    if (!monaco || !isEditorReady) return;
    monaco.editor.setTheme(theme.palette.mode === 'dark' ? 'muiDark' : 'muiLight');
  }, [theme.palette.mode, monaco, isEditorReady]);

  return (
    <StyledPaper position={position} elevation={3}>
      <Label>
        {label}
        <Badge 
          badgeContent={wordCount} 
          color="primary"
          max={9999}
          sx={{ ml: 'auto' }}
        >
          <Typography variant="body2" color="text.secondary" component="span">
            words
          </Typography>
        </Badge>
      </Label>

      <ButtonContainer>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Tooltip title="Clear text">
            <span>
              <ActionButton
                variant="outlined"
                color="error"
                onClick={handleClear}
                startIcon={<ClearIcon />}
                disabled={!value}
              >
                Clear
              </ActionButton>
            </span>
          </Tooltip>
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={language}
              onChange={handleLanguageChange}
              displayEmpty
              variant="outlined"
              startAdornment={<CodeIcon sx={{ mr: 1 }} />}
            >
              {Object.entries(LANGUAGE_OPTIONS).map(([value, label]) => (
                <MenuItem key={value} value={value}>{label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Tooltip title="Copy to clipboard">
            <span>
              <StyledIconButton
                onClick={handleCopy}
                disabled={!value}
                size="small"
              >
                <ContentCopyIcon />
              </StyledIconButton>
            </span>
          </Tooltip>
          <Tooltip title="Paste from clipboard">
            <StyledIconButton
              onClick={handlePaste}
              size="small"
            >
              <ContentPasteIcon />
            </StyledIconButton>
          </Tooltip>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            accept=".txt,.md,.json,.js,.ts,.html,.css,.py,.java,.cpp,.cs,.php,.rb,.sql,.xml,.yaml,.yml"
          />
          <Tooltip title="Upload file">
            <span>
              <StyledIconButton
                onClick={() => fileInputRef.current?.click()}
                size="small"
                disabled={isLoading}
              >
                {isLoading ? <CircularProgress size={24} /> : <UploadFileIcon />}
              </StyledIconButton>
            </span>
          </Tooltip>
          <Tooltip title="Download text">
            <span>
              <StyledIconButton
                onClick={handleDownload}
                disabled={!value}
                size="small"
              >
                <DownloadIcon />
              </StyledIconButton>
            </span>
          </Tooltip>
        </div>
      </ButtonContainer>

      <TextAreaContainer>
        {!isEditorReady && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            height: '100%' 
          }}>
            <CircularProgress />
          </Box>
        )}
        <Editor
          height="100%"
          defaultLanguage="plaintext"
          language={language}
          value={value}
          onChange={(value) => onChange(value || '')}
          onMount={handleEditorDidMount}
          options={editorOptions}
          loading={<CircularProgress />}
          beforeMount={(monaco) => {
            if (!monaco) return;
            try {
              // Disable telemetry
              if (monaco.editor.config) {
                monaco.editor.config.telemetry = false;
              }
              // Disable validation to prevent "Host is not supported" errors
              monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
                noSemanticValidation: true,
                noSyntaxValidation: true,
                noSuggestionDiagnostics: true
              });
              monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
                noSemanticValidation: true,
                noSyntaxValidation: true,
                noSuggestionDiagnostics: true
              });
              // Disable worker-based features
              monaco.languages.typescript.javascriptDefaults.setWorkerOptions({
                customWorkerPath: ''
              });
              monaco.languages.typescript.typescriptDefaults.setWorkerOptions({
                customWorkerPath: ''
              });
            } catch (error) {
              console.warn('Failed to configure Monaco:', error);
            }
          }}
          keepCurrentModel={true}
        />
      </TextAreaContainer>

      {value && (
        <Fade in={true}>
          <StatsContainer>
            <span>
              {wordCount} words
            </span>
            <span>
              {commonWordCount} common
            </span>
            <span>
              {wordCount > 0 ? `${((commonWordCount / wordCount) * 100).toFixed(1)}% match` : '0% match'}
            </span>
          </StatsContainer>
        </Fade>
      )}

      <Snackbar
        open={!!error}
        autoHideDuration={4000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </StyledPaper>
  );
});

TextComparisonArea.displayName = 'TextComparisonArea';

export default TextComparisonArea; 