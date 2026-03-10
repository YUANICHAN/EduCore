<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Department;

class DepartmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run()
    {
        $departments = [
            [
                'code' => 'CS',
                'name' => 'Computer Studies',
                'description' => 'Department of Computer Studies offering programs in Information Technology and Computer Science',
                'color' => 'blue',
                'status' => 'active',
            ],
            [
                'code' => 'BA',
                'name' => 'Business Administration',
                'description' => 'Department of Business Administration offering programs in Business Management and Entrepreneurship',
                'color' => 'emerald',
                'status' => 'active',
            ],
            [
                'code' => 'HM',
                'name' => 'Hospitality Management',
                'description' => 'Department of Hospitality Management offering programs in Hotel and Restaurant Management',
                'color' => 'amber',
                'status' => 'active',
            ],
            [
                'code' => 'GE',
                'name' => 'General Education',
                'description' => 'General Education Department handling foundational and core curriculum subjects',
                'color' => 'purple',
                'status' => 'active',
            ],
        ];

        foreach ($departments as $department) {
            Department::firstOrCreate(
                ['code' => $department['code']],
                $department
            );
        }
    }
}
