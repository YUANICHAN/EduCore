# EduCore Admin Workflow Documentation

## 📋 Complete Admin Workflow (Enhanced System)

This document outlines the step-by-step process for setting up and managing the EduCore system, following proper hierarchical dependencies and validation rules.

---

## 🎯 Step 1: Create Program/Course

**Purpose**: Define educational programs before creating subjects or sections.

**Navigate**: Admin Dashboard → Programs → Add New Program

### Required Fields:
- **Program Name**: e.g., "Bachelor of Science in Information Technology", "Grade 11 - STEM"
- **Program Code**: Short code e.g., "BSIT", "G11-STEM"
- **Level**: Select one:
  - `College`
  - `Senior High`
  - `Junior High`
  - `Elementary`
- **Duration / No. of Years**: e.g., 4 years for college, 2 years for senior high
- **Department** (optional): e.g., "Computer Science Department"
- **Credits Required** (optional): Total credits needed to graduate
- **Description** (optional): Brief program description
- **Status**: `Active` / `Inactive`

### Validation:
✅ Program code must be unique  
✅ Program name is required  
✅ Level is required  

### API Endpoint:
```http
POST /api/programs
```

### Sample Request:
```json
{
  "program_code": "BSIT",
  "program_name": "Bachelor of Science in Information Technology",
  "level": "college",
  "duration_years": 4,
  "credits_required": 120,
  "status": "active"
}
```

**Result**: Program is now available for Subjects & Sections

---

## 📚 Step 2: Create Subjects → Assign to Program

**Purpose**: Define subjects/courses and link them to specific programs.

**Navigate**: Admin Dashboard → Subjects → Add New Subject

### Required Fields:
- **Subject Name**: e.g., "Programming 1", "Calculus"
- **Subject Code**: e.g., "CS101", "MATH101"
- **Subject Type**: Select one:
  - `Major` - Core subject for the program
  - `Minor` - Supporting subject
  - `Elective` - Optional subject
  - `Core` - Required for all programs
- **Units**: Credit units, e.g., 3
- **Credits**: Academic credits
- **Hours per Week**: Lab + Lecture hours, e.g., 5
- **Program**: Select from existing active programs
- **Year Level / Grade Level**: e.g., "1st Year", "Grade 11"
- **Semester**: `1st Semester` / `2nd Semester` / `Summer`
- **Prerequisites** (optional): Select subjects that must be completed first
- **Status**: `Active` / `Inactive`

### Validation:
✅ Subject code must be unique  
✅ Program must exist and be active  
✅ Year level and semester are required  

### API Endpoint:
```http
POST /api/subjects
```

### Sample Request:
```json
{
  "subject_code": "CS101",
  "subject_name": "Introduction to Programming",
  "subject_type": "major",
  "units": 3,
  "credits": 3,
  "hours_per_week": 5,
  "program_id": 1,
  "grade_level": "1st Year",
  "semester": "1st",
  "is_required": true,
  "prerequisites": [],
  "status": "active"
}
```

**Result**: Subject now appears in the Program's curriculum

---

## 📅 Step 3: Set School Year & Grading Periods

**Purpose**: Define the academic year and its grading periods for managing schedules and grades.

### A. Create School Year / Academic Year

**Navigate**: Admin Dashboard → Academic Years → Add New School Year

#### Required Fields:
- **School Year**: e.g., "2024-2025"
- **Year Code**: e.g., "SY2024-2025"
- **Start Date**: e.g., August 15, 2024
- **End Date**: e.g., May 30, 2025
- **Semester**: `1st Semester` / `2nd Semester` / `Summer`
- **Set as Current/Active?**: `Yes` / `No`
- **Status**: `Active` / `Inactive` / `Completed`

### B. Create Grading Periods

**Navigate**: Admin Dashboard → Settings → Grading Periods → Create Periods

#### Required Fields (per period):
- **Period Name**: e.g., "1st Quarter", "Midterm", "1st Semester"
- **Period Type**: `Quarter` / `Semester` / `Term`
- **Period Number**: 1, 2, 3, or 4
- **Start Date**: Beginning of period
- **End Date**: End of period
- **Status**: Default is `Locked`
  - `Locked` - Teachers cannot encode grades
  - `Open` - Teachers can encode grades
  - `Closed` - Period finalized, grades locked permanently

