<?php

namespace App\Console\Commands;

use App\Models\Teachers;
use App\Models\Department;
use Illuminate\Console\Command;

class AssignDepartmentsToTeachers extends Command
{
    protected $signature = 'teachers:assign-departments';
    protected $description = 'Assign departments to teachers interactively';

    public function handle()
    {
        // Get all departments
        $departments = Department::all();
        
        if ($departments->isEmpty()) {
            $this->error('No departments found in database');
            return 1;
        }

        $this->info('Available Departments:');
        foreach ($departments as $dept) {
            $this->line("  [{$dept->id}] {$dept->name} ({$dept->code})");
        }

        // Get all teachers without departments
        $teachers = Teachers::whereNull('department_id')->get();
        
        if ($teachers->isEmpty()) {
            $this->info('All teachers already have departments assigned!');
            return 0;
        }

        $this->info("\nTeachers without department assignment:");
        foreach ($teachers as $i => $teacher) {
            $this->line("  [{$i}] {$teacher->first_name} {$teacher->last_name} ({$teacher->email})");
        }

        $departmentId = $this->ask('Enter the department ID to assign to all teachers without departments');

        if (!Department::find($departmentId)) {
            $this->error("Department ID {$departmentId} not found");
            return 1;
        }

        $count = Teachers::whereNull('department_id')->update(['department_id' => $departmentId]);
        
        $this->info("Successfully assigned {$count} teachers to department {$departmentId}");
        return 0;
    }
}
