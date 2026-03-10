<?php

namespace Database\Factories;

use App\Models\Report;
use App\Models\User;
use App\Models\Students;
use App\Models\Teachers;
use App\Models\Classes;
use App\Models\AcademicYear;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Report>
 */
class ReportFactory extends Factory
{
    protected $model = Report::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition()
    {
        $reportType = fake()->randomElement(['grade_report', 'attendance_report', 'performance_report', 'class_report', 'other']);

        return [
            'report_type' => $reportType,
            'generated_by' => User::factory(),
            'for_student_id' => fake()->boolean(40) ? Students::factory() : null,
            'for_teacher_id' => fake()->boolean(30) ? Teachers::factory() : null,
            'for_class_id' => fake()->boolean(30) ? Classes::factory() : null,
            'academic_year_id' => AcademicYear::factory(),
            'data' => json_encode([
                'total_records' => fake()->numberBetween(10, 100),
                'summary' => fake()->sentence(),
            ]),
            'file_path' => fake()->boolean(50) ? 'reports/' . fake()->uuid() . '.pdf' : null,
            'generated_at' => fake()->dateTimeBetween('-3 months', 'now'),
        ];
    }
}