### Validation:
✅ Cannot have overlapping date ranges  
✅ Only one period can be "Open" at a time  
✅ Cannot delete period with recorded grades  

### API Endpoints:
```http
POST /api/academic-years
POST /api/grading-periods
POST /api/grading-periods/bulk-create
```

### Sample Grading Period Setup:
```json
{
  "academic_year_id": 1,
  "period_type": "quarter",
  "periods": [
    {
      "period_name": "1st Quarter",
      "period_number": 1,
      "start_date": "2024-08-15",
      "end_date": "2024-10-31"
    },
    {
      "period_name": "2nd Quarter",
      "period_number": 2,
      "start_date": "2024-11-01",
      "end_date": "2025-01-15"
    },
    {
      "period_name": "3rd Quarter",
      "period_number": 3,
      "start_date": "2025-01-16",
      "end_date": "2025-03-31"
    },
    {
      "period_name": "4th Quarter",
      "period_number": 4,
      "start_date": "2025-04-01",
      "end_date": "2025-05-30"
    }
  ]
}
```

### Managing Grading Periods:

**Open Period** (Allow grade encoding):
```http
POST /api/grading-periods/{id}/open
```

**Lock Period** (Prevent grade encoding):
```http
POST /api/grading-periods/{id}/lock
```

**Close Period** (Finalize permanently):
```http
POST /api/grading-periods/{id}/close
```

**Result**: School Year & Periods are ready for sections and enrollment

---

## 🏫 Step 4: Create Sections → Link to Program + School Year

**Purpose**: Create class sections that will hold students.

**Navigate**: Admin Dashboard → Sections → Create Section

### Required Fields:
- **Section Name/Code**: e.g., "BSIT 1-A", "Grade 7 - Rizal"
- **Program**: Select from existing programs
- **Year Level / Grade Level**: e.g., "1st Year", "Grade 7"
- **School Year**: Select active school year
- **Room** (optional): e.g., "Room 301"
- **Max Capacity**: e.g., 40 students
- **Adviser** (optional): Assign a teacher as class adviser
- **Status**: `Active` / `Inactive`

### Validation:
✅ Program must exist and be active  
✅ Academic year must be active  
✅ Section code must be unique  

### API Endpoint:
```http
POST /api/sections
```

### Sample Request:
```json
{
  "section_code": "BSIT-1A",
  "program_id": 1,
  "grade_level": "1st Year",
  "academic_year_id": 1,
  "capacity": 40,
  "room_number": "CS Lab 1",
  "status": "active"
}
```

**Result**: Section is now available for:
- Teacher assignment (Step 5)
- Student enrollment (Step 7)

---

## 👨‍🏫 Step 5: Add Teachers → Assign to Subject + Section

**Purpose**: Create teacher profiles and assign them to classes (teacher load).

### A. Create Teacher Profile

**Navigate**: Admin Dashboard → Teachers → Add New Teacher

#### Required Fields:
- **Full Name**: First and Last name
- **Employee ID**: Unique identifier
- **Email**: For login
- **Contact Number**
- **Department** (optional)
- **Specialization** (optional): e.g., "Computer Science"
- **Hire Date**
- **Employment Status**: `Active` / `On Leave` / `Inactive`

### B. Assign Teacher to Classes (Teacher Load)

**Navigate**: Admin Dashboard → Classes → Create Class / Assign Teacher

#### Required Fields:
- **Subject**: Select from program curriculum
- **Section**: Select target section
- **Teacher**: Select teacher to assign
- **Academic Year**: Auto-filled from section
- **Schedule**: Day & Time (optional at this stage)
- **Capacity**: Max students for this class
- **Status**: `Active`

### Validation:
✅ Cannot assign same teacher to overlapping schedules  
✅ Subject must belong to section's program  
✅ Section must have active academic year  

### API Endpoint:
```http
POST /api/classes
```

### Sample Request:
```json
{
  "subject_id": 5,
  "teacher_id": 2,
  "section_id": 3,
  "academic_year_id": 1,
  "schedule": [
    {"day": "Monday", "start_time": "09:00", "end_time": "11:00"},
    {"day": "Wednesday", "start_time": "09:00", "end_time": "11:00"}
  ],
  "capacity": 40,
  "status": "active"
}
```

