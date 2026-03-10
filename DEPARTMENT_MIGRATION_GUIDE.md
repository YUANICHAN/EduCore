# Department Relationship Migration Guide

## Overview
This guide documents the migration from string-based department references to proper integer-based foreign key relationships in the EduCore system. This change ensures data integrity and improves query performance.

## Changes Summary

### Models

#### Teachers.php
**Changes Made:**
- Removed `'department'` from fillable array (was storing string values)
- Added `'department_id'` to fillable array (now stores integer FK)
- Added `department()` relationship method returning `$this->belongsTo(Department::class)`

**Before:**
```php
protected $fillable = [
    // ...
    'department',  // String field
    // ...
];
```

**After:**
```php
protected $fillable = [
    // ...
    'department_id',  // Integer FK
    // ...
];

public function department()
{
    return $this->belongsTo(Department::class);
}
```

#### Department.php
**Changes Made:**
- Updated `teachers()` relationship to use `department_id` FK instead of string matching on name
- Updated `programs()` relationship to use `department_id` FK

**Before:**
```php
public function teachers()
{
    return $this->hasMany(Teachers::class, 'department', 'name');  // String matching
}
```

**After:**
```php
public function teachers()
{
    return $this->hasMany(Teachers::class, 'department_id');  // FK matching
}
```

### Controllers

#### TeachersController.php
**Changes Made:**

1. **index() method (Line 22)**
   - Now loads department relationship: `with(['user', 'department', ...])`
   - Filters by department_id FK: `where('department_id', $request->department_id)`

2. **store() method validation (Lines 136-139)**
   - **Before:** Validated department as string with regex pattern
   ```php
   'department' => [
       'nullable',
       'string',
       'max:100',
       'regex:/^[\p{L}\s&\-]+$/u'
   ],
   ```
   - **After:** Validates department_id as integer with FK existence check
   ```php
   'department_id' => [
       'nullable',
       'integer',
       'exists:departments,id'
   ],
   ```

3. **update() method validation (Lines 351-354)**
   - Same validation change as store() method

4. **show() method (Line 272)**
   - Now loads department relationship for complete teacher data
   - `$teacher->load(['user', 'department', 'classes.subject', ...])`

5. **workloadSummary() method (Line 1093)**
   - Updated to access department name through relationship: `$teacher->department?->name ?? 'N/A'`
   - **Before:** `'department' => $teacher->department` (returned string or null)
   - **After:** `'department' => $teacher->department?->name ?? 'N/A'` (returns department name or N/A)

### Database Migrations

#### 1. add_department_id_to_teachers_table (2026_03_04_100006)
Creates the new `department_id` column with proper foreign key constraint:

```php
Schema::table('teachers', function (Blueprint $table) {
    $table->foreignId('department_id')
        ->nullable()
        ->after('email')
        ->constrained('departments')
        ->onDelete('set null');
});
```

**Key Features:**
- BIGINT UNSIGNED column (standard Laravel foreign ID)
- Nullable to maintain backward compatibility during migration
- Constrained to departments table primary key
- Cascading delete: Sets department_id to NULL if department is deleted

#### 2. migrate_department_data_in_teachers_table (2026_03_04_100007)
Migrates existing teacher records from string department names to department_id FK:

```sql
UPDATE teachers t
INNER JOIN departments d ON LOWER(TRIM(t.department)) = LOWER(TRIM(d.name))
SET t.department_id = d.id
```

**Key Features:**
- Case-insensitive matching (handles different case variations)
- Trims whitespace before matching
- Logs unmatched department names (those without corresponding record in departments table)
- Logs to application log for investigation

#### 3. drop_department_column_from_teachers_table (2026_03_04_100008) [OPTIONAL]
Removes the old string 'department' column after data migration is verified:

**IMPORTANT:** Only run this migration after:
1. Running the first two migrations
2. Verifying all teachers have been properly assigned to departments
3. Testing the system with the new FK relationships
4. Backing up the database

## Migration Execution Steps

### Step 1: Pre-Migration Verification
Before running any migrations, check the current state:

```php
// Check existing department data
$departments = Department::pluck('name', 'id');
dd($departments);

// Check teachers with department values
$teachersWithDept = Teachers::whereNotNull('department')->get(['id', 'first_name', 'last_name', 'department']);
```

### Step 2: Run Migrations
```bash
php artisan migrate
```

This will execute all three migrations in order:
1. Adds department_id column (empty initially)
2. Migrates data from department string to department_id FK
3. (Optional - skipped if last migration is not intended to run)

### Step 3: Verify Migration
After running migrations, verify the data:

