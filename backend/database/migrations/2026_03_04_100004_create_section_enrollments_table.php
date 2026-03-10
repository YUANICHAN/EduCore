<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * This table tracks student enrollment in a section
     * When enrolled, the system auto-creates enrollments for all subjects in the program curriculum
     */
    public function up(): void
    {
        Schema::create('section_enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->foreignId('section_id')->constrained('sections')->onDelete('cascade');
            $table->foreignId('academic_year_id')->constrained('academic_years')->onDelete('cascade');
            $table->foreignId('program_id')->constrained('programs')->onDelete('cascade');
            $table->string('year_level', 50); // e.g., "1st Year", "Grade 7"
            $table->date('enrollment_date');
            $table->enum('status', ['enrolled', 'dropped', 'transferred', 'completed'])->default('enrolled');
            $table->text('remarks')->nullable();
            $table->timestamps();

            // Ensure student can only be enrolled once per academic year in a section
            $table->unique(['student_id', 'section_id', 'academic_year_id'], 'unique_section_enrollment');
        });

        // Add index for faster queries
        Schema::table('section_enrollments', function (Blueprint $table) {
            $table->index(['academic_year_id', 'section_id']);
            $table->index(['student_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('section_enrollments');
    }
};
