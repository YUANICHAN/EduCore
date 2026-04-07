<?php

namespace App\Http\Controllers;

use App\Models\Building;
use App\Models\Room;
use Illuminate\Http\Request;

class RoomController extends Controller
{
    /**
     * Display a paginated listing of rooms.
     */
    public function index(Request $request)
    {
        $query = Room::with('buildingRecord');

        if ($request->has('search')) {
            $search = trim((string) $request->search);
            if ($search !== '') {
                $query->where(function ($q) use ($search) {
                    $q->where('building', 'like', "%{$search}%")
                      ->orWhereHas('buildingRecord', function ($bq) use ($search) {
                          $bq->where('name', 'like', "%{$search}%");
                      })
                      ->orWhere('room_number', 'like', "%{$search}%");
                });
            }
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $sortBy = $request->get('sort_by', 'building');
        $sortOrder = $request->get('sort_order', 'asc');

        if ($sortBy === 'building') {
            $query->orderBy('building', $sortOrder)
                ->orderBy('room_number', 'asc');
        } elseif ($sortBy === 'room_number') {
            $query->orderBy('building', 'asc')
                ->orderBy('room_number', $sortOrder);
        } else {
            $query->orderBy($sortBy, $sortOrder)
                ->orderBy('building', 'asc')
                ->orderBy('room_number', 'asc');
        }

        $perPage = $request->get('per_page', 15);
        $rooms = $query->paginate($perPage);

        return response()->json($rooms);
    }

    /**
     * Store a newly created room.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'building_id' => 'required|exists:buildings,id',
            'room_number' => 'required|string|max:50',
            'status' => 'nullable|in:active,inactive',
        ]);

        $building = Building::findOrFail($validated['building_id']);

        $exists = Room::where('building_id', $building->id)
            ->where('room_number', $validated['room_number'])
            ->exists();

        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => 'Room already exists in this building.',
            ], 422);
        }

        $room = Room::create([
            'building_id' => $building->id,
            'building' => $building->name,
            'room_number' => $validated['room_number'],
            'status' => $validated['status'] ?? 'active',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Room created successfully',
            'data' => $room,
        ], 201);
    }

    /**
     * Display the specified room.
     */
    public function show(Room $room)
    {
        return response()->json([
            'success' => true,
            'data' => $room,
        ]);
    }

    /**
     * Update the specified room.
     */
    public function update(Request $request, Room $room)
    {
        $validated = $request->validate([
            'building_id' => 'required|exists:buildings,id',
            'room_number' => 'required|string|max:50',
            'status' => 'nullable|in:active,inactive',
        ]);

        $building = Building::findOrFail($validated['building_id']);

        $exists = Room::where('building_id', $building->id)
            ->where('room_number', $validated['room_number'])
            ->where('id', '!=', $room->id)
            ->exists();

        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => 'Room already exists in this building.',
            ], 422);
        }

        $room->update([
            'building_id' => $building->id,
            'building' => $building->name,
            'room_number' => $validated['room_number'],
            'status' => $validated['status'] ?? $room->status,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Room updated successfully',
            'data' => $room,
        ]);
    }

    /**
     * Remove the specified room.
     */
    public function destroy(Room $room)
    {
        $room->delete();

        return response()->json([
            'success' => true,
            'message' => 'Room deleted successfully',
        ]);
    }
}
