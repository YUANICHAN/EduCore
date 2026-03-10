<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\Program;
use App\Models\Section;
use App\Models\Students;
use App\Models\Subject;
use App\Models\Teachers;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class ProgramStructureSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = fake();

        $programDefinitions = [
            ['code' => 'BSBA', 'name' => 'BSBA'],
            ['code' => 'WAD', 'name' => 'WAD'],
            ['code' => 'BSIT', 'name' => 'BSIT'],
            ['code' => 'BSHM', 'name' => 'BSHM'],
            ['code' => 'HRT', 'name' => 'HRT'],
            ['code' => 'OMT', 'name' => 'OMT'],
            ['code' => 'OAT', 'name' => 'OAT'],
        ];

        $yearLevels = [
            1 => '1st Year',
            2 => '2nd Year',
            3 => '3rd Year',
            4 => '4th Year',
        ];

        $semesters = ['1st', '2nd', 'summer'];

        DB::transaction(function () use ($programDefinitions, $yearLevels, $semesters, $faker) {
            $academicYear = AcademicYear::firstOrCreate(
                ['year_code' => '2025-2026 1st'],
                [
                    'start_date' => '2025-08-01',
                    'end_date' => '2025-12-31',
                    'semester' => '1st',
                    'is_current' => true,
                    'status' => 'active',
                ]
            );

            Subject::query()->delete();

            foreach ($programDefinitions as $programDef) {
                $program = Program::updateOrCreate(
                    ['program_code' => $programDef['code']],
                    [
                        'program_name' => $programDef['name'],
                        'description' => null,
                        'department' => $programDef['code'],
                        'duration_years' => 4,
                        'credits_required' => 120,
                        'status' => 'active',
                    ]
                );

                foreach ($yearLevels as $yearNumber => $yearLabel) {
                    foreach ($semesters as $semester) {
                        $subjectCount = $faker->numberBetween(5, 10);
                        for ($i = 1; $i <= $subjectCount; $i++) {
                            $semesterCode = $semester === 'summer' ? 'S' : ($semester === '1st' ? '1' : '2');
                            $subjectCode = $programDef['code'] . '-Y' . $yearNumber . '-' . $semesterCode . '-' . str_pad((string) $i, 2, '0', STR_PAD_LEFT);
                            $subjectName = $programDef['code'] . ' ' . $yearLabel . ' ' . $semester . ' Subject ' . $i;

                            Subject::updateOrCreate(
                                ['subject_code' => $subjectCode],
                                [
                                    'subject_name' => $subjectName,
                                    'description' => null,
                                    'units' => 3,
                                    'credits' => 3,
                                    'program_id' => $program->id,
                                    'grade_level' => $yearLabel,
                                    'semester' => $semester,
                                    'is_required' => true,
                                    'prerequisites' => null,
                                    'status' => 'active',
                                ]
                            );
                        }
                    }
                }

                $teachersForProgram = [];
                for ($t = 1; $t <= 4; $t++) {
                    $teacherEmail = Str::lower("{$programDef['code']}.teacher{$t}@educore.edu");
                    $teacherUser = User::updateOrCreate(
                        ['email' => $teacherEmail],
                        [
                            'name' => strtoupper($programDef['code']) . " Teacher {$t}",
                            'password' => Hash::make('password123'),
                            'role' => 'teacher',
                            'status' => 'active',
                        ]
                    );

                    $teacher = Teachers::updateOrCreate(
                        ['email' => $teacherEmail],
                        [
                            'user_id' => $teacherUser->id,
                            'employee_id' => 'EMP' . str_pad((string) ($program->id * 10 + $t), 6, '0', STR_PAD_LEFT),
                            'first_name' => $faker->firstName(),
                            'last_name' => $faker->lastName(),
                            'phone' => $faker->phoneNumber(),
                            'address' => $faker->address(),
                            'department' => $programDef['code'],
                            'specialization' => $programDef['name'],
                            'hire_date' => $faker->dateTimeBetween('-6 years', '-6 months')->format('Y-m-d'),
                            'employment_status' => 'active',
                        ]
                    );

                    if ($teacherUser->teacher_id !== $teacher->id) {
                        $teacherUser->teacher_id = $teacher->id;
                        $teacherUser->save();
                    }

                    $teachersForProgram[] = $teacher;
                }

                foreach ($yearLevels as $yearNumber => $yearLabel) {
                    foreach (['A', 'B'] as $sectionLetter) {
                        $sectionCode = $programDef['code'] . '-' . $yearNumber . $sectionLetter;
                        $section = Section::updateOrCreate(
                            ['section_code' => $sectionCode],
                            [
                                'program_id' => $program->id,
                                'grade_level' => $yearLabel,
                                'academic_year_id' => $academicYear->id,
                                'capacity' => $faker->numberBetween(20, 40),
                                'adviser_id' => $teachersForProgram[array_rand($teachersForProgram)]->id,
                                'room_number' => 'Room ' . $faker->numberBetween(100, 499),
                                'status' => 'active',
                            ]
                        );

                        $studentCount = $faker->numberBetween(20, 40);
                        for ($s = 1; $s <= $studentCount; $s++) {
                            $studentEmail = Str::lower("{$sectionCode}.student{$s}@educore.edu");
                            $studentNumber = 'STU-' . $sectionCode . '-' . str_pad((string) $s, 2, '0', STR_PAD_LEFT);
                            $studentUser = User::updateOrCreate(
                                ['email' => $studentEmail],
                                [
                                    'name' => strtoupper($programDef['code']) . " Student {$s}",
                                    'password' => Hash::make('password123'),
                                    'role' => 'student',
                                    'status' => 'active',
                                ]
                            );

                            $student = Students::updateOrCreate(
                                ['email' => $studentEmail],
                                [
                                    'user_id' => $studentUser->id,
                                    'program_id' => $program->id,
                                    'section_id' => $section->id,
                                    'academic_year_id' => $academicYear->id,
                                    'student_number' => $studentNumber,
                                    'first_name' => $faker->firstName(),
                                    'last_name' => $faker->lastName(),
                                    'personal_email' => $faker->unique()->safeEmail(),
                                    'phone' => $faker->phoneNumber(),
                                    'address' => $faker->address(),
                                    'grade_level' => $yearLabel,
                                    'enrollment_status' => 'unassigned',
                                    'academic_standing' => 'Good Standing',
                                    'date_enrolled' => $faker->dateTimeBetween('-2 years', 'now')->format('Y-m-d'),
                                    'expected_graduation' => $faker->dateTimeBetween('+1 year', '+4 years')->format('Y-m-d'),
                                    'account_status' => 'active',
                                    'emergency_contact' => $faker->name(),
                                    'emergency_phone' => $faker->phoneNumber(),
                                    'last_login' => null,
                                ]
                            );

                            if ($studentUser->student_id !== $student->id) {
                                $studentUser->student_id = $student->id;
                                $studentUser->save();
                            }
                        }
                    }
                }
            }
        });
    }
}
