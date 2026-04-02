<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Students;
use App\Models\Teachers;
use App\Models\Subject;
use App\Models\Section;
use App\Models\Classes;
use App\Models\Enrollment;
use App\Models\Attendance;
use App\Models\Grade;
use App\Models\Announcement;
use App\Models\AcademicYear;
use App\Models\Program;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Get admin dashboard statistics
     */
    public function admin(Request $request)
    {
        $academicYearId = $request->get('academic_year_id');
        
        // Get current academic year if not specified
        if (!$academicYearId) {
            $currentYear = AcademicYear::where('is_current', true)->first();
            $academicYearId = $currentYear ? $currentYear->id : null;
        }

        $stats = [
            'total_students' => Students::count(),
            'total_teachers' => Teachers::count(),
            'total_programs' => Program::where('status', 'active')->count(),
            'total_subjects' => Subject::where('status', 'active')->count(),
            'total_sections' => Section::where('status', 'active')->count(),
            'total_classes' => Classes::where('status', 'active')->count(),
            'active_enrollments' => Enrollment::where('status', 'enrolled')->count(),
        ];

        // Enrollment by classes
        $enrollmentByProgram = Classes::with(['subject', 'section'])
            ->where('status', 'active')
            ->when($academicYearId, function ($query) use ($academicYearId) {
                return $query->where('academic_year_id', $academicYearId);
            })
            ->get(['id', 'class_code', 'capacity', 'enrolled_count'])
            ->map(function ($class) {
                return [
                    'id' => $class->id,
                    'program_code' => $class->class_code,
                    'course' => $class->class_code,
                    'enrolled' => $class->enrolled_count,
                    'capacity' => $class->capacity,
                ];
            });

        // Recent activity (last 10 activities)
        $recentEnrollments = Enrollment::with(['student', 'class.subject'])
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        // Attendance summary for today
        $todayAttendance = [
            'present' => Attendance::whereDate('date', today())->where('status', 'present')->count(),
            'absent' => Attendance::whereDate('date', today())->where('status', 'absent')->count(),
            'late' => Attendance::whereDate('date', today())->where('status', 'late')->count(),
            'excused' => Attendance::whereDate('date', today())->where('status', 'excused')->count(),
        ];

        // Recent announcements
        $recentAnnouncements = Announcement::with('author')
            ->where('status', 'published')
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        // Enrollment statistics - Count students with actual class enrollments
        $enrolledStudents = Enrollment::where('status', 'enrolled')
            ->distinct('student_id')
            ->count('student_id');
        $totalStudents = Students::count();
        $notEnrolledCount = $totalStudents - $enrolledStudents;

        // Academic metrics
        $allGrades = Grade::select('score')->where('score', '>', 0)->pluck('score')->filter();
        $averageGrade = $allGrades->count() > 0 ? round($allGrades->avg(), 2) : 0;

        // At-risk students (students with average score below 2.0)
        $atRiskStudents = Grade::selectRaw('student_id, AVG(score) as avg_score')
            ->groupBy('student_id')
            ->havingRaw('AVG(score) < 2.0')
            ->count();

        // Retention rate (students who continue from previous year)
        $retentionRate = $totalStudents > 0 ? round(($enrolledStudents / $totalStudents) * 100, 2) : 0;

        // Teacher workload
        $teachers = Teachers::with(['classes'])->get();
        $teachersBalanced = $teachers->filter(function ($teacher) {
            return $teacher->classes->count() <= 4;
        })->count();
        $teachersOverloaded = $teachers->filter(function ($teacher) {
            return $teacher->classes->count() > 4;
        })->count();

        // Average subjects and sections per teacher
        $totalTeachers = Teachers::count();
        $totalSubjectsAssigned = Classes::select('teacher_id')
            ->distinct()
            ->count('teacher_id');
        $avgSubjectsPerTeacher = $totalTeachers > 0 ? round($totalSubjectsAssigned / $totalTeachers, 2) : 0;
        
        $totalSectionsAssigned = DB::table('classes')
            ->selectRaw('DISTINCT teacher_id, section_id')
            ->count();
        $avgSectionsPerTeacher = $totalTeachers > 0 ? round($totalSectionsAssigned / $totalTeachers, 2) : 0;

        // Get current academic year enrollment period info
        $enrollmentProgress = 0;
        $enrollmentDeadline = 'Not set';
        if ($academicYearId) {
            $currentYear = AcademicYear::find($academicYearId);
            if ($currentYear && $currentYear->end_date) {
                $enrollmentDeadline = $currentYear->end_date->format('M d, Y');
                $enrollmentProgress = round(($enrolledStudents / max($totalStudents, 1)) * 100, 2);
            }
        }

        return response()->json([
            'stats' => $stats,
            'enrollment_by_program' => $enrollmentByProgram,
            'recent_enrollments' => $recentEnrollments,
            'today_attendance' => $todayAttendance,
            'recent_announcements' => $recentAnnouncements,
            // Additional enrollment metrics
            'enrolled_count' => $enrolledStudents,
            'not_enrolled_count' => $notEnrolledCount,
            'retention_rate' => $retentionRate,
            'at_risk_students' => $atRiskStudents,
            'average_grade' => $averageGrade,
            'teachers_balanced' => $teachersBalanced,
            'teachers_overloaded' => $teachersOverloaded,
            'avg_subjects_per_teacher' => $avgSubjectsPerTeacher,
            'avg_sections_per_teacher' => $avgSectionsPerTeacher,
            'enrollment_deadline' => $enrollmentDeadline,
            'enrollment_progress' => $enrollmentProgress,
        ]);
    }

    /**
     * Get teacher dashboard statistics
     */
    public function teacher(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        if ($user->role !== 'teacher') {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $user->loadMissing('teacher');
        $teacher = $user->teacher;
        
        if (!$teacher) {
            return response()->json(['error' => 'Teacher profile not found'], 404);
        }

        $teacherId = $teacher->id;

        // Get teacher's classes
        $classes = Classes::where('teacher_id', $teacherId)
            ->where('status', 'active')
            ->with(['subject', 'section', 'schedules'])
            ->get();

        $classIds = $classes->pluck('id');

        $stats = [
            'total_classes' => $classes->count(),
            'total_students' => Enrollment::whereIn('class_id', $classIds)
                ->where('status', 'enrolled')
                ->distinct('student_id')
                ->count('student_id'),
            'total_sections' => $classes->pluck('section_id')->unique()->count(),
        ];

        // Today's schedule
        $today = now()->format('l'); // Get day name
        $todaySchedule = Classes::where('teacher_id', $teacherId)
            ->where('status', 'active')
            ->whereHas('schedules', function ($query) use ($today) {
                $query->where('day_of_week', $today);
            })
            ->with(['subject', 'section', 'schedules' => function ($query) use ($today) {
                $query->where('day_of_week', $today);
            }])
            ->get();

        // Pending grades to submit
        $pendingGrades = Enrollment::whereIn('class_id', $classIds)
            ->where('status', 'enrolled')
            ->whereDoesntHave('grades', function ($query) {
                $query->where('grading_period', 'final');
            })
            ->count();

        // Recent attendance records
        $recentAttendance = Attendance::whereIn('class_id', $classIds)
            ->with(['student', 'class.subject'])
            ->orderBy('date', 'desc')
            ->take(10)
            ->get();

        // Announcements for teacher's sections
        $sectionIds = $classes->pluck('section_id')->unique();
        $announcements = Announcement::where(function ($query) use ($sectionIds, $classIds) {
            $query->whereIn('section_id', $sectionIds)
                  ->orWhereIn('class_id', $classIds)
                  ->orWhereNull('section_id');
        })
        ->where('status', 'published')
        ->orderBy('created_at', 'desc')
        ->take(5)
        ->get();

        return response()->json([
            'stats' => $stats,
            'classes' => $classes,
            'today_schedule' => $todaySchedule,
            'pending_grades' => $pendingGrades,
            'recent_attendance' => $recentAttendance,
            'announcements' => $announcements,
        ]);
    }

    /**
     * Get student dashboard statistics
     */
    public function student(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        if ($user->role !== 'student') {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $user->loadMissing('student');
        $student = $user->student;
        
        if (!$student) {
            return response()->json(['error' => 'Student profile not found'], 404);
        }

        $studentId = $student->id;

        // Get current enrollments
        $enrollments = Enrollment::where('student_id', $studentId)
            ->where('status', 'enrolled')
            ->with(['class.subject', 'class.teacher', 'class.schedules'])
            ->get();

        $classIds = $enrollments->pluck('class_id');

        // Calculate attendance percentage
        $totalAttendance = Attendance::where('student_id', $studentId)
            ->whereIn('class_id', $classIds)
            ->count();
        $presentCount = Attendance::where('student_id', $studentId)
            ->whereIn('class_id', $classIds)
            ->whereIn('status', ['present', 'late'])
            ->count();
        $attendancePercentage = $totalAttendance > 0 
            ? round(($presentCount / $totalAttendance) * 100, 2) 
            : 0;

        // Get grades
        $grades = Grade::where('student_id', $studentId)
            ->with(['class.subject'])
            ->get();

        // Calculate GPA (assuming 1.0-5.0 scale where 1.0 is highest)
        $gradeValues = $grades->pluck('grade')->filter();
        $gpa = $gradeValues->count() > 0 ? round($gradeValues->avg(), 2) : null;

        $stats = [
            'total_subjects' => $enrollments->count(),
            'attendance_percentage' => $attendancePercentage,
            'current_gpa' => $gpa,
            'total_units' => $enrollments->sum(function ($enrollment) {
                return $enrollment->class->subject->units ?? 0;
            }),
        ];

        // Today's schedule
        $today = now()->format('l');
        $todaySchedule = $enrollments->filter(function ($enrollment) use ($today) {
            return $enrollment->class->schedules->contains('day_of_week', $today);
        })->map(function ($enrollment) use ($today) {
            $schedule = $enrollment->class->schedules->firstWhere('day_of_week', $today);
            return [
                'subject' => $enrollment->class->subject,
                'teacher' => $enrollment->class->teacher,
                'schedule' => $schedule,
            ];
        });

        // Recent grades
        $recentGrades = Grade::where('student_id', $studentId)
            ->with(['class.subject'])
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        // Announcements for student's section and classes
        $sectionId = $student->section_id;
        $announcements = Announcement::where(function ($query) use ($sectionId, $classIds) {
            $query->where('section_id', $sectionId)
                  ->orWhereIn('class_id', $classIds)
                  ->orWhereNull('section_id');
        })
        ->where('status', 'published')
        ->orderBy('created_at', 'desc')
        ->take(5)
        ->get();

        // Upcoming deadlines (if any grade submissions are pending)
        $attendanceRecords = Attendance::where('student_id', $studentId)
            ->whereIn('class_id', $classIds)
            ->orderBy('date', 'desc')
            ->take(10)
            ->get();

        return response()->json([
            'stats' => $stats,
            'enrollments' => $enrollments,
            'today_schedule' => $todaySchedule->values(),
            'recent_grades' => $recentGrades,
            'announcements' => $announcements,
            'recent_attendance' => $attendanceRecords,
        ]);
    }
}
