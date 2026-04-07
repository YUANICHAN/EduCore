<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\StudentsController;
use App\Http\Controllers\TeachersController;
use App\Http\Controllers\ProgramController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\AcademicYearController;
use App\Http\Controllers\SectionController;
use App\Http\Controllers\SubjectController;
use App\Http\Controllers\ClassesController;
use App\Http\Controllers\EnrollmentController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\GradeController;
use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\GradingPeriodController;
use App\Http\Controllers\SectionEnrollmentController;
use App\Http\Controllers\BuildingController;
use App\Http\Controllers\RoomController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// =============================================================================
// PUBLIC ROUTES (No authentication required)
// =============================================================================
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/register', [AuthController::class, 'register']);

// Health check
Route::get('/health', function () {
    return response()->json([
        'success' => true,
        'message' => 'API is running',
        'timestamp' => now()->toISOString()
    ]);
});

// =============================================================================
// ALL API ROUTES (No authentication for development)
// =============================================================================

// Auth & Profile
Route::get('/user', function (Request $request) {
    if ($request->user()) {
        return response()->json(['success' => true, 'data' => $request->user()]);
    }
    return response()->json(['success' => false, 'message' => 'Not logged in'], 401);
})->middleware('auth:sanctum');

Route::post('/auth/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
Route::get('/auth/profile', [AuthController::class, 'profile'])->middleware('auth:sanctum');
Route::put('/auth/profile', [AuthController::class, 'updateProfile'])->middleware('auth:sanctum');
Route::post('/auth/profile', [AuthController::class, 'updateProfile'])->middleware('auth:sanctum');
Route::put('/auth/password', [AuthController::class, 'updatePassword'])->middleware('auth:sanctum');
Route::post('/auth/refresh', [AuthController::class, 'refresh'])->middleware('auth:sanctum');

// Dashboard (public for now)
Route::get('/dashboard/admin', [DashboardController::class, 'admin']);
Route::get('/dashboard/teacher', [DashboardController::class, 'teacher'])->middleware('auth:sanctum');
Route::get('/dashboard/student', [DashboardController::class, 'student'])->middleware('auth:sanctum');

// Users Management
Route::get('/users/statistics', [UserController::class, 'statistics']);
Route::post('/users/{user}/lock', [UserController::class, 'lock']);
Route::post('/users/{user}/unlock', [UserController::class, 'unlock']);
Route::post('/users/{user}/reset-password', [UserController::class, 'resetPassword']);
Route::post('/users/{user}/force-logout', [UserController::class, 'forceLogout']);
Route::apiResource('users', UserController::class);

// Settings
Route::get('/settings', [SettingsController::class, 'index']);
Route::put('/settings/general', [SettingsController::class, 'updateGeneral']);
Route::put('/settings/academic', [SettingsController::class, 'updateAcademic']);
Route::put('/settings/user-roles', [SettingsController::class, 'updateUserRoles']);
Route::put('/settings/enrollment', [SettingsController::class, 'updateEnrollment']);
Route::put('/settings/grading', [SettingsController::class, 'updateGrading']);
Route::put('/settings/system', [SettingsController::class, 'updateSystem']);
Route::post('/settings/logo', [SettingsController::class, 'uploadLogo']);

// Departments
Route::apiResource('departments', DepartmentController::class);

// Programs
Route::apiResource('programs', ProgramController::class);

// Academic Years
Route::get('academic-years/current', [AcademicYearController::class, 'current']);
Route::apiResource('academic-years', AcademicYearController::class);

// Grading Periods
Route::get('grading-periods/current', [GradingPeriodController::class, 'current']);
Route::get('grading-periods/current-period', [GradingPeriodController::class, 'currentPeriod']);
Route::post('grading-periods/bulk-create', [GradingPeriodController::class, 'bulkCreate']);
Route::post('grading-periods/{gradingPeriod}/open', [GradingPeriodController::class, 'open']);
Route::post('grading-periods/{gradingPeriod}/lock', [GradingPeriodController::class, 'lock']);
Route::post('grading-periods/{gradingPeriod}/close', [GradingPeriodController::class, 'close']);
Route::apiResource('grading-periods', GradingPeriodController::class);

// Sections
Route::get('sections/{section}/students', [SectionController::class, 'students']);
Route::get('sections/{section}/classes', [SectionController::class, 'classes']);
Route::apiResource('sections', SectionController::class);

// Students
Route::get('students/{student}/enrollments', [StudentsController::class, 'enrollments']);
Route::get('students/{student}/grades', [StudentsController::class, 'grades']);
Route::get('students/{student}/attendance', [StudentsController::class, 'attendance']);
Route::get('students/{student}/schedule', [StudentsController::class, 'schedule']);
Route::apiResource('students', StudentsController::class);

// Teachers
Route::get('teachers/unassigned-classes', [TeachersController::class, 'unassignedClasses']);
Route::get('teachers/workload-summary', [TeachersController::class, 'workloadSummary']);
Route::get('teachers/{teacher}/classes', [TeachersController::class, 'classes']);
Route::get('teachers/{teacher}/sections', [TeachersController::class, 'sections']);
Route::get('teachers/{teacher}/schedule', [TeachersController::class, 'schedule']);
Route::get('teachers/{teacher}/workload', [TeachersController::class, 'workload']);
Route::post('teachers/{teacher}/assign-class', [TeachersController::class, 'assignClass']);
Route::post('teachers/{teacher}/create-and-assign', [TeachersController::class, 'createAndAssignClass']);
Route::post('teachers/{teacher}/unassign-class', [TeachersController::class, 'unassignClass']);
Route::post('teachers/{teacher}/delete-class', [TeachersController::class, 'deleteClass']);
Route::post('teachers/{teacher}/bulk-assign', [TeachersController::class, 'bulkAssignClasses']);
Route::post('teachers/{teacher}/check-conflicts', [TeachersController::class, 'checkWorkloadConflicts']);
Route::apiResource('teachers', TeachersController::class);

// Subjects
Route::get('subjects/{subject}/classes', [SubjectController::class, 'classes']);
Route::apiResource('subjects', SubjectController::class);

// Classes
Route::get('classes/{class}/students', [ClassesController::class, 'students']);
Route::get('classes/{class}/students/export-excel', [ClassesController::class, 'exportStudentsExcel']);
Route::get('classes/{class}/schedule', [ClassesController::class, 'schedule']);
Route::get('classes/{class}/attendance', [ClassesController::class, 'attendance']);
Route::get('classes/{class}/grades', [ClassesController::class, 'grades']);
Route::post('classes/check-teacher-conflicts', [ClassesController::class, 'checkTeacherConflicts']);
Route::post('classes/check-section-conflicts', [ClassesController::class, 'checkSectionConflicts']);
Route::post('classes/check-room-conflicts', [ClassesController::class, 'checkRoomConflicts']);
Route::get('teachers/{teacher}/availability', [ClassesController::class, 'teacherAvailability']);
Route::apiResource('classes', ClassesController::class);

// Enrollments (Old class-based enrollments - kept for backward compatibility)
Route::post('enrollments/bulk-enroll', [EnrollmentController::class, 'bulkEnroll']);
Route::delete('enrollments/remove', [EnrollmentController::class, 'remove']);
Route::post('enrollments/{enrollment}/drop', [EnrollmentController::class, 'drop']);
Route::apiResource('enrollments', EnrollmentController::class);

// Section Enrollments (New proper workflow)
Route::post('section-enrollments/bulk-enroll', [SectionEnrollmentController::class, 'bulkEnroll']);
Route::post('section-enrollments/{sectionEnrollment}/drop', [SectionEnrollmentController::class, 'drop']);
Route::apiResource('section-enrollments', SectionEnrollmentController::class);

// Attendance
Route::post('attendance/record', [AttendanceController::class, 'record']);
Route::get('attendance/class/{class}/date/{date}', [AttendanceController::class, 'byClassAndDate']);
Route::apiResource('attendance', AttendanceController::class);

// Grades
Route::post('grades/bulk', [GradeController::class, 'bulkCreate']);
Route::post('grades/lock-period', [GradeController::class, 'lockByPeriod']);
Route::post('grades/{grade}/lock', [GradeController::class, 'lock']);
Route::post('grades/{grade}/unlock', [GradeController::class, 'unlock']);
Route::get('grades/student/{student}', [GradeController::class, 'byStudent']);
Route::get('grades/class/{class}', [GradeController::class, 'byClass']);
Route::apiResource('grades', GradeController::class);

// Schedules
Route::get('schedules/section/{section}', [ScheduleController::class, 'bySection']);
Route::get('schedules/teacher/{teacher}', [ScheduleController::class, 'byTeacher']);
Route::apiResource('schedules', ScheduleController::class);

// Rooms
Route::apiResource('buildings', BuildingController::class);
Route::apiResource('rooms', RoomController::class);

// Announcements
Route::get('announcements/section/{section}', [AnnouncementController::class, 'bySection']);
Route::get('announcements/class/{class}', [AnnouncementController::class, 'byClass']);
Route::apiResource('announcements', AnnouncementController::class);

// Reports
Route::post('reports/generate/grade', [ReportController::class, 'generateGradeReport']);
Route::post('reports/generate/attendance', [ReportController::class, 'generateAttendanceReport']);
Route::post('reports/generate/class', [ReportController::class, 'generateClassReport']);
Route::post('reports/generate/performance', [ReportController::class, 'generatePerformanceReport']);
Route::post('reports/export/{format}', [ReportController::class, 'export']);
Route::get('reports/student/{student}', [ReportController::class, 'byStudent']);
Route::apiResource('reports', ReportController::class);