```php
// Check successful migrations
$unassignedTeachers = Teachers::whereNull('department_id')->get();
dd($unassignedTeachers); // Should be empty (or only those without matching departments)

// Check a department's teachers
$department = Department::find(1)->load('teachers');
dd($department->teachers);

// Check relationships work
$teacher = Teachers::with('department')->first();
dd($teacher->department->name); // Should return department name
```

### Step 4: Handle Unmatched Teachers (if any)
If there are teachers with unmatched department names:

```php
// Find unmatched teachers
$unmatched = Teachers::whereNull('department_id')
    ->whereNotNull('department')
    ->get(['id', 'first_name', 'last_name', 'department']);

foreach ($unmatched as $teacher) {
    // Manually assign to correct department or find/create the department
    $dept = Department::where('name', 'like', '%' . $teacher->department . '%')->first();
    if ($dept) {
        $teacher->update(['department_id' => $dept->id]);
    }
}
```

### Step 5: Drop Old Column (Optional)
Once verified everything works correctly:

```bash
php artisan migrate --step=1
```

Or manually add this to your migration queue and run it.

## API Changes

### Teacher Creation/Update
The API now expects `department_id` (integer) instead of `department` (string):

**Before:**
```json
{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "department": "Mathematics"
}
```

**After:**
```json
{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "department_id": 1
}
```

### Teacher Response
Teacher endpoints now include full department object in relationships:

**Before:**
```json
{
    "id": 1,
    "name": "John Doe",
    "department": "Mathematics"
}
```

**After:**
```json
{
    "id": 1,
    "name": "John Doe",
    "department": {
        "id": 1,
        "code": "MATH",
        "name": "Mathematics",
        "description": "..."
    }
}
```

## Frontend Updates Required

If using React/Vue frontend, update these areas:

### 1. Teacher Form Component
```javascript
// Before
const handleSubmit = (formData) => {
    return api.post('/teachers', {
        ...formData,
        department: selectedDepartmentName  // String
    });
};

// After
const handleSubmit = (formData) => {
    return api.post('/teachers', {
        ...formData,
        department_id: selectedDepartmentId  // Integer
    });
};
```

### 2. Department Dropdown
```javascript
// Before
<select name="department">
    <option value="">Select Department</option>
    <option value="Mathematics">Mathematics</option>
    <option value="Science">Science</option>
</select>

// After
<select name="department_id">
    <option value="">Select Department</option>
    {departments.map(dept => (
        <option key={dept.id} value={dept.id}>{dept.name}</option>
    ))}
</select>
```

### 3. Teacher Display
```javascript
// Before
const departmentName = teacher.department;

// After
const departmentName = teacher.department?.name || 'Not Assigned';
```

## Testing Checklist

- [ ] Database migrations run without errors
- [ ] All teachers are properly assigned to departments
- [ ] New teacher creation with department_id works
- [ ] Teacher update with department_id works
- [ ] Directory/Department listing shows correct teachers
- [ ] Frontend forms properly send department_id
- [ ] Frontend displays department names correctly
- [ ] Null department_id is handled gracefully (displays N/A)
- [ ] Deleting a department sets teacher department_id to NULL
- [ ] API responses include proper department relationship data

## Rollback Instructions

If you need to rollback the migrations:

```bash
# Rollback last 3 migrations
php artisan migrate:rollback --step=3

# Or fully rollback
php artisan migrate:reset
```

This will:
1. Re-add the department column
2. Reset department_id values to NULL
3. Remove the department_id_from_teachers_table column and constraint

Note: String department data will NOT be restored automatically. You may need to manually restore from database backup if needed.

## Performance Implications

### Benefits of FK-based Approach:
- ✅ Faster queries (integer comparison vs string comparison)
- ✅ Referential integrity enforced by database
- ✅ No orphaned teachers if department deleted
- ✅ Proper cascading deletes/updates handled by DB
- ✅ Easier to handle department changes (just update FK)

### Query Performance:
```php
// Before (String matching)
Teachers::where('department', 'Mathematics')->get(); // String search

// After (Integer FK)
Teachers::where('department_id', 1)->get(); // Integer search - faster & indexed
```

## Support & Troubleshooting

### Issue: Foreign key constraint error
**Solution:** Ensure all department names exist in departments table before migration

### Issue: Unmatched teachers after migration
**Solution:** Check teachersdepartment values that don't match any department names in departments table. Create missing departments or manually update teachers.

### Issue: API returning null for department
**Solution:** Ensure teacher has department_id set and department exists. Use `?->name ?? 'N/A'` pattern in responses.

### Issue: Old department column still showing
**Solution:** The optional 3rd migration hasn't been run. Only run after verification if you want to remove the old column.

---

**Migration Date:** 2026-03-04
**Version:** 1.0
