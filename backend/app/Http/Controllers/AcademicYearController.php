<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use Illuminate\Http\Request;

class AcademicYearController extends Controller
{
    /**
     * Display a paginated listing of academic years
     */
    public function index(Request $request)
    {
        $query = AcademicYear::withCount(['students', 'sections', 'classes']);
        
        // Search functionality
        if ($request->has('search')) {
            $search = $request->search;
            $query->where('year_code', 'like', "%{$search}%");
        }
        
        // Filter by semester
        if ($request->has('semester')) {
            $query->where('semester', $request->semester);
        }
        
        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        // Filter by is_current
        if ($request->has('is_current')) {
            $query->where('is_current', $request->boolean('is_current'));
        }
        
        // Sorting
        $sortBy = $request->get('sort_by', 'start_date');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);
        
        // Pagination
        $perPage = $request->get('per_page', 15);
        $academicYears = $query->paginate($perPage);
        
        return response()->json($academicYears);
    }

    /**
     * Get current academic year
     */
    public function current()
    {
        $current = AcademicYear::where('is_current', true)->first();
        
        if (!$current) {
            return response()->json([
                'success' => false,
                'message' => 'No current academic year is set'
            ], 404);
        }
        
        return response()->json([
            'success' => true,
            'data' => $current->load(['sections', 'classes'])
        ]);
    }

    /**
     * Store a newly created academic year
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'year_code' => 'required|string|max:50|unique:academic_years,year_code',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'semester' => 'required|in:1st,2nd,summer',
            'is_current' => 'boolean',
            'status' => 'required|in:active,inactive,completed',
        ]);

        // If this is set as current, unset any existing current
        if (!empty($validated['is_current']) && $validated['is_current']) {
            AcademicYear::where('is_current', true)->update(['is_current' => false]);
        }

        $academicYear = AcademicYear::create($validated);
        
        return response()->json([
            'success' => true,
            'message' => 'Academic year created successfully',
            'data' => $academicYear
        ], 201);
    }

    /**
     * Display the specified academic year
     */
    public function show(AcademicYear $academicYear)
    {
        return response()->json([
            'success' => true,
            'data' => $academicYear->load(['sections', 'classes'])
        ]);
    }

    /**
     * Update the specified academic year
     */
    public function update(Request $request, AcademicYear $academicYear)
    {
        $validated = $request->validate([
            'year_code' => 'string|max:50|unique:academic_years,year_code,' . $academicYear->id,
            'start_date' => 'date',
            'end_date' => 'date|after:start_date',
            'semester' => 'in:1st,2nd,summer',
            'is_current' => 'boolean',
            'status' => 'in:active,inactive,completed',
        ]);

        // If setting as current, unset any other current
        if (isset($validated['is_current']) && $validated['is_current'] && !$academicYear->is_current) {
            AcademicYear::where('is_current', true)
                ->where('id', '!=', $academicYear->id)
                ->update(['is_current' => false]);
        }

        $academicYear->update($validated);
        
        return response()->json([
            'success' => true,
            'message' => 'Academic year updated successfully',
            'data' => $academicYear
        ]);
    }

    /**
     * Remove the specified academic year
     */
    public function destroy(AcademicYear $academicYear)
    {
        // Check for related data
        if ($academicYear->sections()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete academic year with existing sections'
            ], 422);
        }
        
        if ($academicYear->classes()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete academic year with existing classes'
            ], 422);
        }
        
        $academicYear->delete();
        
        return response()->json([
            'success' => true,
            'message' => 'Academic year deleted successfully'
        ]);
    }
}
