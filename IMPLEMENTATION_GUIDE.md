# EduCore System - Implementation & Migration Guide

## 🔧 Installation Guide

### Prerequisites
- PHP 8.1+
- MySQL 5.7+ / MariaDB 10.3+
- Composer
- Node.js 16+

### Backend Setup

1. **Run Database Migrations**

```bash
cd backend
php artisan migrate
```

This will create/update the following:
- `grading_periods` table
- Add `level` to `programs` table
- Add `subject_type` and `hours_per_week` to `subjects` table
- Add `student_type`, `date_of_birth`, `age` to `students` table
- Create `section_enrollments` table
- Add foreign keys to `grades` and `enrollments` tables

2. **Clear Cache**

```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
```

3. **Restart Development Server**

```bash
php artisan serve
```

### API Routes Added

#### Grading Periods Management
```
GET    /api/grading-periods                      - List all grading periods
POST   /api/grading-periods                      - Create grading period
GET    /api/grading-periods/{id}                 - Get grading period details
PUT    /api/grading-periods/{id}                 - Update grading period
DELETE /api/grading-periods/{id}                 - Delete grading period
GET    /api/grading-periods/current              - Get current academic year's periods
GET    /api/grading-periods/current-period       - Get currently open period
POST   /api/grading-periods/bulk-create          - Create multiple periods at once
POST   /api/grading-periods/{id}/open            - Open period for grade encoding
POST   /api/grading-periods/{id}/lock            - Lock period (prevent encoding)
POST   /api/grading-periods/{id}/close           - Close period permanently
```

#### Section Enrollments (New Workflow)
```
GET    /api/section-enrollments                  - List all section enrollments
POST   /api/section-enrollments                  - Enroll student in section (auto-loads subjects)
GET    /api/section-enrollments/{id}             - Get enrollment details
PUT    /api/section-enrollments/{id}             - Update enrollment
DELETE /api/section-enrollments/{id}             - Delete enrollment
POST   /api/section-enrollments/bulk-enroll      - Bulk enroll multiple students
POST   /api/section-enrollments/{id}/drop        - Drop student from section
```

### Migration from Old System

If you have existing data:

#### 1. Backup Your Database
```bash
mysqldump -u username -p database_name > backup_$(date +%Y%m%d).sql
```

#### 2. Update Existing Programs
```sql
-- Set default level for existing programs
UPDATE programs SET level = 'college' WHERE level IS NULL;
```

#### 3. Update Existing Subjects
```sql
-- Set default subject type
UPDATE subjects SET subject_type = 'core' WHERE subject_type IS NULL;
```

#### 4. Update Existing Students
```sql
-- Set default student type
UPDATE students SET student_type = 'old' WHERE student_type IS NULL;
```

#### 5. Migrate Existing Enrollments (Optional)

If you want to convert existing class enrollments to section enrollments:

```sql
-- This is a sample SQL - adjust based on your data structure
INSERT INTO section_enrollments (student_id, section_id, academic_year_id, program_id, year_level, enrollment_date, status, created_at, updated_at)
SELECT DISTINCT 
    s.id as student_id,
    s.section_id,
    s.academic_year_id,
    s.program_id,
    s.grade_level as year_level,
    s.date_enrolled as enrollment_date,
    'enrolled' as status,
    NOW() as created_at,
    NOW() as updated_at
FROM students s
WHERE s.section_id IS NOT NULL
  AND s.enrollment_status = 'enrolled'
  AND NOT EXISTS (
    SELECT 1 FROM section_enrollments se 
    WHERE se.student_id = s.id 
      AND se.section_id = s.section_id 
      AND se.academic_year_id = s.academic_year_id
  );
```

---

## 🎨 Frontend Updates Needed

### Service Files to Create

Create `frontend/src/service/gradingPeriodService.js`:

```javascript
import api from './api';

const gradingPeriodService = {
  getAll: async (params = {}) => {
    const response = await api.get('/grading-periods', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/grading-periods/${id}`);
    return response.data;
  },

  getCurrent: async () => {
    const response = await api.get('/grading-periods/current');
    return response.data;
  },

  getCurrentPeriod: async () => {
    const response = await api.get('/grading-periods/current-period');
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/grading-periods', data);
    return response.data;
  },

  bulkCreate: async (data) => {
    const response = await api.post('/grading-periods/bulk-create', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/grading-periods/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/grading-periods/${id}`);
    return response.data;
  },

  open: async (id) => {
    const response = await api.post(`/grading-periods/${id}/open`);
    return response.data;
  },

  lock: async (id) => {
    const response = await api.post(`/grading-periods/${id}/lock`);
    return response.data;
  },

  close: async (id) => {
    const response = await api.post(`/grading-periods/${id}/close`);
    return response.data;
  },
};

export default gradingPeriodService;
```

Create `frontend/src/service/sectionEnrollmentService.js`:

```javascript
import api from './api';

const sectionEnrollmentService = {
  getAll: async (params = {}) => {
    const response = await api.get('/section-enrollments', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/section-enrollments/${id}`);
    return response.data;
  },

  enroll: async (data) => {
    const response = await api.post('/section-enrollments', data);
    return response.data;
  },

  bulkEnroll: async (data) => {
    const response = await api.post('/section-enrollments/bulk-enroll', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/section-enrollments/${id}`, data);
    return response.data;
  },

  drop: async (id) => {
    const response = await api.post(`/section-enrollments/${id}/drop`);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/section-enrollments/${id}`);
    return response.data;
  },
};

