import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';

const WorkforceCalendarView = ({ data, year, month }) => {
  const [hoveredDay, setHoveredDay] = useState(null);
  
  const monthDate = new Date(year, month - 1, 1);
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  const getDayData = (day) => {
    if (!data || !data.dailyData) return null;
    
    // Create date string in YYYY-MM-DD format for comparison
    const dayString = format(day, 'yyyy-MM-dd');
    
    return data.dailyData.find(d => {
      if (!d.date) return false;
      
      // Handle both Date objects and string formats
      const dDate = d.date instanceof Date ? d.date : new Date(d.date);
      
      // Compare dates by creating strings in same format
      const dDateString = format(dDate, 'yyyy-MM-dd');
      return dDateString === dayString;
    }) || null;
  };
  
  const getWorkforceColor = (present, total) => {
    if (total === 0) return 'bg-gray-100';
    
    const percentage = total > 0 ? (present / total) * 100 : 0;
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 70) return 'bg-green-400';
    if (percentage >= 50) return 'bg-yellow-400';
    return 'bg-red-400';
  };
  
  const getWorkforceTextColor = (present, total) => {
    if (total === 0) return 'text-gray-500';
    return 'text-white';
  };
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const firstDayOfMonth = monthStart.getDay();

  return (
    <div>
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
          <div key={`empty-${i}`} className="h-12 bg-gray-50 rounded flex items-center justify-center">
            <span className="text-xs text-gray-300">-</span>
          </div>
        ))}
        
        {/* Calendar Days */}
        {days.map(day => {
          const dayData = getDayData(day);
          const isToday = isSameDay(day, new Date());
          const dayOfWeek = day.getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          
          return (
            <div
              key={day.toString()}
              className={`h-12 rounded p-1 relative group flex flex-col items-center justify-center transition-all duration-200
                ${getWorkforceColor(dayData?.present || 0, dayData?.total || 0)} 
                ${isToday ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
                ${isWeekend ? 'opacity-90' : ''}
                hover:scale-105 hover:shadow-md hover:z-10
              `}
              onMouseEnter={() => setHoveredDay(day)}
              onMouseLeave={() => setHoveredDay(null)}
            >
              {/* Date Number */}
              <div className="flex justify-center items-center">
                <span className={`text-sm font-bold ${getWorkforceTextColor(dayData?.present || 0, dayData?.total || 0)}`}>
                  {format(day, 'd')}
                </span>
              </div>
              
              {/* Workforce */}
              {dayData && (
                <div className={`text-xs font-medium ${getWorkforceTextColor(dayData.present, dayData.total)} text-center`}>
                  {dayData.present}/{dayData.total}
                </div>
              )}
              
              {/* Hover Tooltip */}
              {hoveredDay && isSameDay(hoveredDay, day) && dayData && (
                <div className="absolute z-20 w-72 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl -top-40 left-1/2 transform -translate-x-1/2">
                  <div className="font-semibold mb-2 border-b border-gray-700 pb-1">
                    {format(day, 'EEEE, MMMM d, yyyy')}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Workforce:</span>
                      <span className="font-medium">{dayData.present}/{dayData.total} present</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Avg Productivity:</span>
                      <span className="font-medium">{dayData.avgProductivity?.toFixed(1) || '0.0'}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Avg Hours:</span>
                      <span className="font-medium">{dayData.avgHours?.toFixed(1) || '0.0'}h</span>
                    </div>
                    
                    {/* Employee Details */}
                    {dayData.employees && dayData.employees.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-700">
                        <div className="font-medium mb-1">Employee Details:</div>
                        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                          {dayData.employees.map((emp, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs">
                              <div className="flex items-center space-x-2">
                                <span className="truncate max-w-32">{emp.name}</span>
                                {emp.status === 'leave' && (
                                  <span className="px-1.5 py-0.5 bg-red-100 text-red-800 text-xs rounded">Leave</span>
                                )}
                                {emp.status === 'holiday' && (
                                  <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 text-xs rounded">Holiday</span>
                                )}
                              </div>
                              <div className="flex items-center space-x-3">
                                <span className="text-gray-300">{emp.hours?.toFixed(1) || '0.0'}h</span>
                                {emp.productivity && (
                                  <span className={`font-medium ${
                                    emp.productivity >= 90 ? 'text-green-400' :
                                    emp.productivity >= 70 ? 'text-yellow-400' : 'text-red-400'
                                  }`}>
                                    {emp.productivity.toFixed(1)}%
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
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
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
            <span>≥90% present</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-400 rounded mr-2"></div>
            <span>70-89% present</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-400 rounded mr-2"></div>
            <span>50-69% present</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-400 rounded mr-2"></div>
            <span>&lt;50% present</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-100 rounded mr-2 border border-gray-300"></div>
            <span>No data</span>
          </div>
        </div>
      </div>
      
      {/* Summary */}
      {data && data.summary && (
        <div className="mt-4 grid grid-cols-4 gap-2 text-xs">
          <div className="border rounded p-2 text-center">
            <div className="text-gray-600">Avg Daily Presence</div>
            <div className="font-bold text-green-600">
              {data.summary.avgPresence?.toFixed(1) || '0.0'}%
            </div>
          </div>
          <div className="border rounded p-2 text-center">
            <div className="text-gray-600">Total Employees</div>
            <div className="font-bold text-gray-800">{data.summary.totalEmployees || 0}</div>
          </div>
          <div className="border rounded p-2 text-center">
            <div className="text-gray-600">Total Leaves</div>
            <div className="font-bold text-red-600">{data.summary.totalLeaves || 0}</div>
          </div>
          <div className="border rounded p-2 text-center">
            <div className="text-gray-600">Avg Hours</div>
            <div className="font-bold text-blue-600">{data.summary.avgHours?.toFixed(1) || '0.0'}h</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkforceCalendarView;