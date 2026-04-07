<?php

namespace App\Http\Controllers;

use App\Models\Building;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class BuildingController extends Controller
{
    public function index(Request $request)
    {
        $query = Building::query();

        if ($request->has('search')) {
            $search = trim((string) $request->search);
            if ($search !== '') {
                $query->where('name', 'like', "%{$search}%");
            }
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $sortBy = $request->get('sort_by', 'name');
        $sortOrder = $request->get('sort_order', 'asc');
        $query->orderBy($sortBy, $sortOrder);

        $perPage = $request->get('per_page', 15);
        return response()->json($query->paginate($perPage));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100', Rule::unique('buildings', 'name')],
            'status' => 'nullable|in:active,inactive',
        ]);

        $building = Building::create([
            'name' => trim($validated['name']),
            'status' => $validated['status'] ?? 'active',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Building created successfully',
            'data' => $building,
        ], 201);
    }

    public function show(Building $building)
    {
        return response()->json([
            'success' => true,
            'data' => $building,
        ]);
    }

    public function update(Request $request, Building $building)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100', Rule::unique('buildings', 'name')->ignore($building->id)],
            'status' => 'nullable|in:active,inactive',
        ]);

        $building->update([
            'name' => trim($validated['name']),
            'status' => $validated['status'] ?? $building->status,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Building updated successfully',
            'data' => $building,
        ]);
    }

    public function destroy(Building $building)
    {
        if ($building->rooms()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete a building that still has rooms.',
            ], 422);
        }

        $building->delete();

        return response()->json([
            'success' => true,
            'message' => 'Building deleted successfully',
        ]);
    }
}
