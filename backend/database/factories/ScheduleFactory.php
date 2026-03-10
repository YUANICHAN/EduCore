<?php

namespace Database\Factories;

use App\Models\Schedule;
use App\Models\Classes;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Schedule>
 */
class ScheduleFactory extends Factory
{
    protected $model = Schedule::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition()
    {
        $timeSlots = [
            ['08:00', '10:00'],
            ['10:00', '12:00'],
            ['13:00', '15:00'],
            ['15:00', '17:00'],
        ];

        $slot = fake()->randomElement($timeSlots);

        return [
            'class_id' => Classes::factory(),
            'day_of_week' => fake()->randomElement(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']),
            'time_start' => $slot[0],
            'time_end' => $slot[1],
            'room_number' => fake()->bothify('Room ###'),
            'building' => fake()->randomElement(['Main Building', 'Science Building', 'IT Building', 'Engineering Building']),
        ];
    }
}
