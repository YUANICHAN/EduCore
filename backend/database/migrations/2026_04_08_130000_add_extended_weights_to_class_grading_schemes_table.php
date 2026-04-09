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
        Schema::table('class_grading_schemes', function (Blueprint $table) {
            if (!Schema::hasColumn('class_grading_schemes', 'performance_task_weight')) {
                $table->decimal('performance_task_weight', 5, 2)->default(0)->after('attendance_weight');
            }

            if (!Schema::hasColumn('class_grading_schemes', 'activity_task_weight')) {
                $table->decimal('activity_task_weight', 5, 2)->default(0)->after('performance_task_weight');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('class_grading_schemes', function (Blueprint $table) {
            if (Schema::hasColumn('class_grading_schemes', 'activity_task_weight')) {
                $table->dropColumn('activity_task_weight');
            }

            if (Schema::hasColumn('class_grading_schemes', 'performance_task_weight')) {
                $table->dropColumn('performance_task_weight');
            }
        });
    }
};
