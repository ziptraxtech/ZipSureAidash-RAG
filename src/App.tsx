import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/Header'; // Make sure this path is correct
import Footer from './components/Footer';
import Reports from './components/Reports';
import './index.css';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="App flex flex-col min-h-screen">
          <Header /> 
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/reports" element={<Reports />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;