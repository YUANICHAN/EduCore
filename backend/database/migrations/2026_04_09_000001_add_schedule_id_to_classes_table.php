<?php

use App\Models\Classes;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('classes', function (Blueprint $table) {
            $table->foreignId('schedule_id')
                ->nullable()
                ->after('academic_year_id')
                ->constrained('schedules')
                ->nullOnDelete();
        });

        $classes = DB::table('classes')->select('id', 'schedule')->orderBy('id')->get();

        foreach ($classes as $class) {
            $primaryScheduleId = DB::table('schedules')
                ->where('class_id', $class->id)
                ->orderBy('day_of_week')
                ->orderBy('time_start')
                ->value('id');

            if (!$primaryScheduleId && !empty($class->schedule)) {
                $scheduleItems = is_string($class->schedule)
                    ? json_decode($class->schedule, true)
                    : $class->schedule;

                if (is_array($scheduleItems)) {
                    foreach ($scheduleItems as $scheduleItem) {
                        if (!is_array($scheduleItem)) {
                            continue;
                        }

                        $insertedId = DB::table('schedules')->insertGetId([
                            'class_id' => $class->id,
                            'day_of_week' => $scheduleItem['day_of_week'] ?? $scheduleItem['day'] ?? 'Monday',
                            'time_start' => $scheduleItem['time_start'] ?? $scheduleItem['start_time'] ?? '08:00:00',
                            'time_end' => $scheduleItem['time_end'] ?? $scheduleItem['end_time'] ?? '09:00:00',
                            'room_number' => $scheduleItem['room_number'] ?? $scheduleItem['room'] ?? null,
                            'building' => $scheduleItem['building'] ?? null,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);

                        $primaryScheduleId = $primaryScheduleId ?: $insertedId;
                    }
                }
            }

            if ($primaryScheduleId) {
                DB::table('classes')
                    ->where('id', $class->id)
                    ->update(['schedule_id' => $primaryScheduleId]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('classes', function (Blueprint $table) {
            $table->dropConstrainedForeignId('schedule_id');
        });
    }
};