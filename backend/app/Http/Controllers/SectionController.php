<?php

namespace App\Http\Controllers;

use App\Models\Section;
use Illuminate\Http\Request;

class SectionController extends Controller
{
    /**
     * Display a paginated listing of sections
     */
    public function index(Request $request)
    {
        $query = Section::with(['program', 'academicYear', 'adviser'])
            ->withCount([
                'students',
                'classes',
                'sectionEnrollments as enrolled_count' => function ($query) {
                    $query->where('status', 'enrolled');
                }
            ]);
        
        // Search functionality
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('section_code', 'like', "%{$search}%")
                  ->orWhere('room_number', 'like', "%{$search}%");
            });
        }
        
        // Filter by program
        if ($request->has('program_id')) {
            $query->where('program_id', $request->program_id);
        }
        
        // Filter by academic year
        if ($request->has('academic_year_id')) {
            $query->where('academic_year_id', $request->academic_year_id);
        }
        
        // Filter by grade level
        if ($request->has('grade_level') || $request->has('year_level')) {
            $query->where('grade_level', $request->grade_level ?? $request->year_level);
        }
        
        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        // Filter by adviser
        if ($request->has('adviser_id')) {
            $query->where('adviser_id', $request->adviser_id);
        }
        
        // Sorting
        $sortBy = $request->get('sort_by', 'section_code');
        $sortOrder = $request->get('sort_order', 'asc');
        $query->orderBy($sortBy, $sortOrder);
        
        // Pagination
        $perPage = $request->get('per_page', 15);
        
        // Return all sections if per_page is 'all' or -1
        if ($perPage === 'all' || $perPage == -1) {
            $sections = $query->get();
            return response()->json(['data' => $sections]);
        }
        
        $sections = $query->paginate($perPage);
        
        return response()->json($sections);
    }

    /**
     * Store a newly created section
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'section_code' => 'required|string|max:50|unique:sections,section_code',
            'program_id' => 'required|exists:programs,id',
            'grade_level' => 'required|string|max:50',
            'academic_year_id' => 'required|exists:academic_years,id',
            'capacity' => 'nullable|integer|min:1|max:100',
            'adviser_id' => 'nullable|exists:teachers,id',
            'room_number' => 'nullable|string|max:50',
            'status' => 'required|in:active,inactive',
        ]);

        // Validate program exists and is active
        $program = \App\Models\Program::find($validated['program_id']);
        if (!$program || $program->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Program must exist and be active before creating sections'
            ], 422);
        }

        // Validate academic year is active
        $academicYear = \App\Models\AcademicYear::find($validated['academic_year_id']);
        if (!$academicYear || $academicYear->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Academic year must be active'
            ], 422);
        }

        $section = Section::create($validated);
        
        return response()->json([
            'success' => true,
            'message' => 'Section created successfully',
            'data' => $section->load(['program', 'academicYear', 'adviser'])
        ], 201);
    }

    /**
     * Display the specified section
     */
    public function show(Section $section)
    {
        return response()->json([
            'success' => true,
            'data' => $section->load(['program', 'academicYear', 'adviser', 'students', 'classes'])
        ]);
    }

    /**
     * Update the specified section
     */
    public function update(Request $request, Section $section)
    {
        $validated = $request->validate([
            'section_code' => 'string|max:50|unique:sections,section_code,' . $section->id,
            'program_id' => 'exists:programs,id',
            'grade_level' => 'string|max:50',
            'academic_year_id' => 'exists:academic_years,id',
            'capacity' => 'nullable|integer|min:1|max:100',
            'adviser_id' => 'nullable|exists:teachers,id',
            'room_number' => 'nullable|string|max:50',
            'status' => 'in:active,inactive',
        ]);

        $section->update($validated);
        
        return response()->json([
            'success' => true,
            'message' => 'Section updated successfully',
            'data' => $section->load(['program', 'academicYear', 'adviser'])
        ]);
    }

    /**
     * Remove the specified section
     */
    public function destroy(Section $section)
    {
        // Check if section has students
        if ($section->students()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete section with enrolled students'
            ], 422);
        }
        
        $section->delete();
        
        return response()->json([
            'success' => true,
            'message' => 'Section deleted successfully'
        ]);
    }

    /**
     * Get students in a section
     */
    public function students(Section $section, Request $request)
    {
        $query = $section->students();
        
        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('student_number', 'like', "%{$search}%");
            });
        }
        
        $perPage = $request->get('per_page', 15);
        $students = $query->paginate($perPage);
        
        return response()->json($students);
    }

    /**
     * Get classes in a section
     */
    public function classes(Section $section, Request $request)
    {
        $query = $section->classes()->with(['subject', 'teacher', 'schedules']);
        
        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        $perPage = $request->get('per_page', 15);
        $classes = $query->paginate($perPage);
        
        return response()->json($classes);
    }
}
