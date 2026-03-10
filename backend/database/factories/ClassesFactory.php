<?php

namespace Database\Factories;

use App\Models\Classes;
use App\Models\Subject;
use App\Models\Teachers;
use App\Models\Section;
use App\Models\AcademicYear;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Classes>
 */
class ClassesFactory extends Factory
{
    protected $model = Classes::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition()
    {
        $schedule = [
            [
                'day' => fake()->randomElement(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']),
                'time_start' => '08:00',
                'time_end' => '10:00',
                'room' => fake()->bothify('Room ###'),
            ],
        ];

        return [
            'class_code' => fake()->unique()->bothify('CLS-####'),
            'subject_id' => Subject::factory(),
            'teacher_id' => Teachers::factory(),
            'section_id' => Section::factory(),
            'academic_year_id' => AcademicYear::factory(),
            'schedule' => json_encode($schedule),
            'capacity' => fake()->numberBetween(25, 40),
            'enrolled_count' => fake()->numberBetween(0, 30),
            'status' => fake()->randomElement(['active', 'completed', 'cancelled']),
        ];
    }
}
