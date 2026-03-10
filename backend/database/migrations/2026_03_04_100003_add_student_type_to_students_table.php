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
        Schema::table('students', function (Blueprint $table) {
            $table->enum('student_type', ['new', 'transferee', 'returnee', 'old'])
                ->default('new')
                ->after('grade_level');
            $table->date('date_of_birth')->nullable()->after('last_name');
            $table->integer('age')->nullable()->after('date_of_birth');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn(['student_type', 'date_of_birth', 'age']);
        });
    }
};
