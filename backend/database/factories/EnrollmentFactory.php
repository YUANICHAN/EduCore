<?php

namespace Database\Factories;

use App\Models\Enrollment;
use App\Models\Students;
use App\Models\Classes;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Enrollment>
 */
class EnrollmentFactory extends Factory
{
    protected $model = Enrollment::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition()
    {
        return [
            'student_id' => Students::factory(),
            'class_id' => Classes::factory(),
            'enrollment_date' => fake()->dateTimeBetween('-1 year', 'now'),
            'status' => fake()->randomElement(['enrolled', 'dropped', 'completed']),
            'midterm_grade' => fake()->boolean(60) ? fake()->randomFloat(2, 1.0, 5.0) : null,
            'final_grade' => fake()->boolean(40) ? fake()->randomFloat(2, 1.0, 5.0) : null,
            'remarks' => fake()->boolean(30) ? fake()->sentence() : null,
        ];
    }
}
