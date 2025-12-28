// frontend/src/utils/chartSetup.js
// Centralized Chart.js registration
// Import this ONCE at the top of App.js

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
  } from 'chart.js';
  
  // Register ALL Chart.js components globally - DO THIS ONCE
  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
  );
  
  console.log('✅ Chart.js components registered successfully');
  
  export default ChartJS;