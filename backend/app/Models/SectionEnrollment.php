<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SectionEnrollment extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'section_id',
        'academic_year_id',
        'program_id',
        'year_level',
        'enrollment_date',
        'status',
        'remarks',
    ];

    protected $casts = [
        'enrollment_date' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function student()
    {
        return $this->belongsTo(Students::class);
    }

    public function section()
    {
        return $this->belongsTo(Section::class);
    }

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function program()
    {
        return $this->belongsTo(Program::class);
    }

    public function classEnrollments()
    {
        return $this->hasMany(Enrollment::class);
    }

    // Scopes
    public function scopeEnrolled($query)
    {
        return $query->where('status', 'enrolled');
    }

    public function scopeActive($query)
    {
        return $query->whereIn('status', ['enrolled']);
    }

    // Helper methods
    public function isEnrolled()
    {
        return $this->status === 'enrolled';
    }

    public function isDropped()
    {
        return $this->status === 'dropped';
    }
}
