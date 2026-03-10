<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\{
    User,
    Program,
    AcademicYear,
    Teachers,
    Section,
    Students,
    Subject,
    Classes,
    Enrollment,
    Attendance,
    Grade,
    Schedule,
    Announcement,
    Report
};

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * @return void
     */
    public function run()
    {
        $this->command->info('🌱 Seeding database with test data...');

        // Step 1: Create base tables (no dependencies)
        $this->command->info('Creating Programs...');
        $programs = Program::factory()->count(5)->create();

        $this->command->info('Creating Academic Years...');
        $academicYears = collect([
            AcademicYear::create([
                'year_code' => '2023-2024 1st',
                'start_date' => '2023-08-01',
                'end_date' => '2023-12-31',
                'semester' => '1st',
                'is_current' => false,
                'status' => 'completed',
            ]),
            AcademicYear::create([
                'year_code' => '2023-2024 2nd',
                'start_date' => '2024-01-01',
                'end_date' => '2024-05-31',
                'semester' => '2nd',
                'is_current' => false,
                'status' => 'completed',
            ]),
            AcademicYear::create([
                'year_code' => '2024-2025 1st',
                'start_date' => '2024-08-01',
                'end_date' => '2024-12-31',
                'semester' => '1st',
                'is_current' => false,
                'status' => 'completed',
            ]),
            AcademicYear::create([
                'year_code' => '2024-2025 2nd',
                'start_date' => '2025-01-01',
                'end_date' => '2025-05-31',
                'semester' => '2nd',
                'is_current' => false,
                'status' => 'completed',
            ]),
            AcademicYear::create([
                'year_code' => '2025-2026 1st',
                'start_date' => '2025-08-01',
                'end_date' => '2025-12-31',
                'semester' => '1st',
                'is_current' => true,
                'status' => 'active',
            ]),
        ]);

        $this->command->info('Creating Users...');
        $users = User::factory()->count(20)->create();

        // Step 2: Create Teachers (depends on users)
        $this->command->info('Creating Teachers...');
        $teachers = Teachers::factory()->count(10)->create([
            'user_id' => fn() => $users->random()->id
        ]);

        // Step 3: Create Sections (depends on programs, academic_years, teachers)
        $this->command->info('Creating Sections...');
        $sections = Section::factory()->count(15)->create([
            'program_id' => fn() => $programs->random()->id,
            'academic_year_id' => fn() => $academicYears->random()->id,
            'adviser_id' => fn() => fake()->boolean(70) ? $teachers->random()->id : null,
        ]);

        // Step 4: Create Students (depends on users, programs, sections, academic_years)
        $this->command->info('Creating Students...');
        $students = Students::factory()->count(50)->create([
            'user_id' => fn() => User::factory()->create()->id,
            'program_id' => fn() => $programs->random()->id,
            'section_id' => fn() => fake()->boolean(80) ? $sections->random()->id : null,
            'academic_year_id' => fn() => $academicYears->random()->id,
        ]);

        // Step 5: Create Subjects (depends on programs)
        $this->command->info('Creating Subjects...');
        $subjects = Subject::factory()->count(25)->create([
            'program_id' => fn() => $programs->random()->id,
        ]);

        // Step 6: Create Classes (depends on subjects, teachers, sections, academic_years)
        $this->command->info('Creating Classes...');
        $classes = Classes::factory()->count(40)->create([
            'subject_id' => fn() => $subjects->random()->id,
            'teacher_id' => fn() => $teachers->random()->id,
            'section_id' => fn() => $sections->random()->id,
            'academic_year_id' => fn() => $academicYears->random()->id,
        ]);

        // Step 7: Create Enrollments (depends on students, classes)
        $this->command->info('Creating Enrollments...');
        $enrollments = collect();
        $attempts = 0;
        $maxEnrollments = 150;
        
        while ($enrollments->count() < $maxEnrollments && $attempts < ($maxEnrollments * 2)) {
            try {
                $enrollment = Enrollment::factory()->create([
                    'student_id' => $students->random()->id,
                    'class_id' => $classes->random()->id,
                ]);
                $enrollments->push($enrollment);
            } catch (\Exception $e) {
                // Skip duplicate entries
                $attempts++;
            }
        }

        // Step 8: Create Schedules (depends on classes)
        $this->command->info('Creating Schedules...');
        Schedule::factory()->count(80)->create([
            'class_id' => fn() => $classes->random()->id,
        ]);

        // Step 9: Create Attendance (depends on classes, students, users)
        $this->command->info('Creating Attendance Records...');
        $attendanceRecords = collect();
        $attempts = 0;
        $maxAttendance = 300;
        
        while ($attendanceRecords->count() < $maxAttendance && $attempts < ($maxAttendance * 2)) {
            try {
                $record = Attendance::factory()->create([
                    'class_id' => $classes->random()->id,
                    'student_id' => $students->random()->id,
                    'recorded_by' => $users->random()->id,
                ]);
                $attendanceRecords->push($record);
            } catch (\Exception $e) {
                // Skip duplicate entries
                $attempts++;
            }
        }

        // Step 10: Create Grades (depends on enrollments, students, classes, teachers)
        $this->command->info('Creating Grades...');
        Grade::factory()->count(400)->create([
            'enrollment_id' => fn() => $enrollments->random()->id,
            'student_id' => fn() => $students->random()->id,
            'class_id' => fn() => $classes->random()->id,
            'recorded_by' => fn() => $teachers->random()->id,
        ]);

        // Step 11: Create Announcements (depends on users, sections, classes)
        $this->command->info('Creating Announcements...');
        Announcement::factory()->count(25)->create([
            'author_id' => fn() => $users->random()->id,
            'section_id' => fn() => fake()->boolean(30) ? $sections->random()->id : null,
            'class_id' => fn() => fake()->boolean(30) ? $classes->random()->id : null,
        ]);

        // Step 12: Create Reports (depends on users, students, teachers, classes, academic_years)
        $this->command->info('Creating Reports...');
        Report::factory()->count(20)->create([
            'generated_by' => fn() => $users->random()->id,
            'for_student_id' => fn() => fake()->boolean(40) ? $students->random()->id : null,
            'for_teacher_id' => fn() => fake()->boolean(30) ? $teachers->random()->id : null,
            'for_class_id' => fn() => fake()->boolean(30) ? $classes->random()->id : null,
            'academic_year_id' => fn() => $academicYears->random()->id,
        ]);

        $this->command->info('✅ Database seeding completed successfully!');
        $this->command->newLine();
        $this->command->info('📊 Summary:');
        $this->command->info("   - Programs: {$programs->count()}");
        $this->command->info("   - Academic Years: {$academicYears->count()}");
        $this->command->info("   - Users: " . User::count());
        $this->command->info("   - Teachers: {$teachers->count()}");
        $this->command->info("   - Students: {$students->count()}");
        $this->command->info("   - Sections: {$sections->count()}");
        $this->command->info("   - Subjects: {$subjects->count()}");
        $this->command->info("   - Classes: {$classes->count()}");
        $this->command->info("   - Enrollments: {$enrollments->count()}");
        $this->command->info("   - Attendance: " . Attendance::count());
        $this->command->info("   - Grades: " . Grade::count());
        $this->command->info("   - Schedules: " . Schedule::count());
        $this->command->info("   - Announcements: " . Announcement::count());
        $this->command->info("   - Reports: " . Report::count());
    }
}
