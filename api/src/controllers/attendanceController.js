const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const Helpers = require('../utils/helpers');
const moment = require('moment');

exports.getDashboardData = async (req, res) => {
  try {
    const currentDate = moment();
    const currentMonthYear = Helpers.getMonthYear(currentDate);
    
    const prevDate = moment().subtract(1, 'month');
    const prevMonthYear = Helpers.getMonthYear(prevDate);

    // Get data for both months
    const [currentData, prevData] = await Promise.all([
      Attendance.find({ monthYear: currentMonthYear }),
      Attendance.find({ monthYear: prevMonthYear })
    ]);

    // Function to calculate statistics
    const calculateStats = (data, monthYear) => {
      if (!data || data.length === 0) {
        return {
          monthYear,
          hasData: false,
          statistics: [],
          totalRecords: 0,
          totalEmployees: 0
        };
      }

      const employees = [...new Set(data.map(d => d.employeeName))];
      const statistics = employees.map(employeeName => {
        const employeeData = data.filter(d => d.employeeName === employeeName);
        const totalExpectedHours = employeeData.reduce((sum, d) => sum + d.expectedHours, 0);
        const totalWorkedHours = employeeData.reduce((sum, d) => sum + d.workedHours, 0);
        const leavesTaken = employeeData.filter(d => d.isLeave && !d.isHoliday).length;
        const productivity = totalExpectedHours > 0 ? 
          (totalWorkedHours / totalExpectedHours) * 100 : 0;

        return {
          employeeName,
          totalExpectedHours: parseFloat(totalExpectedHours.toFixed(2)),
          totalWorkedHours: parseFloat(totalWorkedHours.toFixed(2)),
          leavesTaken,
          leavesAllowed: 2,
          productivity: parseFloat(productivity.toFixed(2))
        };
      });

      return {
        monthYear,
        hasData: true,
        statistics,
        totalRecords: data.length,
        totalEmployees: employees.length
      };
    };

    const currentMonthStats = calculateStats(currentData, currentMonthYear);
    const previousMonthStats = calculateStats(prevData, prevMonthYear);

    res.json({
      currentMonth: currentMonthStats,
      previousMonth: previousMonthStats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard data',
      message: error.message
    });
  }
};

exports.getMonthlyData = async (req, res) => {
  try {
    const { year, month } = req.params;
    
    if (!year || !month) {
      return res.status(400).json({
        error: 'Missing parameters',
        message: 'Year and month are required'
      });
    }

    const monthYear = `${year}-${String(month).padStart(2, '0')}`;
    
    const attendanceData = await Attendance.find({ monthYear })
      .sort({ employeeName: 1, date: 1 })
      .lean();

    if (!attendanceData || attendanceData.length === 0) {
      return res.status(404).json({
        error: 'No data found',
        message: `No attendance data found for ${monthYear}`,
        monthYear
      });
    }

    const employees = [...new Set(attendanceData.map(d => d.employeeName))];
    const statistics = employees.map(employeeName => {
      const employeeData = attendanceData.filter(d => d.employeeName === employeeName);
      const totalExpectedHours = employeeData.reduce((sum, d) => sum + d.expectedHours, 0);
      const totalWorkedHours = employeeData.reduce((sum, d) => sum + d.workedHours, 0);
      const leavesTaken = employeeData.filter(d => d.isLeave && !d.isHoliday).length;
      const productivity = totalExpectedHours > 0 ? 
        (totalWorkedHours / totalExpectedHours) * 100 : 0;

      return {
        employeeName,
        totalExpectedHours: parseFloat(totalExpectedHours.toFixed(2)),
        totalWorkedHours: parseFloat(totalWorkedHours.toFixed(2)),
        leavesTaken,
        leavesAllowed: 2,
        productivity: parseFloat(productivity.toFixed(2)),
        dailyBreakdown: employeeData.map(d => ({
          date: Helpers.formatDate(d.date),
          day: d.dayOfWeek,
          workedHours: d.workedHours,
          isLeave: d.isLeave,
          isHoliday: d.isHoliday,
          expectedHours: d.expectedHours,
          inTime: d.inTime,
          outTime: d.outTime,
          status: d.status
        }))
      };
    });

    res.json({
      success: true,
      monthYear,
      statistics,
      summary: {
        totalRecords: attendanceData.length,
        totalEmployees: employees.length,
        month: parseInt(month),
        year: parseInt(year)
      }
    });

  } catch (error) {
    console.error('Monthly data error:', error);
    res.status(500).json({
      error: 'Failed to fetch monthly data',
      message: error.message
    });
  }
};

exports.getAllMonths = async (req, res) => {
  try {
    const months = await Attendance.aggregate([
      {
        $group: {
          _id: "$monthYear",
          recordCount: { $sum: 1 },
          employeeCount: { $addToSet: "$employeeName" },
          lastUpdated: { $max: "$updatedAt" }
        }
      },
      {
        $project: {
          monthYear: "$_id",
          recordCount: 1,
          employeeCount: { $size: "$employeeCount" },
          lastUpdated: 1,
          _id: 0
        }
      },
      { $sort: { monthYear: -1 } }
    ]);

    res.json({
      success: true,
      months,
      totalMonths: months.length
    });

  } catch (error) {
    console.error('Get months error:', error);
    res.status(500).json({
      error: 'Failed to fetch months',
      message: error.message
    });
  }
};

exports.getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find()
      .sort({ name: 1 })
      .select('name employeeId email department leavesPerMonth createdAt')
      .lean();

    res.json({
      success: true,
      employees,
      totalEmployees: employees.length
    });

  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({
      error: 'Failed to fetch employees',
      message: error.message
    });
  }
};