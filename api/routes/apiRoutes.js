const express = require('express');
const router = express.Router();
const multer = require('multer');
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const uploadController = require('../controllers/uploadController');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel files allowed.'), false);
    }
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Leave & Productivity Analyzer API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// File upload endpoint with proper error handling
router.post('/upload', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({
        error: 'File upload error',
        message: err.message
      });
    }
    // Pass to controller
    uploadController.uploadAttendance(req, res);
  });
});

// Get data for specific month
router.get('/month/:year/:month', async (req, res) => {
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
          date: d.date.toISOString().split('T')[0],
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
});

// GET /api/previous-month/:year/:month
router.get('/previous-month/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;
    
    let prevYear = parseInt(year);
    let prevMonth = parseInt(month) - 1;
    
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear = prevYear - 1;
    }
    
    const monthYear = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
    
    const attendanceData = await Attendance.find({ monthYear })
      .sort({ employeeName: 1, date: 1 })
      .lean();

    if (!attendanceData || attendanceData.length === 0) {
      return res.status(404).json({
        error: 'No data found',
        message: `No attendance data found for ${monthYear}`
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
        productivity: parseFloat(productivity.toFixed(2))
      };
    });
    
    res.json({
      year: prevYear,
      month: prevMonth,
      statistics
    });
    
  } catch (error) {
    console.error('Error fetching previous month data:', error);
    res.status(500).json({ error: 'Failed to fetch previous month data' });
  }
});

