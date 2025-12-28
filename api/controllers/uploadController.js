const ExcelJS = require('exceljs');
const moment = require('moment');
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const Helpers = require('../utils/helpers');

exports.uploadAttendance = async (req, res) => {
  try {
    const { month, year, override } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        error: 'No file provided',
        message: 'Please select an Excel file to upload'
      });
    }

    if (!month || !year) {
      return res.status(400).json({
        error: 'Missing parameters',
        message: 'Month and year are required'
      });
    }

    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({
        error: 'Invalid month',
        message: 'Month must be between 1 and 12'
      });
    }

    const monthYear = `${year}-${String(month).padStart(2, '0')}`;
    
    // Check if data already exists
    const existingData = await Attendance.findOne({ monthYear });
    
    if (existingData && override !== 'true') {
      return res.status(409).json({
        error: 'Data already exists',
        message: `Attendance data for ${monthYear} already exists. Use override=true to replace.`,
        monthYear
      });
    }

    // Parse Excel file
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    
    const worksheet = workbook.worksheets[0];
    const attendanceData = [];
    const employeesMap = new Map();

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header row

      try {
        const employeeName = row.getCell(1).value;
        const dateValue = row.getCell(2).value;
        const inTime = row.getCell(3).value;
        const outTime = row.getCell(4).value;

        if (!employeeName || !dateValue) return;

        // Parse date correctly from Excel
        let parsedDate;
        
        if (dateValue instanceof Date) {
          // Excel gives us a JavaScript Date object
          // Extract year, month, day WITHOUT timezone conversion
          const year = dateValue.getFullYear();
          const month = dateValue.getMonth(); // 0-indexed
          const day = dateValue.getDate();
          
          // Create UTC date at midnight
          parsedDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
          
          console.log(`Row ${rowNumber}: Excel date=${dateValue.toISOString()}, Parsed UTC=${parsedDate.toISOString()}`);
        } else if (typeof dateValue === 'string') {
          // If it's a string, parse different formats
          const formats = ['YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY', 'DD-MM-YYYY'];
          const momentDate = moment(dateValue, formats, true);
          
          if (momentDate.isValid()) {
            parsedDate = new Date(Date.UTC(
              momentDate.year(),
              momentDate.month(),
              momentDate.date(),
              0, 0, 0, 0
            ));
          } else {
            console.error(`Invalid date string for row ${rowNumber}:`, dateValue);
            return;
          }
        } else if (typeof dateValue === 'number') {
          // Excel serial date number
          // Excel date serial starts from 1899-12-30
          const excelEpoch = new Date(Date.UTC(1899, 11, 30, 0, 0, 0));
          const days = Math.floor(dateValue);
          parsedDate = new Date(excelEpoch.getTime() + days * 86400000);
          
          console.log(`Row ${rowNumber}: Excel serial=${dateValue}, Parsed=${parsedDate.toISOString()}`);
        } else {
          console.error(`Unknown date type for row ${rowNumber}:`, typeof dateValue, dateValue);
          return;
        }

        if (!parsedDate || isNaN(parsedDate.getTime())) {
          console.error(`Failed to parse date for row ${rowNumber}:`, dateValue);
          return;
        }

        // Get day name from UTC date
        const dayOfWeek = moment.utc(parsedDate).format('dddd');
        const isWeekend = dayOfWeek === 'Saturday' || dayOfWeek === 'Sunday';
        const isHoliday = dayOfWeek === 'Sunday';
        
        let isLeave = false;
        let workedHours = 0;
        let status = 'Present';

        if (isHoliday) {
          status = 'Holiday';
        } else if (isWeekend && dayOfWeek === 'Sunday') {
          status = 'Weekend';
        } else {
          if (!inTime || !outTime) {
            isLeave = true;
            status = 'Leave';
          } else {
            workedHours = Helpers.calculateWorkedHours(inTime, outTime);
            if (workedHours === 0) {
              isLeave = true;
              status = 'Leave';
            }
          }
        }

        const expectedHours = Helpers.getExpectedHours(dayOfWeek);

        attendanceData.push({
          employeeName,
          date: parsedDate, // Store as UTC Date
          inTime: inTime || null,
          outTime: outTime || null,
          workedHours,
          isLeave,
          isHoliday,
          dayOfWeek,
          monthYear,
          expectedHours,
          status
        });

        // Track employee
        if (!employeesMap.has(employeeName)) {
          employeesMap.set(employeeName, { name: employeeName });
        }

      } catch (error) {
        console.error(`Error processing row ${rowNumber}:`, error);
      }
    });

    if (attendanceData.length === 0) {
      return res.status(400).json({
        error: 'No valid data',
        message: 'Excel file does not contain valid attendance data'
      });
    }

    // Debug: Log first few records
    console.log('Sample attendance data:');
    attendanceData.slice(0, 3).forEach(record => {
      console.log(`${record.employeeName} - ${record.date.toISOString()} - ${record.dayOfWeek}`);
    });

    // Process employees
    const employees = Array.from(employeesMap.values());
    
    // Find or create employees in database
    for (const employee of employees) {
      let dbEmployee = await Employee.findOne({ name: employee.name });
      if (!dbEmployee) {
        dbEmployee = await Employee.create({
          name: employee.name,
          leavesPerMonth: 2
        });
      }
      
      // Update attendance records with employee ID
      attendanceData.forEach(record => {
        if (record.employeeName === employee.name) {
          record.employeeId = dbEmployee._id;
        }
      });
    }

    // Delete existing data if overriding
    if (existingData && override === 'true') {
      await Attendance.deleteMany({ monthYear });
      console.log(`Deleted existing data for ${monthYear}`);
    }

    // Insert new attendance records
    const insertedRecords = await Attendance.insertMany(attendanceData);
    
    console.log(`✅ Inserted ${insertedRecords.length} records`);

    // Calculate statistics
    const statistics = [];
    for (const [employeeName] of employeesMap) {
      const employeeRecords = attendanceData.filter(r => r.employeeName === employeeName);
      const totalExpectedHours = employeeRecords.reduce((sum, r) => sum + r.expectedHours, 0);
      const totalWorkedHours = employeeRecords.reduce((sum, r) => sum + r.workedHours, 0);
      const leavesTaken = employeeRecords.filter(r => r.isLeave && !r.isHoliday).length;
      const productivity = totalExpectedHours > 0 ? 
        (totalWorkedHours / totalExpectedHours) * 100 : 0;

      statistics.push({
        employeeName,
        totalExpectedHours: parseFloat(totalExpectedHours.toFixed(2)),
        totalWorkedHours: parseFloat(totalWorkedHours.toFixed(2)),
        leavesTaken,
        leavesAllowed: 2,
        productivity: parseFloat(productivity.toFixed(2)),
        dailyBreakdown: employeeRecords
          .sort((a, b) => a.date - b.date) // Sort by date
          .map(r => ({
            date: r.date.toISOString().split('T')[0], // Format as YYYY-MM-DD
            day: r.dayOfWeek,
            workedHours: r.workedHours,
            isLeave: r.isLeave,
            isHoliday: r.isHoliday,
            expectedHours: r.expectedHours,
            inTime: r.inTime,
            outTime: r.outTime,
            status: r.status
          }))
      });
    }

    res.json({
      success: true,
      message: `File uploaded successfully for ${monthYear}`,
      summary: {
        totalRecords: insertedRecords.length,
        totalEmployees: employees.length,
        monthYear
      },
      statistics
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'Upload failed',
      message: error.message
    });
  }
};