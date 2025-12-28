import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';

const CalendarView = ({ year, month, dailyBreakdown, employeeName }) => {
  const [hoveredDay, setHoveredDay] = useState(null);
  
  // Validate year and month to prevent invalid interval error
  if (!year || !month || month < 1 || month > 12) {
    return (
      <div className="bg-white rounded border p-4 text-center">
        <p className="text-sm text-gray-500">Invalid month/year selection</p>
      </div>
    );
  }
  
  // Create date with validation
  const monthDate = new Date(year, month - 1, 1);
  if (isNaN(monthDate.getTime())) {
    return (
      <div className="bg-white rounded border p-4 text-center">
        <p className="text-sm text-gray-500">Invalid date</p>
      </div>
    );
  }
  
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  
  // Validate interval
  if (monthStart > monthEnd) {
    return (
      <div className="bg-white rounded border p-4 text-center">
        <p className="text-sm text-gray-500">Invalid date range</p>
      </div>
    );
  }
  
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  const getDayData = (day) => {
    if (!dailyBreakdown) return null;
    
    // Create date string in YYYY-MM-DD format for comparison
    const dayString = format(day, 'yyyy-MM-dd');
    
    return dailyBreakdown.find(d => {
      if (!d.date) return false;
      
      // Handle both Date objects and string formats
      const dDate = d.date instanceof Date ? d.date : new Date(d.date);
      
      // Compare dates by creating strings in same format
      const dDateString = format(dDate, 'yyyy-MM-dd');
      return dDateString === dayString;
    }) || null;
  };
  
  const getStatusColor = (dayData) => {
    if (!dayData) return 'bg-gray-100';
    if (dayData.isHoliday) return 'bg-purple-500';
    if (dayData.isLeave) return 'bg-red-500';
    
    if (dayData.workedHours > 0) {
      const productivity = dayData.expectedHours > 0 
        ? (dayData.workedHours / dayData.expectedHours) * 100 
        : 0;
      
      if (productivity >= 90) return 'bg-green-600';
      if (productivity >= 70) return 'bg-blue-500';
      return 'bg-yellow-400';
    }
    
    return 'bg-gray-300';
  };
  
  const getStatusTextColor = (dayData) => {
    if (!dayData) return 'text-gray-500';
    if (dayData.isHoliday || dayData.isLeave) return 'text-white';
    
    const productivity = dayData.expectedHours > 0 
      ? (dayData.workedHours / dayData.expectedHours) * 100 
      : 0;
    
    if (productivity >= 90) return 'text-white';
    return 'text-gray-800';
  };
  
  const getHoursText = (dayData) => {
    if (!dayData) return '';
    if (dayData.isHoliday) return 'Holiday';
    if (dayData.isLeave) return 'Leave';
    if (dayData.workedHours > 0 || dayData.expectedHours > 0) {
      return `${dayData.workedHours.toFixed(1)}h / ${dayData.expectedHours.toFixed(1)}h`;
    }
    return 'No data';
  };
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const firstDayOfMonth = monthStart.getDay();
  
  return (
    <div className="bg-white rounded border p-3">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold text-gray-800">
          {format(monthDate, 'MMMM yyyy')} - {employeeName}
        </h3>
      </div>
      
      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day Headers */}
        {dayNames.map(day => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
            {day}
          </div>
        ))}
        
        {/* Empty days before month start */}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="h-16 bg-gray-50 rounded"></div>
        ))}
        
        {/* Calendar Days */}
        {days.map(day => {
          const dayData = getDayData(day);
          const isToday = isSameDay(day, new Date());
          
          return (
            <div
              key={day.toString()}
              className={`h-16 rounded p-1 relative group ${getStatusColor(dayData)} ${isToday ? 'ring-1 ring-blue-500' : ''}`}
              onMouseEnter={() => setHoveredDay(day)}
              onMouseLeave={() => setHoveredDay(null)}
            >
              {/* Date Number */}
              <div className="flex justify-between items-start">
                <span className={`text-xl font-bold ${getStatusTextColor(dayData)}`}>
                  {format(day, 'd')}
                </span>
              </div>
              
              {/* Hours Worked */}
              <div className="mt-1">
                <div className={`text-base font-medium ${getStatusTextColor(dayData)} truncate`}>
                  {getHoursText(dayData)}
                </div>
              </div>
              
              {/* Hover Tooltip */}
              {hoveredDay && isSameDay(hoveredDay, day) && dayData && (
                <div className="absolute z-10 w-56 p-2 bg-gray-900 text-white text-xs rounded shadow-lg -top-24 left-1/2 transform -translate-x-1/2">
                  <div className="font-semibold mb-1">
                    {format(day, 'EEEE, MMMM d')}
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className="font-medium">
                        {dayData.isHoliday ? 'Holiday' : 
                         dayData.isLeave ? 'Leave' : 'Present'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>In-Time:</span>
                      <span className="font-medium">{dayData.inTime || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Out-Time:</span>
                      <span className="font-medium">{dayData.outTime || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hours:</span>
                      <span className="font-medium">{dayData.workedHours.toFixed(1)}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Expected:</span>
                      <span className="font-medium">{dayData.expectedHours.toFixed(1)}h</span>
                    </div>
                    {!dayData.isHoliday && !dayData.isLeave && (
                      <div className="flex justify-between">
                        <span>Productivity:</span>
                        <span className="font-medium">
                          {dayData.expectedHours > 0 
                            ? ((dayData.workedHours / dayData.expectedHours) * 100).toFixed(1)
                            : '0.0'}%
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="flex flex-wrap gap-2 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-600 rounded mr-1"></div>
            <span>≥90% productivity</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-400 rounded mr-1"></div>
            <span>70-89% productivity</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-400 rounded mr-1"></div>
            <span>&lt;70% productivity</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded mr-1"></div>
            <span>Leave</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-purple-500 rounded mr-1"></div>
            <span>Holiday</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;