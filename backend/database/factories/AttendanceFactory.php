<?php

namespace Database\Factories;

use App\Models\Attendance;
use App\Models\Classes;
use App\Models\Students;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Attendance>
 */
class AttendanceFactory extends Factory
{
    protected $model = Attendance::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition()
    {
        $status = fake()->randomElement(['present', 'absent', 'late', 'excused']);
        $timeIn = $status !== 'absent' ? fake()->time() : null;
        $timeOut = $status === 'present' ? fake()->time() : null;

        return [
            'class_id' => Classes::factory(),
            'student_id' => Students::factory(),
            'date' => fake()->dateTimeBetween('-3 months', 'now'),
            'time_in' => $timeIn,
            'time_out' => $timeOut,
            'status' => $status,
            'remarks' => fake()->boolean(20) ? fake()->sentence() : null,
            'recorded_by' => User::factory(),
        ];
    }
}
