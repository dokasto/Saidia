import React from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import '@mantine/core/styles.css';
import './App.css';
import { createTheme, MantineProvider } from '@mantine/core';
import Dashboard from './components/Dashboard';

const theme = createTheme({
  fontFamily: 'Nunito, sans-serif',
});

export default function App() {
  return (
    <MantineProvider theme={theme}>
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </Router>
    </MantineProvider>
  );
}
