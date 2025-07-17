import React from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import '@mantine/core/styles.css';
import './App.css';
import { createTheme, MantineProvider } from '@mantine/core';
import Dashboard from './components/Dashboard';
import SubjectProvider from './providers/subjectProvider';
import SplashScreen from './components/SplashScreen';

const theme = createTheme({
  fontFamily: 'Nunito, sans-serif',
});

export default function App() {
  return (
    <MantineProvider theme={theme}>
      <SubjectProvider>
        <Router>
          <Routes>
            <Route path="/" element={<SplashScreen />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </Router>
      </SubjectProvider>
    </MantineProvider>
  );
}
