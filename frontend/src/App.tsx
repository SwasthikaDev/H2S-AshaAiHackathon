import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Container } from '@mui/material';

// Components
import Navbar from './components/Navbar';
import ChatInterface from './components/ChatInterface';
import JobsPage from './pages/JobsPage';
import EventsPage from './pages/EventsPage';
import MentorshipPage from './pages/MentorshipPage';
import HomePage from './pages/HomePage';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar />
          <Container component="main" sx={{ flex: 1, py: 4 }}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/chat" element={<ChatInterface />} />
              <Route path="/jobs" element={<JobsPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/mentorship" element={<MentorshipPage />} />
            </Routes>
          </Container>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App; 