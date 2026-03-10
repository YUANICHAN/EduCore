<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Grade extends Model
{
    use HasFactory;

    protected $fillable = [
        'enrollment_id',
        'student_id',
        'class_id',
        'grading_period_id',
        'grading_period',
        'component_type',
        'component_name',
        'score',
        'max_score',
        'percentage_weight',
        'date_recorded',
        'recorded_by',
        'remarks',
        'is_locked',
        'locked_at',
        'locked_by',
    ];

    protected $casts = [
        'score' => 'decimal:2',
        'max_score' => 'decimal:2',
        'percentage_weight' => 'decimal:2',
        'date_recorded' => 'date',
        'is_locked' => 'boolean',
        'locked_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function enrollment()
    {
        return $this->belongsTo(Enrollment::class);
    }

    public function student()
    {
        return $this->belongsTo(Students::class);
    }

    public function class()
    {
        return $this->belongsTo(Classes::class);
    }

    public function gradingPeriod()
    {
        return $this->belongsTo(GradingPeriod::class);
    }

    public function recorder()
    {
        return $this->belongsTo(Teachers::class, 'recorded_by');
    }

    public function locker()
    {
        return $this->belongsTo(User::class, 'locked_by');
    }

    /**
     * Check if grade can be modified
     */
    public function canModify()
    {
        return !$this->is_locked;
    }

    /**
     * Lock the grade
     */
    public function lock($userId)
    {
        $this->update([
            'is_locked' => true,
            'locked_at' => now(),
            'locked_by' => $userId,
        ]);
    }

    /**
     * Unlock the grade (admin only)
     */
    public function unlock()
    {
        $this->update([
            'is_locked' => false,
            'locked_at' => null,
            'locked_by' => null,
        ]);
    }
}
