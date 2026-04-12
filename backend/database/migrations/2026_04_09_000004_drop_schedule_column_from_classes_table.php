<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Remove legacy classes.schedule JSON column.
     */
    public function up(): void
    {
        if (!Schema::hasColumn('classes', 'schedule')) {
            return;
        }

        Schema::table('classes', function (Blueprint $table) {
            $table->dropColumn('schedule');
        });
    }

    /**
     * Recreate classes.schedule JSON column for rollback compatibility.
     */
    public function down(): void
    {
        if (Schema::hasColumn('classes', 'schedule')) {
            return;
        }

        Schema::table('classes', function (Blueprint $table) {
            $table->json('schedule')->nullable()->after('academic_year_id');
        });
    }
};
