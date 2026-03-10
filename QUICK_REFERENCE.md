# 🎓 EduCore Admin Quick Reference Card

## 📋 7-Step Setup Workflow

```
1️⃣ PROGRAMS        →  2️⃣ SUBJECTS      →  3️⃣ SCHOOL YEAR
      ↓                    ↓                    ↓
   (Level)           (Subject Type)      (Grading Periods)
      ↓                    ↓                    ↓
4️⃣ SECTIONS        →  5️⃣ TEACHERS      →  6️⃣ STUDENTS
      ↓                    ↓                    ↓
 (Assign to          (Assign to          (Assign to
  Program +           Subject +            Program +
  School Year)        Section)            Student Type)
      ↓                    ↓                    ↓
            7️⃣ ENROLLMENT ← Auto-loads Subjects!
```

---

## 🔑 Essential Fields Guide

### Programs
- ✅ Program Code (unique)
- ✅ Program Name
- ✅ **Level**: College | Senior High | Junior High | Elementary
- Status: Active | Inactive

### Subjects
- ✅ Subject Code (unique)
- ✅ Subject Name
- ✅ **Subject Type**: Major | Minor | Elective | Core
- ✅ Units + Hours per Week
- ✅ Assign to Program + Year Level + Semester

### School Year (Academic Year)
- ✅ Year Code (e.g., "2024-2025")
- ✅ Start Date + End Date
- ✅ Set as Current/Active
- ✅ Create Grading Periods after

### Grading Periods
- ✅ Period Name (e.g., "1st Quarter")
- ✅ Period Type: Quarter | Semester | Term
- ✅ Period Number: 1, 2, 3, or 4
- ✅ Date Range
- ✅ **Status**:
  - 🔒 Locked = Cannot encode grades
  - 🔓 Open = Can encode grades
  - ✖️ Closed = Finalized forever

### Sections
- ✅ Section Code (unique)
- ✅ Assign to Program
- ✅ Year Level (must match program curriculum)
- ✅ Academic Year (must be active)
- ✅ Max Capacity (e.g., 40 students)
- Room + Adviser (optional)

### Teachers
- ✅ Full Name + Employee ID
- ✅ Email (for login)
- ✅ Department + Specialization
- **Assign to Classes**: Subject + Section

### Students
- ✅ Student Number (unique)
- ✅ Full Name + Email
- ✅ **Student Type**: New | Transferee | Returnee | Old
- ✅ Date of Birth + Age
- ✅ Assign to Program + Year Level
- ✅ Status: Active

### Enrollment
- ✅ Select Student (must have program)
- ✅ Select Section (must match program + year level)
- ⚡ System auto-loads all subjects!
- ⚡ System auto-enrolls in all classes!

---

## ✅ Validation Checklist

Before creating:

| Action | Requirements |
|--------|-------------|
| **Subject** | Program must exist & be active |
| **Section** | Program + Academic Year must be active |
| **Teacher Assignment** | Subject + Section + Teacher must exist |
| **Student** | Program must exist & be active |
| **Enrollment** | Student must have program, Section must have slots |

---

## 🔒 Grading Period Management

### Status Flow:
```
Locked (default) → Open (teachers can encode) → Closed (finalized)
       ↓                    ↓                         ↓
   Cannot encode      Can encode grades      Cannot modify ever
```

### Actions:
- **Open Period**: `/api/grading-periods/{id}/open`
- **Lock Period**: `/api/grading-periods/{id}/lock`
- **Close Period**: `/api/grading-periods/{id}/close` (permanent!)

⚠️ **Important**: Only ONE period can be "Open" at a time!

---

## 🚨 Common Errors & Solutions

| Error | Solution |
|-------|----------|
| "Program not found" | Create program first |
| "Section has no available slots" | Increase capacity or create new section |
| "Student already enrolled" | Check if already in a section this year |
| "Another period is already open" | Lock/close other period first |
| "Program must be active" | Set program status to active |
| "No active academic year" | Create and activate academic year |

---

## 📊 Quick Status Reference

### Program Level Options:
- 🎓 `college` - University/College programs
- 🏫 `senior_high` - Grade 11-12
- 🏫 `junior_high` - Grade 7-10
- 🏫 `elementary` - Grade 1-6

### Subject Type Options:
- 📘 `major` - Core program subject
- 📙 `minor` - Supporting subject
- 📗 `elective` - Optional/choice subject
- 📕 `core` - Required for all

### Student Type Options:
- 🆕 `new` - First-time enrollee
- 🔄 `transferee` - From another school
- 🔙 `returnee` - Previously enrolled
- 📚 `old` - Continuing student

### Enrollment Status:
- ✅ `enrolled` - Currently enrolled
- ❌ `dropped` - Withdrawn from section
- 🔄 `transferred` - Moved to another section
- ✔️ `completed` - Finished successfully

---

## 🎯 Best Practices

1. **Always set up in order**:
   Programs → Subjects → Year → Sections → Teachers → Students → Enroll

2. **Keep one academic year active** at a time

3. **Open one grading period** at a time for encoding

4. **Check section capacity** before bulk enrollment

5. **Validate student program** matches section program

6. **Assign teachers** before opening grading period

7. **Lock periods** when grade encoding is complete

8. **Never delete** records with dependencies (drop/deactivate instead)

---

## 📞 Quick API Reference

### Grading Periods
```
GET    /api/grading-periods/current         - Current year's periods
POST   /api/grading-periods/{id}/open       - Open for encoding
POST   /api/grading-periods/{id}/lock       - Lock encoding
POST   /api/grading-periods/{id}/close      - Close permanently
```

### Section Enrollment
```
POST   /api/section-enrollments             - Enroll student (auto-loads subjects)
POST   /api/section-enrollments/bulk-enroll - Bulk enroll multiple students
POST   /api/section-enrollments/{id}/drop   - Drop student from section
```

### Teacher Workload
```
GET    /api/teachers/{id}/workload          - View teacher's load
POST   /api/teachers/{id}/assign-class      - Assign to class
```

---

## 💡 Pro Tips

✨ **Bulk Create Periods**: Use bulk-create API to create all quarters at once

✨ **Bulk Enroll**: Select multiple students to enroll in same section

✨ **Check Workload**: Review teacher workload before assigning more classes

✨ **Preview Enrollment**: System shows which subjects will be loaded before confirming

✨ **Section Capacity**: Set realistic capacity (consider room size + teacher load)

---

## 🔍 Where to Find Things

| Feature | Location |
|---------|----------|
| Programs | Admin → Programs |
| Subjects | Admin → Subjects |
| Academic Years | Admin → Settings → School Year |
| Grading Periods | Admin → Settings → Grading Periods |
| Sections | Admin → Sections |
| Teachers | Admin → Teachers |
| Teacher Workload | Admin → Teachers → Workload |
| Students | Admin → Students |
| Enrollment | Admin → Enrollment |

---

## 📖 Full Documentation

- **ADMIN_WORKFLOW_GUIDE.md** - Complete workflow with examples
- **IMPLEMENTATION_GUIDE.md** - Technical setup & migration
- **ENHANCEMENT_SUMMARY.md** - What changed & why

---

**Need Help?** Check the full guides or contact your system administrator.

**Version**: 2.0  
**Last Updated**: March 4, 2026  
**System**: EduCore Enhanced
