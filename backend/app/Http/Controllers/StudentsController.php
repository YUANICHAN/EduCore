<?php

namespace App\Http\Controllers;

use App\Models\Students;
use App\Models\User;
use App\Models\Enrollment;
use App\Models\Grade;
use App\Models\Attendance;
use App\Models\Schedule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class StudentsController extends Controller
{
    /**
     * Display a paginated listing of students
     */
    public function index(Request $request)
    {
        $query = Students::with(['program', 'section'])
            ->withCount('enrollments')
            ->withCount([
                'enrollments as active_enrollments_count' => function ($q) {
                    $q->where('status', 'enrolled');
                }
            ]);
        
        // Search functionality
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('student_number', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }
        
        // Filter by program
        if ($request->has('program_id')) {
            $query->where('program_id', $request->program_id);
        }
        
        // Filter by grade level
        if ($request->has('grade_level')) {
            $query->where('grade_level', $request->grade_level);
        }
        if ($request->has('year_level')) {
            $query->where('grade_level', $request->year_level);
        }
        
        // Filter by section
        if ($request->has('section_id')) {
            $query->where('section_id', $request->section_id);
        }

        // Filter unassigned students only (students without any active class enrollment)
        if ($request->boolean('unassigned_only')) {
            $query->whereDoesntHave('enrollments', function ($q) {
                $q->where('status', 'enrolled');
            });
        }
        
        // Filter by academic year
        if ($request->has('academic_year_id')) {
            $query->where('academic_year_id', $request->academic_year_id);
        }
        
        // Filter by enrollment status
        if ($request->has('enrollment_status')) {
            $status = strtolower((string) $request->enrollment_status);
            if ($status === 'enrolled') {
                $query->whereHas('enrollments', function ($q) {
                    $q->where('status', 'enrolled');
                });
            } elseif ($status === 'unassigned') {
                $query->whereDoesntHave('enrollments', function ($q) {
                    $q->where('status', 'enrolled');
                });
            } else {
                $query->where('enrollment_status', $request->enrollment_status);
            }
        }
        
        // Filter by account status
        if ($request->has('account_status')) {
            $query->where('account_status', $request->account_status);
        }
        
        // Sorting
        $sortBy = $request->get('sort_by', 'last_name');
        $sortOrder = $request->get('sort_order', 'asc');
        $query->orderBy($sortBy, $sortOrder);
        
        // Pagination
        $perPage = $request->get('per_page', 15);
        $students = $query->paginate($perPage);

        // Keep enrollment_status in sync with real active class enrollments.
        foreach ($students as $student) {
            $student->enrollment_status = ($student->active_enrollments_count ?? 0) > 0
                ? 'enrolled'
                : 'unassigned';
        }
        
        return response()->json($students);
    }

    /**
     * Store a newly created student
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'student_number' => 'required|unique:students,student_number',
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'date_of_birth' => 'nullable|date',
            'age' => 'nullable|integer|min:1|max:150',
            'email' => 'required|email|unique:students,email|unique:users,email',
            'personal_email' => 'nullable|email',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'program_id' => 'required|exists:programs,id',
            'section_id' => 'nullable|exists:sections,id',
            'grade_level' => 'required|string|max:255',
            'student_type' => 'required|in:new,transferee,returnee,old',
            'academic_year_id' => 'required|exists:academic_years,id',
            'academic_standing' => 'nullable|string|max:255',
            'date_enrolled' => 'nullable|date',
            'expected_graduation' => 'nullable|date',
            'password' => 'required|min:6',
            'account_status' => 'in:active,inactive',
            'emergency_contact' => 'nullable|string|max:255',
            'emergency_phone' => 'nullable|string|max:20',
            'profile_image' => 'nullable|image|mimes:jpeg,jpg,png,webp|max:10240',
        ]);

        // Validate program is active
        $program = \App\Models\Program::find($validated['program_id']);
        if (!$program || $program->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Student must be assigned to an active program'
            ], 422);
        }

        try {
            return DB::transaction(function () use ($validated) {
                // Handle profile image upload
                if (request()->hasFile('profile_image')) {
                    $image = request()->file('profile_image');
                    $imageName = time() . '_' . uniqid() . '.' . $image->getClientOriginalExtension();
                    $storedPath = $image->storeAs('uploads/students', $imageName, 'public');
                    $validated['profile_image'] = 'storage/' . $storedPath;
                }

                // Create User account first
                $user = User::create([
                    'name' => $validated['first_name'] . ' ' . $validated['last_name'],
                    'email' => $validated['email'],
                    'password' => bcrypt($validated['password']),
                    'role' => 'student',
                    'status' => $validated['account_status'] ?? 'active',
                    'phone' => $validated['phone'] ?? null,
                    'address' => $validated['address'] ?? null,
                ]);

                // Create Student record linked to User
                $studentData = $validated;
                $studentData['user_id'] = $user->id;
                $studentData['account_status'] = $validated['account_status'] ?? 'active';
                $studentData['enrollment_status'] = 'unassigned';
                unset($studentData['password']); // Don't store password in students table
                
                $student = Students::create($studentData);
                
                // Update User with back-reference to student
                $user->update(['student_id' => $student->id]);
                
                return response()->json([
                    'success' => true,
                    'message' => 'Student and login account created successfully',
                    'data' => $student->load('user', 'program', 'section')
                ], 201);
            });
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create student: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified student
     */
    public function show(Students $student)
    {
        return response()->json([
            'success' => true,
            'data' => $student->load(['user', 'program', 'section', 'academicYear'])
        ]);
    }

    /**
     * Update the specified student
     */
    public function update(Request $request, Students $student)
    {
        $validated = $request->validate([
            'first_name' => 'sometimes|string|max:255',
            'last_name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:students,email,' . $student->id,
            'personal_email' => 'nullable|email',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'program' => 'sometimes|string|max:255',
            'program_id' => 'sometimes|exists:programs,id',
            'grade_level' => 'sometimes|string|max:255',
            'section' => 'nullable|string|max:255',
            'section_id' => 'nullable|exists:sections,id',
            'academic_year' => 'sometimes|string|max:255',
            'academic_year_id' => 'sometimes|exists:academic_years,id',
            'academic_standing' => 'nullable|string|max:255',
            'date_enrolled' => 'nullable|date',
            'expected_graduation' => 'nullable|date',
            'account_status' => 'sometimes|in:active,inactive,disabled',
            'profile_image' => 'nullable|image|mimes:jpeg,jpg,png,webp|max:10240',
            'emergency_contact' => 'nullable|string|max:255',
            'emergency_phone' => 'nullable|string|max:20',
        ]);

        // Handle profile image upload
        if (request()->hasFile('profile_image')) {
            // Delete old image if exists
            if ($student->profile_image) {
                if (str_starts_with($student->profile_image, 'storage/')) {
                    Storage::disk('public')->delete(str_replace('storage/', '', $student->profile_image));
                } elseif (file_exists(public_path($student->profile_image))) {
                    unlink(public_path($student->profile_image));
                }
            }

            $image = request()->file('profile_image');
            $imageName = time() . '_' . uniqid() . '.' . $image->getClientOriginalExtension();
            $storedPath = $image->storeAs('uploads/students', $imageName, 'public');
            $validated['profile_image'] = 'storage/' . $storedPath;
        }

        $student->update($validated);
        
        return response()->json([
            'success' => true,
            'message' => 'Student updated successfully',
            'data' => $student
        ]);
    }

    /**
     * Remove the specified student
     */
    public function destroy(Students $student)
    {
        // Check for enrollments
        if ($student->enrollments()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete student with existing enrollments'
            ], 422);
        }
        
        $student->delete();
        
        return response()->json([
            'success' => true,
            'message' => 'Student deleted successfully'
        ]);
    }

    /**
     * Get student's enrollments
     */
    public function enrollments(Students $student, Request $request)
    {
        $query = Enrollment::where('student_id', $student->id)
            ->with(['class.subject', 'class.teacher', 'class.section']);
        
        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        $query->orderBy('created_at', 'desc');
        
        $perPage = $request->get('per_page', 15);
        $enrollments = $query->paginate($perPage);

        return response()->json($enrollments);
    }

    /**
     * Get student's grades
     */
    public function grades(Students $student, Request $request)
    {
        $query = Grade::where('student_id', $student->id)
            ->with(['class.subject', 'class.teacher', 'recorder']);
        
        // Filter by grading period
        if ($request->has('grading_period')) {
            $query->where('grading_period', $request->grading_period);
        }
        
        // Filter by class
        if ($request->has('class_id')) {
            $query->where('class_id', $request->class_id);
        }
        
        $query->orderBy('date_recorded', 'desc');
        
        $perPage = $request->get('per_page', 50);
        $grades = $query->paginate($perPage);

        // Calculate GPA
        $allGrades = Grade::where('student_id', $student->id)->get();
        $gpa = null;
        if ($allGrades->count() > 0) {
            $totalPercentage = $allGrades->sum(function ($g) {
                return ($g->score / $g->max_score) * 100;
            });
            $avgPercentage = $totalPercentage / $allGrades->count();
            $gpa = $this->convertToGradeScale($avgPercentage);
        }

        return response()->json([
            'grades' => $grades,
            'summary' => [
                'gpa' => $gpa,
                'total_grades' => $allGrades->count(),
            ]
        ]);
    }

    /**
     * Get student's attendance records
     */
    public function attendance(Students $student, Request $request)
    {
        $query = Attendance::where('student_id', $student->id)
            ->with(['class.subject', 'class.teacher']);
        
        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        // Filter by date range
        if ($request->has('from_date')) {
            $query->where('date', '>=', $request->from_date);
        }
        if ($request->has('to_date')) {
            $query->where('date', '<=', $request->to_date);
        }
        
        // Filter by class
        if ($request->has('class_id')) {
            $query->where('class_id', $request->class_id);
        }
        
        $query->orderBy('date', 'desc');
        
        $perPage = $request->get('per_page', 50);
        $attendance = $query->paginate($perPage);

        // Calculate summary
        $allAttendance = Attendance::where('student_id', $student->id)->get();
        $summary = [
            'total' => $allAttendance->count(),
            'present' => $allAttendance->where('status', 'present')->count(),
            'absent' => $allAttendance->where('status', 'absent')->count(),
            'late' => $allAttendance->where('status', 'late')->count(),
            'excused' => $allAttendance->where('status', 'excused')->count(),
        ];
        $summary['attendance_rate'] = $summary['total'] > 0 
            ? round((($summary['present'] + $summary['late']) / $summary['total']) * 100, 2) 
            : 0;

        return response()->json([
            'attendance' => $attendance,
            'summary' => $summary,
        ]);
    }

    /**
     * Get student's schedule
     */
    public function schedule(Students $student, Request $request)
    {
        // Get student's enrolled classes
        $classIds = Enrollment::where('student_id', $student->id)
            ->where('status', 'enrolled')
            ->pluck('class_id');

        $query = Schedule::whereIn('class_id', $classIds)
            ->with(['class.subject', 'class.teacher', 'class.section']);
        
        // Filter by day
        if ($request->has('day_of_week')) {
            $query->where('day_of_week', $request->day_of_week);
        }
        
        $query->orderBy('day_of_week')->orderBy('time_start');
        
        $schedules = $query->get();

        return response()->json([
            'success' => true,
            'data' => $schedules
        ]);
    }

    /**
     * Convert percentage to 1.0-5.0 grade scale
     */
    private function convertToGradeScale($percentage)
    {
        if ($percentage >= 97) return 1.0;
        if ($percentage >= 94) return 1.25;
        if ($percentage >= 91) return 1.5;
        if ($percentage >= 88) return 1.75;
        if ($percentage >= 85) return 2.0;
        if ($percentage >= 82) return 2.25;
        if ($percentage >= 79) return 2.5;
        if ($percentage >= 76) return 2.75;
        if ($percentage >= 75) return 3.0;
        return 5.0;
    }
}
