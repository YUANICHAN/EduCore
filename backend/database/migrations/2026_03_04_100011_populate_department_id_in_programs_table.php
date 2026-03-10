<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Populates department_id in programs table by matching department names
     * from the existing department string column with records in the departments table.
     */
    public function up(): void
    {
        // Check if the 'department' column still exists
        if (!Schema::hasColumn('programs', 'department')) {
            return;
        }

        // Get all programs with department values
        $programs = DB::table('programs')
            ->whereNotNull('department')
            ->where('department', '!=', '')
            ->get();

        foreach ($programs as $program) {
            // Find matching department by name or code
            $department = DB::table('departments')
                ->where('name', $program->department)
                ->orWhere('code', $program->department)
                ->first();

            if ($department) {
                // Update program with the department_id
                DB::table('programs')
                    ->where('id', $program->id)
                    ->update(['department_id' => $department->id]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reset all department_id values to null
        DB::table('programs')->update(['department_id' => null]);
    }
};
