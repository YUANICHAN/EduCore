<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Populates department_id in teachers table by matching department names
     * from the existing department string column with records in the departments table.
     */
    public function up(): void
    {
        // Check if the 'department' column exists
        if (!Schema::hasColumn('teachers', 'department')) {
            echo "Department column not found - skipping population\n";
            return;
        }

        // Get all unique departments from teachers table
        $teacherDepts = DB::table('teachers')
            ->whereNotNull('department')
            ->where('department', '!=', '')
            ->distinct()
            ->pluck('department')
            ->toArray();

        echo "Found teachers with departments: " . json_encode($teacherDepts) . "\n";

        // Get all departments
        $departments = DB::table('departments')->get();
        echo "Available departments in DB: " . $departments->count() . " found\n";

        // Create a map of department names/codes to IDs
        $deptMap = [];
        foreach ($departments as $dept) {
            $deptMap[strtolower(trim($dept->name))] = $dept->id;
            if ($dept->code) {
                $deptMap[strtolower(trim($dept->code))] = $dept->id;
            }
        }

        // Update each teacher
        $updated = 0;
        foreach ($teacherDepts as $deptName) {
            $key = strtolower(trim($deptName));
            
            if (isset($deptMap[$key])) {
                $count = DB::table('teachers')
                    ->where('department', $deptName)
                    ->update(['department_id' => $deptMap[$key]]);
                $updated += $count;
                echo "Updated $count teachers from department: $deptName\n";
            } else {
                echo "WARNING: No matching department found for: $deptName\n";
            }
        }

        echo "Total teachers updated: $updated\n";
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reset all department_id values to null
        DB::table('teachers')->update(['department_id' => null]);
    }
};
