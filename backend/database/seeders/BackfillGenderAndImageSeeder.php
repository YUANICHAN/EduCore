<?php

namespace Database\Seeders;

use App\Models\Students;
use App\Models\Teachers;
use Illuminate\Database\Seeder;

class BackfillGenderAndImageSeeder extends Seeder
{
    public function run()
    {
        // Students
        Students::whereNull('gender')
            ->orWhereNull('profile_image')
            ->chunkById(100, function ($students) {
                foreach ($students as $student) {
                    $student->update([
                        'gender' => $student->gender ?? fake()->randomElement(['male', 'female', 'prefer_not_to_say']),
                        'profile_image' => $student->profile_image ?? 'avatars/default-student.png',
                    ]);
                }
            });

        // Teachers
        Teachers::whereNull('gender')
            ->orWhereNull('profile_image')
            ->chunkById(100, function ($teachers) {
                foreach ($teachers as $teacher) {
                    $teacher->update([
                        'gender' => $teacher->gender ?? fake()->randomElement(['male', 'female', 'prefer_not_to_say']),
                        'profile_image' => $teacher->profile_image ?? 'avatars/default-teacher.png',
                    ]);
                }
            });
    }
}

