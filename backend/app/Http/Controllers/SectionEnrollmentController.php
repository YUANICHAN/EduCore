<?php

namespace App\Http\Controllers;

use App\Models\SectionEnrollment;
use App\Models\Section;
use App\Models\Students;
use App\Models\AcademicYear;
use App\Models\Program;
use App\Models\Subject;
use App\Models\Classes;
use App\Models\Enrollment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SectionEnrollmentController extends Controller
{
    /**
     * Display a listing of section enrollments
     */
    public function index(Request $request)
    {
        $query = SectionEnrollment::with(['student', 'section', 'academicYear', 'program']);
        
        // Filter by student
        if ($request->has('student_id')) {
            $query->where('student_id', $request->student_id);
        }
        
        // Filter by section
        if ($request->has('section_id')) {
            $query->where('section_id', $request->section_id);
        }
        
        // Filter by academic year
        if ($request->has('academic_year_id')) {
            $query->where('academic_year_id', $request->academic_year_id);
        }
        
        // Filter by program
        if ($request->has('program_id')) {
            $query->where('program_id', $request->program_id);
        }
        
        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        // Search by student name
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
     * Enroll a student in a section
     * This will:
     * 1. Create section enrollment
     * 2. Auto-load all subjects for the program/year level
     * 3. Create class enrollments for each subject
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'section_id' => 'required|exists:sections,id',
            'enrollment_date' => 'required|date',
            'remarks' => 'nullable|string',
        ]);

        try {
            return DB::transaction(function () use ($validated) {
                // Get student and validate
                $student = Students::with('program')->findOrFail($validated['student_id']);
                
                if (!$student->program_id) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Student must be assigned to a program before enrollment'
                    ], 422);
                }
                
                if ($student->account_status !== 'active') {
                    return response()->json([
                        'success' => false,
                        'message' => 'Student account is not active'
                    ], 422);
                }
                
                // Get section and validate
                $section = Section::with(['program', 'academicYear'])->findOrFail($validated['section_id']);
                
                if ($section->status !== 'active') {
                    return response()->json([
                        'success' => false,
                        'message' => 'Section is not active'
                    ], 422);
                }
                
                // Check if section belongs to the same program
                if ($section->program_id !== $student->program_id) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Section does not belong to student\'s program'
                    ], 422);
                }
                
                // Check if section has available slots
                if (!$section->hasAvailableSlots()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Section has reached maximum capacity'
                    ], 422);
                }
                
                // Check if academic year is active
                if (!$section->academicYear || !$section->academicYear->is_current) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Academic year is not currently active'
                    ], 422);
                }
                
                // Check for duplicate enrollment
                $exists = SectionEnrollment::where('student_id', $student->id)
                    ->where('section_id', $section->id)
                    ->where('academic_year_id', $section->academic_year_id)
                    ->exists();
                
                if ($exists) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Student is already enrolled in this section for this academic year'
                    ], 422);
                }
                
                // Check if student is already enrolled in another section for this academic year
                $otherEnrollment = SectionEnrollment::where('student_id', $student->id)
                    ->where('academic_year_id', $section->academic_year_id)
                    ->where('status', 'enrolled')
                    ->exists();
                
                if ($otherEnrollment) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Student is already enrolled in another section for this academic year'
                    ], 422);
                }
                
                // Create section enrollment
                $sectionEnrollment = SectionEnrollment::create([
                    'student_id' => $student->id,
                    'section_id' => $section->id,
                    'academic_year_id' => $section->academic_year_id,
                    'program_id' => $student->program_id,
                    'year_level' => $section->grade_level,
                    'enrollment_date' => $validated['enrollment_date'],
                    'status' => 'enrolled',
                    'remarks' => $validated['remarks'] ?? null,
                ]);
                
                // Auto-load subjects based on program curriculum
                $subjects = Subject::where('program_id', $student->program_id)
                    ->where('grade_level', $section->grade_level)
                    ->where('semester', $section->academicYear->semester)
                    ->where('status', 'active')
                    ->get();
                
                $enrolledClasses = [];
                $notFoundSubjects = [];
                
                foreach ($subjects as $subject) {
                    // Find the class for this subject in this section
                    $class = Classes::where('subject_id', $subject->id)
                        ->where('section_id', $section->id)
                        ->where('academic_year_id', $section->academic_year_id)
                        ->where('status', 'active')
                        ->first();
                    
                    if ($class) {
                        // Check class capacity
                        if ($class->enrolled_count < $class->capacity) {
                            // Create class enrollment
                            Enrollment::create([
                                'student_id' => $student->id,
                                'class_id' => $class->id,
                                'section_enrollment_id' => $sectionEnrollment->id,
                                'enrollment_date' => $validated['enrollment_date'],
                                'status' => 'enrolled',
                            ]);
                            
                            // Increment enrolled count
                            $class->increment('enrolled_count');
                            
                            $enrolledClasses[] = [
                                'subject_code' => $subject->subject_code,
                                'subject_name' => $subject->subject_name,
                                'class_code' => $class->class_code,
                            ];
                        } else {
                            $notFoundSubjects[] = [
                                'subject_code' => $subject->subject_code,
                                'subject_name' => $subject->subject_name,
                                'reason' => 'Class is full',
                            ];
                        }
                    } else {
                        $notFoundSubjects[] = [
                            'subject_code' => $subject->subject_code,
                            'subject_name' => $subject->subject_name,
                            'reason' => 'No class available for this subject in this section',
                        ];
                    }
                }
                
                // Update student record
                $student->update([
                    'section_id' => $section->id,
                    'enrollment_status' => 'enrolled',
                ]);
                
                return response()->json([
                    'success' => true,
                    'message' => 'Student enrolled successfully',
                    'data' => [
                        'section_enrollment' => $sectionEnrollment->load(['student', 'section', 'academicYear', 'program']),
                        'enrolled_classes_count' => count($enrolledClasses),
                        'enrolled_classes' => $enrolledClasses,
                        'not_enrolled_subjects' => $notFoundSubjects,
                        'total_subjects' => $subjects->count(),
                    ]
                ], 201);
            });
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to enroll student: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified section enrollment
     */
    public function show(SectionEnrollment $sectionEnrollment)
    {
        return response()->json([
            'success' => true,
            'data' => $sectionEnrollment->load([
                'student',
                'section',
                'academicYear',
                'program',
                'classEnrollments.class.subject'
            ])
        ]);
    }

    /**
     * Update the specified section enrollment
     */
    public function update(Request $request, SectionEnrollment $sectionEnrollment)
    {
        $validated = $request->validate([
            'status' => 'in:enrolled,dropped,transferred,completed',
            'remarks' => 'nullable|string',
        ]);

        // Handle status changes
        if (isset($validated['status']) && $validated['status'] !== $sectionEnrollment->status) {
            if ($validated['status'] === 'dropped') {
                // Drop all class enrollments
                $sectionEnrollment->classEnrollments()->update(['status' => 'dropped']);
                
                // Update student record
                $sectionEnrollment->student->update([
                    'section_id' => null,
                    'enrollment_status' => 'unassigned',
                ]);
            }
        }

        $sectionEnrollment->update($validated);
        
        return response()->json([
            'success' => true,
            'message' => 'Section enrollment updated successfully',
            'data' => $sectionEnrollment->load(['student', 'section', 'academicYear', 'program'])
        ]);
    }

    /**
     * Drop a student from section
     */
    public function drop(SectionEnrollment $sectionEnrollment)
    {
        try {
            DB::transaction(function () use ($sectionEnrollment) {
                // Drop all class enrollments
                foreach ($sectionEnrollment->classEnrollments as $enrollment) {
                    if ($enrollment->status === 'enrolled') {
                        $enrollment->update(['status' => 'dropped']);
                        $enrollment->class->decrement('enrolled_count');
                    }
                }
                
                // Update section enrollment
                $sectionEnrollment->update(['status' => 'dropped']);
                
                // Update student record
                $sectionEnrollment->student->update([
                    'section_id' => null,
                    'enrollment_status' => 'unassigned',
                ]);
            });
            
            return response()->json([
                'success' => true,
                'message' => 'Student dropped from section successfully',
                'data' => $sectionEnrollment
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to drop student: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified section enrollment
     */
    public function destroy(SectionEnrollment $sectionEnrollment)
    {
        // Check if there are grades recorded
        $hasGrades = false;
        foreach ($sectionEnrollment->classEnrollments as $enrollment) {
            if ($enrollment->grades()->count() > 0) {
                $hasGrades = true;
                break;
            }
        }
        
        if ($hasGrades) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete enrollment with existing grades. Consider dropping instead.'
            ], 422);
        }
        
        try {
            DB::transaction(function () use ($sectionEnrollment) {
                // Delete all class enrollments
                foreach ($sectionEnrollment->classEnrollments as $enrollment) {
                    if ($enrollment->status === 'enrolled') {
                        $enrollment->class->decrement('enrolled_count');
                    }
                    $enrollment->delete();
                }
                
                // Delete section enrollment
                $sectionEnrollment->delete();
                
                // Update student record
                Students::where('id', $sectionEnrollment->student_id)->update([
                    'section_id' => null,
                    'enrollment_status' => 'unassigned',
                ]);
            });
            
            return response()->json([
                'success' => true,
                'message' => 'Section enrollment deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete enrollment: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bulk enroll students in a section
     */
    public function bulkEnroll(Request $request)
    {
        $validated = $request->validate([
            'section_id' => 'required|exists:sections,id',
            'student_ids' => 'required|array|min:1',
            'student_ids.*' => 'required|exists:students,id',
            'enrollment_date' => 'required|date',
        ]);

        $results = [
            'success' => [],
            'failed' => [],
        ];

        foreach ($validated['student_ids'] as $studentId) {
            try {
                $response = $this->store(new Request([
                    'student_id' => $studentId,
                    'section_id' => $validated['section_id'],
                    'enrollment_date' => $validated['enrollment_date'],
                ]));
                
                $data = json_decode($response->getContent(), true);
                
                if ($data['success']) {
                    $results['success'][] = [
                        'student_id' => $studentId,
                        'data' => $data['data']
                    ];
                } else {
                    $results['failed'][] = [
                        'student_id' => $studentId,
                        'message' => $data['message']
                    ];
                }
            } catch (\Exception $e) {
                $results['failed'][] = [
                    'student_id' => $studentId,
                    'message' => $e->getMessage()
                ];
            }
        }

        return response()->json([
            'success' => true,
            'message' => count($results['success']) . ' students enrolled successfully',
            'total' => count($validated['student_ids']),
            'enrolled' => count($results['success']),
            'failed' => count($results['failed']),
            'data' => $results
        ]);
    }
}
