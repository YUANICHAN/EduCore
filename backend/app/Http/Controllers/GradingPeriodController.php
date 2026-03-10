<?php

namespace App\Http\Controllers;

use App\Models\GradingPeriod;
use App\Models\AcademicYear;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GradingPeriodController extends Controller
{
    /**
     * Display a listing of grading periods
     */
    public function index(Request $request)
    {
        $query = GradingPeriod::with('academicYear');
        
        // Filter by academic year
        if ($request->has('academic_year_id')) {
            $query->where('academic_year_id', $request->academic_year_id);
        }
        
        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        // Filter by period type
        if ($request->has('period_type')) {
            $query->where('period_type', $request->period_type);
        }
        
        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where('period_name', 'like', "%{$search}%");
        }
        
        // Sorting
        $sortBy = $request->get('sort_by', 'period_number');
        $sortOrder = $request->get('sort_order', 'asc');
        $query->orderBy($sortBy, $sortOrder);
        
        // Pagination
        $perPage = $request->get('per_page', 15);
        $gradingPeriods = $query->paginate($perPage);
        
        return response()->json($gradingPeriods);
    }

    /**
     * Get grading periods for current academic year
     */
    public function current()
    {
        $currentYear = AcademicYear::where('is_current', true)->first();
        
        if (!$currentYear) {
            return response()->json([
                'success' => false,
                'message' => 'No current academic year is set'
            ], 404);
        }
        
        $periods = GradingPeriod::where('academic_year_id', $currentYear->id)
            ->orderBy('period_number')
            ->get();
        
        return response()->json([
            'success' => true,
            'data' => [
                'academic_year' => $currentYear,
                'grading_periods' => $periods
            ]
        ]);
    }

    /**
     * Get currently active/open grading period
     */
    public function currentPeriod()
    {
        $period = GradingPeriod::open()->current()->first();
        
        if (!$period) {
            return response()->json([
                'success' => false,
                'message' => 'No grading period is currently open'
            ], 404);
        }
        
        return response()->json([
            'success' => true,
            'data' => $period->load('academicYear')
        ]);
    }

    /**
     * Store a newly created grading period
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'academic_year_id' => 'required|exists:academic_years,id',
            'period_name' => 'required|string|max:100',
            'period_type' => 'required|in:quarter,semester,term',
            'period_number' => 'required|integer|min:1|max:4',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'status' => 'in:locked,open,closed',
            'description' => 'nullable|string',
        ]);

        // Check for duplicate period
        $exists = GradingPeriod::where('academic_year_id', $validated['academic_year_id'])
            ->where('period_number', $validated['period_number'])
            ->where('period_type', $validated['period_type'])
            ->exists();
        
        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => 'A grading period with this number already exists for this academic year'
            ], 422);
        }

        // Check for overlapping dates
        $overlap = GradingPeriod::where('academic_year_id', $validated['academic_year_id'])
            ->where(function ($q) use ($validated) {
                $q->whereBetween('start_date', [$validated['start_date'], $validated['end_date']])
                  ->orWhereBetween('end_date', [$validated['start_date'], $validated['end_date']])
                  ->orWhere(function ($q2) use ($validated) {
                      $q2->where('start_date', '<=', $validated['start_date'])
                         ->where('end_date', '>=', $validated['end_date']);
                  });
            })
            ->exists();
        
        if ($overlap) {
            return response()->json([
                'success' => false,
                'message' => 'Date range overlaps with an existing grading period'
            ], 422);
        }

        $validated['status'] = $validated['status'] ?? 'locked';

        $gradingPeriod = GradingPeriod::create($validated);
        
        return response()->json([
            'success' => true,
            'message' => 'Grading period created successfully',
            'data' => $gradingPeriod->load('academicYear')
        ], 201);
    }

    /**
     * Display the specified grading period
     */
    public function show(GradingPeriod $gradingPeriod)
    {
        return response()->json([
            'success' => true,
            'data' => $gradingPeriod->load(['academicYear', 'grades'])
        ]);
    }

    /**
     * Update the specified grading period
     */
    public function update(Request $request, GradingPeriod $gradingPeriod)
    {
        $validated = $request->validate([
            'academic_year_id' => 'exists:academic_years,id',
            'period_name' => 'string|max:100',
            'period_type' => 'in:quarter,semester,term',
            'period_number' => 'integer|min:1|max:4',
            'start_date' => 'date',
            'end_date' => 'date|after:start_date',
            'status' => 'in:locked,open,closed',
            'description' => 'nullable|string',
        ]);

        // If changing status to open, ensure no other period is open in the same academic year
        if (isset($validated['status']) && $validated['status'] === 'open' && $gradingPeriod->status !== 'open') {
            $hasOpen = GradingPeriod::where('academic_year_id', $gradingPeriod->academic_year_id)
                ->where('id', '!=', $gradingPeriod->id)
                ->where('status', 'open')
                ->exists();
            
            if ($hasOpen) {
                return response()->json([
                    'success' => false,
                    'message' => 'Another grading period is already open. Please close it first.'
                ], 422);
            }
        }

        $gradingPeriod->update($validated);
        
        return response()->json([
            'success' => true,
            'message' => 'Grading period updated successfully',
            'data' => $gradingPeriod->load('academicYear')
        ]);
    }

    /**
     * Open a grading period for grade encoding
     */
    public function open(GradingPeriod $gradingPeriod)
    {
        // Check if another period is already open
        $hasOpen = GradingPeriod::where('academic_year_id', $gradingPeriod->academic_year_id)
            ->where('id', '!=', $gradingPeriod->id)
            ->where('status', 'open')
            ->exists();
        
        if ($hasOpen) {
            return response()->json([
                'success' => false,
                'message' => 'Another grading period is already open. Please close it first.'
            ], 422);
        }

        $gradingPeriod->update(['status' => 'open']);
        
        return response()->json([
            'success' => true,
            'message' => 'Grading period opened successfully. Teachers can now encode grades.',
            'data' => $gradingPeriod
        ]);
    }

    /**
     * Lock a grading period
     */
    public function lock(GradingPeriod $gradingPeriod)
    {
        $gradingPeriod->update(['status' => 'locked']);
        
        return response()->json([
            'success' => true,
            'message' => 'Grading period locked. Grade encoding is now disabled.',
            'data' => $gradingPeriod
        ]);
    }

    /**
     * Close a grading period (finalize)
     */
    public function close(GradingPeriod $gradingPeriod)
    {
        // Lock all grades in this period
        DB::transaction(function () use ($gradingPeriod) {
            $gradingPeriod->grades()->update([
                'is_locked' => true,
                'locked_at' => now(),
            ]);
            
            $gradingPeriod->update(['status' => 'closed']);
        });
        
        return response()->json([
            'success' => true,
            'message' => 'Grading period closed and all grades locked.',
            'data' => $gradingPeriod
        ]);
    }

    /**
     * Remove the specified grading period
     */
    public function destroy(GradingPeriod $gradingPeriod)
    {
        // Check if there are grades recorded
        if ($gradingPeriod->grades()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete grading period with existing grades'
            ], 422);
        }
        
        $gradingPeriod->delete();
        
        return response()->json([
            'success' => true,
            'message' => 'Grading period deleted successfully'
        ]);
    }

    /**
     * Bulk create grading periods for an academic year
     */
    public function bulkCreate(Request $request)
    {
        $validated = $request->validate([
            'academic_year_id' => 'required|exists:academic_years,id',
            'period_type' => 'required|in:quarter,semester,term',
            'periods' => 'required|array|min:1|max:4',
            'periods.*.period_name' => 'required|string|max:100',
            'periods.*.period_number' => 'required|integer|min:1|max:4',
            'periods.*.start_date' => 'required|date',
            'periods.*.end_date' => 'required|date|after:periods.*.start_date',
        ]);

        try {
            $createdPeriods = DB::transaction(function () use ($validated) {
                $periods = [];
                
                foreach ($validated['periods'] as $periodData) {
                    $periods[] = GradingPeriod::create([
                        'academic_year_id' => $validated['academic_year_id'],
                        'period_name' => $periodData['period_name'],
                        'period_type' => $validated['period_type'],
                        'period_number' => $periodData['period_number'],
                        'start_date' => $periodData['start_date'],
                        'end_date' => $periodData['end_date'],
                        'status' => 'locked',
                    ]);
                }
                
                return $periods;
            });
            
            return response()->json([
                'success' => true,
                'message' => count($createdPeriods) . ' grading periods created successfully',
                'data' => $createdPeriods
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create grading periods: ' . $e->getMessage()
            ], 500);
        }
    }
}
