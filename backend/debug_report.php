<?php
require __DIR__ . '/vendor/autoload.php';
require __DIR__ . '/bootstrap/app.php';

use Illuminate\Support\Facades\DB;
use App\Models\Enrollment;

// Check enrollments for BSHM-1A (section_id = 1), 2025-2026 1st, 1st semester, enrolled status
$enrollments = Enrollment::query()
    ->with(['student', 'class.subject', 'class.section'])
    ->whereHas('class', function ($q) {
        $q->where('section_id', 1)
            ->whereHas('subject', function ($subQ) {
                $subQ->where('semester', '1st')
                    ->whereHas('academicYear', function ($ayQ) {
                        $ayQ->where('year_id', '2025-2026 1st');
                    });
            });
    })
    ->where('status', 'enrolled')
    ->get();

echo "Total Enrolled Students in BSHM-1A, 1st Semester, 2025-2026 1st: " . $enrollments->count() . "\n\n";

foreach ($enrollments as $enrollment) {
    echo "ID: {$enrollment->student_id} | Name: {$enrollment->student->student_name} | Status: {$enrollment->status}\n";
}

echo "\n\n--- Checking Section Data ---\n";
$section = DB::table('sections')->where('id', 1)->first();
echo "Section ID 1: " . json_encode($section) . "\n";

echo "\n--- All Sections ---\n";
$sections = DB::table('sections')->get();
echo "Total Sections: " . $sections->count() . "\n";
foreach ($sections as $sec) {
    echo "ID: {$sec->id} | Code: {$sec->section_code} | Section Name: {$sec->section_name}\n";
}

echo "\n--- Checking Academic Years ---\n";
$ayears = DB::table('academic_years')->get();
foreach ($ayears as $ay) {
    echo "ID: {$ay->id} | Year ID: {$ay->year_id} | Year Code: {$ay->year_code}\n";
}

echo "\n--- Checking Classes in BSHM with 1st semester ---\n";
$classes = DB::table('classes')
    ->join('subjects', 'classes.subject_id', '=', 'subjects.id')
    ->join('sections', 'classes.section_id', '=', 'sections.id')
    ->where('sections.id', 1)
    ->where('subjects.semester', '1st')
    ->select('classes.id', 'subjects.code as subject_code', 'subjects.semester', 'sections.section_code', 'classes.section_id')
    ->get();

echo "Classes found: " . count($classes) . "\n";
foreach ($classes as $class) {
    echo "Class ID: {$class->id} | Subject: {$class->subject_code} | Section: {$class->section_code} | Semester: {$class->semester}\n";
}

echo "\n--- Checking Enrollments for those Classes ---\n";
if (count($classes) > 0) {
    $classIds = array_map(fn($c) => $c->id, (array)$classes);
    $enrolls = DB::table('enrollments')
        ->whereIn('class_id', $classIds)
        ->where('status', 'enrolled')
        ->count();
    echo "Total enrollments in those classes: " . $enrolls . "\n";
}
