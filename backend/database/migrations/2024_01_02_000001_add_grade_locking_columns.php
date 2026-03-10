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
        if (!Schema::hasTable('grades')) {
            return;
        }

        Schema::table('grades', function (Blueprint $table) {
            $table->boolean('is_locked')->default(false)->after('remarks');
            $table->timestamp('locked_at')->nullable()->after('is_locked');
            $table->unsignedBigInteger('locked_by')->nullable()->after('locked_at');
            
            $table->foreign('locked_by')->references('id')->on('users')->onDelete('set null');
            $table->index('is_locked');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('grades')) {
            return;
        }

        Schema::table('grades', function (Blueprint $table) {
            if (Schema::hasColumn('grades', 'locked_by')) {
                $table->dropForeign(['locked_by']);
            }

            $columns = array_filter(['is_locked', 'locked_at', 'locked_by'], function ($column) {
                return Schema::hasColumn('grades', $column);
            });

            if (!empty($columns)) {
                $table->dropColumn($columns);
            }
        });
    }
};
