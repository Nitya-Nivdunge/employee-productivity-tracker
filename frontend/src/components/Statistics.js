import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Calendar, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const Statistics = ({ data }) => {
  if (!data) return null;

  const getProductivityIcon = (productivity) => {
    if (productivity >= 90) return TrendingUp;
    if (productivity >= 70) return CheckCircle;
    return TrendingDown;
  };

  const getProductivityColor = (productivity) => {
    if (productivity >= 90) return 'text-green-600 bg-green-50';
    if (productivity >= 70) return 'text-blue-600 bg-blue-50';
    return 'text-red-600 bg-red-50';
  };

  const getLeaveColor = (leavesTaken, leavesAllowed) => {
    if (leavesTaken > leavesAllowed) return 'text-red-600 bg-red-50';
    if (leavesTaken === leavesAllowed) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const stats = [
    {
      title: 'Productivity',
      value: `${data.productivity?.toFixed(1) || 0}%`,
      icon: getProductivityIcon(data.productivity),
      color: getProductivityColor(data.productivity),
      description: data.productivity >= 90 ? 'Excellent' : data.productivity >= 70 ? 'Good' : 'Needs improvement'
    },
    {
      title: 'Worked Hours',
      value: `${data.totalWorkedHours?.toFixed(1) || 0}h`,
      subValue: `of ${data.totalExpectedHours?.toFixed(1) || 0}h expected`,
      icon: Clock,
      color: 'text-blue-600 bg-blue-50',
      description: `${((data.totalWorkedHours / data.totalExpectedHours) * 100).toFixed(1)}% of target`
    },
    {
      title: 'Leaves Used',
      value: `${data.leavesTaken || 0}`,
      subValue: `of ${data.leavesAllowed || 2} allowed`,
      icon: data.leavesTaken > data.leavesAllowed ? AlertCircle : Calendar,
      color: getLeaveColor(data.leavesTaken, data.leavesAllowed),
      description: data.leavesTaken > data.leavesAllowed ? 'Over limit' : 'Within limit'
    },
    {
      title: 'Attendance',
      value: `${data.dailyBreakdown?.filter(d => !d.isLeave && !d.isHoliday).length || 0}`,
      subValue: `working days`,
      icon: CheckCircle,
      color: 'text-purple-600 bg-purple-50',
      description: 'Present days count'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <div className="mt-2">
                  <p className={`text-3xl font-bold ${stat.color.split(' ')[0]}`}>
                    {stat.value}
                  </p>
                  {stat.subValue && (
                    <p className="text-sm text-gray-500 mt-1">{stat.subValue}</p>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">{stat.description}</p>
              </div>
              <div className={`p-3 rounded-full ${stat.color.split(' ')[1]}`}>
                <Icon className={`h-6 w-6 ${stat.color.split(' ')[0]}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Statistics;