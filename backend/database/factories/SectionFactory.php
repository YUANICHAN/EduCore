<?php

namespace Database\Factories;

use App\Models\Section;
use App\Models\Program;
use App\Models\AcademicYear;
use App\Models\Teachers;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Section>
 */
class SectionFactory extends Factory
{
    protected $model = Section::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition()
    {
        $gradeLevel = fake()->randomElement(['1st Year', '2nd Year', '3rd Year', '4th Year']);
        $sectionLetter = fake()->randomElement(['A', 'B', 'C', 'D', 'E']);

        return [
            'section_code' => fake()->unique()->bothify('SEC-####'),
            'program_id' => Program::factory(),
            'grade_level' => $gradeLevel,
            'academic_year_id' => AcademicYear::factory(),
            'capacity' => fake()->numberBetween(25, 40),
            'adviser_id' => fake()->boolean(70) ? Teachers::factory() : null,
            'room_number' => fake()->bothify('Room ###'),
            'status' => fake()->randomElement(['active', 'inactive']),
        ];
    }
}
