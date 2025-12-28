# NMIMS Intern Technical Assignment – Kenmark ITan Solutions

## Project Task: Leave & Productivity Analyzer (Full Stack)

Build a full-stack web application that analyzes employee attendance, leave usage, and productivity based on an uploaded Excel attendance sheet. The system should follow these business rules: normal working days (Monday to Friday) are 8.5 hours per day with working time from 10:00 AM to 6:30 PM, Saturdays are half days with 4 working hours from 10:00 AM to 2:00 PM, Sundays are off, and each employee is allowed 2 leaves per month. Productivity must be calculated as the ratio of actual worked hours to expected working hours for the selected month.

The application should allow users to upload an Excel (.xlsx) attendance file containing employee details, date, in-time, and out-time. The backend should parse the Excel file, store attendance data in the database, calculate daily worked hours, mark leave days when attendance is missing, and compute monthly totals. A dashboard should display total expected hours, total actual worked hours, leaves used (out of 2), and productivity percentage, along with a daily attendance breakdown.

**Technology stack:** You can use either the preferred tech stack or alternate stacks mentioned below. While we reward slightly higher for the preferred stack, if you are well-versed with any of the alternate stacks/technologies, it won't go overlooked. The final outcome should be a clean, functional Leave & Productivity Analyzer that helps track employee attendance, leave balance, and productivity from Excel data.

---

## Detailed Requirements

### Business Rules

1. **Working Hours:**
   - Monday to Friday: 8.5 hours per day (10:00 AM to 6:30 PM)
   - Saturday: 4 hours (half day from 10:00 AM to 2:00 PM)
   - Sunday: Off (no working hours expected)

2. **Leave Policy:**
   - Each employee is allowed 2 leaves per month
   - Missing attendance on a working day (Monday-Saturday) should be marked as a leave

3. **Productivity Calculation:**
   - Productivity = (Actual Worked Hours / Expected Working Hours) × 100
   - Expected hours should be calculated based on the number of working days in the selected month

### Core Features

1. **Excel File Upload** - Accept .xlsx files with columns: Employee Name/ID, Date, In-Time, Out-Time
2. **Data Processing** - Parse Excel, calculate worked hours, identify leaves, store in database
3. **Dashboard** - Display total expected hours, actual worked hours, leaves used (out of 2), productivity percentage, and daily breakdown
4. **Monthly Analysis** - Select month and view monthly summary

### Preferred Tech Stack

- **Next.js** 16.x
- **Tailwind CSS** 4.x
- **MongoDB**
- **Prisma ORM**
- **TSX** (TypeScript)
- **Excel Parsing:** Use libraries like `xlsx` or `exceljs`

### Alternate Stacks

- **React.js** / **Angular.io** / **Vue.js**
- **Flutter** / **React Native**
- **Node.js Express ORM**
- **MySQL**
- **JSX**

**Note:** While we reward slightly higher for the preferred stack, if you are well-versed with any of the alternate stacks/technologies, it won't go overlooked. Choose the stack you're most comfortable with to deliver the best results.

---

## Deliverables

1. **GitHub Repository** (public) with README.md
2. **Deployed Application** on Netlify or Vercel
3. **Sample Excel File** in repository for testing

---

## Evaluation Criteria

- Functionality (35%) - All features working correctly
- Code Quality (25%) - Clean, maintainable code
- UI/UX (20%) - Clean, responsive interface
- Architecture (15%) - Proper database design and structure
- Documentation (5%) - Clear README

---

## Submission Instructions

1. **Create a GitHub Repository** (make it public)
2. **Deploy on Netlify or Vercel** (get live demo URL)
3. **Submit via Google Form:** [Click here to submit](https://forms.gle/9rQRdKoRBgNnGCsZ6)

**Required in Google Form:**
- Full Name
- Student ID / Roll Number
- Email Address
- Phone Number
- GitHub Repository URL
- Live Demo URL (Netlify/Vercel)

---

## Sample Excel Format

Your application should accept Excel files with the following structure:

| Employee Name | Date       | In-Time | Out-Time |
|---------------|------------|---------|----------|
| John Doe      | 2024-01-01 | 10:00   | 18:30    |
| John Doe      | 2024-01-02 | 10:15   | 18:45    |
| John Doe      | 2024-01-03 |          |          |

Note: Missing in-time/out-time should be treated as a leave day.

---

