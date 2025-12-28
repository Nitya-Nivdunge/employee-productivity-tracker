import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import FileUpload from './FileUpload';
import Statistics from './Statistics';
import AttendanceTable from './AttendanceTable';
import CalendarView from './CalendarView';
import WorkforceCalendarView from './WorkforceCalendarView';
import EmployeeSearch from './EmployeeSearch';

import { 
  getMonthlyData, 
  getOverallInsights, 
  getAllEmployeesProductivity, 
  getWorkforceDailyBreakdown,
  getPreviousMonthData
} from '../services/api';

const Dashboard = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [monthlyData, setMonthlyData] = useState(null);
  const [allEmployeesProductivity, setAllEmployeesProductivity] = useState({ employees: [] });
  const [workforceData, setWorkforceData] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activePage, setActivePage] = useState('overall-insights');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [breakdownView, setBreakdownView] = useState('calendar');
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [employeeStats, setEmployeeStats] = useState(null);
  const [previousMonthStats, setPreviousMonthStats] = useState(null);
  const [prevMonthName, setPrevMonthName] = useState('');

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    loadAllData();
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    if (uploadSuccess) {
      const timer = setTimeout(() => {
        setUploadSuccess(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [uploadSuccess]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      
      // Load current month data FIRST
      await loadMonthlyData(selectedYear, selectedMonth);
      
      // Load workforce data for current month
      await loadWorkforceData(selectedYear, selectedMonth);
      
      // Load current year productivity data
      await loadYearlyProductivityData(selectedYear);
      
      // Load previous month data
      await loadPreviousMonthData(selectedYear, selectedMonth);
      
    } catch (error) {
      console.error('Error loading data:', error);
      if (error.status !== 404) {
        toast.error('Failed to load data');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadMonthlyData = async (year, month) => {
    try {
      const data = await getMonthlyData(year, month);
      setMonthlyData(data);
      
      // Update filtered employees list
      if (data && data.statistics && data.statistics.length > 0) {
        const sortedEmployees = [...data.statistics]
          .sort((a, b) => a.employeeName.localeCompare(b.employeeName));
        setFilteredEmployees(sortedEmployees);
        
        // Calculate employee stats for overall insights
        const stats = {
          totalEmployees: sortedEmployees.length,
          avgProductivity: sortedEmployees.reduce((sum, emp) => sum + (emp.productivity || 0), 0) / sortedEmployees.length,
          avgHours: sortedEmployees.reduce((sum, emp) => sum + (emp.totalWorkedHours || 0), 0) / sortedEmployees.length,
          totalLeaves: sortedEmployees.reduce((sum, emp) => sum + (emp.leavesTaken || 0), 0),
          totalHours: sortedEmployees.reduce((sum, emp) => sum + (emp.totalWorkedHours || 0), 0),
          employees: sortedEmployees
        };
        setEmployeeStats(stats);
        
        // If employee search term exists, try to find matching employee
        if (employeeSearchTerm.trim() !== '') {
          const found = sortedEmployees.find(emp => 
            emp.employeeName.toLowerCase().includes(employeeSearchTerm.toLowerCase())
          );
          if (found) {
            setSelectedEmployee(found);
          } else {
            setSelectedEmployee(null);
          }
        }
      } else {
        setFilteredEmployees([]);
        setSelectedEmployee(null);
        setEmployeeStats(null);
      }
    } catch (error) {
      console.error('Error loading monthly data:', error);
      setFilteredEmployees([]);
      setSelectedEmployee(null);
      setEmployeeStats(null);
    }
  };

  const loadWorkforceData = async (year, month) => {
    try {
      const workforce = await getWorkforceDailyBreakdown(year, month);
      if (workforce && workforce.dailyBreakdown) {
        // Transform the data for the WorkforceCalendarView
        const transformedData = {
          dailyData: workforce.dailyBreakdown.map(day => {
            // Calculate present employees (not on leave and not holiday)
            const presentEmployees = day.employees.filter(emp => !emp.isLeave && !emp.isHoliday).length;
            const totalEmployees = day.employees.length;
            
            // Calculate average hours for the day
            const totalHours = day.employees.reduce((sum, emp) => sum + (emp.workedHours || 0), 0);
            const avgHours = totalEmployees > 0 ? totalHours / totalEmployees : 0;
            
            // Calculate average productivity for the day
            const productiveEmployees = day.employees.filter(emp => emp.workedHours > 0);
            const avgProductivity = productiveEmployees.length > 0 
              ? productiveEmployees.reduce((sum, emp) => {
                  // Simple productivity calculation based on hours
                  // Assuming 8-hour workday for expected hours
                  const expectedHours = 8;
                  const productivity = emp.workedHours >= expectedHours ? 100 : (emp.workedHours / expectedHours) * 100;
                  return sum + productivity;
                }, 0) / productiveEmployees.length
              : 0;
            
            return {
              date: day.date,
              present: presentEmployees,
              total: totalEmployees,
              avgHours,
              avgProductivity,
              employees: day.employees.map(emp => ({
                name: emp.employeeName,
                status: emp.isLeave ? 'leave' : emp.isHoliday ? 'holiday' : 'present',
                hours: emp.workedHours || 0,
                productivity: emp.workedHours > 0 ? Math.min((emp.workedHours / 8) * 100, 100) : 0
              }))
            };
          }),
          summary: {
            avgPresence: workforce.dailyBreakdown.reduce((sum, day) => {
              const present = day.employees.filter(emp => !emp.isLeave && !emp.isHoliday).length;
              const total = day.employees.length;
              return sum + (total > 0 ? (present / total) * 100 : 0);
            }, 0) / workforce.dailyBreakdown.length,
            totalEmployees: workforce.dailyBreakdown[0]?.employees.length || 0,
            totalLeaves: workforce.dailyBreakdown.reduce((sum, day) => 
              sum + day.employees.filter(emp => emp.isLeave).length, 0
            ),
            avgHours: workforce.dailyBreakdown.reduce((sum, day) => 
              sum + day.employees.reduce((empSum, emp) => empSum + (emp.workedHours || 0), 0)
            , 0) / workforce.dailyBreakdown.length
          }
        };
        setWorkforceData(transformedData);
      } else {
        setWorkforceData(null);
      }
    } catch (error) {
      console.log('No workforce data available:', error.message);
      setWorkforceData(null);
    }
  };

  const loadYearlyProductivityData = async (year) => {
    try {
      const allEmployeesProd = await getAllEmployeesProductivity(year);
      if (allEmployeesProd && allEmployeesProd.employees) {
        // Transform data to match OverallProductivityChart expectations
        const transformedData = {
          employees: allEmployeesProd.employees.map(emp => ({
            name: emp.employeeName,
            productivity: emp.productivity || 0,
            leavesTaken: emp.leaveDays || 0,
            leavesAllowed: 24, // 2 per month * 12
            totalHours: emp.totalWorkedHours || 0
          }))
        };
        setAllEmployeesProductivity(transformedData);
      } else {
        setAllEmployeesProductivity({ employees: [] });
      }
    } catch (error) {
      console.log('No productivity data available:', error.message);
      setAllEmployeesProductivity({ employees: [] });
    }
  };

  const loadPreviousMonthData = async (year, month) => {
    try {
      const prevData = await getPreviousMonthData(year, month);
      
      // Calculate previous month name for display
      let prevMonth = month - 1;
      let prevYear = year;
      if (prevMonth === 0) {
        prevMonth = 12;
        prevYear = year - 1;
      }
      setPrevMonthName(`${monthNames[prevMonth - 1]} ${prevYear}`);
      
      if (prevData && prevData.statistics && prevData.statistics.length > 0) {
        const sortedPrevEmployees = [...prevData.statistics]
          .sort((a, b) => a.employeeName.localeCompare(b.employeeName));
        
        const prevStats = {
          totalEmployees: sortedPrevEmployees.length,
          avgProductivity: sortedPrevEmployees.reduce((sum, emp) => sum + (emp.productivity || 0), 0) / sortedPrevEmployees.length,
          avgHours: sortedPrevEmployees.reduce((sum, emp) => sum + (emp.totalWorkedHours || 0), 0) / sortedPrevEmployees.length,
          totalLeaves: sortedPrevEmployees.reduce((sum, emp) => sum + (emp.leavesTaken || 0), 0),
          totalHours: sortedPrevEmployees.reduce((sum, emp) => sum + (emp.totalWorkedHours || 0), 0),
          employees: sortedPrevEmployees,
          month: prevMonth,
          year: prevYear
        };
        setPreviousMonthStats(prevStats);
      } else {
        setPreviousMonthStats(null);
      }
    } catch (error) {
      console.log('No previous month data available:', error.message);
      setPreviousMonthStats(null);
    }
  };

  const handleUploadSuccess = (result) => {
    setUploadSuccess(true);
    toast.success('File uploaded successfully! Data will refresh shortly.');
    setTimeout(() => {
      loadAllData();
    }, 1000);
  };

  const handleEmployeeSearch = (searchTerm) => {
    setEmployeeSearchTerm(searchTerm);
    
    if (!filteredEmployees || filteredEmployees.length === 0) {
      toast.error('No employees available for this month');
      return;
    }
    
    const found = filteredEmployees.find(emp => 
      emp.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (found) {
      setSelectedEmployee(found);
      setActivePage('employee-detail');
    } else {
      setSelectedEmployee(null);
      toast.error(`No employee found matching "${searchTerm}"`);
    }
  };

  const clearEmployeeSearch = () => {
    setEmployeeSearchTerm('');
    setSelectedEmployee(null);
    setActivePage('overall-insights');
  };

  // Helper function to create employee table
  const renderEmployeeTable = (stats, title, isPreviousMonth = false, isPreviousYear = false) => {
    if (!stats || !stats.employees || stats.employees.length === 0) return null;
    
    return (
      <div className="bg-white rounded-lg shadow-sm border mb-4">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Productivity</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Worked Hours</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Leaves</th>
                {isPreviousYear ? (
                  <>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Exceeded Months</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Best Month</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Worst Month</th>
                  </>
                ) : (
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.employees.map((emp, index) => {
                // Calculate leaves correctly
                const leavesTaken = isPreviousYear ? emp.totalLeavesTaken : emp.leavesTaken || 0;
                const leavesAllowed = isPreviousYear ? emp.totalLeavesAllowed : emp.leavesAllowed || 2;
                const productivity = isPreviousYear ? emp.avgProductivity : emp.productivity;
                
                return (
                  <tr 
                    key={index}
                    className={`hover:bg-gray-50 ${!isPreviousMonth && !isPreviousYear ? 'cursor-pointer' : ''}`}
                    onClick={!isPreviousMonth && !isPreviousYear ? () => {
                      setSelectedEmployee(emp);
                      setActivePage('employee-detail');
                    } : undefined}
                  >
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                      {emp.employeeName}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                        productivity >= 90 ? 'bg-green-100 text-green-800' : 
                        productivity >= 70 ? 'bg-blue-100 text-blue-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {productivity?.toFixed(1) || '0.0'}%
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                      {isPreviousYear ? emp.totalWorkedHours?.toFixed(1) || '0.0' : (emp.totalWorkedHours || 0).toFixed(1)}h
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                      <span className={leavesTaken > leavesAllowed ? 'text-red-600 font-medium' : ''}>
                        {leavesTaken}/{leavesAllowed}
                      </span>
                    </td>
                    {isPreviousYear ? (
                      <>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-center">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${emp.exceededLimitMonths > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                            {emp.exceededLimitMonths || 0} month{emp.exceededLimitMonths !== 1 ? 's' : ''}
                          </span>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-600">
                          {emp.bestMonth || 'N/A'}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-600">
                          {emp.worstMonth || 'N/A'}
                        </td>
                      </>
                    ) : (
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                          leavesTaken > leavesAllowed ? 'bg-red-100 text-red-800' :
                          leavesTaken === leavesAllowed ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {leavesTaken > leavesAllowed ? 'Over Limit' :
                           leavesTaken === leavesAllowed ? 'Limit Reached' :
                           'Within Limit'}
                        </span>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Calculate statistics for selected employee
  const calculateEmployeeStats = (employee) => {
    if (!employee || !employee.dailyBreakdown) return null;
    
    const dailyBreakdown = employee.dailyBreakdown || [];
    
    // Filter working days (not leave and not holiday)
    const workingDays = dailyBreakdown.filter(day => !day.isLeave && !day.isHoliday);
    
    // Calculate total expected and worked hours
    const totalExpectedHours = workingDays.reduce((sum, day) => sum + (day.expectedHours || 0), 0);
    const totalWorkedHours = workingDays.reduce((sum, day) => sum + (day.workedHours || 0), 0);
    
    // Calculate productivity for each working day
    const productivities = workingDays.map(day => {
      if (day.expectedHours > 0) {
        return (day.workedHours / day.expectedHours) * 100;
      }
      return 0;
    });
    
    const avgProductivity = productivities.length > 0 
      ? productivities.reduce((sum, prod) => sum + prod, 0) / productivities.length
      : 0;
    
    const peakProductivity = productivities.length > 0 
      ? Math.max(...productivities)
      : 0;
    
    const lowestProductivity = productivities.length > 0 
      ? Math.min(...productivities)
      : 0;
    
    // Get leave days
    const leaveDays = dailyBreakdown
      .filter(day => day.isLeave && !day.isHoliday)
      .map(day => {
        const date = new Date(day.date);
        return {
          date: day.date,
          formattedDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        };
      });
    
    // Get holiday days
    const holidayDays = dailyBreakdown
      .filter(day => day.isHoliday)
      .map(day => {
        const date = new Date(day.date);
        return {
          date: day.date,
          formattedDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        };
      });
    
    return {
      workingDays: workingDays.length,
      totalExpectedHours,
      totalWorkedHours,
      avgProductivity,
      peakProductivity,
      lowestProductivity,
      leaveDays,
      holidayDays
    };
  };

  // Overall Insights Component
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
        
        {/* CURRENT MONTH Employee Performance Table - MOVED TO TOP */}
        {employeeStats && employeeStats.employees.length > 0 && (
          renderEmployeeTable(
            employeeStats, 
            `Current Month (${monthNames[selectedMonth - 1]} ${selectedYear}) - Employee Performance`,
            false,
            false
          )
        )}
        
        {/* Current Month Stats Cards */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">
            Current Month ({monthNames[selectedMonth - 1]} {selectedYear}) Insights
          </h3>
          
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
          
          {/* Workforce Calendar - MOVED HERE */}
          {workforceData && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-800 mb-4">
                Workforce Calendar - {monthNames[selectedMonth - 1]} {selectedYear}
              </h4>
              <WorkforceCalendarView 
                data={workforceData} 
                year={selectedYear} 
                month={selectedMonth} 
              />
            </div>
          )}
        </div>
        
        {/* Previous Month Employee Performance */}
        {previousMonthStats && (
          <>
            <h3 className="text-sm font-semibold text-gray-800">
              Previous Month ({prevMonthName}) Performance
            </h3>
            {renderEmployeeTable(
              previousMonthStats, 
              `Previous Month (${prevMonthName}) - Employee Performance`, 
              true, 
              false
            )}
          </>
        )}
      </div>
    );
  };

  // Employee Dashboard Component - UPDATED to show summary data across screen
  const EmployeeDashboard = ({ employee }) => {
    const stats = calculateEmployeeStats(employee);
    
    if (!stats) return null;
    
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Employee Dashboard: {employee.employeeName}
            </h3>
            <p className="text-sm text-gray-600">
              {monthNames[selectedMonth - 1]} {selectedYear}
            </p>
          </div>
          <button
            onClick={clearEmployeeSearch}
            className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors flex items-center"
          >
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to All Employees
          </button>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-white rounded-lg shadow-sm border p-3">
            <h6 className="text-xs font-medium text-gray-600 mb-1">Leaves Taken</h6>
            <div className="text-lg font-bold text-gray-800">{employee.leavesTaken || 0}</div>
            <div className="text-xs text-gray-500">out of {employee.leavesAllowed || 2} allowed</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-3">
            <h6 className="text-xs font-medium text-gray-600 mb-1">Overall Productivity</h6>
            <div className={`text-lg font-bold ${employee.productivity >= 90 ? 'text-green-600' : employee.productivity >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
              {(employee.productivity || 0).toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">Monthly average</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-3">
            <h6 className="text-xs font-medium text-gray-600 mb-1">Total Worked Hours</h6>
            <div className="text-lg font-bold text-gray-800">{(employee.totalWorkedHours || 0).toFixed(1)}h</div>
            <div className="text-xs text-gray-500">This month</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-3">
            <h6 className="text-xs font-medium text-gray-600 mb-1">Attendance Rate</h6>
            <div className="text-lg font-bold text-gray-800">
              {(((stats.workingDays || 0) / 31) * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">Days present</div>
          </div>
        </div>
        
        {/* Summary Data - Full Width Grid */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4">
            <h4 className="text-sm font-semibold text-gray-800 mb-4">Monthly Summary</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Non-Working Days */}
              <div>
                <h5 className="text-sm font-semibold text-gray-700 mb-3">Non-Working Days</h5>
                
                {/* Leave Days */}
                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    <h6 className="text-xs font-medium text-red-600">
                      Leave Days ({stats.leaveDays.length})
                    </h6>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {stats.leaveDays.length > 0 ? (
                      stats.leaveDays.map((day, idx) => (
                        <div key={idx} className="bg-gray-50 border border-gray-200 rounded p-2 text-center">
                          <span className="text-xs font-medium text-gray-700">{day.formattedDate}</span>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-3 text-center py-2">
                        <span className="text-xs text-gray-500">No leave days</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Holidays */}
                <div>
                  <div className="flex items-center mb-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                    <h6 className="text-xs font-medium text-purple-600">
                      Holidays ({stats.holidayDays.length})
                    </h6>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {stats.holidayDays.length > 0 ? (
                      stats.holidayDays.map((day, idx) => (
                        <div key={idx} className="bg-purple-50 border border-purple-200 rounded p-2 text-center">
                          <span className="text-xs font-medium text-purple-700">{day.formattedDate}</span>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-3 text-center py-2">
                        <span className="text-xs text-gray-500">No holidays</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Right Column: Productivity Statistics */}
              <div>
                <h5 className="text-sm font-semibold text-gray-700 mb-3">Productivity Statistics</h5>
                
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {/* Average Productivity */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                    <div className="text-xs font-medium text-green-700 mb-1">Average Productivity</div>
                    <div className={`text-xl font-bold ${stats.avgProductivity >= 80 ? 'text-green-600' : stats.avgProductivity >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {stats.avgProductivity.toFixed(1)}%
                    </div>
                  </div>
                  
                  {/* Peak Productivity */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                    <div className="text-xs font-medium text-blue-700 mb-1">Peak Productivity</div>
                    <div className="text-xl font-bold text-green-600">
                      {stats.peakProductivity.toFixed(1)}%
                    </div>
                  </div>
                  
                  {/* Lowest Productivity */}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                    <div className="text-xs font-medium text-red-700 mb-1">Lowest Productivity</div>
                    <div className="text-xl font-bold text-red-600">
                      {stats.lowestProductivity.toFixed(1)}%
                    </div>
                  </div>
                </div>
                
                {/* Working Days and Hours */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h6 className="text-xs font-semibold text-gray-700 mb-3">Hours Summary</h6>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Working Days:</span>
                      <span className="text-sm font-medium text-gray-800">{stats.workingDays} days</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Total Expected Hours:</span>
                      <span className="text-sm font-medium text-gray-800">{stats.totalExpectedHours.toFixed(1)}h</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Total Worked Hours:</span>
                      <span className="text-sm font-medium text-gray-800">{stats.totalWorkedHours.toFixed(1)}h</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                      <span className="text-xs text-gray-600">Hours Difference:</span>
                      <span className={`text-sm font-medium ${stats.totalWorkedHours >= stats.totalExpectedHours ? 'text-green-600' : 'text-red-600'}`}>
                        {(stats.totalWorkedHours - stats.totalExpectedHours).toFixed(1)}h
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading && !monthlyData) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 overflow-hidden flex flex-col">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
            fontSize: '14px',
          },
        }}
      />
      
      {/* Header - Centered */}
      <header className="bg-white shadow py-3 px-6">
        <div className="flex justify-center items-center">
          <h1 className="text-xl font-bold text-gray-900 text-center">
            Leave & Productivity Analyzer
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Panel - Compact */}
        <div className="w-64 bg-white border-r border-gray-200 p-3 flex flex-col space-y-3 overflow-y-auto">
          
          {/* Filters */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Filters</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded p-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  {[2025, 2024, 2023, 2022].map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded p-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="1">Jan</option>
                  <option value="2">Feb</option>
                  <option value="3">Mar</option>
                  <option value="4">Apr</option>
                  <option value="5">May</option>
                  <option value="6">Jun</option>
                  <option value="7">Jul</option>
                  <option value="8">Aug</option>
                  <option value="9">Sep</option>
                  <option value="10">Oct</option>
                  <option value="11">Nov</option>
                  <option value="12">Dec</option>
                </select>
              </div>
            </div>
            
            {/* Employee Search */}
            <div className="pt-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Search Employee</label>
              <EmployeeSearch
                employees={filteredEmployees.map(emp => emp.employeeName)}
                onSelect={handleEmployeeSearch}
              />
            </div>
          </div>

          {/* File Upload */}
          <div className="pt-1">
            <FileUpload 
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
              onUploadSuccess={handleUploadSuccess}
            />
          </div>

          {/* Upload Success Message */}
          {uploadSuccess && (
            <div className="bg-green-50 border border-green-200 rounded p-2 animate-fade-in">
              <div className="flex items-center">
                <svg className="h-4 w-4 text-green-400 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-xs text-green-800">
                  File uploaded! Data updated.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          
          {/* Navigation */}
          <div className="bg-white border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => {
                  setActivePage('overall-insights');
                  clearEmployeeSearch();
                }}
                className={`px-4 py-2 text-xs font-medium transition-colors ${
                  activePage === 'overall-insights' 
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                Overall Insights
              </button>
              {selectedEmployee && (
                <>
                  <button
                    onClick={() => setActivePage('employee-detail')}
                    className={`px-4 py-2 text-xs font-medium transition-colors ${
                      activePage === 'employee-detail' 
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Employee Dashboard
                  </button>
                  <button
                    onClick={() => setActivePage('daily-breakdown')}
                    className={`px-4 py-2 text-xs font-medium transition-colors ${
                      activePage === 'daily-breakdown' 
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Daily Breakdown
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Page Content */}
          <div className="flex-1 overflow-y-auto p-3">
            
            {/* Overall Insights Page */}
            {activePage === 'overall-insights' && <OverallInsights />}

            {/* Employee Detail Page */}
            {activePage === 'employee-detail' && selectedEmployee && (
              <EmployeeDashboard employee={selectedEmployee} />
            )}

            {/* Daily Breakdown Page */}
            {activePage === 'daily-breakdown' && selectedEmployee && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-gray-800">
                    Daily Breakdown - {selectedEmployee.employeeName}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-600">View:</span>
                    <div className="inline-flex rounded-md shadow-sm" role="group">
                      <button
                        type="button"
                        onClick={() => setBreakdownView('calendar')}
                        className={`px-3 py-1 text-xs font-medium rounded-l transition-colors ${
                          breakdownView === 'calendar' 
                            ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                        }`}
                      >
                        Calendar
                      </button>
                      <button
                        type="button"
                        onClick={() => setBreakdownView('table')}
                        className={`px-3 py-1 text-xs font-medium rounded-r transition-colors ${
                          breakdownView === 'table' 
                            ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                        }`}
                      >
                        Table
                      </button>
                    </div>
                  </div>
                </div>

                {breakdownView === 'calendar' ? (
                  <CalendarView 
                    year={selectedYear}
                    month={selectedMonth}
                    dailyBreakdown={selectedEmployee.dailyBreakdown || []}
                    employeeName={selectedEmployee.employeeName}
                  />
                ) : (
                  <AttendanceTable data={selectedEmployee} />
                )}
              </div>
            )}

            {/* No Employee Selected */}
            {activePage !== 'overall-insights' && !selectedEmployee && (
              <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-4 text-sm font-medium text-gray-900">No Employee Selected</h3>
                <p className="mt-1 text-xs text-gray-500">
                  Search for an employee or click on an employee name to view details
                </p>
                <button
                  onClick={() => setActivePage('overall-insights')}
                  className="mt-4 px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                >
                  View Overall Insights
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;