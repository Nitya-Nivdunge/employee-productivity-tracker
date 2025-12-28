import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);


const OverallProductivityChart = ({ data }) => {
  if (!data || !data.employees || data.employees.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-gray-500">No productivity data available</p>
      </div>
    );
  }

  // Sort employees by productivity
  const sortedEmployees = [...data.employees].sort((a, b) => b.productivity - a.productivity);
  const topEmployees = sortedEmployees.slice(0, 12); // Show top 12 employees
  
  // Fix: Use employeeName instead of name
  const chartData = {
    labels: topEmployees.map(emp => {
      const name = emp.employeeName || emp.name || 'Unknown';
      return name.length > 15 ? name.substring(0, 15) + '...' : name;
    }),
    datasets: [
      {
        label: 'Productivity %',
        data: topEmployees.map(emp => emp.productivity || 0),
        backgroundColor: topEmployees.map(emp => {
          const productivity = emp.productivity || 0;
          if (productivity >= 90) return 'rgba(34, 197, 94, 0.7)';
          if (productivity >= 70) return 'rgba(59, 130, 246, 0.7)';
          return 'rgba(239, 68, 68, 0.7)';
        }),
        borderColor: topEmployees.map(emp => {
          const productivity = emp.productivity || 0;
          if (productivity >= 90) return 'rgb(34, 197, 94)';
          if (productivity >= 70) return 'rgb(59, 130, 246)';
          return 'rgb(239, 68, 68)';
        }),
        borderWidth: 1,
        borderRadius: 4,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context) => `Productivity: ${context.parsed.y.toFixed(1)}%`,
          afterLabel: (context) => {
            const employee = topEmployees[context.dataIndex];
            // Use leaveCount if available, otherwise fallback to leavesTaken
            const leavesTaken = employee.leaveCount || employee.leavesTaken || 0;
            const leavesAllowed = employee.leavesAllowed || 2; // Monthly limit
            return `Leaves: ${leavesTaken}/${leavesAllowed}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Productivity (%)'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          callback: function(value) {
            return value + '%';
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      }
    }
  };

  // Calculate stats with safe property access
  const totalEmployees = data.employees.length;
  const avgProductivity = data.employees.reduce((sum, emp) => sum + (emp.productivity || 0), 0) / totalEmployees;
  const highPerformers = data.employees.filter(emp => (emp.productivity || 0) >= 90).length;
  const lowPerformers = data.employees.filter(emp => (emp.productivity || 0) < 70).length;
  // Use leaveCount if available, otherwise leavesTaken
  const totalLeaves = data.employees.reduce((sum, emp) => sum + (emp.leaveCount || emp.leavesTaken || 0), 0);
  const avgHours = data.employees.reduce((sum, emp) => sum + (emp.totalHours || 0), 0) / totalEmployees;

  return (
    <div>
      <div className="h-64">
        <Bar data={chartData} options={options} />
      </div>
      
      {/* Stats */}
      <div className="mt-4 grid grid-cols-5 gap-2 text-xs">
        <div className="border rounded p-2 text-center">
          <div className="text-gray-600">Total Employees</div>
          <div className="font-bold text-gray-800">{totalEmployees}</div>
        </div>
        <div className="border rounded p-2 text-center">
          <div className="text-gray-600">Avg Productivity</div>
          <div className={`font-bold ${avgProductivity >= 80 ? 'text-green-600' : 'text-yellow-600'}`}>
            {avgProductivity.toFixed(1)}%
          </div>
        </div>
        <div className="border rounded p-2 text-center">
          <div className="text-gray-600">High Performers (≥90%)</div>
          <div className="font-bold text-green-600">{highPerformers}</div>
        </div>
        <div className="border rounded p-2 text-center">
            <div className="text-gray-600">Needs Improvement (&lt;70&percnt;)</div>
          <div className="font-bold text-red-600">{lowPerformers}</div>
        </div>
        <div className="border rounded p-2 text-center">
          <div className="text-gray-600">Total Leaves</div>
          <div className="font-bold text-red-600">{totalLeaves}</div>
        </div>
      </div>
      
      {/* Top Performers List */}
      {sortedEmployees.length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">Top 5 Performers</h4>
          <div className="space-y-1">
            {sortedEmployees.slice(0, 5).map((emp, index) => {
              const name = emp.employeeName || emp.name || 'Unknown';
              const productivity = emp.productivity || 0;
              const leavesTaken = emp.leaveCount || emp.leavesTaken || 0;
              const leavesAllowed = emp.leavesAllowed || 2; // Monthly limit
              
              return (
                <div key={index} className="flex items-center justify-between border-b pb-1">
                  <div className="text-xs truncate max-w-40">{name}</div>
                  <div className="flex items-center space-x-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${productivity >= 90 ? 'bg-green-100 text-green-800' : productivity >= 70 ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
                      {productivity.toFixed(1)}%
                    </span>
                    <span className={`text-xs ${leavesTaken > leavesAllowed ? 'text-red-600' : 'text-gray-500'}`}>
                      {leavesTaken}/{leavesAllowed} leaves
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default OverallProductivityChart;