export default sectionEnrollmentService;
```

### Update Service Index

Add to `frontend/src/service/index.js`:

```javascript
export { default as gradingPeriodService } from './gradingPeriodService';
export { default as sectionEnrollmentService } from './sectionEnrollmentService';
```

### UI Components to Update/Create

1. **Programs.jsx** - Add "Level" field to form
2. **Subjects.jsx** - Add "Subject Type" and "Hours per Week" fields
3. **Students.jsx** - Add "Student Type", "Date of Birth", "Age" fields
4. **Create: GradingPeriods.jsx** - New page for managing grading periods
5. **Update: Enrollment.jsx** - Use new section enrollment workflow
6. **Create: SectionEnrollmentModal.jsx** - New enrollment modal

---

## 📝 Testing Guide

### 1. Test Grading Periods

```bash
# Create academic year first
curl -X POST http://localhost:8000/api/academic-years \
  -H "Content-Type: application/json" \
  -d '{
    "year_code": "SY2024-2025",
    "start_date": "2024-08-15",
    "end_date": "2025-05-30",
    "semester": "1st",
    "is_current": true,
    "status": "active"
  }'

# Create grading periods
curl -X POST http://localhost:8000/api/grading-periods/bulk-create \
  -H "Content-Type: application/json" \
  -d '{
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
      }
    ]
  }'

# Open a grading period
curl -X POST http://localhost:8000/api/grading-periods/1/open
```

### 2. Test Section Enrollment

```bash
# Enroll a student in a section (will auto-load subjects)
curl -X POST http://localhost:8000/api/section-enrollments \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": 1,
    "section_id": 1,
    "enrollment_date": "2024-08-15"
  }'
```

### 3. Verify Validation Rules

Test that the system enforces:
- ✅ Cannot create subject without active program
- ✅ Cannot create section without active academic year
- ✅ Cannot enroll student without program
- ✅ Cannot enroll in section at full capacity
- ✅ Cannot have overlapping grading periods
- ✅ Only one grading period can be open at a time

---

## 🐛 Troubleshooting

### Issue: Migration fails
**Solution**: Check if tables already exist. Drop and recreate if needed (backup first!)

### Issue: Foreign key constraint errors
**Solution**: Ensure parent records exist (program before subject, etc.)

### Issue: Routes not found
**Solution**: Clear route cache: `php artisan route:clear`

### Issue: Changes not reflecting
**Solution**: 
```bash
php artisan config:clear
php artisan cache:clear
composer dump-autoload
```

---

## 🔄 System Comparison

### Old System vs Enhanced System

| Feature | Old System | Enhanced System |
|---------|-----------|-----------------|
| **Program Level** | No level field | Has College/SHS/JHS/Elementary |
| **Subject Type** | Not defined | Major/Minor/Elective/Core |
| **Student Type** | Not defined | New/Transferee/Returnee/Old |
| **Grading Periods** | Enum in grades table | Separate table with lock/unlock |
| **Enrollment** | Direct to classes | Section → Auto-load subjects |
| **Validation** | Basic | Comprehensive with dependencies |
| **Capacity Check** | Class level only | Both section and class level |

---

## 📚 Additional Resources

- **API Documentation**: See `backend/routes/api.php` for all endpoints
- **Database Schema**: See migration files in `backend/database/migrations/`
- **Models**: See `backend/app/Models/` for relationships
- **Controllers**: See `backend/app/Http/Controllers/` for business logic

---

## ✅ Post-Implementation Checklist

After deploying the enhanced system:

- [ ] Database migrations completed successfully
- [ ] All new API routes tested
- [ ] Frontend service files created
- [ ] Grading periods created for current academic year
- [ ] Test enrollment workflow with sample student
- [ ] Verify validation rules working
- [ ] Train admin users on new workflow
- [ ] Update user documentation
- [ ] Monitor for any errors in logs

---

**Need Help?** Check error logs:
- Backend: `backend/storage/logs/laravel.log`
- Frontend: Browser console (F12)

---

**Version**: 2.0  
**Implementation Date**: March 4, 2026
