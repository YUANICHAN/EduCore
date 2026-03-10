<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Section extends Model
{
    use HasFactory;

    protected $fillable = [
        'section_code',
        'program_id',
        'grade_level',
        'academic_year_id',
        'capacity',
        'adviser_id',
        'room_number',
        'status',
    ];

    protected $casts = [
        'capacity' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function program()
    {
        return $this->belongsTo(Program::class);
    }

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function adviser()
    {
        return $this->belongsTo(Teachers::class, 'adviser_id');
    }

    public function sectionEnrollments()
    {
        return $this->hasMany(SectionEnrollment::class);
    }

    public function students()
    {
        return $this->hasMany(Students::class);
    }

    public function classes()
    {
        return $this->hasMany(Classes::class);
    }

    public function announcements()
    {
        return $this->hasMany(Announcement::class);
    }

    // Get enrolled students count
    public function getEnrolledCountAttribute()
    {
        return $this->sectionEnrollments()->enrolled()->count();
    }

    // Check if section has available slots
    public function hasAvailableSlots()
    {
        return $this->getEnrolledCountAttribute() < $this->capacity;
    }

    public function getAvailableSlotsAttribute()
    {
        return $this->capacity - $this->getEnrolledCountAttribute();
    }
}
