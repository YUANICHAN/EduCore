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
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            
            // Foreign Keys
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('program_id')->constrained('programs')->onDelete('cascade');
            $table->foreignId('section_id')->nullable()->constrained('sections')->onDelete('set null');
            $table->foreignId('academic_year_id')->constrained('academic_years')->onDelete('cascade');
            
            // Basic Information
            $table->string('student_number')->unique();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('email')->unique();
            $table->string('personal_email')->nullable();
            $table->string('phone')->nullable();
            $table->text('address')->nullable();
            
            // Academic Information
            $table->string('grade_level');
            $table->enum('enrollment_status', ['enrolled', 'unassigned'])->default('unassigned');
            $table->string('academic_standing')->nullable();
            $table->date('date_enrolled')->nullable();
            $table->date('expected_graduation')->nullable();
            
            // Account Information
            $table->enum('account_status', ['active', 'disabled'])->default('active');
            $table->timestamp('last_login')->nullable();
            
            // Emergency Contact
            $table->string('emergency_contact')->nullable();
            $table->string('emergency_phone')->nullable();
            
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
        Schema::dropIfExists('students');
    }
};
