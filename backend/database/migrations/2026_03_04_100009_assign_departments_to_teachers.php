<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Assigns departments to teachers in a round-robin fashion
     */
    public function up(): void
    {
        // Get all departments
        $departments = DB::table('departments')->get(['id']);
        
        if ($departments->isEmpty()) {
            // No departments exist, skip
            return;
        }

        // Get all teachers without a department
        $teachers = DB::table('teachers')
            ->whereNull('department_id')
            ->get(['id']);

        // Assign teachers to departments round-robin
        $departmentIds = $departments->pluck('id')->toArray();
        $departmentCount = count($departmentIds);

        $index = 0;
        foreach ($teachers as $teacher) {
            $departmentId = $departmentIds[$index % $departmentCount];
            
            DB::table('teachers')
                ->where('id', $teacher->id)
                ->update(['department_id' => $departmentId]);
            
            $index++;
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reset department_id to null
        DB::table('teachers')->update(['department_id' => null]);
    }
};
