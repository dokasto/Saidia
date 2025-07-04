import React from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import SplashScreen from './SplashScreen';
import './App.css';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SplashScreen />} />
      </Routes>
    </Router>
  );
}
