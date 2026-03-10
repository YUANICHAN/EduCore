<?php

namespace App\Http\Controllers;

use App\Models\Subject;
use Illuminate\Http\Request;

class SubjectController extends Controller
{
    /**
     * Display a paginated listing of subjects
     */
    public function index(Request $request)
    {
        $query = Subject::with('program')->withCount('classes');
        
        // Search functionality
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('subject_code', 'like', "%{$search}%")
                  ->orWhere('subject_name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }
        
        // Filter by program
        if ($request->has('program_id')) {
            $query->where('program_id', $request->program_id);
        }
        
        // Filter by grade level
        if ($request->has('grade_level')) {
            $query->where('grade_level', $request->grade_level);
        }
        
        // Filter by semester
        if ($request->has('semester')) {
            $query->where('semester', $request->semester);
        }
        
        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        // Sorting
        $sortBy = $request->get('sort_by', 'subject_name');
        $sortOrder = $request->get('sort_order', 'asc');
        $query->orderBy($sortBy, $sortOrder);
        
        // Pagination
        $perPage = $request->get('per_page', 15);
        $subjects = $query->paginate($perPage);
        
        return response()->json($subjects);
    }

    /**
     * Store a newly created subject
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'subject_code' => 'required|string|max:50|unique:subjects,subject_code',
            'subject_name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'subject_type' => 'required|in:major,minor,elective,core',
            'units' => 'required|integer|min:0',
            'credits' => 'required|integer|min:0',
            'hours_per_week' => 'nullable|integer|min:0',
            'program_id' => 'required|exists:programs,id',
            'grade_level' => 'required|string|max:50',
            'semester' => 'required|in:1st,2nd,summer',
            'is_required' => 'boolean',
            'prerequisites' => 'nullable|array',
            'prerequisites.*' => 'exists:subjects,id',
            'status' => 'required|in:active,inactive',
        ]);

        // Validate that program exists and is active
        $program = \App\Models\Program::find($validated['program_id']);
        if (!$program) {
            return response()->json([
                'success' => false,
                'message' => 'Program not found'
            ], 404);
        }

        if ($program->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Cannot add subject to inactive program'
            ], 422);
        }

        $subject = Subject::create($validated);
        
        return response()->json([
            'success' => true,
            'message' => 'Subject created successfully',
            'data' => $subject->load('program')
        ], 201);
    }

    /**
     * Display the specified subject
     */
    public function show(Subject $subject)
    {
        return response()->json([
            'success' => true,
            'data' => $subject->load(['program', 'classes'])
        ]);
    }

    /**
     * Update the specified subject
     */
    public function update(Request $request, Subject $subject)
    {
        $validated = $request->validate([
            'subject_code' => 'string|max:50|unique:subjects,subject_code,' . $subject->id,
            'subject_name' => 'string|max:255',
            'description' => 'nullable|string',
            'subject_type' => 'in:major,minor,elective,core',
            'units' => 'integer|min:0',
            'credits' => 'integer|min:0',
            'hours_per_week' => 'nullable|integer|min:0',
            'program_id' => 'exists:programs,id',
            'grade_level' => 'string|max:50',
            'semester' => 'in:1st,2nd,summer',
            'is_required' => 'boolean',
            'prerequisites' => 'nullable|array',
            'prerequisites.*' => 'exists:subjects,id',
            'status' => 'in:active,inactive',
        ]);

        $subject->update($validated);
        
        return response()->json([
            'success' => true,
            'message' => 'Subject updated successfully',
            'data' => $subject->load('program')
        ]);
    }

    /**
     * Remove the specified subject
     */
    public function destroy(Subject $subject)
    {
        // Check if subject has related classes
        if ($subject->classes()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete subject with existing classes'
            ], 422);
        }
        
        $subject->delete();
        
        return response()->json([
            'success' => true,
            'message' => 'Subject deleted successfully'
        ]);
    }

    /**
     * Get classes for a subject
     */
    public function classes(Subject $subject, Request $request)
    {
        $query = $subject->classes()->with(['teacher', 'section', 'academicYear']);
        
        // Filter by academic year
        if ($request->has('academic_year_id')) {
            $query->where('academic_year_id', $request->academic_year_id);
        }
        
        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        $perPage = $request->get('per_page', 15);
        $classes = $query->paginate($perPage);
        
        return response()->json($classes);
    }
}
