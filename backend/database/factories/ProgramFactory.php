<?php

namespace Database\Factories;

use App\Models\Program;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Program>
 */
class ProgramFactory extends Factory
{
    protected $model = Program::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition()
    {
        $programs = [
            ['code' => 'BSCS', 'name' => 'Bachelor of Science in Computer Science', 'dept' => 'Computer Science'],
            ['code' => 'BSIT', 'name' => 'Bachelor of Science in Information Technology', 'dept' => 'Information Technology'],
            ['code' => 'BSCE', 'name' => 'Bachelor of Science in Computer Engineering', 'dept' => 'Engineering'],
            ['code' => 'BSBA', 'name' => 'Bachelor of Science in Business Administration', 'dept' => 'Business'],
            ['code' => 'BSA', 'name' => 'Bachelor of Science in Accountancy', 'dept' => 'Accounting'],
        ];

        $program = fake()->randomElement($programs);

        return [
            'program_code' => $program['code'] . '-' . fake()->unique()->numberBetween(1, 999),
            'program_name' => $program['name'],
            'description' => fake()->paragraph(),
            'department' => $program['dept'],
            'duration_years' => fake()->numberBetween(4, 5),
            'credits_required' => fake()->numberBetween(120, 180),
            'status' => fake()->randomElement(['active', 'inactive']),
        ];
    }
}
