<?php

namespace App\Http\Controllers;

use App\Models\Teachers;
use App\Models\User;
use App\Models\Classes;
use App\Models\Section;
use App\Models\Schedule;
use App\Models\Subject;
use App\Models\AcademicYear;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\QueryException;

class TeachersController extends Controller
{
    /**
     * Display a paginated listing of teachers
     */
    public function index(Request $request)
    {
        $query = Teachers::with(['user', 'department', 'classes.subject', 'sections'])
            ->withCount('classes');
        
        // Search functionality
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('employee_id', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }
        
        // Filter by department
        if ($request->has('department_id')) {
            $query->where('department_id', $request->department_id);
        }
        
        // Filter by specialization
        if ($request->has('specialization')) {
            $query->where('specialization', $request->specialization);
        }
        
        // Filter by employment status
        if ($request->has('employment_status')) {
            $query->where('employment_status', $request->employment_status);
        }
        
        // Sorting
        $sortBy = $request->get('sort_by', 'last_name');
        $sortOrder = $request->get('sort_order', 'asc');
        $query->orderBy($sortBy, $sortOrder);
        
        // Pagination
        $perPage = $request->get('per_page', 15);
        $teachers = $query->paginate($perPage);

        // Append computed workload info to each teacher
        foreach ($teachers as $teacher) {
            $activeClasses = $teacher->classes->where('status', 'active');
            $totalUnits = 0;
            $subjectNames = [];
            foreach ($activeClasses as $cls) {
                if ($cls->subject) {
                    $totalUnits += $cls->subject->units ?? 0;
                    $subjectNames[] = $cls->subject->subject_name;
                }
            }
            $teacher->teaching_load = $totalUnits;
            $teacher->subjects = array_unique($subjectNames);
        }
        
        return response()->json($teachers);
    }

