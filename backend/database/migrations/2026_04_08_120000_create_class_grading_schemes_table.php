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
        Schema::create('class_grading_schemes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('class_id')->constrained('classes')->onDelete('cascade');
            $table->decimal('quizzes_weight', 5, 2)->default(20);
            $table->decimal('exams_weight', 5, 2)->default(50);
            $table->decimal('projects_weight', 5, 2)->default(20);
            $table->decimal('attendance_weight', 5, 2)->default(10);
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();

            $table->unique('class_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('class_grading_schemes');
    }
};
