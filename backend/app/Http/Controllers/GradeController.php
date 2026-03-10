<?php

namespace App\Http\Controllers;

use App\Models\Grade;
use App\Models\Enrollment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GradeController extends Controller
{
    /**
     * Display a paginated listing of grades
     */
    public function index(Request $request)
    {
        $query = Grade::with(['enrollment', 'student', 'class.subject', 'recorder']);
        
        // Filter by student
        if ($request->has('student_id')) {
            $query->where('student_id', $request->student_id);
        }
        
        // Filter by class
        if ($request->has('class_id')) {
            $query->where('class_id', $request->class_id);
        }
        
        // Filter by enrollment
        if ($request->has('enrollment_id')) {
            $query->where('enrollment_id', $request->enrollment_id);
        }
        
        // Filter by grading period
        if ($request->has('grading_period')) {
            $query->where('grading_period', $request->grading_period);
        }
        
        // Filter by component type
        if ($request->has('component_type')) {
            $query->where('component_type', $request->component_type);
        }
        
        // Sorting
        $sortBy = $request->get('sort_by', 'date_recorded');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);
        
        // Pagination
        $perPage = $request->get('per_page', 15);
        $grades = $query->paginate($perPage);
        
        return response()->json($grades);
    }

    /**
     * Store a newly created grade
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'enrollment_id' => 'required|exists:enrollments,id',
            'student_id' => 'required|exists:students,id',
            'class_id' => 'required|exists:classes,id',
            'grading_period' => 'required|in:prelim,midterm,finals',
            'component_type' => 'required|in:quiz,exam,project,assignment,participation,other',
            'component_name' => 'required|string|max:255',
            'score' => 'required|numeric|min:0',
            'max_score' => 'required|numeric|min:0|gte:score',
            'percentage_weight' => 'nullable|numeric|min:0|max:100',
            'date_recorded' => 'required|date',
            'recorded_by' => 'required|exists:teachers,id',
            'remarks' => 'nullable|string',
        ]);

        // Verify enrollment matches student and class
        $enrollment = Enrollment::find($validated['enrollment_id']);
        if ($enrollment->student_id != $validated['student_id'] || 
            $enrollment->class_id != $validated['class_id']) {
            return response()->json([
                'success' => false,
                'message' => 'Enrollment does not match student and class'
            ], 422);
        }

        $grade = Grade::create($validated);
        
        // Update enrollment grades if needed
        $this->updateEnrollmentGrades($validated['enrollment_id']);
        
        return response()->json([
            'success' => true,
            'message' => 'Grade recorded successfully',
            'data' => $grade->load(['enrollment', 'student', 'class.subject', 'recorder'])
        ], 201);
    }

    /**
     * Display the specified grade
     */
    public function show(Grade $grade)
    {
        return response()->json([
            'success' => true,
            'data' => $grade->load(['enrollment', 'student', 'class.subject', 'recorder'])
        ]);
    }

    /**
     * Update the specified grade
     */
    public function update(Request $request, Grade $grade)
    {
        // Check if grade is locked
        if ($grade->is_locked) {
            return response()->json([
                'success' => false,
                'message' => 'This grade is locked and cannot be modified. Contact an administrator to unlock it.'
            ], 403);
        }

        $validated = $request->validate([
            'enrollment_id' => 'exists:enrollments,id',
            'student_id' => 'exists:students,id',
            'class_id' => 'exists:classes,id',
            'grading_period' => 'in:prelim,midterm,finals',
            'component_type' => 'in:quiz,exam,project,assignment,participation,other',
            'component_name' => 'string|max:255',
            'score' => 'numeric|min:0',
            'max_score' => 'numeric|min:0',
            'percentage_weight' => 'nullable|numeric|min:0|max:100',
            'date_recorded' => 'date',
            'recorded_by' => 'exists:teachers,id',
            'remarks' => 'nullable|string',
        ]);

        // Validate score <= max_score
        $score = $validated['score'] ?? $grade->score;
        $maxScore = $validated['max_score'] ?? $grade->max_score;
        if ($score > $maxScore) {
            return response()->json([
                'success' => false,
                'message' => 'Score cannot be greater than max score'
            ], 422);
        }

        $grade->update($validated);
        
        // Update enrollment grades
        $this->updateEnrollmentGrades($grade->enrollment_id);
        
        return response()->json([
            'success' => true,
            'message' => 'Grade updated successfully',
            'data' => $grade->load(['enrollment', 'student', 'class.subject', 'recorder'])
        ]);
    }

    /**
     * Remove the specified grade
     */
    public function destroy(Grade $grade)
    {
        // Check if grade is locked
        if ($grade->is_locked) {
            return response()->json([
                'success' => false,
                'message' => 'This grade is locked and cannot be deleted. Contact an administrator to unlock it.'
            ], 403);
        }

        $enrollmentId = $grade->enrollment_id;
        $grade->delete();
        
        // Update enrollment grades
        $this->updateEnrollmentGrades($enrollmentId);
        
        return response()->json([
            'success' => true,
            'message' => 'Grade deleted successfully'
        ]);
    }

    /**
     * Lock a grade (prevents modifications)
     */
    public function lock(Request $request, Grade $grade)
    {
        if ($grade->is_locked) {
            return response()->json([
                'success' => false,
                'message' => 'Grade is already locked'
            ], 422);
        }

        $grade->lock($request->user()->id);

        return response()->json([
            'success' => true,
            'message' => 'Grade locked successfully',
            'data' => $grade->fresh(['enrollment', 'student', 'class.subject', 'recorder', 'locker'])
        ]);
    }

    /**
     * Unlock a grade (admin only)
     */
    public function unlock(Request $request, Grade $grade)
    {
        // Check if user is admin
        if ($request->user()->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Only administrators can unlock grades'
            ], 403);
        }

        if (!$grade->is_locked) {
            return response()->json([
                'success' => false,
                'message' => 'Grade is not locked'
            ], 422);
        }

        $grade->unlock();

        return response()->json([
            'success' => true,
            'message' => 'Grade unlocked successfully',
            'data' => $grade->fresh(['enrollment', 'student', 'class.subject', 'recorder'])
        ]);
    }

    /**
     * Lock all grades for a class and grading period
     */
    public function lockByPeriod(Request $request)
    {
        $validated = $request->validate([
            'class_id' => 'required|exists:classes,id',
            'grading_period' => 'required|in:prelim,midterm,finals',
        ]);

        $count = Grade::where('class_id', $validated['class_id'])
            ->where('grading_period', $validated['grading_period'])
            ->where('is_locked', false)
            ->update([
                'is_locked' => true,
                'locked_at' => now(),
                'locked_by' => $request->user()->id,
            ]);

        return response()->json([
            'success' => true,
            'message' => "{$count} grades locked successfully",
            'locked_count' => $count
        ]);
    }

    /**
     * Create multiple grades at once
     */
    public function bulkCreate(Request $request)
    {
        $validated = $request->validate([
            'grades' => 'required|array|min:1',
            'grades.*.enrollment_id' => 'required|exists:enrollments,id',
            'grades.*.student_id' => 'required|exists:students,id',
            'grades.*.class_id' => 'required|exists:classes,id',
            'grades.*.grading_period' => 'required|in:prelim,midterm,finals',
            'grades.*.component_type' => 'required|in:quiz,exam,project,assignment,participation,other',
            'grades.*.component_name' => 'required|string|max:255',
            'grades.*.score' => 'required|numeric|min:0',
            'grades.*.max_score' => 'required|numeric|min:0',
            'grades.*.percentage_weight' => 'nullable|numeric|min:0|max:100',
            'grades.*.remarks' => 'nullable|string',
        ]);

        $created = [];
        $errors = [];
        $enrollmentIds = [];

        DB::beginTransaction();
        try {
            foreach ($validated['grades'] as $index => $gradeData) {
                // Validate score <= max_score
                if ($gradeData['score'] > $gradeData['max_score']) {
                    $errors[] = "Grade at index {$index}: Score cannot be greater than max score";
                    continue;
                }

                $gradeData['recorded_by'] = $request->user()->teacher_id ?? $request->user()->id;
                $gradeData['date_recorded'] = now();
                
                $grade = Grade::create($gradeData);
                $created[] = $grade;
                $enrollmentIds[] = $gradeData['enrollment_id'];
            }

            if (!empty($errors)) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Some grades could not be created',
                    'errors' => $errors
                ], 422);
            }

            // Update enrollment grades for all affected enrollments
            foreach (array_unique($enrollmentIds) as $enrollmentId) {
                $this->updateEnrollmentGrades($enrollmentId);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => count($created) . ' grades created successfully',
                'data' => $created
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create grades: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get grades for a specific student
     */
    public function byStudent($studentId, Request $request)
    {
        $query = Grade::where('student_id', $studentId)
            ->with(['class.subject', 'enrollment', 'recorder']);
        
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
        
        // Calculate summary
        $allGrades = Grade::where('student_id', $studentId)->get();
        $summary = $this->calculateGradeSummary($allGrades);
        
        return response()->json([
            'grades' => $grades,
            'summary' => $summary
        ]);
    }

    /**
     * Get grades for a specific class
     */
    public function byClass($classId, Request $request)
    {
        $query = Grade::where('class_id', $classId)
            ->with(['student', 'enrollment', 'recorder']);
        
        // Filter by grading period
        if ($request->has('grading_period')) {
            $query->where('grading_period', $request->grading_period);
        }
        
        // Filter by component type
        if ($request->has('component_type')) {
            $query->where('component_type', $request->component_type);
        }
        
        $query->orderBy('student_id')->orderBy('date_recorded', 'desc');
        
        $perPage = $request->get('per_page', 50);
        $grades = $query->paginate($perPage);
        
        return response()->json($grades);
    }

    /**
     * Update enrollment midterm and final grades
     */
    private function updateEnrollmentGrades($enrollmentId)
    {
        $enrollment = Enrollment::find($enrollmentId);
        if (!$enrollment) return;

        // Calculate midterm grade
        $midtermGrades = Grade::where('enrollment_id', $enrollmentId)
            ->whereIn('grading_period', ['prelim', 'midterm'])
            ->get();
        
        if ($midtermGrades->count() > 0) {
            $midtermAvg = $midtermGrades->sum(function ($g) {
                return ($g->score / $g->max_score) * 100 * ($g->percentage_weight / 100 ?: 1);
            }) / $midtermGrades->sum('percentage_weight') * 100;
            
            // Convert to 1.0-5.0 scale (rough conversion)
            $enrollment->midterm_grade = $this->convertToGradeScale($midtermAvg);
        }

        // Calculate final grade
        $allGrades = Grade::where('enrollment_id', $enrollmentId)->get();
        if ($allGrades->count() > 0) {
            $totalWeight = $allGrades->sum('percentage_weight') ?: $allGrades->count();
            $weightedSum = $allGrades->sum(function ($g) {
                $weight = $g->percentage_weight ?: 1;
                return ($g->score / $g->max_score) * 100 * $weight;
            });
            
            $finalAvg = $weightedSum / $totalWeight;
            $enrollment->final_grade = $this->convertToGradeScale($finalAvg);
        }

        $enrollment->save();
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

    /**
     * Calculate grade summary for a student
     */
    private function calculateGradeSummary($grades)
    {
        if ($grades->isEmpty()) {
            return [
                'total_grades' => 0,
                'average_percentage' => 0,
                'gpa' => null
            ];
        }

        $totalPercentage = $grades->sum(function ($g) {
            return ($g->score / $g->max_score) * 100;
        });
        
        $avgPercentage = $totalPercentage / $grades->count();
        
        return [
            'total_grades' => $grades->count(),
            'average_percentage' => round($avgPercentage, 2),
            'gpa' => $this->convertToGradeScale($avgPercentage),
            'by_period' => [
                'prelim' => $grades->where('grading_period', 'prelim')->count(),
                'midterm' => $grades->where('grading_period', 'midterm')->count(),
                'finals' => $grades->where('grading_period', 'finals')->count(),
            ],
            'by_type' => [
                'quiz' => $grades->where('component_type', 'quiz')->count(),
                'exam' => $grades->where('component_type', 'exam')->count(),
                'project' => $grades->where('component_type', 'project')->count(),
                'assignment' => $grades->where('component_type', 'assignment')->count(),
            ]
        ];
    }
}
