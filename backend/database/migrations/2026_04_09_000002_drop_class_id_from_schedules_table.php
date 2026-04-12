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
        Schema::table('schedules', function (Blueprint $table) {
            $table->dropForeign(['class_id']);
            $table->dropColumn('class_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('schedules', function (Blueprint $table) {
            $table->unsignedBigInteger('class_id')->nullable()->after('id');
            $table->foreign('class_id')->references('id')->on('classes')->nullOnDelete();
        });

        $classLinks = DB::table('classes')
            ->whereNotNull('schedule_id')
            ->select('id', 'schedule_id')
            ->get();

        foreach ($classLinks as $link) {
            DB::table('schedules')
                ->where('id', $link->schedule_id)
                ->update(['class_id' => $link->id]);
        }
    }
};