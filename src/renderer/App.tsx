import React from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import SplashScreen from './SplashScreen';
import '@mantine/core/styles.css';
import './App.css';
import { createTheme, MantineProvider } from '@mantine/core';
import { DatabaseDemo } from './database/DatabaseDemo';
import { DownloadDemo } from './files/DownloadDemo';
import { LLMDemo } from './llm/LLMDemo';

const theme = createTheme({
  fontFamily: 'Nunito, sans-serif',
});

export default function App() {
  return (
    <MantineProvider theme={theme}>
      <Router>
        <Routes>
          <Route path="/" element={<DatabaseDemo />} />
          {/* <Route path="/database" element={<DatabaseDemo />} />
          <Route path="/downloads" element={<DownloadDemo />} /> */}
        </Routes>
      </Router>
    </MantineProvider>
  );
}
