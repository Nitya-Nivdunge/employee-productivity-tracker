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

// Register Chart components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const YearComparisonChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-gray-500">No comparison data available</p>
      </div>
    );
  }

  // Sort data by year
  const sortedData = [...data].sort((a, b) => a.year - b.year);
  
  const chartData = {
    labels: sortedData.map(item => item.year.toString()),
    datasets: [
      {
        label: 'Avg Productivity (%)',
        data: sortedData.map(item => item.avgProductivity || 0),
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
        yAxisID: 'y',
        order: 1,
      },
      {
        label: 'Avg Hours',
        data: sortedData.map(item => item.avgHours || 0),
        backgroundColor: 'rgba(34, 197, 94, 0.7)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
        yAxisID: 'y1',
        order: 2,
      },
      {
        label: 'Avg Leaves/Employee',
        data: sortedData.map(item => item.avgLeavesPerEmployee || 0),
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 1,
        yAxisID: 'y',
        order: 3,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    height: 300, // Set explicit height for taller bars
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          boxWidth: 12,
          padding: 15,
          font: {
            size: 11
          },
          usePointStyle: true,
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            const value = context.parsed.y;
            
            if (label.includes('Productivity')) {
              return `${label}: ${value.toFixed(1)}%`;
            } else if (label.includes('Hours')) {
              return `${label}: ${value.toFixed(1)}h`;
            } else {
              return `${label}: ${value.toFixed(1)}`;
            }
          },
          afterLabel: function(context) {
            const item = sortedData[context.dataIndex];
            const datasetLabel = context.dataset.label;
            
            if (datasetLabel === 'Avg Productivity (%)') {
              return `Total Leaves: ${item.totalLeaves || 0}`;
            } else if (datasetLabel === 'Avg Hours') {
              return `Total Hours: ${item.totalWorkedHours?.toFixed(0) || 0}h`;
            } else if (datasetLabel === 'Avg Leaves/Employee') {
              return `Total Employees: ${item.employeeCount || 0}`;
            }
            return '';
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        // Make bars wider
        barPercentage: 0.6,
        categoryPercentage: 0.8
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Productivity (%) & Leaves'
        },
        ticks: {
          stepSize: 20, // Increased for better spacing
          callback: function(value) {
            return value.toFixed(0);
          }
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Hours'
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          callback: function(value) {
            return value.toFixed(0) + 'h';
          }
        }
      }
    }
  };

  // Calculate some stats for info
  const currentYear = new Date().getFullYear();
  const currentYearData = sortedData.find(item => item.year === currentYear);
  const prevYearData = sortedData.find(item => item.year === currentYear - 1);
  
  return (
    <div>
      <div className="h-80"> {/* Increased from h-64 to h-80 */}
        <Bar data={chartData} options={options} />
      </div>
      
      {/* Stats summary */}
      <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
        {currentYearData && (
          <>
            <div className="border rounded p-2 text-center">
              <div className="text-gray-600">{currentYear} Avg Productivity</div>
              <div className={`font-bold ${currentYearData.avgProductivity >= 80 ? 'text-green-600' : currentYearData.avgProductivity >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                {currentYearData.avgProductivity.toFixed(1)}%
              </div>
            </div>
            <div className="border rounded p-2 text-center">
              <div className="text-gray-600">{currentYear} Avg Hours</div>
              <div className="font-bold text-blue-600">
                {currentYearData.avgHours.toFixed(1)}h
              </div>
            </div>
            <div className="border rounded p-2 text-center">
              <div className="text-gray-600">{currentYear} Avg Leaves</div>
              <div className="font-bold text-red-600">
                {currentYearData.avgLeavesPerEmployee.toFixed(1)}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default YearComparisonChart;