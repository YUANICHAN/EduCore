# ✅ EduCore Enhancement - Implementation Checklist

Use this checklist to implement the enhanced system step by step.

---

## 🔧 Phase 1: Database Setup

### ☐ Backup Current Database
```bash
cd backend
mysqldump -u username -p database_name > backup_before_enhancement.sql
```

### ☐ Review Migration Files
Check these files exist:
- [ ] `database/migrations/2026_03_04_100000_create_grading_periods_table.php`
- [ ] `database/migrations/2026_03_04_100001_add_level_to_programs_table.php`
- [ ] `database/migrations/2026_03_04_100002_add_subject_type_to_subjects_table.php`
- [ ] `database/migrations/2026_03_04_100003_add_student_type_to_students_table.php`
- [ ] `database/migrations/2026_03_04_100004_create_section_enrollments_table.php`
- [ ] `database/migrations/2026_03_04_100005_add_grading_period_to_enrollments_grades.php`

### ☐ Run Migrations
```bash
php artisan migrate
```

Expected output:
```
Migrating: 2026_03_04_100000_create_grading_periods_table
Migrated:  2026_03_04_100000_create_grading_periods_table (XX ms)
Migrating: 2026_03_04_100001_add_level_to_programs_table
Migrated:  2026_03_04_100001_add_level_to_programs_table (XX ms)
...
```

### ☐ Update Existing Data (If you have data)
```sql
-- Set default level for existing programs
UPDATE programs SET level = 'college' WHERE level IS NULL;

-- Set default subject type for existing subjects
UPDATE subjects SET subject_type = 'core' WHERE subject_type IS NULL;

-- Set default student type for existing students
UPDATE students SET student_type = 'old' WHERE student_type IS NULL;
```

### ☐ Verify Tables Created
```sql
SHOW TABLES LIKE 'grading_periods';
SHOW TABLES LIKE 'section_enrollments';
DESC programs;  -- Should show 'level' column
DESC subjects;  -- Should show 'subject_type' and 'hours_per_week' columns
DESC students;  -- Should show 'student_type', 'date_of_birth', 'age' columns
```

---

## 🔄 Phase 2: Backend Verification

### ☐ Clear All Caches
```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear
composer dump-autoload
```

### ☐ Verify Models Created
Check these files exist:
- [ ] `app/Models/GradingPeriod.php`
- [ ] `app/Models/SectionEnrollment.php`

### ☐ Verify Controllers Created
Check these files exist:
- [ ] `app/Http/Controllers/GradingPeriodController.php`
- [ ] `app/Http/Controllers/SectionEnrollmentController.php`

### ☐ Verify Routes Added
```bash
php artisan route:list | grep grading-periods
php artisan route:list | grep section-enrollments
```

Should show routes like:
```
GET|HEAD   api/grading-periods
POST       api/grading-periods
GET|HEAD   api/grading-periods/current
POST       api/section-enrollments
POST       api/section-enrollments/bulk-enroll
...
```

### ☐ Check for PHP Errors
```bash
php artisan serve
```

Access: http://localhost:8000/api/health

Should return:
```json
{
  "success": true,
  "message": "API is running",
  "timestamp": "2026-03-04T..."
}
```

---

## 🧪 Phase 3: Testing

### ☐ Test 1: Create Program with Level
```bash
curl -X POST http://localhost:8000/api/programs \
  -H "Content-Type: application/json" \
  -d '{
    "program_code": "TEST-BSIT",
    "program_name": "Test Program",
    "level": "college",
    "duration_years": 4,
    "status": "active"
  }'
```

Expected: `"success": true`

### ☐ Test 2: Create Subject with Type
```bash
curl -X POST http://localhost:8000/api/subjects \
  -H "Content-Type: application/json" \
  -d '{
    "subject_code": "TEST101",
    "subject_name": "Test Subject",
    "subject_type": "major",
    "units": 3,
    "credits": 3,
    "hours_per_week": 5,
    "program_id": 1,
    "grade_level": "1st Year",
    "semester": "1st",
    "status": "active"
  }'
```

Expected: `"success": true`

### ☐ Test 3: Create Academic Year
```bash
curl -X POST http://localhost:8000/api/academic-years \
  -H "Content-Type: application/json" \
  -d '{
    "year_code": "TEST-2024-2025",
    "start_date": "2024-08-15",
    "end_date": "2025-05-30",
    "semester": "1st",
    "is_current": true,
    "status": "active"
  }'
```

