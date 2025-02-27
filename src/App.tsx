import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { 
  CssBaseline, 
  Container, 
  Grid, 
  Typography, 
  Box, 
  useMediaQuery, 
  Snackbar, 
  Alert,
  Paper,
  IconButton,
  Tooltip,
  Divider,
  AppBar,
  useScrollTrigger,
  Slide,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import GitHubIcon from '@mui/icons-material/GitHub';
import TextComparisonArea from './components/TextComparisonArea';
import ErrorBoundary from './components/ErrorBoundary';
import { compareTexts } from './utils/textComparison';
import './styles/monaco.css';

// Rate limiting configuration
const DEBOUNCE_DELAY = 300; // milliseconds

function HideOnScroll({ children }) {
  const trigger = useScrollTrigger();
  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
}

function App() {
  const [text1, setText1] = useState('');
  const [text2, setText2] = useState('');
  const [commonWords, setCommonWords] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [syncScroll, setSyncScroll] = useState(false);
  const [scrollTop1, setScrollTop1] = useState(0);
  const [scrollTop2, setScrollTop2] = useState(0);
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [mode, setMode] = useState<'light' | 'dark'>(prefersDarkMode ? 'dark' : 'light');
  const compareTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const theme = useMemo(() => createTheme({
    palette: {
      mode,
      primary: {
        main: mode === 'dark' ? '#90caf9' : '#1976d2',
      },
      secondary: {
        main: mode === 'dark' ? '#f48fb1' : '#dc004e',
      },
      background: {
        default: mode === 'dark' ? '#121212' : '#f5f5f5',
        paper: mode === 'dark' ? '#1e1e1e' : '#ffffff',
      },
    },
    typography: {
      h1: {
        fontSize: 'clamp(2rem, 5vw, 2.5rem)',
        fontWeight: 600,
        marginBottom: '0.5rem',
        letterSpacing: '-0.01562em',
      },
      h4: {
        fontSize: 'clamp(1.5rem, 3vw, 1.8rem)',
        fontWeight: 500,
        marginBottom: '0.5rem',
      },
      subtitle1: {
        fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
        opacity: 0.8,
        marginBottom: '2rem',
        lineHeight: 1.6,
      },
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'dark' ? '#1e1e1e' : '#ffffff',
            color: mode === 'dark' ? '#ffffff' : '#000000',
            boxShadow: 'none',
            borderBottom: `1px solid ${mode === 'dark' ? '#333333' : '#e0e0e0'}`,
            transition: 'all 0.3s ease-in-out',
          },
        },
      },
      MuiContainer: {
        styleOverrides: {
          root: {
            transition: 'all 0.3s ease-in-out',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            transition: 'all 0.3s ease-in-out',
            borderRadius: 12,
          },
        },
      },
    },
  }), [mode]);

  const handleToastClose = useCallback(() => {
    setShowToast(false);
  }, []);

  const handleShowToast = useCallback((message: string) => {
    setToastMessage(message);
    setShowToast(true);
  }, []);

  const handleTextChange = useCallback((newText: string, textArea: 1 | 2) => {
    if (textArea === 1) {
      setText1(newText);
    } else {
      setText2(newText);
    }

    // Debounce the comparison to avoid excessive calculations
    if (compareTimeoutRef.current) {
      clearTimeout(compareTimeoutRef.current);
    }

    compareTimeoutRef.current = setTimeout(() => {
      const result = compareTexts(textArea === 1 ? newText : text1, textArea === 2 ? newText : text2);
      setCommonWords(result.commonWords);
    }, DEBOUNCE_DELAY);
  }, [text1, text2]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (compareTimeoutRef.current) {
        clearTimeout(compareTimeoutRef.current);
      }
    };
  }, []);

  const handleErrorClose = useCallback(() => {
    setError(null);
  }, []);

  const statsDetails = useMemo(() => {
    const result = compareTexts(text1, text2);
    const text1Words = text1.trim() ? text1.trim().split(/\s+/).length : 0;
    const text2Words = text2.trim() ? text2.trim().split(/\s+/).length : 0;
    const commonCount = result.count;
    const uniqueWords1 = text1Words - commonCount;
    const uniqueWords2 = text2Words - commonCount;

    return { 
      text1Words, 
      text2Words, 
      commonCount,
      uniqueWords1,
      uniqueWords2,
      similarity: result.similarity
    };
  }, [text1, text2]);

  const toggleColorMode = useCallback(() => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  }, []);

  // Add handleScroll functions
  const handleScroll1 = useCallback((scrollTop: number) => {
    if (syncScroll) {
      setScrollTop2(scrollTop);
    }
  }, [syncScroll]);

  const handleScroll2 = useCallback((scrollTop: number) => {
    if (syncScroll) {
      setScrollTop1(scrollTop);
    }
  }, [syncScroll]);

  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <HideOnScroll>
          <AppBar position="sticky" elevation={0}>
            <Container maxWidth="xl">
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  py: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography
                    variant="h6"
                    component="h1"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      fontWeight: 700,
                      color: theme.palette.mode === 'dark'
                        ? theme.palette.primary.main
                        : theme.palette.primary.main,
                      animation: 'fadeIn 0.5s ease-in-out',
                      cursor: 'pointer',
                    }}
                    onClick={() => window.location.reload()}
                  >
                    TextRay
                  </Typography>
                  <Tooltip
                    title="Compare two texts to find common words and analyze similarities"
                    arrow
                    placement="right"
                  >
                    <IconButton
                      size="small"
                      sx={{
                        '&:hover': {
                          transform: 'scale(1.1)',
                          transition: 'transform 0.2s',
                        },
                      }}
                    >
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={syncScroll}
                        onChange={(e) => setSyncScroll(e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Sync Scroll"
                  />
                  <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
                    <IconButton onClick={toggleColorMode} color="inherit">
                      {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Container>
          </AppBar>
        </HideOnScroll>
        
        <Container
          maxWidth="xl"
          sx={{
            height: '100vh',
            overflow: 'hidden',
            py: { xs: 2, sm: 3 },
            px: { xs: 1, sm: 2 },
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {(statsDetails.text1Words > 0 || statsDetails.text2Words > 0) && (
            <Paper 
              elevation={2} 
              sx={{ 
                p: 3, 
                mb: 3,
                background: theme.palette.background.paper,
                animation: 'slideIn 0.3s ease-in-out',
                '@keyframes slideIn': {
                  '0%': { opacity: 0, transform: 'translateY(10px)' },
                  '100%': { opacity: 1, transform: 'translateY(0)' },
                },
              }}
            >
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2">
                    Text 1: {statsDetails.text1Words} words
                    <br />
                    <Typography component="span" color="text.secondary">
                      ({statsDetails.uniqueWords1} unique)
                    </Typography>
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4} sx={{ textAlign: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CompareArrowsIcon sx={{ mx: 1 }} />
                    <Typography variant="body2" color="primary">
                      {statsDetails.commonCount} common words
                      <br />
                      <Typography component="span" color="secondary">
                        {statsDetails.similarity}% similarity
                      </Typography>
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4} sx={{ textAlign: 'right' }}>
                  <Typography variant="body2">
                    Text 2: {statsDetails.text2Words} words
                    <br />
                    <Typography component="span" color="text.secondary">
                      ({statsDetails.uniqueWords2} unique)
                    </Typography>
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          )}

          <Grid 
            container 
            spacing={{ xs: 2, md: 4 }} 
            sx={{ 
              flexGrow: 1,
              mb: 2
            }}
          >
            <Grid item xs={12} md={6}>
              <ErrorBoundary>
                <TextComparisonArea
                  value={text1}
                  onChange={(text) => handleTextChange(text, 1)}
                  label="First Text"
                  commonWords={commonWords}
                  position="left"
                  onShowToast={handleShowToast}
                  onScroll={handleScroll1}
                  syncScroll={syncScroll}
                  scrollTop={scrollTop1}
                />
              </ErrorBoundary>
            </Grid>
            <Grid item xs={12} md={6}>
              <ErrorBoundary>
                <TextComparisonArea
                  value={text2}
                  onChange={(text) => handleTextChange(text, 2)}
                  label="Second Text"
                  commonWords={commonWords}
                  position="right"
                  onShowToast={handleShowToast}
                  onScroll={handleScroll2}
                  syncScroll={syncScroll}
                  scrollTop={scrollTop2}
                />
              </ErrorBoundary>
            </Grid>
          </Grid>

          <Snackbar 
            open={showToast} 
            autoHideDuration={2000} 
            onClose={handleToastClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert onClose={handleToastClose} severity="success" sx={{ width: '100%' }}>
              {toastMessage}
            </Alert>
          </Snackbar>
          
          <Snackbar 
            open={!!error} 
            autoHideDuration={6000} 
            onClose={handleErrorClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert onClose={handleErrorClose} severity="error" sx={{ width: '100%' }}>
              {error}
            </Alert>
          </Snackbar>
        </Container>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App; 