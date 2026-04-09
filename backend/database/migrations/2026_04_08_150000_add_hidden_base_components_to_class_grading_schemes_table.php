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
            if (!Schema::hasColumn('class_grading_schemes', 'hidden_base_components')) {
                $table->json('hidden_base_components')->nullable()->after('custom_weights');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('class_grading_schemes', function (Blueprint $table) {
            if (Schema::hasColumn('class_grading_schemes', 'hidden_base_components')) {
                $table->dropColumn('hidden_base_components');
            }
        });
    }
};
