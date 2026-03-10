<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Subject extends Model
{
    use HasFactory;

    protected $fillable = [
        'subject_code',
        'subject_name',
        'description',
        'subject_type',
        'units',
        'credits',
        'hours_per_week',
        'program_id',
        'grade_level',
        'semester',
        'is_required',
        'prerequisites',
        'status',
    ];

    protected $casts = [
        'units' => 'integer',
        'credits' => 'integer',
        'is_required' => 'boolean',
        'prerequisites' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function program()
    {
        return $this->belongsTo(Program::class);
    }

    public function classes()
    {
        return $this->hasMany(Classes::class);
    }
}
