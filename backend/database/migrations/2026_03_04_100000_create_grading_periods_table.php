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
        Schema::create('grading_periods', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_year_id')->constrained('academic_years')->onDelete('cascade');
            $table->string('period_name', 100); // e.g., "1st Quarter", "Midterm", "1st Semester"
            $table->enum('period_type', ['quarter', 'semester', 'term'])->default('quarter');
            $table->integer('period_number'); // 1, 2, 3, 4 for quarters
            $table->date('start_date');
            $table->date('end_date');
            $table->enum('status', ['locked', 'open', 'closed'])->default('locked');
            $table->text('description')->nullable();
            $table->timestamps();

            // Ensure no overlapping periods in the same academic year
            $table->unique(['academic_year_id', 'period_number', 'period_type'], 'unique_period');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('grading_periods');
    }
};
