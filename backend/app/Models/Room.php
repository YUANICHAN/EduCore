<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Room extends Model
{
    use HasFactory;

    protected $fillable = [
        'building_id',
        'building',
        'room_number',
        'status',
    ];

    public function buildingRecord()
    {
        return $this->belongsTo(Building::class, 'building_id');
    }
}