### View Teacher Workload:

**Navigate**: Admin Dashboard → Teachers → Teacher Workload

Shows:
- Number of sections assigned
- Number of subjects assigned
- Total units/hours per week
- Schedule conflicts (if any)

**API Endpoint**:
```http
GET /api/teachers/{teacher_id}/workload
```

**Result**: Teacher can now see assigned classes in their account

---

## 👨‍🎓 Step 6: Add Students → Assign to Program

**Purpose**: Create student profiles and link them to a program.

**Navigate**: Admin Dashboard → Students → Add New Student

### Required Fields:
- **Student Number**: Unique ID (can auto-generate)
- **Full Name**: First and Last name
- **Date of Birth** (optional)
- **Age** (optional)
- **Gender**
- **Email**: For login
- **Contact Info**: Phone number
- **Address**
- **Guardian Info** (optional): Emergency contact
- **Program**: Select from active programs
- **Year Level / Grade Level**: e.g., "1st Year"
- **Student Type**: Select one:
  - `New` - First-time enrollee
  - `Transferee` - From another school
  - `Returnee` - Previously enrolled, returning
  - `Old` - Continuing student
- **Account Status**: `Active` / `Inactive`
- **Profile Photo** (optional)

### Validation:
✅ Student number must be unique  
✅ Email must be unique  
✅ Program must exist and be active  
✅ Creates user account automatically  

### API Endpoint:
```http
POST /api/students
```

### Sample Request:
```json
{
  "student_number": "2024-00001",
  "first_name": "Juan",
  "last_name": "Dela Cruz",
  "date_of_birth": "2005-05-15",
  "email": "juan.delacruz@student.edu",
  "phone": "09123456789",
  "address": "Manila, Philippines",
  "program_id": 1,
  "grade_level": "1st Year",
  "student_type": "new",
  "academic_year_id": 1,
  "password": "defaultPassword123",
  "account_status": "active"
}
```

**Result**: 
- Student profile created
- User login account created
- Student linked to Program
- **NOT yet enrolled in a section** (enrollment_status = "unassigned")

---

## 📝 Step 7: Enroll Students → Assign to Section (Auto-load Subjects)

**Purpose**: Enroll students in sections and automatically enroll them in all subjects.

**Navigate**: Admin Dashboard → Enrollments → Enroll Student

### Workflow:

1. **Search & Select Student**
   - System shows unassigned students or students in selected program

2. **System Auto-Checks**:
   - ✅ Student is Active?
   - ✅ Student has Program assigned?
   - ✅ Active School Year exists?

3. **Fill Enrollment Details**:
   - **School Year**: Auto-filled from active year
   - **Program**: Auto-filled from student's program
   - **Year Level / Grade Level**: Pre-filled
   - **Select Section**: Filtered by:
     - Same Program
     - Same Year Level
     - Active Status
     - Available Slots

4. **Section Validation**:
   - ✅ Section under same Program?
   - ✅ Section has available slots?
   - ✅ Student not already enrolled in this section?
   - ✅ Student not enrolled in another section for same year?

5. **Auto-Load Subjects**:
   System automatically finds subjects based on:
   - Student's Program
   - Year Level
   - Current Semester
   - Active Status

6. **Create Class Enrollments**:
   For each subject found:
   - Finds corresponding class in the section
   - Checks class capacity
   - Creates enrollment record
   - Updates enrolled count

7. **Review Before Confirm**:
   - Shows list of subjects to be enrolled
   - Option to add/remove elective subjects
   - Confirms total units

8. **Confirm Enrollment**

### System Records:
- ✅ Section Enrollment (Student → Section → Academic Year)
- ✅ Class Enrollments (Student → Each Class/Subject)
- ✅ Updates student status to "enrolled"
- ✅ Updates section enrolled count

### Validation Rules:
✅ Student must have active status  
✅ Section must have available slots  
✅ Cannot enroll twice in same section  
✅ Cannot enroll in multiple sections in same academic year  
✅ Program must match between student and section  

### API Endpoint:
```http
POST /api/section-enrollments
```

### Sample Request:
```json
{
  "student_id": 15,
  "section_id": 3,
  "enrollment_date": "2024-08-15"
}
```