// GET /api/year-aggregated/:year
router.get('/year-aggregated/:year', async (req, res) => {
  try {
    const { year } = req.params;

    if (!year || isNaN(year) || year < 2000 || year > new Date().getFullYear() + 1) {
      return res.status(400).json({ error: 'Invalid year' });
    }

    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${parseInt(year) + 1}-01-01`);

    const yearResponse = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lt: endDate }
        }
      },
      {
        $group: {
          _id: { 
            employeeId: "$employeeId",
            employeeName: "$employeeName",
            month: { $month: "$date" }
          },
          totalWorkedHours: { $sum: "$workedHours" },
          leaveDays: { $sum: { $cond: [{ $eq: ["$isLeave", true] }, 1, 0] } },
          expectedHours: { $sum: "$expectedHours" }
        }
      },
      {
        $group: {
          _id: {
            employeeId: "$_id.employeeId",
            employeeName: "$_id.employeeName"
          },
          monthlyData: {
            $push: {
              month: "$_id.month",
              workedHours: "$totalWorkedHours",
              leavesTaken: "$leaveDays",
              expectedHours: "$expectedHours"
            }
          },
          totalWorkedHours: { $sum: "$totalWorkedHours" },
          totalLeavesTaken: { $sum: "$leaveDays" },
          totalExpectedHours: { $sum: "$expectedHours" }
        }
      }
    ]);
    
    if (!yearResponse || yearResponse.length === 0) {
      return res.status(404).json({ error: 'No data found for this year' });
    }
    
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const employees = yearResponse.map(emp => {
      const monthlyProductivity = emp.monthlyData.map(month => ({
        month: month.month,
        productivity: month.expectedHours > 0 
          ? (month.workedHours / month.expectedHours) * 100 
          : 0,
        leavesTaken: month.leavesTaken
      }));

      const validMonths = monthlyProductivity.filter(m => m.productivity > 0);
      const avgProductivity = validMonths.length > 0 
        ? validMonths.reduce((sum, m) => sum + m.productivity, 0) / validMonths.length
        : 0;
      
      let bestMonth = { month: 0, productivity: 0 };
      let worstMonth = { month: 0, productivity: 100 };
      let exceededLimitMonths = 0;
      
      monthlyProductivity.forEach(month => {
        if (month.productivity > bestMonth.productivity) {
          bestMonth = month;
        }
        if (month.productivity < worstMonth.productivity && month.productivity > 0) {
          worstMonth = month;
        }
        if (month.leavesTaken > 2) {
          exceededLimitMonths++;
        }
      });
      
      return {
        employeeId: emp._id.employeeId,
        employeeName: emp._id.employeeName,
        totalWorkedHours: emp.totalWorkedHours,
        totalLeavesTaken: emp.totalLeavesTaken,
        totalLeavesAllowed: monthlyProductivity.length * 2,
        avgProductivity,
        avgMonthlyHours: emp.totalWorkedHours / monthlyProductivity.length,
        exceededLimitMonths,
        bestMonth: bestMonth.productivity > 0 
          ? `${monthNames[bestMonth.month - 1]} (${bestMonth.productivity.toFixed(1)}%)`
          : 'N/A',
        worstMonth: worstMonth.productivity < 100
          ? `${monthNames[worstMonth.month - 1]} (${worstMonth.productivity.toFixed(1)}%)`
          : 'N/A',
        monthlyData: monthlyProductivity
      };
    });
    
    const totalEmployees = employees.length;
    const totalHours = employees.reduce((sum, emp) => sum + emp.totalWorkedHours, 0);
    const totalLeaves = employees.reduce((sum, emp) => sum + emp.totalLeavesTaken, 0);
    const avgProductivity = employees.reduce((sum, emp) => sum + emp.avgProductivity, 0) / totalEmployees;
    const avgHours = totalHours / totalEmployees;
    
    res.json({
      year,
      totalEmployees,
      totalHours,
      totalLeaves,
      avgProductivity,
      avgHours,
      employees,
      monthCount: employees.length > 0 ? employees[0].monthlyData.length : 0
    });
    
  } catch (error) {
    console.error('Error fetching aggregated year data:', error);
    res.status(500).json({ error: 'Failed to fetch aggregated year data' });
  }
});

// GET /api/workforce/:year/:month
router.get('/workforce/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;
    
    if (!year || isNaN(year) || year < 2000 || year > new Date().getFullYear() + 1) {
      return res.status(400).json({ error: 'Invalid year' });
    }
    
    if (!month || isNaN(month) || month < 1 || month > 12) {
      return res.status(400).json({ error: 'Invalid month' });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const dailyData = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lt: endDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            employeeId: "$employeeId",
            employeeName: "$employeeName"
          },
          workedHours: { $sum: "$workedHours" },
          isLeave: { $max: "$isLeave" },
          isHoliday: { $max: "$isHoliday" }
        }
      },
      {
        $group: {
          _id: "$_id.date",
          date: { $first: "$_id.date" },
          employees: {
            $push: {
              employeeId: "$_id.employeeId",
              employeeName: "$_id.employeeName",
              workedHours: "$workedHours",
              isLeave: "$isLeave",
              isHoliday: "$isHoliday"
            }
          }
        }
      },
      { $sort: { date: 1 } }
    ]);

    res.json({
      year: parseInt(year),
      month: parseInt(month),
      dailyBreakdown: dailyData || []
    });

  } catch (error) {
    console.error('Error fetching workforce data:', error);
    res.status(500).json({ error: 'Failed to fetch workforce data' });
  }
});

// GET /api/year-comparison
router.get('/year-comparison', async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const years = [currentYear - 1, currentYear];
    
    const yearData = await Attendance.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(`${years[0]}-01-01`),
            $lt: new Date(`${years[1] + 1}-01-01`)
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            employeeId: "$employeeId"
          },
          totalWorkedHours: { $sum: "$workedHours" },
          leaveDays: { $sum: { $cond: [{ $eq: ["$isLeave", true] }, 1, 0] } },
          expectedHours: { $sum: "$expectedHours" }
        }
      },
      {
        $group: {
          _id: "$_id.year",
          year: { $first: "$_id.year" },
          totalWorkedHours: { $sum: "$totalWorkedHours" },
          totalLeaves: { $sum: "$leaveDays" },
          totalExpectedHours: { $sum: "$expectedHours" },
          employeeCount: { $sum: 1 }
        }
      },
      { $sort: { year: 1 } }
    ]);

    const comparisonData = yearData.map(item => {
      const avgProductivity = item.totalExpectedHours > 0 
        ? (item.totalWorkedHours / item.totalExpectedHours) * 100 
        : 0;
      
      const avgHours = item.employeeCount > 0 
        ? item.totalWorkedHours / item.employeeCount 
        : 0;
      
      const avgLeavesPerEmployee = item.employeeCount > 0 
        ? item.totalLeaves / item.employeeCount 
        : 0;
      
      return {
        year: item.year,
        totalWorkedHours: item.totalWorkedHours,
        totalLeaves: item.totalLeaves,
        employeeCount: item.employeeCount,
        avgProductivity: parseFloat(avgProductivity.toFixed(1)),
        avgHours: parseFloat(avgHours.toFixed(1)),
        avgLeavesPerEmployee: parseFloat(avgLeavesPerEmployee.toFixed(1))
      };
    });

    res.json(comparisonData || []);

  } catch (error) {
    console.error('Error fetching year comparison:', error);
    res.status(500).json({ error: 'Failed to fetch year comparison data' });
  }
});

// GET /api/employees/productivity/:year
router.get('/employees/productivity/:year', async (req, res) => {
  try {
    const { year } = req.params;
    
    if (!year || isNaN(year) || year < 2000 || year > new Date().getFullYear() + 1) {
      return res.status(400).json({ error: 'Invalid year' });
    }

    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${parseInt(year) + 1}-01-01`);

    const productivityData = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lt: endDate }
        }
      },
      {
        $group: {
          _id: {
            employeeId: "$employeeId",
            employeeName: "$employeeName"
          },
          totalWorkedHours: { $sum: "$workedHours" },
          totalExpectedHours: { $sum: "$expectedHours" },
          leaveDays: { $sum: { $cond: [{ $eq: ["$isLeave", true] }, 1, 0] } }
        }
      },
      {
        $project: {
          employeeId: "$_id.employeeId",
          employeeName: "$_id.employeeName",
          totalWorkedHours: 1,
          leaveDays: 1,
          productivity: {
            $cond: [
              { $gt: ["$totalExpectedHours", 0] },
              { $multiply: [{ $divide: ["$totalWorkedHours", "$totalExpectedHours"] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { employeeName: 1 } }
    ]);

    res.json({
      year,
      employees: productivityData
    });
    
  } catch (error) {
    console.error('Error fetching productivity data:', error);
    res.status(500).json({ error: 'Failed to fetch productivity data' });
  }
});

// Get all available months
router.get('/months', async (req, res) => {
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
});

// Get all employees
router.get('/employees', async (req, res) => {
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
});

module.exports = router;