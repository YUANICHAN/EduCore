<?php

namespace Database\Factories;

use App\Models\Subject;
use App\Models\Program;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Subject>
 */
class SubjectFactory extends Factory
{
    protected $model = Subject::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition()
    {
        $subjects = [
            'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English',
            'History', 'Programming', 'Database Systems', 'Networks', 'Web Development'
        ];

        return [
            'subject_code' => fake()->unique()->bothify('SUB-###'),
            'subject_name' => fake()->randomElement($subjects) . ' ' . fake()->numberBetween(1, 3),
            'description' => fake()->sentence(10),
            'units' => fake()->numberBetween(2, 4),
            'credits' => fake()->numberBetween(2, 4),
            'program_id' => Program::factory(),
            'grade_level' => fake()->randomElement(['1st Year', '2nd Year', '3rd Year', '4th Year']),
            'semester' => fake()->randomElement(['1st', '2nd', 'summer']),
            'is_required' => fake()->boolean(80),
            'prerequisites' => fake()->boolean(30) ? json_encode([fake()->bothify('SUB-###')]) : null,
            'status' => fake()->randomElement(['active', 'inactive']),
        ];
    }
}
