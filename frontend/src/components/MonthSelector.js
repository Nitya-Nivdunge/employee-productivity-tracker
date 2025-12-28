import React, { useState, useEffect } from 'react';

const MonthSelector = ({ onMonthChange }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [existingData, setExistingData] = useState(false);

  // Get current date to set defaults
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  // Get previous month
  const prevMonthDate = new Date();
  prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
  const prevMonth = prevMonthDate.getMonth() + 1;
  const prevYear = prevMonthDate.getFullYear();

  // Month names for display
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Generate years (from 2020 to current year + 1)
  const years = [];
  for (let year = 2020; year <= currentYear + 1; year++) {
    years.push(year);
  }

  useEffect(() => {
    // Check if data exists for selected month/year
    checkExistingData(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear]);

  const checkExistingData = async (month, year) => {
    try {
      const response = await fetch(`http://localhost:5000/api/month/${year}/${month}`);
      if (response.ok) {
        setExistingData(true);
      } else {
        setExistingData(false);
      }
    } catch (error) {
      setExistingData(false);
    }
  };

  const handleMonthChange = (e) => {
    const month = parseInt(e.target.value);
    setSelectedMonth(month);
    if (onMonthChange) {
      onMonthChange(month, selectedYear, existingData);
    }
  };

  const handleYearChange = (e) => {
    const year = parseInt(e.target.value);
    setSelectedYear(year);
    if (onMonthChange) {
      onMonthChange(selectedMonth, year, existingData);
    }
  };

  const loadPreviousMonth = () => {
    setSelectedMonth(prevMonth);
    setSelectedYear(prevYear);
    if (onMonthChange) {
      onMonthChange(prevMonth, prevYear, false);
    }
  };

  const loadCurrentMonth = () => {
    setSelectedMonth(currentMonth);
    setSelectedYear(currentYear);
    if (onMonthChange) {
      onMonthChange(currentMonth, currentYear, false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Select Month</h2>
      
      <div className="space-y-4">
        <div className="flex gap-2 mb-4">
          <button
            onClick={loadPreviousMonth}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
          >
            ← Previous Month
          </button>
          <button
            onClick={loadCurrentMonth}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium"
          >
            Current Month
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Month
            </label>
            <select
              value={selectedMonth}
              onChange={handleMonthChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {monthNames.map((month, index) => (
                <option key={index} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year
            </label>
            <select
              value={selectedYear}
              onChange={handleYearChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        {existingData && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Data already exists for {monthNames[selectedMonth - 1]} {selectedYear}. 
                  Uploading new data will override existing records.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="text-sm text-gray-500 mt-2">
          <p>Selected: <span className="font-medium">{monthNames[selectedMonth - 1]} {selectedYear}</span></p>
        </div>
      </div>
    </div>
  );
};

export default MonthSelector;