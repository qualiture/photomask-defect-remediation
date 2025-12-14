import { createTheme } from '@mui/material/styles';

// SAP Fiori-inspired theme for Photomask Defect Tracker
export const theme = createTheme({
  palette: {
    primary: {
      main: '#0B385C', // SAP Dark Blue
      light: '#1E4E7A',
      dark: '#071E3C',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#0F6937', // SAP Green
      light: '#2E8051',
      dark: '#084A24',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#D32F2F', // Critical defect
      light: '#EF5350',
      dark: '#C62828',
    },
    warning: {
      main: '#FF9800', // Major defect
      light: '#FFB74D',
      dark: '#F57C00',
    },
    info: {
      main: '#2196F3', // Minor/Info
      light: '#64B5F6',
      dark: '#1976D2',
    },
    success: {
      main: '#4CAF50', // Approved/Good
      light: '#81C784',
      dark: '#388E3C',
    },
    background: {
      default: '#F5F5F5',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#202124',
      secondary: '#5F6368',
      disabled: '#9AA0A6',
    },
  },
  typography: {
    fontFamily: '"SAP-icons", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      lineHeight: 1.2,
      color: '#0B385C',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
      color: '#0B385C',
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
      color: '#0B385C',
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      color: '#0B385C',
    },
    h5: {
      fontSize: '1rem',
      fontWeight: 600,
      color: '#0B385C',
    },
    h6: {
      fontSize: '0.875rem',
      fontWeight: 600,
      color: '#0B385C',
    },
    body1: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.75rem',
      lineHeight: 1.43,
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: '0.5px',
    },
  },
  shape: {
    borderRadius: 4,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          padding: '8px 16px',
          borderRadius: '4px',
        },
        contained: {
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          borderRadius: '4px',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          backgroundColor: '#FFFFFF',
          color: '#0B385C',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#F5F5F5',
          borderRight: '1px solid #EBEBEB',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
  },
});

// Severity colors (consistent with defect types)
export const severityColors = {
  Critical: '#D32F2F', // Red
  Major: '#FF9800',    // Orange
  Minor: '#2196F3',    // Blue
};

// Mask status colors
export const statusColors = {
  New: '#4CAF50',           // Green
  InUse: '#2196F3',         // Blue
  Quarantine: '#FF9800',    // Orange
  UnderRepair: '#FF6F00',   // Deep Orange
  Retired: '#9E9E9E',       // Gray
};

// Equipment status colors
export const equipmentStatusColors = {
  Active: '#4CAF50',        // Green
  Maintenance: '#FF9800',   // Orange
  Retired: '#9E9E9E',       // Gray
};
