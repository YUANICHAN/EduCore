<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Enrollment extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'class_id',
        'section_enrollment_id',
        'enrollment_date',
        'status',
        'midterm_grade',
        'final_grade',
        'remarks',
    ];

    protected $casts = [
        'enrollment_date' => 'date',
        'midterm_grade' => 'decimal:2',
        'final_grade' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function student()
    {
        return $this->belongsTo(Students::class);
    }

    public function class()
    {
        return $this->belongsTo(Classes::class);
    }

    public function sectionEnrollment()
    {
        return $this->belongsTo(SectionEnrollment::class);
    }

    public function grades()
    {
        return $this->hasMany(Grade::class);
    }
}