Expected: `"success": true`

### ☐ Test 4: Create Grading Periods
```bash
curl -X POST http://localhost:8000/api/grading-periods \
  -H "Content-Type: application/json" \
  -d '{
    "academic_year_id": 1,
    "period_name": "1st Quarter",
    "period_type": "quarter",
    "period_number": 1,
    "start_date": "2024-08-15",
    "end_date": "2024-10-31",
    "status": "locked"
  }'
```

Expected: `"success": true`

### ☐ Test 5: Get Grading Periods
```bash
curl http://localhost:8000/api/grading-periods/current
```

Expected: List of grading periods

### ☐ Test 6: Create Section
```bash
curl -X POST http://localhost:8000/api/sections \
  -H "Content-Type: application/json" \
  -d '{
    "section_code": "TEST-1A",
    "program_id": 1,
    "grade_level": "1st Year",
    "academic_year_id": 1,
    "capacity": 40,
    "status": "active"
  }'
```

Expected: `"success": true`

### ☐ Test 7: Create Student with Type
```bash
curl -X POST http://localhost:8000/api/students \
  -H "Content-Type: application/json" \
  -d '{
    "student_number": "TEST-2024-001",
    "first_name": "Test",
    "last_name": "Student",
    "email": "test.student@test.com",
    "program_id": 1,
    "grade_level": "1st Year",
    "student_type": "new",
    "academic_year_id": 1,
    "password": "test123",
    "account_status": "active"
  }'
```

Expected: `"success": true`

### ☐ Test 8: Section Enrollment (Auto-load Subjects)
```bash
curl -X POST http://localhost:8000/api/section-enrollments \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": 1,
    "section_id": 1,
    "enrollment_date": "2024-08-15"
  }'
```

Expected: 
```json
{
  "success": true,
  "message": "Student enrolled successfully",
  "data": {
    "enrolled_classes_count": ...
  }
}
```

---

## 🎨 Phase 4: Frontend Updates (Optional)

### ☐ Create Service Files
- [ ] Create `frontend/src/service/gradingPeriodService.js`
- [ ] Create `frontend/src/service/sectionEnrollmentService.js`
- [ ] Update `frontend/src/service/index.js`

See IMPLEMENTATION_GUIDE.md for complete code.

### ☐ Update Program Form
- [ ] Add "Level" dropdown field
- [ ] Options: College, Senior High, Junior High, Elementary

### ☐ Update Subject Form
- [ ] Add "Subject Type" dropdown field
- [ ] Options: Major, Minor, Elective, Core
- [ ] Add "Hours per Week" number field

### ☐ Update Student Form
- [ ] Add "Student Type" dropdown field
- [ ] Options: New, Transferee, Returnee, Old
- [ ] Add "Date of Birth" date picker
- [ ] Add "Age" number field

### ☐ Create Grading Periods Page (Optional)
- [ ] List grading periods
- [ ] Create/Edit/Delete periods
- [ ] Open/Lock/Close actions
- [ ] Status indicators

### ☐ Update Enrollment Page
- [ ] Use new section enrollment endpoint
- [ ] Show auto-loaded subjects preview
- [ ] Display enrollment summary

---

## 📚 Phase 5: Documentation Review

### ☐ Read Documentation Files
- [ ] Read `ENHANCEMENT_SUMMARY.md` - Overview of changes
- [ ] Read `ADMIN_WORKFLOW_GUIDE.md` - Complete workflow
- [ ] Read `IMPLEMENTATION_GUIDE.md` - Technical details
- [ ] Read `QUICK_REFERENCE.md` - Quick tips

### ☐ Train Admin Users
- [ ] Show new workflow (7 steps)
- [ ] Demonstrate grading period management
- [ ] Explain new enrollment process
- [ ] Cover validation rules

---

## 🚀 Phase 6: Production Deployment

### ☐ Pre-Deployment
- [ ] All tests passing
- [ ] No PHP errors in logs
- [ ] Database backup created
- [ ] Rollback plan ready

