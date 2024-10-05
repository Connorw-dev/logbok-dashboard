// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Dashboard from './Dashboard';
import DeviceDetails from './components/DeviceDetails';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/device/:deviceId" element={<DeviceDetails />} />
      </Routes>
    </Router>
  );
}

export default App;
