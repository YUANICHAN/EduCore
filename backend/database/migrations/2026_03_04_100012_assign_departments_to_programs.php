<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Manually assigns programs to appropriate departments based on program codes
     */
    public function up(): void
    {
        // Map program codes to department codes
        $programToDepartment = [
            'BSBA' => 'BA',  // Business Administration
            'BSIT' => 'CS',  // Computer Studies
            'WAD' => 'CS',   // Computer Studies
            'BSHM' => 'HM',  // Hospitality Management
            'HRT' => 'HM',   // Hospitality Management
            'OMT' => 'GE',   // General Education
            'OAT' => 'GE',   // General Education
        ];

        foreach ($programToDepartment as $programCode => $deptCode) {
            // Find the department
            $department = DB::table('departments')->where('code', $deptCode)->first();
            
            if ($department) {
                // Update programs that match this code
                DB::table('programs')
                    ->where('program_code', $programCode)
                    ->orWhere('department', $programCode)
                    ->update(['department_id' => $department->id]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reset department_id to null
        DB::table('programs')->update(['department_id' => null]);
    }
};