### ☐ Deployment
- [ ] Pull code to production server
- [ ] Run `composer install --no-dev`
- [ ] Run migrations: `php artisan migrate --force`
- [ ] Clear caches
- [ ] Update existing data (if needed)
- [ ] Restart PHP/web server

### ☐ Post-Deployment Verification
- [ ] Check API health endpoint
- [ ] Test creating program with level
- [ ] Test creating subject with type
- [ ] Test grading period creation
- [ ] Test section enrollment workflow
- [ ] Review error logs
- [ ] Monitor system for 24 hours

---

## 📊 Phase 7: Data Migration (If Existing Data)

### ☐ Migrate Existing Programs
```sql
-- Review existing programs
SELECT id, program_code, program_name, level FROM programs;

-- Set appropriate levels
UPDATE programs SET level = 'college' WHERE program_code LIKE 'BS%';
UPDATE programs SET level = 'senior_high' WHERE program_name LIKE '%Grade 1%';
-- Add more as needed
```

### ☐ Migrate Existing Subjects
```sql
-- Review existing subjects
SELECT id, subject_code, subject_name, subject_type FROM subjects;

-- Set appropriate types
UPDATE subjects SET subject_type = 'major' WHERE subject_code LIKE 'CS%';
UPDATE subjects SET subject_type = 'core' WHERE subject_name LIKE '%Math%';
-- Add more as needed
```

### ☐ Migrate Existing Students
```sql
-- Set student types based on creation date or other criteria
UPDATE students SET student_type = 'old' WHERE created_at < '2024-01-01';
UPDATE students SET student_type = 'new' WHERE created_at >= '2024-01-01';
```

### ☐ Create Section Enrollments (Optional)
```sql
-- Create section enrollments from existing student-section assignments
INSERT INTO section_enrollments 
  (student_id, section_id, academic_year_id, program_id, year_level, enrollment_date, status, created_at, updated_at)
SELECT 
  s.id,
  s.section_id,
  s.academic_year_id,
  s.program_id,
  s.grade_level,
  s.date_enrolled,
  'enrolled',
  NOW(),
  NOW()
FROM students s
WHERE s.section_id IS NOT NULL
  AND s.enrollment_status = 'enrolled';
```

---

## ✅ Final Verification

### ☐ System Health Check
- [ ] All migrations applied successfully
- [ ] No PHP errors in logs
- [ ] All routes accessible
- [ ] API endpoints responding correctly
- [ ] Frontend (if updated) loads without errors

### ☐ Workflow Verification
- [ ] Can create program with level
- [ ] Can create subject with type assigned to program
- [ ] Can create academic year and grading periods
- [ ] Can create section linked to program + year
- [ ] Can assign teacher to classes
- [ ] Can create student with type assigned to program
- [ ] Can enroll student in section (auto-loads subjects)
- [ ] Validation rules working correctly

### ☐ Documentation
- [ ] Admin users trained on new workflow
- [ ] Documentation accessible to admins
- [ ] Quick reference card distributed

---

## 🎉 Completion

Once all checkboxes are complete:

✅ **Your EduCore system is now enhanced and ready!**

The system now properly enforces:
- ✅ Hierarchical dependencies (Program → Subject → Section → Enrollment)
- ✅ Comprehensive validation rules
- ✅ Grading period management with encoding control
- ✅ Proper enrollment workflow with auto-loading subjects
- ✅ Multiple education level support
- ✅ Better data integrity and capacity management

---

## 🐛 Troubleshooting

If you encounter issues:

1. **Check logs**:
   - Backend: `backend/storage/logs/laravel.log`
   - Database: MySQL error log

2. **Clear everything**:
   ```bash
   php artisan config:clear
   php artisan cache:clear
   php artisan route:clear
   composer dump-autoload
   ```

3. **Verify migrations**:
   ```bash
   php artisan migrate:status
   ```

4. **Review documentation**:
   - IMPLEMENTATION_GUIDE.md has troubleshooting section

5. **Test endpoints individually**:
   - Use Postman or curl to test each endpoint

---

## 📞 Need Help?

If you get stuck:
- ✅ Review error messages in logs
- ✅ Check database for missing tables/columns
- ✅ Verify all files were created correctly
- ✅ Ensure code is properly formatted (no syntax errors)
- ✅ Try rollback and re-run migrations

---

**Version**: 2.0  
**Status**: Ready for Implementation  
**Date**: March 4, 2026
