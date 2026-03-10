<?php

namespace App\Http\Controllers;

use App\Models\Enrollment;
use App\Models\Classes;
use Illuminate\Http\Request;

class EnrollmentController extends Controller
{
    /**
     * Display a paginated listing of enrollments
     */
    public function index(Request $request)
    {
        $query = Enrollment::with(['student', 'class.subject', 'class.teacher', 'class.section']);
        
        // Filter by student
        if ($request->has('student_id')) {
            $query->where('student_id', $request->student_id);
        }
        
        // Filter by class
        if ($request->has('class_id')) {
            $query->where('class_id', $request->class_id);
        }
        
        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        // Filter by date range
        if ($request->has('from_date')) {
            $query->where('enrollment_date', '>=', $request->from_date);
        }
        if ($request->has('to_date')) {
            $query->where('enrollment_date', '<=', $request->to_date);
        }
        
        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->whereHas('student', function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('student_number', 'like', "%{$search}%");
            });
        }
        
        // Sorting
        $sortBy = $request->get('sort_by', 'enrollment_date');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);
        
        // Pagination
        $perPage = $request->get('per_page', 15);
        $enrollments = $query->paginate($perPage);
        
        return response()->json($enrollments);
    }

    /**
     * Store a newly created enrollment
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'class_id' => 'required|exists:classes,id',
            'enrollment_date' => 'required|date',
            'status' => 'in:enrolled,dropped,completed',
            'remarks' => 'nullable|string',
        ]);

        // Check for duplicate enrollment
        $exists = Enrollment::where('student_id', $validated['student_id'])
            ->where('class_id', $validated['class_id'])
            ->exists();
        
        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => 'Student is already enrolled in this class'
            ], 422);
        }

        // Check class capacity
        $class = Classes::find($validated['class_id']);
        if ($class->enrolled_count >= $class->capacity) {
            return response()->json([
                'success' => false,
                'message' => 'Class has reached maximum capacity'
            ], 422);
        }

        $validated['status'] = $validated['status'] ?? 'enrolled';

        $enrollment = Enrollment::create($validated);
        
        // Update enrolled count
        $class->increment('enrolled_count');
        
        // Update student enrollment status
        \App\Models\Students::where('id', $validated['student_id'])
            ->update(['enrollment_status' => 'enrolled']);
        
        return response()->json([
            'success' => true,
            'message' => 'Enrollment created successfully',
            'data' => $enrollment->load(['student', 'class.subject', 'class.teacher'])
        ], 201);
    }

    /**
     * Display the specified enrollment
     */
    public function show(Enrollment $enrollment)
    {
        return response()->json([
            'success' => true,
            'data' => $enrollment->load(['student', 'class.subject', 'class.teacher', 'class.section'])
        ]);
    }

    /**
     * Update the specified enrollment
     */
    public function update(Request $request, Enrollment $enrollment)
    {
        $validated = $request->validate([
            'student_id' => 'exists:students,id',
            'class_id' => 'exists:classes,id',
            'enrollment_date' => 'date',
            'status' => 'in:enrolled,dropped,completed',
            'midterm_grade' => 'nullable|numeric|min:0|max:5',
            'final_grade' => 'nullable|numeric|min:0|max:5',
            'remarks' => 'nullable|string',
        ]);

        // Handle status changes
        $oldStatus = $enrollment->status;
        $newStatus = $validated['status'] ?? $oldStatus;
        
        if ($oldStatus !== $newStatus) {
            $class = $enrollment->class;
            
            if ($oldStatus === 'enrolled' && $newStatus !== 'enrolled') {
                // Decrement enrolled count when dropping/completing
                $class->decrement('enrolled_count');
            } elseif ($oldStatus !== 'enrolled' && $newStatus === 'enrolled') {
                // Check capacity when re-enrolling
                if ($class->enrolled_count >= $class->capacity) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Class has reached maximum capacity'
                    ], 422);
                }
                $class->increment('enrolled_count');
            }
        }

        $enrollment->update($validated);
        
        return response()->json([
            'success' => true,
            'message' => 'Enrollment updated successfully',
            'data' => $enrollment->load(['student', 'class.subject', 'class.teacher'])
        ]);
    }

    /**
     * Remove the specified enrollment
     */
    public function destroy(Enrollment $enrollment)
    {
        // Check for grades
        if ($enrollment->grades()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete enrollment with existing grades. Consider dropping instead.'
            ], 422);
        }
        
        // Update enrolled count if was enrolled
        if ($enrollment->status === 'enrolled') {
            $enrollment->class->decrement('enrolled_count');
        }
        
        $enrollment->delete();
        
        return response()->json([
            'success' => true,
            'message' => 'Enrollment deleted successfully'
        ]);
    }

    /**
     * Drop an enrollment
     */
    public function drop(Enrollment $enrollment)
    {
        if ($enrollment->status !== 'enrolled') {
            return response()->json([
                'success' => false,
                'message' => 'Only enrolled students can be dropped'
            ], 422);
        }
        
        $enrollment->update(['status' => 'dropped']);
        $enrollment->class->decrement('enrolled_count');
        
        return response()->json([
            'success' => true,
            'message' => 'Enrollment dropped successfully',
            'data' => $enrollment->load(['student', 'class.subject'])
        ]);
    }

    /**
     * Bulk enroll students in a class
     */
    public function bulkEnroll(Request $request)
    {
        $validated = $request->validate([
            'class_id' => 'required|exists:classes,id',
            'student_ids' => 'required|array|min:1',
            'student_ids.*' => 'exists:students,id',
        ]);

        $class = Classes::find($validated['class_id']);
        $studentIds = $validated['student_ids'];
        
        // Check capacity
        $currentEnrolled = Enrollment::where('class_id', $class->id)
            ->where('status', 'enrolled')
            ->count();
        
        $availableSlots = $class->capacity - $currentEnrolled;
        if (count($studentIds) > $availableSlots) {
            return response()->json([
                'success' => false,
                'message' => "Only {$availableSlots} slots available. Tried to enroll " . count($studentIds) . " students."
            ], 422);
        }

        $enrolled = 0;
        $duplicates = 0;
        $errors = [];

        foreach ($studentIds as $studentId) {
            // Check for duplicate enrollment
            $exists = Enrollment::where('student_id', $studentId)
                ->where('class_id', $class->id)
                ->exists();
            
            if ($exists) {
                $duplicates++;
                continue;
            }

            try {
                Enrollment::create([
                    'student_id' => $studentId,
                    'class_id' => $class->id,
                    'enrollment_date' => now()->toDateString(),
                    'status' => 'enrolled',
                ]);
                
                // Update student enrollment status
                \App\Models\Students::where('id', $studentId)
                    ->update(['enrollment_status' => 'enrolled']);
                
                $enrolled++;
            } catch (\Exception $e) {
                $errors[] = "Student ID {$studentId}: " . $e->getMessage();
            }
        }

        // Update class enrolled count
        $class->increment('enrolled_count', $enrolled);

        return response()->json([
            'success' => true,
            'message' => "Enrolled {$enrolled} student(s)" . ($duplicates > 0 ? ", {$duplicates} already enrolled" : ''),
            'data' => [
                'enrolled_count' => $enrolled,
                'duplicate_count' => $duplicates,
                'errors' => $errors,
            ]
        ], 201);
    }

    /**
     * Remove student from class (delete enrollment by student_id and class_id)
     */
    public function remove(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'class_id' => 'required|exists:classes,id',
        ]);

        $enrollment = Enrollment::where('student_id', $validated['student_id'])
            ->where('class_id', $validated['class_id'])
            ->first();

        if (!$enrollment) {
            return response()->json([
                'success' => false,
                'message' => 'Enrollment not found'
            ], 404);
        }

        // Check for grades
        if ($enrollment->grades()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete enrollment with existing grades. Consider dropping instead.'
            ], 422);
        }

        // Update enrolled count if was enrolled
        if ($enrollment->status === 'enrolled') {
            $enrollment->class->decrement('enrolled_count');
        }

        $enrollment->delete();
        
        // Check if student has any other enrollments, if not update status to unassigned
        $studentId = $enrollment->student_id;
        $hasOtherEnrollments = Enrollment::where('student_id', $studentId)
            ->where('status', 'enrolled')
            ->exists();
        
        if (!$hasOtherEnrollments) {
            \App\Models\Students::where('id', $studentId)
                ->update(['enrollment_status' => 'unassigned']);
        }

        return response()->json([
            'success' => true,
            'message' => 'Student removed from class successfully'
        ]);
    }
}
