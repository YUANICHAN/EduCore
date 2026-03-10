<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Teachers extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'employee_id',
        'first_name',
        'last_name',
        'email',
        'phone',
        'address',
        'department_id',
        'specialization',
        'hire_date',
        'employment_status',
        'max_load',
        'profile_image',
    ];

    protected $hidden = [
        'remember_token',
    ];

    protected $casts = [
        'hire_date' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function classes()
    {
        return $this->hasMany(Classes::class, 'teacher_id');
    }

    public function sections()
    {
        return $this->hasMany(Section::class, 'adviser_id');
    }

    public function grades()
    {
        return $this->hasMany(Grade::class, 'recorded_by');
    }

    public function reports()
    {
        return $this->hasMany(Report::class, 'for_teacher_id');
    }
}
