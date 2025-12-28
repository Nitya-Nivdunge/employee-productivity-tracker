const moment = require('moment');

class Helpers {
  constructor() {
    this.workdayHours = {
      'Monday': 8.5,
      'Tuesday': 8.5,
      'Wednesday': 8.5,
      'Thursday': 8.5,
      'Friday': 8.5,
      'Saturday': 4,
      'Sunday': 0
    };
  }

  // Calculate worked hours from inTime and outTime
  calculateWorkedHours(inTime, outTime) {
    if (!inTime || !outTime) return 0;
    
    try {
      const inMoment = moment(inTime, 'HH:mm');
      const outMoment = moment(outTime, 'HH:mm');
      
      if (!inMoment.isValid() || !outMoment.isValid()) return 0;
      
      const hours = outMoment.diff(inMoment, 'hours', true);
      return Math.max(0, parseFloat(hours.toFixed(2)));
    } catch (error) {
      console.error('Error calculating hours:', error);
      return 0;
    }
  }

  // Get expected hours for a day
  getExpectedHours(dayOfWeek) {
    return this.workdayHours[dayOfWeek] || 0;
  }

  // Check if date is a weekend
  isWeekend(date) {
    const day = moment(date).day();
    return day === 0 || day === 6;
  }

  // Format date to YYYY-MM-DD
  formatDate(date) {
    return moment(date).format('YYYY-MM-DD');
  }

  // Get month-year string
  getMonthYear(date) {
    return moment(date).format('YYYY-MM');
  }

  // Get day name
  getDayName(date) {
    return moment(date).format('dddd');
  }
}

module.exports = new Helpers();