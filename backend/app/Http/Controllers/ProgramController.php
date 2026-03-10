<?php

namespace App\Http\Controllers;

use App\Models\Program;
use Illuminate\Http\Request;

class ProgramController extends Controller
{
    private function uploadProgramImage(Request $request, ?Program $program = null): ?string
    {
        if (!$request->hasFile('program_image')) {
            return null;
        }

        if ($program && $program->program_image && file_exists(public_path($program->program_image))) {
            @unlink(public_path($program->program_image));
        }

        $file = $request->file('program_image');
        $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
        $path = public_path() . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'programs';

        if (!file_exists($path)) {
            mkdir($path, 0777, true);
        }

        $file->move($path, $filename);

        return 'uploads/programs/' . $filename;
    }
    /**
     * Display a paginated listing of programs
     */
    public function index(Request $request)
    {
        $query = Program::withCount(['sections', 'subjects', 'students']);
        
        // Search functionality
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('program_code', 'like', "%{$search}%")
                  ->orWhere('program_name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }
        
        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        // Filter by department
        if ($request->has('department')) {
            $query->where('department', $request->department);
        }
        
        // Sorting
        $sortBy = $request->get('sort_by', 'program_name');
        $sortOrder = $request->get('sort_order', 'asc');
        $query->orderBy($sortBy, $sortOrder);
        
        // Pagination
        $perPage = $request->get('per_page', 15);
        
        // Return all programs if per_page is 'all' or -1
        if ($perPage === 'all' || $perPage == -1) {
            $programs = $query->get();
            return response()->json(['data' => $programs]);
        }
        
        $programs = $query->paginate($perPage);
        
        return response()->json($programs);
    }

    /**
     * Store a newly created program
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'program_code' => 'required|string|max:50|unique:programs,program_code',
            'program_name' => 'required|string|max:255',
            'level' => 'required|in:college,senior_high,junior_high,elementary',
            'description' => 'nullable|string',
            'program_image' => 'nullable|file|mimes:jpeg,jpg,png,webp|max:10240',
            'department' => 'nullable|string|max:255',
            'department_id' => 'nullable|exists:departments,id',
            'duration_years' => 'nullable|integer|min:1|max:10',
            'credits_required' => 'nullable|integer|min:0',
            'status' => 'required|in:active,inactive',
        ]);

        if ($request->hasFile('program_image')) {
            $validated['program_image'] = $this->uploadProgramImage($request);
        }

        $program = Program::create($validated);
        
        return response()->json([
            'success' => true,
            'message' => 'Program created successfully',
            'data' => $program
        ], 201);
    }

    /**
     * Display the specified program
     */
    public function show(Program $program)
    {
        return response()->json([
            'success' => true,
            'data' => $program->load(['sections', 'subjects', 'students'])
        ]);
    }

    /**
     * Update the specified program
     */
    public function update(Request $request, Program $program)
    {
        $validated = $request->validate([
            'program_code' => 'string|max:50|unique:programs,program_code,' . $program->id,
            'program_name' => 'string|max:255',
            'level' => 'in:college,senior_high,junior_high,elementary',
            'description' => 'nullable|string',
            'program_image' => 'nullable|file|mimes:jpeg,jpg,png,webp|max:10240',
            'department' => 'nullable|string|max:255',
            'department_id' => 'nullable|exists:departments,id',
            'duration_years' => 'nullable|integer|min:1|max:10',
            'credits_required' => 'nullable|integer|min:0',
            'status' => 'in:active,inactive',
        ]);

        if ($request->hasFile('program_image')) {
            $validated['program_image'] = $this->uploadProgramImage($request, $program);
        }

        $program->update($validated);
        
        return response()->json([
            'success' => true,
            'message' => 'Program updated successfully',
            'data' => $program
        ]);
    }

    /**
     * Remove the specified program
     */
    public function destroy(Program $program)
    {
        // Check if program has directly enrolled students.
        if ($program->students()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete program with enrolled students'
            ], 422);
        }

        // Check if program has sections with enrolled students.
        $hasEnrolledSections = $program->sections()
            ->where(function ($query) {
                $query->whereHas('students')
                    ->orWhereHas('sectionEnrollments', function ($sectionEnrollments) {
                        $sectionEnrollments->enrolled();
                    });
            })
            ->exists();

        if ($hasEnrolledSections) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete program because it has enrolled sections. Please move or drop students from these sections first.'
            ], 422);
        }

        if ($program->program_image && file_exists(public_path($program->program_image))) {
            @unlink(public_path($program->program_image));
        }

        $program->delete();
        
        return response()->json([
            'success' => true,
            'message' => 'Program deleted successfully'
        ]);
    }
}
