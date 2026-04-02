<?php

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
            $table->dropForeign(['teacher_id']);
        });

        Schema::table('classes', function (Blueprint $table) {
            $table->unsignedBigInteger('teacher_id')->nullable()->change();
        });

        Schema::table('classes', function (Blueprint $table) {
            $table->foreign('teacher_id')->references('id')->on('teachers')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove unassigned classes to safely restore NOT NULL constraint.
        DB::table('classes')->whereNull('teacher_id')->delete();

        Schema::table('classes', function (Blueprint $table) {
            $table->dropForeign(['teacher_id']);
        });

        Schema::table('classes', function (Blueprint $table) {
            $table->unsignedBigInteger('teacher_id')->nullable(false)->change();
        });

        Schema::table('classes', function (Blueprint $table) {
            $table->foreign('teacher_id')->references('id')->on('teachers')->cascadeOnDelete();
        });
    }
};
