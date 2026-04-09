<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClassGradingScheme extends Model
{
    use HasFactory;

    protected $fillable = [
        'class_id',
        'quizzes_weight',
        'exams_weight',
        'projects_weight',
        'attendance_weight',
        'performance_task_weight',
        'activity_task_weight',
        'custom_weights',
        'hidden_base_components',
        'created_by',
    ];

    protected $casts = [
        'quizzes_weight' => 'decimal:2',
        'exams_weight' => 'decimal:2',
        'projects_weight' => 'decimal:2',
        'attendance_weight' => 'decimal:2',
        'performance_task_weight' => 'decimal:2',
        'activity_task_weight' => 'decimal:2',
        'custom_weights' => 'array',
        'hidden_base_components' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function class()
    {
        return $this->belongsTo(Classes::class, 'class_id');
    }
}
