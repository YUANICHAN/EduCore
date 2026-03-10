<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AcademicYear extends Model
{
    use HasFactory;

    protected $fillable = [
        'year_code',
        'start_date',
        'end_date',
        'semester',
        'is_current',
        'status',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'is_current' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function gradingPeriods()
    {
        return $this->hasMany(GradingPeriod::class, 'academic_year_id');
    }

    public function students()
    {
        return $this->hasMany(Students::class, 'academic_year_id');
    }

    public function sections()
    {
        return $this->hasMany(Section::class, 'academic_year_id');
    }

    public function classes()
    {
        return $this->hasMany(Classes::class, 'academic_year_id');
    }

    public function sectionEnrollments()
    {
        return $this->hasMany(SectionEnrollment::class, 'academic_year_id');
    }

    public function reports()
    {
        return $this->hasMany(Report::class, 'academic_year_id');
    }
}
