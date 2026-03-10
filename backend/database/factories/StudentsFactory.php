<?php

namespace Database\Factories;

use App\Models\Students;
use App\Models\User;
use App\Models\Program;
use App\Models\Section;
use App\Models\AcademicYear;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Students>
 */
class StudentsFactory extends Factory
{
    protected $model = Students::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition()
    {
        return [
            'user_id' => User::factory(),
            'program_id' => Program::factory(),
            'section_id' => fake()->boolean(80) ? Section::factory() : null,
            'academic_year_id' => AcademicYear::factory(),
            'student_number' => 'STU' . fake()->unique()->numberBetween(100000, 999999),
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'gender' => fake()->randomElement(['male', 'female', 'prefer_not_to_say']),
            'profile_image' => fake()->imageUrl(),
            'email' => fake()->unique()->safeEmail(),
            'personal_email' => fake()->unique()->safeEmail(),
            'phone' => fake()->phoneNumber(),
            'address' => fake()->address(),
            'grade_level' => fake()->randomElement(['1st Year', '2nd Year', '3rd Year', '4th Year']),
            'enrollment_status' => fake()->randomElement(['enrolled', 'unassigned']),
            'academic_standing' => fake()->randomElement(['Good Standing', 'Dean\'s List', 'Probation', 'Warning']),
            'date_enrolled' => fake()->dateTimeBetween('-4 years', 'now'),
            'expected_graduation' => fake()->dateTimeBetween('now', '+4 years'),
            'account_status' => fake()->randomElement(['active', 'disabled']),
            'emergency_contact' => fake()->name(),
            'emergency_phone' => fake()->phoneNumber(),
            'last_login' => fake()->boolean(60) ? fake()->dateTimeBetween('-1 month', 'now') : null,
        ];
    }
}
