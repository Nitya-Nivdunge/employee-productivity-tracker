// frontend/src/App.js
import React from 'react';
import { Toaster } from 'react-hot-toast';
import Dashboard from './components/Dashboard';

// CRITICAL: Import chart setup FIRST to register all Chart.js components
import './utils/chartSetup';

function App() {
  return (
    <>
      <Dashboard />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
            fontSize: '14px',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  );
}

export default App;