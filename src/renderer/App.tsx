import React, { useEffect } from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import './App.css';
import { createTheme, MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import Dashboard from './components/Dashboard';
import SubjectProvider from './providers/subjectProvider';
import SplashScreen from './components/SplashScreen';

const theme = createTheme({
  fontFamily: 'Nunito, sans-serif',
});

export default function App() {
  useEffect(() => {
    window.electron.llm.initialise();
  }, []);

  return (
    <MantineProvider theme={theme}>
      <Notifications position="top-right" />
      <SubjectProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
          <footer
            style={{
              textAlign: 'center',
              padding: '1rem',
              fontSize: '0.9rem',
              color: '#555',
            }}
          >
            Built by{' '}
            <a
              href="https://www.linkedin.com/in/joy-nk/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#0077b5', textDecoration: 'none' }}
            >
              Joy
            </a>{' '}
            and{' '}
            <a
              href="https://www.linkedin.com/in/thisisudo/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#0077b5', textDecoration: 'none' }}
            >
              Udo
            </a>
          </footer>
        </Router>
      </SubjectProvider>
    </MantineProvider>
  );
}
