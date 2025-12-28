import React from 'react';

// Replace the Entire OverallInsights function with this updated version
const OverallInsights = () => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">
          Overall Insights - {selectedYear}
        </h2>
        <div className="text-sm text-gray-500">
          {monthNames[selectedMonth - 1]} {selectedYear}
        </div>
      </div>
      
      {/* Current Year Insights */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">
          Current Year ({selectedYear}) Insights
        </h3>
        
        {/* Employee Stats Cards */}
        {employeeStats && (
          <div className="grid grid-cols-4 gap-3 mb-6">
            <div className="bg-blue-50 rounded-lg p-3">
              <h3 className="text-xs font-semibold text-blue-700 mb-2">Total Employees</h3>
              <div className="text-2xl font-bold text-blue-800">
                {employeeStats.totalEmployees}
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <h3 className="text-xs font-semibold text-green-700 mb-2">Avg Productivity</h3>
              <div className={`text-2xl font-bold ${employeeStats.avgProductivity >= 80 ? 'text-green-600' : employeeStats.avgProductivity >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                {employeeStats.avgProductivity.toFixed(1)}%
              </div>
            </div>
            <div className="bg-indigo-50 rounded-lg p-3">
              <h3 className="text-xs font-semibold text-indigo-700 mb-2">Avg Hours</h3>
              <div className="text-2xl font-bold text-indigo-600">
                {employeeStats.avgHours.toFixed(1)}h
              </div>
            </div>
            <div className="bg-red-50 rounded-lg p-3">
              <h3 className="text-xs font-semibold text-red-700 mb-2">Total Leaves</h3>
              <div className="text-2xl font-bold text-red-600">
                {employeeStats.totalLeaves}
              </div>
            </div>
          </div>
        )}
        
        {/* Overall Productivity Chart - Current Year */}
        {allEmployeesProductivity && allEmployeesProductivity.employees && allEmployeesProductivity.employees.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-800 mb-4">
              Productivity Distribution - {selectedYear}
            </h4>
            <OverallProductivityChart data={allEmployeesProductivity} />
          </div>
        )}
      </div>
      
      {/* Previous Year Insights Section */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">
          Previous Year ({selectedYear - 1}) Insights
        </h3>
        
        {overallData && overallData.previousYearData ? (
          <div>
            {/* Show Previous Year Stats */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="bg-blue-50 rounded-lg p-3">
                <h3 className="text-xs font-semibold text-blue-700 mb-2">Total Employees</h3>
                <div className="text-2xl font-bold text-blue-800">
                  {overallData.previousYearData.totalEmployees || 'N/A'}
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <h3 className="text-xs font-semibold text-green-700 mb-2">Avg Productivity</h3>
                <div className={`text-2xl font-bold ${overallData.previousYearData.avgProductivity >= 80 ? 'text-green-600' : overallData.previousYearData.avgProductivity >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {overallData.previousYearData.avgProductivity?.toFixed(1) || 'N/A'}%
                </div>
              </div>
              <div className="bg-indigo-50 rounded-lg p-3">
                <h3 className="text-xs font-semibold text-indigo-700 mb-2">Avg Hours</h3>
                <div className="text-2xl font-bold text-indigo-600">
                  {overallData.previousYearData.avgHours?.toFixed(1) || 'N/A'}h
                </div>
              </div>
              <div className="bg-red-50 rounded-lg p-3">
                <h3 className="text-xs font-semibold text-red-700 mb-2">Total Leaves</h3>
                <div className="text-2xl font-bold text-red-600">
                  {overallData.previousYearData.totalLeaves || 'N/A'}
                </div>
              </div>
            </div>
            
            {/* Year Comparison Chart */}
            {yearComparisonData && yearComparisonData.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-4">Year-over-Year Comparison</h4>
                <YearComparisonChart data={yearComparisonData} />
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h4 className="mt-3 text-sm font-medium text-gray-900">No Previous Year Data Available</h4>
            <p className="mt-1 text-xs text-gray-500">
              No data found for {selectedYear - 1} in the database
            </p>
          </div>
        )}
      </div>
      
      {/* Workforce Calendar */}
      {workforceData && (
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">
            Workforce Calendar - {monthNames[selectedMonth - 1]} {selectedYear}
          </h3>
          <WorkforceCalendarView 
            data={workforceData} 
            year={selectedYear} 
            month={selectedMonth} 
          />
        </div>
      )}
      
      {/* Employee List Table - This stays as it's for current month */}
      {employeeStats && employeeStats.employees.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-gray-800">
              Employee List - {monthNames[selectedMonth - 1]} ({employeeStats.employees.length} employees)
            </h3>
            <div className="text-xs text-gray-500">
              Click on any employee to view details
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Productivity</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Worked Hours</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Leaves</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {employeeStats.employees.map((emp, index) => (
                  <tr 
                    key={index}
                    className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                    onClick={() => {
                      setSelectedEmployee(emp);
                      setActivePage('employee-detail');
                    }}
                  >
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                      {emp.employeeName}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${emp.productivity >= 90 ? 'bg-green-100 text-green-800' : emp.productivity >= 70 ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
                        {emp.productivity.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                      {emp.totalWorkedHours.toFixed(1)}h
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                      <span className={emp.leavesTaken > emp.leavesAllowed ? 'text-red-600 font-medium' : ''}>
                        {emp.leavesTaken}/{emp.leavesAllowed}
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                        emp.leavesTaken > emp.leavesAllowed ? 'bg-red-100 text-red-800' :
                        emp.leavesTaken === emp.leavesAllowed ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {emp.leavesTaken > emp.leavesAllowed ? 'Over Limit' :
                         emp.leavesTaken === emp.leavesAllowed ? 'Limit Reached' :
                         'Within Limit'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};