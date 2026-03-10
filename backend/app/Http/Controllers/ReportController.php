<?php

namespace App\Http\Controllers;

use App\Models\Report;
use App\Models\Students;
use App\Models\Teachers;
use App\Models\Classes;
use App\Models\Enrollment;
use App\Models\Grade;
use App\Models\Attendance;
use App\Models\AcademicYear;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    /**
     * Display a paginated listing of reports
     */
    public function index(Request $request)
    {
        $query = Report::with(['generator', 'student', 'teacher', 'class.subject', 'academicYear']);
        
        // Filter by report type
        if ($request->has('report_type')) {
            $query->where('report_type', $request->report_type);
        }
        
        // Filter by student
        if ($request->has('for_student_id')) {
            $query->where('for_student_id', $request->for_student_id);
        }
        
        // Filter by teacher
        if ($request->has('for_teacher_id')) {
            $query->where('for_teacher_id', $request->for_teacher_id);
        }
        
        // Filter by class
        if ($request->has('for_class_id')) {
            $query->where('for_class_id', $request->for_class_id);
        }
        
        // Filter by academic year
        if ($request->has('academic_year_id')) {
            $query->where('academic_year_id', $request->academic_year_id);
        }
        
        // Filter by generator
        if ($request->has('generated_by')) {
            $query->where('generated_by', $request->generated_by);
        }
        
        // Search in data JSON
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereRaw("JSON_EXTRACT(data, '$.title') LIKE ?", ["%{$search}%"])
                  ->orWhereRaw("JSON_EXTRACT(data, '$.content') LIKE ?", ["%{$search}%"]);
            });
        }
        
        // Sorting
        $sortBy = $request->get('sort_by', 'generated_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);
        
        // Pagination
        $perPage = $request->get('per_page', 15);
        $reports = $query->paginate($perPage);
        
        return response()->json($reports);
    }

    /**
     * Store a newly created report
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'report_type' => 'required|in:grade_report,attendance_report,performance_report,class_report,other',
            'generated_by' => 'required|exists:users,id',
            'for_student_id' => 'nullable|exists:students,id',
            'for_teacher_id' => 'nullable|exists:teachers,id',
            'for_class_id' => 'nullable|exists:classes,id',
            'academic_year_id' => 'required|exists:academic_years,id',
            'data' => 'nullable|array',
            'file_path' => 'nullable|string|max:500',
        ]);

        // Set generated_at
        $validated['generated_at'] = now();

        $report = Report::create($validated);
        
        return response()->json([
            'success' => true,
            'message' => 'Report created successfully',
            'data' => $report->load(['generator', 'student', 'teacher', 'class.subject', 'academicYear'])
        ], 201);
    }

    /**
     * Display the specified report
     */
    public function show(Report $report)
    {
        return response()->json([
            'success' => true,
            'data' => $report->load(['generator', 'student', 'teacher', 'class.subject', 'academicYear'])
        ]);
    }

    /**
     * Update the specified report
     */
    public function update(Request $request, Report $report)
    {
        $validated = $request->validate([
            'report_type' => 'in:grade_report,attendance_report,performance_report,class_report,other',
            'generated_by' => 'exists:users,id',
            'for_student_id' => 'nullable|exists:students,id',
            'for_teacher_id' => 'nullable|exists:teachers,id',
            'for_class_id' => 'nullable|exists:classes,id',
            'academic_year_id' => 'exists:academic_years,id',
            'data' => 'nullable|array',
            'file_path' => 'nullable|string|max:500',
        ]);

        $report->update($validated);
        
        return response()->json([
            'success' => true,
            'message' => 'Report updated successfully',
            'data' => $report->load(['generator', 'student', 'teacher', 'class.subject', 'academicYear'])
        ]);
    }

    /**
     * Remove the specified report
     */
    public function destroy(Report $report)
    {
        // Delete associated file if exists
        if ($report->file_path && file_exists(storage_path('app/' . $report->file_path))) {
            unlink(storage_path('app/' . $report->file_path));
        }
        
        $report->delete();
        
        return response()->json([
            'success' => true,
            'message' => 'Report deleted successfully'
        ]);
    }

    /**
     * Get reports for a specific student
     */
    public function byStudent($studentId, Request $request)
    {
        $query = Report::where('for_student_id', $studentId)
            ->with(['generator', 'class.subject', 'academicYear']);
        
        // Filter by type
        if ($request->has('report_type')) {
            $query->where('report_type', $request->report_type);
        }
        
        // Filter by academic year
        if ($request->has('academic_year_id')) {
            $query->where('academic_year_id', $request->academic_year_id);
        }
        
        $query->orderBy('generated_at', 'desc');
        
        $perPage = $request->get('per_page', 15);
        $reports = $query->paginate($perPage);
        
        return response()->json($reports);
    }

    /**
     * Generate a grade report for a student
     */
    public function generateGradeReport(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'academic_year_id' => 'required|exists:academic_years,id',
            'grading_period' => 'nullable|in:prelim,midterm,finals,all',
        ]);

        $student = Students::find($validated['student_id']);
        $academicYear = AcademicYear::find($validated['academic_year_id']);
        $gradingPeriod = $validated['grading_period'] ?? 'all';

        // Get enrollments for this academic year
        $enrollments = Enrollment::where('student_id', $student->id)
            ->whereHas('class', function ($q) use ($validated) {
                $q->where('academic_year_id', $validated['academic_year_id']);
            })
            ->with(['class.subject', 'class.teacher'])
            ->get();

        $reportData = [
            'title' => "Grade Report - {$student->first_name} {$student->last_name}",
            'student' => [
                'id' => $student->id,
                'name' => "{$student->first_name} {$student->last_name}",
                'student_number' => $student->student_number,
                'program' => $student->program,
                'grade_level' => $student->grade_level,
            ],
            'academic_year' => $academicYear->year_code,
            'grading_period' => $gradingPeriod,
            'generated_at' => now()->toDateTimeString(),
            'subjects' => [],
            'summary' => [],
        ];

        $totalUnits = 0;
        $totalGradePoints = 0;

        foreach ($enrollments as $enrollment) {
            $gradesQuery = Grade::where('enrollment_id', $enrollment->id);
            if ($gradingPeriod !== 'all') {
                $gradesQuery->where('grading_period', $gradingPeriod);
            }
            $grades = $gradesQuery->get();

            $subjectData = [
                'subject_code' => $enrollment->class->subject->subject_code,
                'subject_name' => $enrollment->class->subject->subject_name,
                'teacher' => $enrollment->class->teacher 
                    ? "{$enrollment->class->teacher->first_name} {$enrollment->class->teacher->last_name}"
                    : 'N/A',
                'units' => $enrollment->class->subject->units ?? 3,
                'grades' => [],
                'midterm_grade' => $enrollment->midterm_grade,
                'final_grade' => $enrollment->final_grade,
            ];

            foreach ($grades as $grade) {
                $subjectData['grades'][] = [
                    'component' => $grade->component_name,
                    'type' => $grade->component_type,
                    'period' => $grade->grading_period,
                    'score' => $grade->score,
                    'max_score' => $grade->max_score,
                    'percentage' => round(($grade->score / $grade->max_score) * 100, 2),
                ];
            }

            $reportData['subjects'][] = $subjectData;

            // Calculate GPA contribution
            if ($enrollment->final_grade) {
                $units = $enrollment->class->subject->units ?? 3;
                $totalUnits += $units;
                $totalGradePoints += ($enrollment->final_grade * $units);
            }
        }

        // Calculate GPA
        $reportData['summary'] = [
            'total_subjects' => count($enrollments),
            'total_units' => $totalUnits,
            'gpa' => $totalUnits > 0 ? round($totalGradePoints / $totalUnits, 2) : null,
        ];

        // Save the report
        $report = Report::create([
            'report_type' => 'grade_report',
            'generated_by' => $request->user()->id,
            'for_student_id' => $student->id,
            'academic_year_id' => $academicYear->id,
            'data' => $reportData,
            'generated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Grade report generated successfully',
            'data' => $report->load(['generator', 'student', 'academicYear']),
            'report_content' => $reportData,
        ], 201);
    }

    /**
     * Generate an attendance report for a student
     */
    public function generateAttendanceReport(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'academic_year_id' => 'required|exists:academic_years,id',
            'from_date' => 'nullable|date',
            'to_date' => 'nullable|date|after_or_equal:from_date',
        ]);

        $student = Students::find($validated['student_id']);
        $academicYear = AcademicYear::find($validated['academic_year_id']);

        // Get attendance records
        $query = Attendance::where('student_id', $student->id)
            ->whereHas('class', function ($q) use ($validated) {
                $q->where('academic_year_id', $validated['academic_year_id']);
            })
            ->with(['class.subject']);

        if (isset($validated['from_date'])) {
            $query->where('date', '>=', $validated['from_date']);
        }
        if (isset($validated['to_date'])) {
            $query->where('date', '<=', $validated['to_date']);
        }

        $attendance = $query->orderBy('date', 'desc')->get();

        // Calculate summary
        $summary = [
            'total' => $attendance->count(),
            'present' => $attendance->where('status', 'present')->count(),
            'absent' => $attendance->where('status', 'absent')->count(),
            'late' => $attendance->where('status', 'late')->count(),
            'excused' => $attendance->where('status', 'excused')->count(),
        ];
        $summary['attendance_rate'] = $summary['total'] > 0 
            ? round((($summary['present'] + $summary['late']) / $summary['total']) * 100, 2)
            : 0;

        // Group by subject
        $bySubject = $attendance->groupBy(function ($item) {
            return $item->class->subject->subject_code;
        })->map(function ($items, $subjectCode) {
            return [
                'subject_code' => $subjectCode,
                'subject_name' => $items->first()->class->subject->subject_name,
                'total' => $items->count(),
                'present' => $items->where('status', 'present')->count(),
                'absent' => $items->where('status', 'absent')->count(),
                'late' => $items->where('status', 'late')->count(),
                'excused' => $items->where('status', 'excused')->count(),
            ];
        })->values();

        $reportData = [
            'title' => "Attendance Report - {$student->first_name} {$student->last_name}",
            'student' => [
                'id' => $student->id,
                'name' => "{$student->first_name} {$student->last_name}",
                'student_number' => $student->student_number,
            ],
            'academic_year' => $academicYear->year_code,
            'date_range' => [
                'from' => $validated['from_date'] ?? $academicYear->start_date,
                'to' => $validated['to_date'] ?? $academicYear->end_date,
            ],
            'generated_at' => now()->toDateTimeString(),
            'summary' => $summary,
            'by_subject' => $bySubject,
            'records' => $attendance->map(function ($item) {
                return [
                    'date' => $item->date->toDateString(),
                    'subject' => $item->class->subject->subject_code,
                    'status' => $item->status,
                    'time_in' => $item->time_in,
                    'time_out' => $item->time_out,
                    'remarks' => $item->remarks,
                ];
            }),
        ];

        // Save the report
        $report = Report::create([
            'report_type' => 'attendance_report',
            'generated_by' => $request->user()->id,
            'for_student_id' => $student->id,
            'academic_year_id' => $academicYear->id,
            'data' => $reportData,
            'generated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Attendance report generated successfully',
            'data' => $report->load(['generator', 'student', 'academicYear']),
            'report_content' => $reportData,
        ], 201);
    }

    /**
     * Generate a class report
     */
    public function generateClassReport(Request $request)
    {
        $validated = $request->validate([
            'class_id' => 'required|exists:classes,id',
            'include_grades' => 'nullable|boolean',
            'include_attendance' => 'nullable|boolean',
        ]);

        $class = Classes::with(['subject', 'teacher', 'section', 'academicYear'])->find($validated['class_id']);
        $includeGrades = $validated['include_grades'] ?? true;
        $includeAttendance = $validated['include_attendance'] ?? true;

        // Get enrollments
        $enrollments = Enrollment::where('class_id', $class->id)
            ->with('student')
            ->get();

        $students = [];
        foreach ($enrollments as $enrollment) {
            $studentData = [
                'id' => $enrollment->student->id,
                'student_number' => $enrollment->student->student_number,
                'name' => "{$enrollment->student->first_name} {$enrollment->student->last_name}",
                'enrollment_status' => $enrollment->status,
                'midterm_grade' => $enrollment->midterm_grade,
                'final_grade' => $enrollment->final_grade,
            ];

            if ($includeGrades) {
                $grades = Grade::where('enrollment_id', $enrollment->id)->get();
                $studentData['grades'] = $grades->map(function ($g) {
                    return [
                        'component' => $g->component_name,
                        'type' => $g->component_type,
                        'period' => $g->grading_period,
                        'score' => $g->score,
                        'max_score' => $g->max_score,
                    ];
                });
            }

            if ($includeAttendance) {
                $attendance = Attendance::where('class_id', $class->id)
                    ->where('student_id', $enrollment->student->id)
                    ->get();
                $studentData['attendance'] = [
                    'total' => $attendance->count(),
                    'present' => $attendance->where('status', 'present')->count(),
                    'absent' => $attendance->where('status', 'absent')->count(),
                    'late' => $attendance->where('status', 'late')->count(),
                    'rate' => $attendance->count() > 0 
                        ? round((($attendance->where('status', 'present')->count() + $attendance->where('status', 'late')->count()) / $attendance->count()) * 100, 2)
                        : 0,
                ];
            }

            $students[] = $studentData;
        }

        // Calculate class statistics
        $gradeStats = Enrollment::where('class_id', $class->id)
            ->whereNotNull('final_grade')
            ->selectRaw('AVG(final_grade) as avg_grade, MIN(final_grade) as best_grade, MAX(final_grade) as worst_grade, COUNT(*) as graded_count')
            ->first();

        $reportData = [
            'title' => "Class Report - {$class->subject->subject_code}",
            'class' => [
                'id' => $class->id,
                'code' => $class->class_code,
                'subject' => "{$class->subject->subject_code} - {$class->subject->subject_name}",
                'teacher' => $class->teacher 
                    ? "{$class->teacher->first_name} {$class->teacher->last_name}"
                    : 'N/A',
                'section' => $class->section->section_code ?? 'N/A',
                'capacity' => $class->capacity,
                'enrolled' => $class->enrolled_count,
            ],
            'academic_year' => $class->academicYear->year_code,
            'generated_at' => now()->toDateTimeString(),
            'statistics' => [
                'total_students' => count($students),
                'average_grade' => $gradeStats->avg_grade ? round($gradeStats->avg_grade, 2) : null,
                'best_grade' => $gradeStats->best_grade,
                'worst_grade' => $gradeStats->worst_grade,
                'graded_students' => $gradeStats->graded_count,
            ],
            'students' => $students,
        ];

        // Save the report
        $report = Report::create([
            'report_type' => 'class_report',
            'generated_by' => $request->user()->id,
            'for_class_id' => $class->id,
            'academic_year_id' => $class->academic_year_id,
            'data' => $reportData,
            'generated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Class report generated successfully',
            'data' => $report->load(['generator', 'class.subject', 'academicYear']),
            'report_content' => $reportData,
        ], 201);
    }

    /**
     * Generate a performance report (overall academic performance)
     */
    public function generatePerformanceReport(Request $request)
    {
        $validated = $request->validate([
            'academic_year_id' => 'required|exists:academic_years,id',
            'program' => 'nullable|string',
            'grade_level' => 'nullable|string',
        ]);

        $academicYear = AcademicYear::find($validated['academic_year_id']);

        // Get students query
        $studentsQuery = Students::query();
        if (isset($validated['program'])) {
            $studentsQuery->where('program', $validated['program']);
        }
        if (isset($validated['grade_level'])) {
            $studentsQuery->where('grade_level', $validated['grade_level']);
        }
        $students = $studentsQuery->get();

        // Calculate overall statistics
        $enrollments = Enrollment::whereHas('class', function ($q) use ($validated) {
                $q->where('academic_year_id', $validated['academic_year_id']);
            })
            ->whereIn('student_id', $students->pluck('id'))
            ->get();

        $passedCount = $enrollments->where('final_grade', '<=', 3.0)->whereNotNull('final_grade')->count();
        $failedCount = $enrollments->where('final_grade', '>', 3.0)->whereNotNull('final_grade')->count();
        $totalGraded = $passedCount + $failedCount;

        // GPA distribution
        $gpaDistribution = [
            'excellent' => $enrollments->whereBetween('final_grade', [1.0, 1.5])->count(), // 1.0-1.5
            'very_good' => $enrollments->whereBetween('final_grade', [1.51, 2.0])->count(), // 1.51-2.0
            'good' => $enrollments->whereBetween('final_grade', [2.01, 2.5])->count(), // 2.01-2.5
            'satisfactory' => $enrollments->whereBetween('final_grade', [2.51, 3.0])->count(), // 2.51-3.0
            'failed' => $enrollments->where('final_grade', '>', 3.0)->count(), // > 3.0
        ];

        // Top performers
        $topPerformers = DB::table('enrollments')
            ->join('students', 'enrollments.student_id', '=', 'students.id')
            ->join('classes', 'enrollments.class_id', '=', 'classes.id')
            ->where('classes.academic_year_id', $validated['academic_year_id'])
            ->whereNotNull('enrollments.final_grade')
            ->select('students.id', 'students.student_number', 'students.first_name', 'students.last_name')
            ->selectRaw('AVG(enrollments.final_grade) as avg_gpa')
            ->groupBy('students.id', 'students.student_number', 'students.first_name', 'students.last_name')
            ->orderBy('avg_gpa', 'asc')
            ->limit(10)
            ->get();

        $reportData = [
            'title' => "Performance Report - {$academicYear->year_code}",
            'academic_year' => $academicYear->year_code,
            'filters' => [
                'program' => $validated['program'] ?? 'All',
                'grade_level' => $validated['grade_level'] ?? 'All',
            ],
            'generated_at' => now()->toDateTimeString(),
            'summary' => [
                'total_students' => $students->count(),
                'total_enrollments' => $enrollments->count(),
                'graded_enrollments' => $totalGraded,
                'passed' => $passedCount,
                'failed' => $failedCount,
                'passing_rate' => $totalGraded > 0 ? round(($passedCount / $totalGraded) * 100, 2) : 0,
            ],
            'gpa_distribution' => $gpaDistribution,
            'top_performers' => $topPerformers->map(function ($s) {
                return [
                    'student_number' => $s->student_number,
                    'name' => "{$s->first_name} {$s->last_name}",
                    'gpa' => round($s->avg_gpa, 2),
                ];
            }),
        ];

        // Save the report
        $report = Report::create([
            'report_type' => 'performance_report',
            'generated_by' => $request->user()->id,
            'academic_year_id' => $academicYear->id,
            'data' => $reportData,
            'generated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Performance report generated successfully',
            'data' => $report->load(['generator', 'academicYear']),
            'report_content' => $reportData,
        ], 201);
    }
}
