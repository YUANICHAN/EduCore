<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('programs') || !Schema::hasTable('departments')) {
            return;
        }

        // 1) If department text matches a department name/code, populate missing department_id.
        $programsWithTextOnly = DB::table('programs')
            ->select('id', 'department', 'department_id')
            ->whereNull('department_id')
            ->whereNotNull('department')
            ->where('department', '!=', '')
            ->get();

        foreach ($programsWithTextOnly as $program) {
            $department = DB::table('departments')
                ->where('name', $program->department)
                ->orWhere('code', $program->department)
                ->first();

            if ($department) {
                DB::table('programs')
                    ->where('id', $program->id)
                    ->update([
                        'department_id' => $department->id,
                        'department' => $department->name,
                    ]);
            }
        }

        // 2) For rows with department_id set, normalize department text from FK target name.
        $programsWithFk = DB::table('programs')
            ->select('id', 'department_id')
            ->whereNotNull('department_id')
            ->get();

        foreach ($programsWithFk as $program) {
            $department = DB::table('departments')->where('id', $program->department_id)->first();
            if ($department) {
                DB::table('programs')
                    ->where('id', $program->id)
                    ->update(['department' => $department->name]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No-op. This migration normalizes existing data.
    }
};
