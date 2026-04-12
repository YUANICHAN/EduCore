<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Restore one-to-many schedule design where schedules belong to classes.
     */
    public function up(): void
    {
        Schema::table('schedules', function (Blueprint $table) {
            if (!Schema::hasColumn('schedules', 'class_id')) {
                $table->foreignId('class_id')->nullable()->after('id')->constrained('classes')->onDelete('cascade');
            }
        });

        $links = DB::table('classes')
            ->whereNotNull('schedule_id')
            ->select('id', 'schedule_id')
            ->get();

        foreach ($links as $link) {
            DB::table('schedules')
                ->where('id', $link->schedule_id)
                ->update(['class_id' => $link->id]);
        }

        // Remove orphan schedules before enforcing NOT NULL class ownership.
        DB::table('schedules')->whereNull('class_id')->delete();

        DB::statement('ALTER TABLE schedules MODIFY class_id BIGINT UNSIGNED NOT NULL');

        Schema::table('classes', function (Blueprint $table) {
            if (Schema::hasColumn('classes', 'schedule_id')) {
                $table->dropConstrainedForeignId('schedule_id');
            }
        });
    }

    /**
     * Re-apply the class->schedule pointer design.
     */
    public function down(): void
    {
        Schema::table('classes', function (Blueprint $table) {
            if (!Schema::hasColumn('classes', 'schedule_id')) {
                $table->foreignId('schedule_id')->nullable()->after('academic_year_id')->constrained('schedules')->nullOnDelete();
            }
        });

        $classes = DB::table('classes')->select('id')->get();

        foreach ($classes as $class) {
            $scheduleId = DB::table('schedules')
                ->where('class_id', $class->id)
                ->orderBy('id')
                ->value('id');

            if ($scheduleId) {
                DB::table('classes')
                    ->where('id', $class->id)
                    ->update(['schedule_id' => $scheduleId]);
            }
        }

        Schema::table('schedules', function (Blueprint $table) {
            if (Schema::hasColumn('schedules', 'class_id')) {
                $table->dropConstrainedForeignId('class_id');
            }
        });
    }
};
