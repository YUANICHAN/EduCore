<?php

namespace Database\Factories;

use App\Models\Grade;
use App\Models\Enrollment;
use App\Models\Students;
use App\Models\Classes;
use App\Models\Teachers;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Grade>
 */
class GradeFactory extends Factory
{
    protected $model = Grade::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition()
    {
        $maxScore = fake()->numberBetween(50, 100);
        $score = fake()->numberBetween(0, $maxScore);

        return [
            'enrollment_id' => Enrollment::factory(),
            'student_id' => Students::factory(),
            'class_id' => Classes::factory(),
            'grading_period' => fake()->randomElement(['prelim', 'midterm', 'finals']),
            'component_type' => fake()->randomElement(['quiz', 'exam', 'project', 'assignment', 'participation', 'other']),
            'component_name' => fake()->randomElement(['Quiz', 'Midterm Exam', 'Final Project', 'Assignment']) . ' ' . fake()->numberBetween(1, 5),
            'score' => $score,
            'max_score' => $maxScore,
            'percentage_weight' => fake()->randomFloat(2, 5, 30),
            'date_recorded' => fake()->dateTimeBetween('-2 months', 'now'),
            'recorded_by' => Teachers::factory(),
            'remarks' => fake()->boolean(20) ? fake()->sentence() : null,
        ];
    }
}
