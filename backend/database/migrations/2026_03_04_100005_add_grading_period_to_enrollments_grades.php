<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add grading_period_id to grades table
        Schema::table('grades', function (Blueprint $table) {
            $table->foreignId('grading_period_id')->nullable()->after('class_id')
                ->constrained('grading_periods')->onDelete('cascade');
        });

        // Add section_enrollment_id to enrollments for tracking
        Schema::table('enrollments', function (Blueprint $table) {
            $table->foreignId('section_enrollment_id')->nullable()->after('class_id')
                ->constrained('section_enrollments')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('grades', function (Blueprint $table) {
            $table->dropForeign(['grading_period_id']);
            $table->dropColumn('grading_period_id');
        });

        Schema::table('enrollments', function (Blueprint $table) {
            $table->dropForeign(['section_enrollment_id']);
            $table->dropColumn('section_enrollment_id');
        });
    }
};