### Sample Response:
```json
{
  "success": true,
  "message": "Student enrolled successfully",
  "data": {
    "section_enrollment": {
      "id": 42,
      "student_id": 15,
      "section_id": 3,
      "status": "enrolled"
    },
    "enrolled_classes_count": 8,
    "enrolled_classes": [
      {
        "subject_code": "CS101",
        "subject_name": "Programming 1",
        "class_code": "BSIT1A-CS101"
      },
      {
        "subject_code": "MATH101",
        "subject_name": "Calculus 1",
        "class_code": "BSIT1A-MATH101"
      }
    ],
    "total_subjects": 8
  }
}
```

**Result**: Student can now:
- ✅ See enrolled subjects in their dashboard
- ✅ Appear in teacher's class lists
- ✅ Receive grades per subject per grading period
- ✅ View schedule and announcements

---

## 🔒 Validation Rules Throughout System

### Program Level:
| Rule | Description |
|------|-------------|
| ✅ Must exist before Subjects | Cannot create subject without program |
| ✅ Must exist before Sections | Cannot create section without program |
| ✅ Must be active for new entries | Cannot assign inactive program |

### Subject Level:
| Rule | Description |
|------|-------------|
| ✅ Must be assigned to Program | Every subject belongs to a program |
| ✅ Must be active before classes | Cannot create class from inactive subject |
| ✅ Prerequisites validation | (Future enhancement) |

### School Year & Grading Periods:
| Rule | Description |
|------|-------------|
| ✅ Must be Active before sections | Sections require active school year |
| ✅ Must be Active before enrollment | Cannot enroll without active year |
| ✅ Only one grading period can be Open | Teachers can only encode grades in open period |
| ✅ Closed periods lock all grades | Cannot modify grades in closed periods |

### Section Level:
| Rule | Description |
|------|-------------|
| ✅ Must have available slots | Check capacity before enrollment |
| ✅ Must belong to active program | Program validation required |
| ✅ Must have active academic year | Tied to specific school year |

### Teacher Assignment:
| Rule | Description |
|------|-------------|
| ✅ Must be assigned before grade encoding | Teacher must handle class to encode grades |
| ✅ No schedule conflicts | Cannot assign overlapping schedules |
| ✅ Subject matches section program | Validation on assignment |

### Student Level:
| Rule | Description |
|------|-------------|
| ✅ Must have Program before enrollment | Program assignment required first |
| ✅ Must be Active | Inactive students cannot enroll |
| ✅ Cannot enroll twice | Same section, same academic year check |
| ✅ Cannot enroll in multiple sections | One section per academic year |

### Enrollment Level:
| Rule | Description |
|------|-------------|
| ✅ Program match validation | Student's program must match section's program |
| ✅ Section capacity check | Available slots validation |
| ✅ Duplicate enrollment prevention | Unique constraint enforced |
| ✅ Auto-load subjects | Based on program curriculum |

---

## 📊 Database Schema Overview

### New Tables Added:

1. **grading_periods**
   - Links to academic_years
   - Manages quarter/semester periods
   - Controls grade encoding (open/locked/closed)

2. **section_enrollments**
   - Primary enrollment record
   - Student → Section → Academic Year
   - Triggers auto-loading of subjects

### Enhanced Tables:

1. **programs** - Added `level` field
2. **subjects** - Added `subject_type` and `hours_per_week`
3. **students** - Added `student_type`, `date_of_birth`, `age`
4. **enrollments** - Added `section_enrollment_id` link
5. **grades** - Added `grading_period_id` link

---

## 🚀 Quick Start Checklist

- [ ] 1. Create Programs (with levels)
- [ ] 2. Create Subjects for each Program
- [ ] 3. Set up Academic Year
- [ ] 4. Create Grading Periods for Academic Year
- [ ] 5. Create Sections for Programs
- [ ] 6. Add Teachers
- [ ] 7. Assign Teachers to Classes (Subject + Section)
- [ ] 8. Add Students to Programs
- [ ] 9. Enroll Students in Sections (auto-loads subjects)
- [ ] 10. Open Grading Period when ready for grade encoding

---

## 📞 Support

For issues or questions about the workflow, contact your system administrator.

---

**Version**: 2.0  
**Last Updated**: March 4, 2026  
**System**: EduCore - Enhanced Education Management System
