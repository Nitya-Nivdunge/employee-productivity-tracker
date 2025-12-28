import React from 'react';
import { format } from 'date-fns';

const ProductivityChart = ({ data, year, month, detailed = false }) => {
  if (!data || !data.dailyBreakdown || data.dailyBreakdown.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
        <p className="text-sm text-gray-500">No productivity data available</p>
      </div>
    );
  }

  const getDayOfWeek = (date) => {
    const dayDate = new Date(date);
    return format(dayDate, 'EEE');
  };

  // Calculate daily productivity
  const dailyProductivity = data.dailyBreakdown.map(day => {
    let productivity = null;
    let status = 'working';
    
    if (day.isHoliday) {
      status = 'holiday';
    } else if (day.isLeave) {
      status = 'leave';
    } else if (day.expectedHours > 0) {
      productivity = (day.workedHours / day.expectedHours) * 100;
    }
    
    return {
      date: day.date,
      day: format(new Date(day.date), 'd'),
      dayOfWeek: day.day,
      productivity,
      status,
      workedHours: day.workedHours,
      expectedHours: day.expectedHours
    };
  });

  // Calculate statistics
  const validDays = dailyProductivity.filter(d => d.productivity !== null);
  const avgProductivity = validDays.length > 0 
    ? validDays.reduce((sum, d) => sum + d.productivity, 0) / validDays.length 
    : 0;
  const peakProductivity = validDays.length > 0 
    ? Math.max(...validDays.map(d => d.productivity)) 
    : 0;
  const lowestProductivity = validDays.length > 0 
    ? Math.min(...validDays.map(d => d.productivity)) 
    : 0;
  
  // Get leave and holiday days
  const leaveDays = dailyProductivity.filter(d => d.status === 'leave');
  const holidayDays = dailyProductivity.filter(d => d.status === 'holiday');

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-gray-800">
          Detailed Productivity Analysis - {data.employeeName || 'Employee'}
        </h3>
        <div className="text-xs text-gray-500">
          {format(new Date(year, month - 1), 'MMMM yyyy')}
        </div>
      </div>
      
      {/* Productivity Bar Chart (Custom CSS) */}
      <div className="mb-6">
        <h4 className="text-xs font-medium text-gray-600 mb-3">Daily Productivity Chart</h4>
        
        {/* Fixed height container for bars */}
        <div className="relative h-64 mb-4">
          <div className="flex items-end space-x-1 overflow-x-auto pb-2 h-full">
            {dailyProductivity.map((item, index) => {
              if (item.status === 'holiday') {
                return (
                  <div key={index} className="flex flex-col items-center w-8 flex-shrink-0">
                    <div className="w-6 h-16 bg-purple-400 rounded-t opacity-80"></div>
                    <div className="text-xs text-gray-500 mt-1">{item.day}</div>
                    <div className="text-[10px] text-gray-400">{getDayOfWeek(item.date)}</div>
                  </div>
                );
              }
              
              if (item.status === 'leave') {
                return (
                  <div key={index} className="flex flex-col items-center w-8 flex-shrink-0">
                    <div className="w-6 h-16 bg-red-500 rounded-t"></div>
                    <div className="text-xs text-gray-500 mt-1">{item.day}</div>
                    <div className="text-[10px] text-gray-400">{getDayOfWeek(item.date)}</div>
                  </div>
                );
              }
              
              if (item.productivity === null) {
                return (
                  <div key={index} className="flex flex-col items-center w-8 flex-shrink-0">
                    <div className="w-6 h-16 bg-gray-200 rounded-t"></div>
                    <div className="text-xs text-gray-500 mt-1">{item.day}</div>
                    <div className="text-[10px] text-gray-400">{getDayOfWeek(item.date)}</div>
                  </div>
                );
              }
              
              // Calculate bar height with larger max height
              const maxBarHeight = 200; // Maximum bar height in pixels
              const height = Math.min((item.productivity / 120) * maxBarHeight, maxBarHeight);
              const color = item.productivity >= 90 ? 'bg-green-500' : 
                           item.productivity >= 70 ? 'bg-blue-500' : 
                           'bg-yellow-400';
              
              return (
                <div key={index} className="flex flex-col items-center w-8 flex-shrink-0">
                  <div 
                    className={`w-6 ${color} rounded-t transition-all duration-300 hover:opacity-90`}
                    style={{ 
                      height: `${height}px`,
                      minHeight: '8px'
                    }}
                    title={`Day ${item.day}: ${item.productivity.toFixed(1)}%`}
                  ></div>
                  <div className="text-xs text-gray-500 mt-1">{item.day}</div>
                  <div className="text-[10px] text-gray-400">{getDayOfWeek(item.date)}</div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-4 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded mr-1"></div>
            <span>≥90%</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded mr-1"></div>
            <span>70-89%</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-400 rounded mr-1"></div>
            <span>&lt;70%</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-purple-400 rounded mr-1"></div>
            <span>Holiday</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded mr-1"></div>
            <span>Leave</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-200 rounded mr-1"></div>
            <span>No Data</span>
          </div>
        </div>
      </div>
      
      {/* Stats Grid - Side by side with chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column: Leave & Holiday Info */}
        <div className="border rounded-lg p-3 bg-gray-50">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">Non-Working Days</h4>
          
          {leaveDays.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center text-xs font-medium text-red-600 mb-1">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                <span>Leave Days ({leaveDays.length})</span>
              </div>
              <div className="text-xs text-gray-600 grid grid-cols-2 gap-1">
                {leaveDays.map((day, idx) => (
                  <div key={idx} className="bg-white border rounded px-2 py-1">
                    {format(new Date(day.date), 'MMM d')}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {holidayDays.length > 0 && (
            <div>
              <div className="flex items-center text-xs font-medium text-purple-600 mb-1">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                <span>Holidays ({holidayDays.length})</span>
              </div>
              <div className="text-xs text-gray-600 grid grid-cols-2 gap-1">
                {holidayDays.map((day, idx) => (
                  <div key={idx} className="bg-white border rounded px-2 py-1">
                    {format(new Date(day.date), 'MMM d')}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {leaveDays.length === 0 && holidayDays.length === 0 && (
            <p className="text-xs text-gray-500 text-center py-4">
              No leave or holiday days in this period
            </p>
          )}
        </div>
        
        {/* Right Column: Stats */}
        <div className="border rounded-lg p-3 bg-gray-50">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">Productivity Statistics</h4>
          
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600">Average Productivity</span>
                <span className={`font-bold ${avgProductivity >= 90 ? 'text-green-600' : avgProductivity >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {avgProductivity.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full ${avgProductivity >= 90 ? 'bg-green-500' : avgProductivity >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(avgProductivity, 100)}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600">Peak Productivity</span>
                <span className="font-bold text-green-600">{peakProductivity.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className="h-1.5 rounded-full bg-green-500"
                  style={{ width: `${Math.min(peakProductivity, 100)}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600">Lowest Productivity</span>
                <span className="font-bold text-red-600">{lowestProductivity.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className="h-1.5 rounded-full bg-red-500"
                  style={{ width: `${Math.min(lowestProductivity, 100)}%` }}
                ></div>
              </div>
            </div>
            
            <div className="pt-2 border-t border-gray-200">
              <div className="text-xs text-gray-600">
                <p>Working Days: {validDays.length}</p>
                <p className="mt-1">Total Expected Hours: {data.totalExpectedHours?.toFixed(1) || 0}h</p>
                <p>Total Worked Hours: {data.totalWorkedHours?.toFixed(1) || 0}h</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductivityChart;