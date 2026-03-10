<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Report extends Model
{
    use HasFactory;

    protected $fillable = [
        'report_type',
        'generated_by',
        'for_student_id',
        'for_teacher_id',
        'for_class_id',
        'academic_year_id',
        'data',
        'file_path',
        'generated_at',
    ];

    protected $casts = [
        'data' => 'array',
        'generated_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function generator()
    {
        return $this->belongsTo(User::class, 'generated_by');
    }

    public function student()
    {
        return $this->belongsTo(Students::class, 'for_student_id');
    }

    public function teacher()
    {
        return $this->belongsTo(Teachers::class, 'for_teacher_id');
    }

    public function class()
    {
        return $this->belongsTo(Classes::class, 'for_class_id');
    }

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }
}
