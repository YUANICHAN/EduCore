<?php

namespace Database\Factories;

use App\Models\Teachers;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Teachers>
 */
class TeachersFactory extends Factory
{
    protected $model = Teachers::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition()
    {
        return [
            'user_id' => User::factory(),
            'employee_id' => 'EMP' . fake()->unique()->numberBetween(100000, 999999),
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'email' => fake()->unique()->safeEmail(),
            'gender' => fake()->randomElement(['male', 'female', 'prefer_not_to_say']),
            'profile_image' => fake()->imageUrl(),
            'phone' => fake()->phoneNumber(),
            'address' => fake()->address(),
            'department' => fake()->randomElement([
                'Computer Science',
                'Information Technology',
                'Business Administration',
                'Education',
                'Engineering',
                'Mathematics',
                'Science',
            ]),
            'specialization' => fake()->randomElement([
                'Programming',
                'Database Systems',
                'Network Administration',
                'Web Development',
                'Mobile Development',
                'Mathematics',
                'Physics',
                'Accounting',
                'Management',
            ]),
            'hire_date' => fake()->dateTimeBetween('-10 years', '-1 year'),
            'employment_status' => fake()->randomElement(['active', 'on_leave', 'inactive']),
        ];
    }
}
