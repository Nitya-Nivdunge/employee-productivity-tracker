import React from 'react';
import { format } from 'date-fns';

const AttendanceTable = ({ data }) => {
  if (!data || !data.dailyBreakdown || data.dailyBreakdown.length === 0) {
    return (
      <div className="bg-white rounded border p-4 text-center">
        <p className="text-sm text-gray-500">No attendance data available</p>
      </div>
    );
  }

  const getStatusBadge = (isLeave, isHoliday, workedHours, expectedHours) => {
    if (isHoliday) return (
      <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
        Holiday
      </span>
    );
    if (isLeave) return (
      <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800">
        Leave
      </span>
    );
    
    const productivity = expectedHours > 0 ? (workedHours / expectedHours) * 100 : 0;
    
    if (productivity >= 90) return (
      <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
        Excellent
      </span>
    );
    if (productivity >= 70) return (
      <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
        Good
      </span>
    );
    return (
      <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
        Needs Improvement
      </span>
    );
  };

  const getHoursColor = (workedHours, expectedHours) => {
    if (expectedHours === 0) return 'text-gray-600';
    
    const productivity = (workedHours / expectedHours) * 100;
    if (productivity >= 90) return 'text-green-600 font-bold';
    if (productivity >= 70) return 'text-blue-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-xs">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Day
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Worked Hours
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Expected Hours
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Productivity
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                In-Time
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Out-Time
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.dailyBreakdown.map((day, index) => {
              const productivity = day.expectedHours > 0 
                ? (day.workedHours / day.expectedHours) * 100 
                : 0;
              
              return (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(day.date), 'dd MMM')}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                    {day.day}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {getStatusBadge(day.isLeave, day.isHoliday, day.workedHours, day.expectedHours)}
                  </td>
                  <td className={`px-3 py-2 whitespace-nowrap text-sm font-medium ${getHoursColor(day.workedHours, day.expectedHours)}`}>
                    {day.workedHours.toFixed(1)}h
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                    {day.expectedHours.toFixed(1)}h
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    {day.isHoliday || day.isLeave ? (
                      <span className="text-gray-400">-</span>
                    ) : (
                      <span className={productivity >= 90 ? 'text-green-600 font-bold' : productivity >= 70 ? 'text-blue-600' : 'text-red-600'}>
                        {productivity.toFixed(1)}%
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                    {day.inTime || '-'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                    {day.outTime || '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Summary */}
      <div className="bg-gray-50 px-3 py-2 border-t border-gray-200">
        <div className="flex justify-between text-xs">
          <div>
            <span className="text-gray-600">Total Worked:</span>
            <span className="font-medium ml-1">
              {data.totalWorkedHours?.toFixed(1) || '0.0'}h
            </span>
          </div>
          <div>
            <span className="text-gray-600">Total Expected:</span>
            <span className="font-medium ml-1">
              {data.totalExpectedHours?.toFixed(1) || '0.0'}h
            </span>
          </div>
          <div>
            <span className="text-gray-600">Overall Productivity:</span>
            <span className={`font-bold ml-1 ${data.productivity >= 80 ? 'text-green-600' : data.productivity >= 70 ? 'text-blue-600' : 'text-red-600'}`}>
              {data.productivity?.toFixed(1) || '0.0'}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceTable;