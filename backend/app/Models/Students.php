<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Students extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'program_id',
        'section_id',
        'academic_year_id',
        'student_number',
        'first_name',
        'last_name',
        'date_of_birth',
        'age',
        'gender',
        'profile_image',
        'email',
        'personal_email',
        'phone',
        'address',
        'grade_level',
        'student_type',
        'academic_standing',
        'date_enrolled',
        'expected_graduation',
        'account_status',
        'enrollment_status',
        'emergency_contact',
        'emergency_phone',
        'last_login'
    ];

    protected $hidden = [
        'remember_token',     
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'age' => 'integer',
        'date_enrolled' => 'date',
        'expected_graduation' => 'date',
        'last_login' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function program()
    {
        return $this->belongsTo(Program::class);
    }

    public function section()
    {
        return $this->belongsTo(Section::class);
    }

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function sectionEnrollments()
    {
        return $this->hasMany(SectionEnrollment::class, 'student_id');
    }

    public function enrollments()
    {
        return $this->hasMany(Enrollment::class, 'student_id');
    }

    public function attendance()
    {
        return $this->hasMany(Attendance::class, 'student_id');
    }

    public function grades()
    {
        return $this->hasMany(Grade::class, 'student_id');
    }

    public function reports()
    {
        return $this->hasMany(Report::class, 'for_student_id');
    }
}

