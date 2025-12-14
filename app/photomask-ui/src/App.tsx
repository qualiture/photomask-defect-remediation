import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './styles/theme';
import { Layout } from './components/Layout';

// Pages (to be created)
import Dashboard from './pages/Dashboard';
import DefectsPage from './pages/DefectsPage';
import PhotomasksPage from './pages/PhotomasksPage';
import EquipmentPage from './pages/EquipmentPage';
import RemediationPage from './pages/RemediationPage';
import AnalyticsPage from './pages/AnalyticsPage';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/defects" element={<DefectsPage />} />
              <Route path="/photomasks" element={<PhotomasksPage />} />
              <Route path="/equipment" element={<EquipmentPage />} />
              <Route path="/remediation" element={<RemediationPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
            </Routes>
          </Layout>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