    /**
     * Store a newly created teacher
     */
    public function store(Request $request)
    {
        // Validate empty request body
        if (empty($request->all())) {
            return response()->json([
                'success' => false,
                'message' => 'Request body cannot be empty',
                'errors' => ['body' => ['The request body is required and cannot be empty']]
            ], 400);
        }

        $validated = $request->validate([
            'user_id' => 'nullable|exists:users,id',
            'employee_id' => [
                'nullable',
                'string',
                'max:50',
                'regex:/^[A-Z0-9-]+$/',
                'unique:teachers,employee_id'
            ],
            'employee_number' => [
                'nullable',
                'string',
                'max:50',
                'regex:/^[A-Z0-9-]+$/',
                'unique:teachers,employee_id'
            ],
            'first_name' => [
                'required',
                'string',
                'min:2',
                'max:100',
                'regex:/^[\p{L}\s\.\'\-]+$/u'
            ],
            'last_name' => [
                'required',
                'string',
                'min:2',
                'max:100',
                'regex:/^[\p{L}\s\.\'\-]+$/u'
            ],
            'email' => [
                'required',
                'email',
                'max:255',
                'unique:teachers,email',
                'unique:users,email'
            ],
            'phone' => [
                'nullable',
                'string',
                'max:20',
                'regex:/^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/'
            ],
            'address' => 'nullable|string|max:500',
            'department_id' => [
                'nullable',
                'integer',
                'exists:departments,id'
            ],
            'specialization' => 'nullable|string|max:200',
            'hire_date' => [
                'nullable',
                'date',
                'before_or_equal:today',
                'after:1950-01-01'
            ],
            'employment_status' => [
                'nullable',
                'string',
                'in:active,full-time,part-time,contract,temporary,inactive,terminated,retired'
            ],
            'max_load' => 'nullable|integer|min:1|max:50',
            'profile_image' => 'nullable|image|mimes:jpeg,jpg,png,webp|max:10240',
            'password' => 'required|string|min:6',
            'status' => 'nullable|in:active,inactive',
        ], [
            'first_name.required' => 'First name is required',
            'first_name.min' => 'First name must be at least 2 characters',
            'first_name.max' => 'First name cannot exceed 100 characters',
            'first_name.regex' => 'First name contains invalid characters',
            'last_name.required' => 'Last name is required',
            'last_name.min' => 'Last name must be at least 2 characters',
            'last_name.max' => 'Last name cannot exceed 100 characters',
            'last_name.regex' => 'Last name contains invalid characters',
            'email.required' => 'Email address is required',
            'email.email' => 'Please provide a valid email address',
            'email.unique' => 'This email address is already registered',
            'employee_id.unique' => 'This employee ID is already assigned',
            'employee_id.regex' => 'Employee ID must contain only uppercase letters, numbers, and hyphens',
            'phone.regex' => 'Please provide a valid phone number',
            'hire_date.before_or_equal' => 'Hire date cannot be in the future',
            'hire_date.after' => 'Hire date must be after 1950',
            'employment_status.in' => 'Invalid employment status',
        ]);

        // Check for duplicate combination of first_name + last_name + email
        $duplicate = Teachers::where('first_name', $validated['first_name'])
            ->where('last_name', $validated['last_name'])
            ->where('email', $validated['email'])
            ->first();

        if ($duplicate) {
            return response()->json([
                'success' => false,
                'message' => 'A teacher with the same name and email already exists',
                'errors' => [
                    'duplicate' => ['This teacher entry already exists in the system']
                ]
            ], 409);
        }

        // Sanitize and normalize inputs
        $validated['first_name'] = trim(ucwords(strtolower($validated['first_name'])));
        $validated['last_name'] = trim(ucwords(strtolower($validated['last_name'])));
        $validated['email'] = strtolower(trim($validated['email']));

        // Map employee_number to employee_id if provided
        if (isset($validated['employee_number']) && !isset($validated['employee_id'])) {
            $validated['employee_id'] = strtoupper(trim($validated['employee_number']));
        }
        unset($validated['employee_number']);

        // Normalize employee_id
        if (isset($validated['employee_id'])) {
            $validated['employee_id'] = strtoupper(trim($validated['employee_id']));
        }

        // Set default values
        $validated['employment_status'] = $validated['employment_status'] ?? 'active';
        $validated['max_load'] = $validated['max_load'] ?? 24;
        $accountStatus = $validated['status'] ?? 'active';

        try {
            return DB::transaction(function () use ($validated, $accountStatus) {
                                // Handle profile image upload
                                if (request()->hasFile('profile_image')) {
                                    $image = request()->file('profile_image');
                                    $imageName = time() . '_' . uniqid() . '.' . $image->getClientOriginalExtension();
                                    $destinationPath = public_path() . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'teachers';
                                    if (!file_exists($destinationPath)) {
                                        mkdir($destinationPath, 0777, true);
                                    }
                                    $image->move($destinationPath, $imageName);
                                    $validated['profile_image'] = 'uploads/teachers/' . $imageName;
                                }

                // Create User account first
                $fullName = $validated['first_name'] . ' ' . $validated['last_name'];
                
                $user = User::create([
                    'name' => $fullName,
                    'email' => $validated['email'],
                    'password' => bcrypt($validated['password']),
                    'role' => 'teacher',
                    'status' => $accountStatus,
                    'phone' => $validated['phone'] ?? null,
                    'address' => $validated['address'] ?? null,
                ]);
                
                // Create Teacher record linked to User
                $teacherData = $validated;
                $teacherData['user_id'] = $user->id;
                $teacherData['status'] = $accountStatus;
                unset($teacherData['password']); // Don't store password in teachers table
                unset($teacherData['status']); // Already set user_id, not needed in teachers
                
                $teacher = Teachers::create($teacherData);
                
                // Update User with back-reference to teacher
                $user->update(['teacher_id' => $teacher->id]);
                
                return response()->json([
                    'success' => true,
                    'message' => 'Teacher and login account created successfully',
                    'data' => $teacher->load('user')
                ], 201);
            });
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create teacher: ' . $e->getMessage(),
                'errors' => ['database' => [$e->getMessage()]]
            ], 500);
        }
    }

    /**
     * Display the specified teacher
     */
    public function show(Teachers $teacher)
    {
        $teacher->load(['user', 'department', 'classes.subject', 'classes.section', 'classes.academicYear', 'sections']);
        
        // Compute workload
        $activeClasses = $teacher->classes->where('status', 'active');
        $totalUnits = 0;
        $subjectNames = [];
        foreach ($activeClasses as $cls) {
            if ($cls->subject) {
                $totalUnits += $cls->subject->units ?? 0;
                $subjectNames[] = $cls->subject->subject_name;
            }
        }
        $teacher->teaching_load = $totalUnits;
        $teacher->subjects = array_unique($subjectNames);
        
        return response()->json([
            'success' => true,
            'data' => $teacher
        ]);
    }

    /**
     * Update the specified teacher
     */
    public function update(Request $request, Teachers $teacher)
    {
        // Check if request has any data to update
        if (empty($request->all())) {
            return response()->json([
                'success' => false,
                'message' => 'No data provided for update',
                'errors' => ['body' => ['At least one field must be provided for update']]
            ], 400);
        }

        $validated = $request->validate([
            'user_id' => 'nullable|exists:users,id',
            'employee_id' => [
                'nullable',
                'string',
                'max:50',
                'regex:/^[A-Z0-9-]+$/',
                'unique:teachers,employee_id,' . $teacher->id
            ],
            'employee_number' => [
                'nullable',
                'string',
                'max:50',
                'regex:/^[A-Z0-9-]+$/',
                'unique:teachers,employee_id,' . $teacher->id
            ],
            'first_name' => [
                'sometimes',
                'string',
                'min:2',
                'max:100',
                'regex:/^[\p{L}\s\.\'\-]+$/u'
            ],
            'last_name' => [
                'sometimes',
                'string',
                'min:2',
                'max:100',
                'regex:/^[\p{L}\s\.\'\-]+$/u'
            ],
            'email' => [
                'sometimes',
                'email',
                'max:255',
                'unique:teachers,email,' . $teacher->id
            ],
            'phone' => [
                'nullable',
                'string',
                'max:20',
                'regex:/^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/'
            ],
            'address' => 'nullable|string|max:500',
            'department_id' => [
                'nullable',
                'integer',
                'exists:departments,id'
            ],
            'specialization' => 'nullable|string|max:200',
            'hire_date' => [
                'nullable',
                'date',
                'before_or_equal:today',
                'after:1950-01-01'
            ],
            'employment_status' => [
                'nullable',
                'string',
                'in:active,full-time,part-time,contract,temporary,inactive,terminated,retired'
            ],
            'max_load' => 'nullable|integer|min:1|max:50',
            'profile_image' => 'nullable|image|mimes:jpeg,jpg,png,webp|max:10240',
        ], [
            'first_name.min' => 'First name must be at least 2 characters',
            'first_name.max' => 'First name cannot exceed 100 characters',
            'first_name.regex' => 'First name contains invalid characters',
            'last_name.min' => 'Last name must be at least 2 characters',
            'last_name.max' => 'Last name cannot exceed 100 characters',
            'last_name.regex' => 'Last name contains invalid characters',
            'email.email' => 'Please provide a valid email address',
            'email.unique' => 'This email address is already registered',
            'employee_id.unique' => 'This employee ID is already assigned',
            'employee_id.regex' => 'Employee ID must contain only uppercase letters, numbers, and hyphens',
            'phone.regex' => 'Please provide a valid phone number',
            'hire_date.before_or_equal' => 'Hire date cannot be in the future',
            'hire_date.after' => 'Hire date must be after 1950',
            'employment_status.in' => 'Invalid employment status',
        ]);

        // Check for duplicate if name or email is being updated
        if (isset($validated['first_name']) || isset($validated['last_name']) || isset($validated['email'])) {
            $firstName = $validated['first_name'] ?? $teacher->first_name;
            $lastName = $validated['last_name'] ?? $teacher->last_name;
            $email = $validated['email'] ?? $teacher->email;

            $duplicate = Teachers::where('id', '!=', $teacher->id)
                ->where('first_name', $firstName)
                ->where('last_name', $lastName)
                ->where('email', $email)
                ->first();

            if ($duplicate) {
                return response()->json([
                    'success' => false,
                    'message' => 'A teacher with the same name and email already exists',
                    'errors' => ['duplicate' => ['This combination of name and email is already in use']]
                ], 409);
            }
        }

        // Sanitize and normalize inputs
        if (isset($validated['first_name'])) {
            $validated['first_name'] = trim(ucwords(strtolower($validated['first_name'])));
        }
        if (isset($validated['last_name'])) {
            $validated['last_name'] = trim(ucwords(strtolower($validated['last_name'])));
        }
        if (isset($validated['email'])) {
            $validated['email'] = strtolower(trim($validated['email']));
        }

        // Map employee_number to employee_id if provided
        if (isset($validated['employee_number'])) {
            $validated['employee_id'] = strtoupper(trim($validated['employee_number']));
            unset($validated['employee_number']);
        }

        // Normalize employee_id
        if (isset($validated['employee_id'])) {
            $validated['employee_id'] = strtoupper(trim($validated['employee_id']));
        }

        // Handle profile image upload
        if (request()->hasFile('profile_image')) {
            // Delete old image if exists
            if ($teacher->profile_image && file_exists(public_path($teacher->profile_image))) {
                unlink(public_path($teacher->profile_image));
            }

            $image = request()->file('profile_image');
            $imageName = time() . '_' . uniqid() . '.' . $image->getClientOriginalExtension();
            $destinationPath = public_path() . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'teachers';
            if (!file_exists($destinationPath)) {
                mkdir($destinationPath, 0777, true);
            }
            $image->move($destinationPath, $imageName);
            $validated['profile_image'] = 'uploads/teachers/' . $imageName;
        }

        try {
            $teacher->update($validated);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update teacher record',
                'errors' => ['database' => [$e->getMessage()]]
            ], 500);
        }
        
        return response()->json([
            'success' => true,
            'message' => 'Teacher updated successfully',
            'data' => $teacher
        ]);
    }

    /**
     * Remove the specified teacher
     */
    public function destroy(Teachers $teacher)
    {
        // Check for assigned classes
        if ($teacher->classes()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete teacher with assigned classes'
            ], 422);
        }
        
        // Check for assigned sections
        if ($teacher->sections()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete teacher assigned as section adviser'
            ], 422);
        }
        
        $teacher->delete();
        
        return response()->json([
            'success' => true,
            'message' => 'Teacher deleted successfully'
        ]);
    }

    /**
     * Get teacher's assigned classes
     */
    public function classes(Teachers $teacher, Request $request)
    {
        $query = Classes::where('teacher_id', $teacher->id)
            ->with(['subject', 'section', 'academicYear'])
            ->withCount('enrollments');
        
        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        // Filter by academic year
        if ($request->has('academic_year_id')) {
            $query->where('academic_year_id', $request->academic_year_id);
        }
        
        // Filter by section
        if ($request->has('section_id')) {
            $query->where('section_id', $request->section_id);
        }

        // Filter by subject
        if ($request->has('subject_id')) {
            $query->where('subject_id', $request->subject_id);
        }
        
        $query->orderBy('created_at', 'desc');
        
        $perPage = $request->get('per_page', 100);
        $classes = $query->paginate($perPage);

        return response()->json($classes);
    }

    /**
     * Get teacher's advised sections
     */
    public function sections(Teachers $teacher, Request $request)
    {
        $query = Section::where('adviser_id', $teacher->id)
            ->with(['program', 'academicYear'])
            ->withCount('students');
        
        // Filter by program
        if ($request->has('program_id')) {
            $query->where('program_id', $request->program_id);
        }
        
        // Filter by academic year
        if ($request->has('academic_year_id')) {
            $query->where('academic_year_id', $request->academic_year_id);
        }
        
        // Filter by grade level
        if ($request->has('grade_level')) {
            $query->where('grade_level', $request->grade_level);
        }
        
        $query->orderBy('name', 'asc');
        
        $perPage = $request->get('per_page', 15);
        $sections = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $sections
        ]);
    }

    /**
     * Get teacher's schedule
     */
    public function schedule(Teachers $teacher, Request $request)
    {
        // Get teacher's classes
        $query = Schedule::whereHas('class', function ($q) use ($teacher) {
            $q->where('teacher_id', $teacher->id)->where('status', 'active');
        })
            ->with(['class.subject', 'class.section']);
        
        // Filter by day
        if ($request->has('day_of_week')) {
            $query->where('day_of_week', $request->day_of_week);
        }
        
        // Filter by room
        if ($request->has('room')) {
            $query->where('room', $request->room);
        }
        
        $query->orderBy('day_of_week')->orderBy('time_start');
        
        $schedules = $query->get();

        return response()->json([
            'success' => true,
            'data' => $schedules
        ]);
    }

    /**
     * Get detailed workload information for a teacher
     */
    public function workload(Teachers $teacher, Request $request)
    {
        $academicYearId = $request->get('academic_year_id');
        
        $query = Classes::where('teacher_id', $teacher->id)
            ->with(['subject', 'section.program', 'academicYear', 'schedules'])
            ->withCount('enrollments');

        if ($academicYearId) {
            $query->where('academic_year_id', $academicYearId);
        }
        
        $assignedClasses = $query->get();

        // Calculate workload summary
        $totalUnits = 0;
        $totalClasses = $assignedClasses->count();
        $activeClasses = $assignedClasses->where('status', 'active')->count();
        $totalStudents = 0;
        $subjectNames = [];

        foreach ($assignedClasses as $cls) {
            if ($cls->subject) {
                $totalUnits += $cls->subject->units ?? 0;
                $subjectNames[] = $cls->subject->subject_name;
            }
            $totalStudents += $cls->enrollments_count ?? 0;
        }

        $maxLoad = $teacher->max_load ?? 24;
        $loadPercentage = $maxLoad > 0 ? round(($totalUnits / $maxLoad) * 100, 1) : 0;

        // Get schedule summary
        $classIds = $assignedClasses->where('status', 'active')->pluck('id');
        $schedules = Schedule::whereIn('class_id', $classIds)
            ->with(['class.subject', 'class.section'])
            ->orderBy('day_of_week')
            ->orderBy('time_start')
            ->get();

        $scheduleDays = $schedules->groupBy('day_of_week')->map(function ($daySchedules) {
            return $daySchedules->map(function ($s) {
                return [
                    'id' => $s->id,
                    'class_id' => $s->class?->id,
                    'subject' => $s->class->subject->subject_name ?? 'N/A',
                    'subject_code' => $s->class->subject->subject_code ?? 'N/A',
                    'section' => $s->class->section->name ?? 'N/A',
                    'time_start' => $s->time_start,
                    'time_end' => $s->time_end,
                    'room' => $s->room_number ?? $s->room ?? 'TBD',
                ];
            });
        });

        return response()->json([
            'success' => true,
            'data' => [
                'teacher' => $teacher->load('user'),
                'summary' => [
                    'total_units' => $totalUnits,
                    'max_load' => $maxLoad,
                    'load_percentage' => $loadPercentage,
                    'total_classes' => $totalClasses,
                    'active_classes' => $activeClasses,
                    'total_students' => $totalStudents,
                    'unique_subjects' => count(array_unique($subjectNames)),
                ],
                'classes' => $assignedClasses,
                'schedule_by_day' => $scheduleDays,
            ]
        ]);
    }

    /**
     * Assign a class to a teacher (set teacher_id on existing class)
     */
    public function assignClass(Request $request, Teachers $teacher)
    {
        $validated = $request->validate([
            'class_id' => 'required|exists:classes,id',
        ]);

        $class = Classes::with(['subject', 'section', 'academicYear', 'schedules'])
            ->findOrFail($validated['class_id']);

        // Check if class is already assigned to this teacher
        if ($class->teacher_id === $teacher->id) {
            return response()->json([
                'success' => false,
                'message' => 'This class is already assigned to this teacher.'
            ], 422);
        }

        // Check max load
        $currentLoad = $this->calculateTeachingLoad($teacher->id, $class->academic_year_id);
        $subjectUnits = $class->subject->units ?? 0;
        $maxLoad = $teacher->max_load ?? 24;

        if (($currentLoad + $subjectUnits) > $maxLoad) {
            return response()->json([
                'success' => false,
                'message' => "Assigning this class ({$subjectUnits} units) would exceed the teacher's max load of {$maxLoad} units. Current load: {$currentLoad} units."
            ], 422);
        }

        // Check for schedule conflicts
        if ($class->schedules->isNotEmpty()) {
            foreach ($class->schedules as $schedule) {
                $conflicts = $this->findScheduleConflicts(
                    $teacher->id,
                    $schedule->day_of_week,
                    $schedule->time_start,
                    $schedule->time_end,
                    $class->academic_year_id,
                    $class->id
                );

                if ($conflicts->isNotEmpty()) {
                    $conflictInfo = $conflicts->map(function ($c) {
                        $subjectName = $c->class->subject->subject_name ?? 'Unknown';
                        return "{$subjectName} ({$c->time_start}-{$c->time_end})";
                    })->join(', ');

                    return response()->json([
                        'success' => false,
                        'message' => "Schedule conflict on {$schedule->day_of_week}: {$conflictInfo}"
                    ], 422);
                }
            }
        }

        // Assign the teacher
        $class->update(['teacher_id' => $teacher->id]);

        return response()->json([
            'success' => true,
            'message' => 'Class assigned to teacher successfully',
            'data' => $class->fresh(['subject', 'section', 'academicYear'])
        ]);
    }

    /**
     * Create a new class and assign to teacher
     */
    public function createAndAssignClass(Request $request, Teachers $teacher)
    {
        $validated = $request->validate([
            'section_id' => 'required|exists:sections,id',
            'subject_id' => 'required|exists:subjects,id',
            'academic_year_id' => 'required|exists:academic_years,id',
            'class_code' => 'nullable|string|max:50',
            'status' => 'nullable|in:active,inactive,archived',
        ]);

        // Check if class already exists with this section+subject+academic_year
        $existingClass = Classes::where('section_id', $validated['section_id'])
            ->where('subject_id', $validated['subject_id'])
            ->where('academic_year_id', $validated['academic_year_id'])
            ->first();

        if ($existingClass) {
            if ($existingClass->teacher_id === $teacher->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'This class already exists and is assigned to this teacher.'
                ], 422);
            }
            // If it exists but assigned to someone else, reassign it
            $class = $existingClass;
        } else {
            // Load subject to check units
            $subject = Subject::find($validated['subject_id']);
            $subjectUnits = $subject->units ?? 0;

            // Check max load before creating
            $currentLoad = $this->calculateTeachingLoad($teacher->id, $validated['academic_year_id']);
            $maxLoad = $teacher->max_load ?? 24;

            if (($currentLoad + $subjectUnits) > $maxLoad) {
                return response()->json([
                    'success' => false,
                    'message' => "Assigning this subject ({$subjectUnits} units) would exceed the teacher's max load of {$maxLoad} units. Current load: {$currentLoad} units."
                ], 422);
            }

            // Generate class_code if not provided
            if (!isset($validated['class_code'])) {
                $section = Section::find($validated['section_id']);
                $sectionName = $section->name ?? 'SEC';
                $subjectCode = $subject->subject_code ?? 'SUBJ';
                $validated['class_code'] = "{$subjectCode}-{$sectionName}";
            }

            // Create the class
            $class = Classes::create([
                'class_code' => $validated['class_code'],
                'section_id' => $validated['section_id'],
                'subject_id' => $validated['subject_id'],
                'academic_year_id' => $validated['academic_year_id'],
                'teacher_id' => $teacher->id,
                'status' => $validated['status'] ?? 'active',
            ]);
        }

        // Assign teacher if not already assigned
        if ($class->teacher_id !== $teacher->id) {
            $class->update(['teacher_id' => $teacher->id]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Class created and assigned to teacher successfully',
            'data' => $class->fresh(['subject', 'section', 'academicYear'])
        ]);
    }

    /**
     * Unassign a class from a teacher (set teacher_id to null)
     */
    public function unassignClass(Request $request, Teachers $teacher)
    {
        $validated = $request->validate([
            'class_id' => 'required|exists:classes,id',
            'cancel_class' => 'sometimes|boolean',
        ]);

        $class = Classes::findOrFail($validated['class_id']);
        $cancelClass = (bool) ($validated['cancel_class'] ?? false);

        if ($class->teacher_id !== $teacher->id) {
            return response()->json([
                'success' => false,
                'message' => 'This class is not assigned to this teacher'
            ], 422);
        }

        try {
            $updatePayload = ['teacher_id' => null];
            if ($cancelClass) {
                $updatePayload['status'] = 'cancelled';
            }

            $class->update($updatePayload);
        } catch (QueryException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Unable to unassign class because the current database schema requires every class to have a teacher. Please run the latest migrations to allow unassigned classes.'
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => $cancelClass
                ? 'Class unassigned and cancelled successfully'
                : 'Class unassigned from teacher successfully',
            'data' => [
                'class_id' => $class->id,
                'status' => $class->status,
                'teacher_id' => $class->teacher_id,
            ],
        ]);
    }

    /**
     * Permanently delete a class assigned to a teacher, only when it has no academic records
     */
    public function deleteClass(Request $request, Teachers $teacher)
    {
        $validated = $request->validate([
            'class_id' => 'required|exists:classes,id',
        ]);

        $class = Classes::withCount([
            'enrollments',
            'grades',
            'attendance',
            'schedules',
            'announcements',
        ])->findOrFail($validated['class_id']);

        if ($class->teacher_id !== $teacher->id) {
            return response()->json([
                'success' => false,
                'message' => 'This class is not assigned to this teacher'
            ], 422);
        }

        $blockingCounts = [
            'enrollments' => (int) ($class->enrollments_count ?? 0),
            'grades' => (int) ($class->grades_count ?? 0),
            'attendance' => (int) ($class->attendance_count ?? 0),
            'schedules' => (int) ($class->schedules_count ?? 0),
            'announcements' => (int) ($class->announcements_count ?? 0),
        ];

        $activeBlockers = array_filter($blockingCounts, fn ($count) => $count > 0);
        if (!empty($activeBlockers)) {
            $summary = collect($activeBlockers)
                ->map(fn ($count, $name) => "{$name}: {$count}")
                ->values()
                ->join(', ');

            return response()->json([
                'success' => false,
                'message' => 'Class cannot be deleted because related records exist. Use Unassign + Cancel instead.',
                'data' => [
                    'blockers' => $activeBlockers,
                    'summary' => $summary,
                ],
            ], 422);
        }

        $classCode = $class->class_code ?: "Class #{$class->id}";
        $class->delete();

        return response()->json([
            'success' => true,
            'message' => "{$classCode} deleted permanently",
        ]);
    }

    /**
     * Bulk assign multiple classes to a teacher
     */
    public function bulkAssignClasses(Request $request, Teachers $teacher)
    {
        $validated = $request->validate([
            'class_ids' => 'required|array|min:1',
            'class_ids.*' => 'exists:classes,id',
        ]);

        $results = ['assigned' => [], 'failed' => []];
        $maxLoad = $teacher->max_load ?? 24;

        foreach ($validated['class_ids'] as $classId) {
            $class = Classes::with(['subject', 'section', 'academicYear', 'schedules'])->find($classId);

            if (!$class) {
                $results['failed'][] = ['class_id' => $classId, 'reason' => 'Class not found'];
                continue;
            }

            // Skip if already assigned to this teacher
            if ($class->teacher_id === $teacher->id) {
                $results['assigned'][] = $class;
                continue;
            }

            // Check if assigned to another teacher
            if ($class->teacher_id) {
                $existingTeacher = Teachers::find($class->teacher_id);
                $name = $existingTeacher ? "{$existingTeacher->first_name} {$existingTeacher->last_name}" : 'another teacher';
                $results['failed'][] = [
                    'class_id' => $classId,
                    'class_code' => $class->class_code,
                    'reason' => "Already assigned to {$name}"
                ];
                continue;
            }

            // Check load
            $currentLoad = $this->calculateTeachingLoad($teacher->id, $class->academic_year_id);
            $subjectUnits = $class->subject->units ?? 0;
            if (($currentLoad + $subjectUnits) > $maxLoad) {
                $results['failed'][] = [
                    'class_id' => $classId,
                    'class_code' => $class->class_code,
                    'reason' => "Would exceed max load ({$currentLoad}+{$subjectUnits} > {$maxLoad})"
                ];
                continue;
            }

            // Check schedule conflicts
            $hasConflict = false;
            if ($class->schedules->isNotEmpty()) {
                foreach ($class->schedules as $schedule) {
                    $conflicts = $this->findScheduleConflicts(
                        $teacher->id,
                        $schedule->day_of_week,
                        $schedule->time_start,
                        $schedule->time_end,
                        $class->academic_year_id,
                        $class->id
                    );
                    if ($conflicts->isNotEmpty()) {
                        $results['failed'][] = [
                            'class_id' => $classId,
                            'class_code' => $class->class_code,
                            'reason' => "Schedule conflict on {$schedule->day_of_week}"
                        ];
                        $hasConflict = true;
                        break;
                    }
                }
            }

            if ($hasConflict) continue;

            $class->update(['teacher_id' => $teacher->id]);
            $results['assigned'][] = $class->fresh(['subject', 'section', 'academicYear']);
        }

        $assignedCount = count($results['assigned']);
        $failedCount = count($results['failed']);

        return response()->json([
            'success' => true,
            'message' => "{$assignedCount} class(es) assigned, {$failedCount} failed",
            'data' => $results
        ]);
    }

    /**
     * Get unassigned classes (not assigned to any teacher)
     */
    public function unassignedClasses(Request $request)
    {
        $query = Classes::with(['subject', 'section', 'academicYear', 'schedules', 'teacher'])
            ->withCount('enrollments');

        // By default show only unassigned; if exclude_teacher_id is provided, show all EXCEPT that teacher's classes
        if ($request->has('exclude_teacher_id')) {
            $query->where(function ($q) use ($request) {
                $q->whereNull('teacher_id')
                  ->orWhere('teacher_id', '!=', $request->exclude_teacher_id);
            });
        } else {
            $query->whereNull('teacher_id');
        }
        
        // Filter by academic year
        if ($request->has('academic_year_id')) {
            $query->where('academic_year_id', $request->academic_year_id);
        }

        // Filter by section
        if ($request->has('section_id')) {
            $query->where('section_id', $request->section_id);
        }

        // Filter by subject
        if ($request->has('subject_id')) {
            $query->where('subject_id', $request->subject_id);
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Search by subject name/code
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('class_code', 'like', "%{$search}%")
                  ->orWhereHas('subject', function ($sq) use ($search) {
                      $sq->where('subject_name', 'like', "%{$search}%")
                         ->orWhere('subject_code', 'like', "%{$search}%");
                  });
            });
        }

        $query->orderBy('created_at', 'desc');
        $perPage = $request->get('per_page', 100);
        $classes = $query->paginate($perPage);

        return response()->json($classes);
    }

    /**
     * Check workload conflicts before assignment
     */
    public function checkWorkloadConflicts(Request $request, Teachers $teacher)
    {
        $validated = $request->validate([
            'class_ids' => 'required|array|min:1',
            'class_ids.*' => 'exists:classes,id',
        ]);

        $maxLoad = $teacher->max_load ?? 24;
        $conflicts = [];
        $warnings = [];

        foreach ($validated['class_ids'] as $classId) {
            $class = Classes::with(['subject', 'schedules'])->find($classId);
            if (!$class) continue;

            // Check if already assigned
            if ($class->teacher_id && $class->teacher_id !== $teacher->id) {
                $existingTeacher = Teachers::find($class->teacher_id);
                $name = $existingTeacher ? "{$existingTeacher->first_name} {$existingTeacher->last_name}" : 'another teacher';
                $conflicts[] = [
                    'class_id' => $classId,
                    'type' => 'already_assigned',
                    'message' => "{$class->subject->subject_name} is already assigned to {$name}"
                ];
            }

            // Check load
            $currentLoad = $this->calculateTeachingLoad($teacher->id, $class->academic_year_id);
            $subjectUnits = $class->subject->units ?? 0;
            if (($currentLoad + $subjectUnits) > $maxLoad) {
                $conflicts[] = [
                    'class_id' => $classId,
                    'type' => 'overload',
                    'message' => "Adding {$class->subject->subject_name} ({$subjectUnits} units) would exceed max load ({$currentLoad}+{$subjectUnits} > {$maxLoad})"
                ];
            } elseif (($currentLoad + $subjectUnits) >= ($maxLoad * 0.9)) {
                $warnings[] = [
                    'class_id' => $classId,
                    'type' => 'near_max',
                    'message' => "Load will be near maximum after adding {$class->subject->subject_name}"
                ];
            }

            // Check schedule conflicts
            if ($class->schedules->isNotEmpty()) {
                foreach ($class->schedules as $schedule) {
                    $schedConflicts = $this->findScheduleConflicts(
                        $teacher->id,
                        $schedule->day_of_week,
                        $schedule->time_start,
                        $schedule->time_end,
                        $class->academic_year_id,
                        $class->id
                    );
                    if ($schedConflicts->isNotEmpty()) {
                        $conflictInfo = $schedConflicts->map(function ($c) {
                            return ($c->class->subject->subject_name ?? 'Unknown') . " ({$c->time_start}-{$c->time_end})";
                        })->join(', ');
                        $conflicts[] = [
                            'class_id' => $classId,
                            'type' => 'schedule_conflict',
                            'message' => "Schedule conflict on {$schedule->day_of_week} with {$conflictInfo}"
                        ];
                    }
                }
            }
        }

        return response()->json([
            'success' => true,
            'has_conflicts' => count($conflicts) > 0,
            'conflicts' => $conflicts,
            'warnings' => $warnings,
        ]);
    }

    /**
     * Get workload summary for all teachers
     */
    public function workloadSummary(Request $request)
    {
        $academicYearId = $request->get('academic_year_id');

        $teachers = Teachers::with('user')->get();
        
        $summary = $teachers->map(function ($teacher) use ($academicYearId) {
            $query = Classes::where('teacher_id', $teacher->id)
                ->where('status', 'active')
                ->with('subject');

            if ($academicYearId) {
                $query->where('academic_year_id', $academicYearId);
            }

            $classes = $query->get();
            $totalUnits = $classes->sum(function ($c) {
                return $c->subject->units ?? 0;
            });
            $maxLoad = $teacher->max_load ?? 24;

            return [
                'teacher_id' => $teacher->id,
                'name' => "{$teacher->first_name} {$teacher->last_name}",
                'department' => $teacher->department?->name ?? 'N/A',
                'employment_status' => $teacher->employment_status,
                'current_load' => $totalUnits,
                'max_load' => $maxLoad,
                'load_percentage' => $maxLoad > 0 ? round(($totalUnits / $maxLoad) * 100, 1) : 0,
                'classes_count' => $classes->count(),
                'status' => $totalUnits >= $maxLoad ? 'full' : ($totalUnits >= $maxLoad * 0.75 ? 'heavy' : ($totalUnits > 0 ? 'normal' : 'unassigned')),
            ];
        });

        // Summary stats
        $totalTeachers = $summary->count();
        $fullyLoaded = $summary->where('status', 'full')->count();
        $heavilyLoaded = $summary->where('status', 'heavy')->count();
        $normalLoad = $summary->where('status', 'normal')->count();
        $unassigned = $summary->where('status', 'unassigned')->count();

        return response()->json([
            'success' => true,
            'data' => [
                'teachers' => $summary->values(),
                'stats' => [
                    'total_teachers' => $totalTeachers,
                    'fully_loaded' => $fullyLoaded,
                    'heavily_loaded' => $heavilyLoaded,
                    'normal_load' => $normalLoad,
                    'unassigned' => $unassigned,
                ]
            ]
        ]);
    }

    /**
     * Helper: Calculate teaching load for a given teacher in an academic year
     */
    private function calculateTeachingLoad($teacherId, $academicYearId = null)
    {
        $query = Classes::where('teacher_id', $teacherId)
            ->where('status', 'active')
            ->with('subject');

        if ($academicYearId) {
            $query->where('academic_year_id', $academicYearId);
        }

        return $query->get()->sum(function ($c) {
            return $c->subject->units ?? 0;
        });
    }

    /**
     * Helper: Find schedule conflicts for a teacher
     */
    private function findScheduleConflicts($teacherId, $dayOfWeek, $timeStart, $timeEnd, $academicYearId, $excludeClassId = null)
    {
        return Schedule::whereHas('class', function ($q) use ($teacherId, $academicYearId, $excludeClassId) {
                $q->where('teacher_id', $teacherId)
                  ->where('academic_year_id', $academicYearId)
                  ->where('status', 'active');

                if ($excludeClassId) {
                    $q->where('id', '!=', $excludeClassId);
                }
            })
            ->where('day_of_week', $dayOfWeek)
            ->where(function ($query) use ($timeStart, $timeEnd) {
                $query->where(function ($q) use ($timeStart, $timeEnd) {
                    $q->where('time_start', '<', $timeEnd)
                      ->where('time_end', '>', $timeStart);
                });
            })
            ->with(['class.subject', 'class.section'])
            ->get();
    }
}
