<?php

namespace Database\Factories;

use App\Models\AcademicYear;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\AcademicYear>
 */
class AcademicYearFactory extends Factory
{
    protected $model = AcademicYear::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition()
    {
        $year = fake()->numberBetween(2023, 2026);
        $semester = fake()->randomElement(['1st', '2nd', 'summer']);
        
        $startMonth = $semester === '1st' ? 8 : ($semester === '2nd' ? 1 : 6);
        $startDate = now()->setYear($year)->setMonth($startMonth)->setDay(1);
        $endDate = $startDate->copy()->addMonths($semester === 'summer' ? 2 : 5);

        return [
            'year_code' => $year . '-' . ($year + 1) . ' ' . $semester,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'semester' => $semester,
            'is_current' => fake()->boolean(20),
            'status' => fake()->randomElement(['active', 'inactive', 'completed']),
        ];
    }
}
