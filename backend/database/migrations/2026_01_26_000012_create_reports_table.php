<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            $table->enum('report_type', ['grade_report', 'attendance_report', 'performance_report', 'class_report', 'other']);
            $table->foreignId('generated_by')->constrained('users')->onDelete('cascade');
            $table->foreignId('for_student_id')->nullable()->constrained('students')->onDelete('cascade');
            $table->foreignId('for_teacher_id')->nullable()->constrained('teachers')->onDelete('cascade');
            $table->foreignId('for_class_id')->nullable()->constrained('classes')->onDelete('cascade');
            $table->foreignId('academic_year_id')->constrained('academic_years')->onDelete('cascade');
            $table->json('data')->nullable();
            $table->string('file_path', 500)->nullable();
            $table->timestamp('generated_at');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('reports');
    }
};
