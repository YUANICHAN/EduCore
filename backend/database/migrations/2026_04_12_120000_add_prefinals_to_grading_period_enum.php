<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        DB::statement("ALTER TABLE grades MODIFY grading_period ENUM('prelim', 'midterm', 'prefinals', 'finals') NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        DB::statement("UPDATE grades SET grading_period = 'finals' WHERE grading_period = 'prefinals'");
        DB::statement("ALTER TABLE grades MODIFY grading_period ENUM('prelim', 'midterm', 'finals') NOT NULL");
    }
};
