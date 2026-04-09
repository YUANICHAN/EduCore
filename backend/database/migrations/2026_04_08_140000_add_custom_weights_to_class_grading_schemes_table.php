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
            if (!Schema::hasColumn('class_grading_schemes', 'custom_weights')) {
                $table->json('custom_weights')->nullable()->after('activity_task_weight');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('class_grading_schemes', function (Blueprint $table) {
            if (Schema::hasColumn('class_grading_schemes', 'custom_weights')) {
                $table->dropColumn('custom_weights');
            }
        });
    }
};
