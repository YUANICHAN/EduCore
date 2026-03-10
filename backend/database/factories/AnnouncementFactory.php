<?php

namespace Database\Factories;

use App\Models\Announcement;
use App\Models\User;
use App\Models\Section;
use App\Models\Classes;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Announcement>
 */
class AnnouncementFactory extends Factory
{
    protected $model = Announcement::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition()
    {
        $targetAudience = fake()->randomElement(['all', 'students', 'teachers', 'section', 'class']);
        $sectionId = $targetAudience === 'section' ? Section::factory() : null;
        $classId = $targetAudience === 'class' ? Classes::factory() : null;

        return [
            'title' => fake()->sentence(6),
            'content' => fake()->paragraphs(3, true),
            'author_id' => User::factory(),
            'author_type' => fake()->randomElement(['admin', 'teacher']),
            'target_audience' => $targetAudience,
            'section_id' => $sectionId,
            'class_id' => $classId,
            'priority' => fake()->randomElement(['normal', 'high', 'urgent']),
            'published_at' => fake()->boolean(70) ? fake()->dateTimeBetween('-1 month', 'now') : null,
            'expires_at' => fake()->boolean(50) ? fake()->dateTimeBetween('now', '+2 months') : null,
            'status' => fake()->randomElement(['draft', 'published', 'archived']),
        ];
    }
}
