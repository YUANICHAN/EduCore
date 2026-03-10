<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    /**
     * Display a paginated listing of announcements
     */
    public function index(Request $request)
    {
        $query = Announcement::with(['author', 'section', 'class']);
        
        // Search functionality
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('content', 'like', "%{$search}%");
            });
        }
        
        // Filter by author type
        if ($request->has('author_type')) {
            $query->where('author_type', $request->author_type);
        }
        
        // Filter by target audience
        if ($request->has('target_audience')) {
            $query->where('target_audience', $request->target_audience);
        }
        
        // Filter by section
        if ($request->has('section_id')) {
            $query->where('section_id', $request->section_id);
        }
        
        // Filter by class
        if ($request->has('class_id')) {
            $query->where('class_id', $request->class_id);
        }
        
        // Filter by priority
        if ($request->has('priority')) {
            $query->where('priority', $request->priority);
        }
        
        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        // Filter active (published and not expired)
        if ($request->has('active') && $request->active) {
            $query->where('status', 'published')
                  ->where(function ($q) {
                      $q->whereNull('expires_at')
                        ->orWhere('expires_at', '>', now());
                  });
        }
        
        // Sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);
        
        // Pagination
        $perPage = $request->get('per_page', 15);
        $announcements = $query->paginate($perPage);
        
        return response()->json($announcements);
    }

    /**
     * Store a newly created announcement
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'author_id' => 'required|exists:users,id',
            'author_type' => 'required|in:admin,teacher',
            'target_audience' => 'required|in:all,students,teachers,section,class',
            'section_id' => 'nullable|required_if:target_audience,section|exists:sections,id',
            'class_id' => 'nullable|required_if:target_audience,class|exists:classes,id',
            'priority' => 'required|in:normal,high,urgent',
            'published_at' => 'nullable|date',
            'expires_at' => 'nullable|date|after:published_at',
            'status' => 'required|in:draft,published,archived',
        ]);

        // Auto-set published_at if status is published
        if ($validated['status'] === 'published' && empty($validated['published_at'])) {
            $validated['published_at'] = now();
        }

        $announcement = Announcement::create($validated);
        
        return response()->json([
            'success' => true,
            'message' => 'Announcement created successfully',
            'data' => $announcement->load(['author', 'section', 'class'])
        ], 201);
    }

    /**
     * Display the specified announcement
     */
    public function show(Announcement $announcement)
    {
        return response()->json([
            'success' => true,
            'data' => $announcement->load(['author', 'section', 'class'])
        ]);
    }

    /**
     * Update the specified announcement
     */
    public function update(Request $request, Announcement $announcement)
    {
        $validated = $request->validate([
            'title' => 'string|max:255',
            'content' => 'string',
            'author_id' => 'exists:users,id',
            'author_type' => 'in:admin,teacher',
            'target_audience' => 'in:all,students,teachers,section,class',
            'section_id' => 'nullable|exists:sections,id',
            'class_id' => 'nullable|exists:classes,id',
            'priority' => 'in:normal,high,urgent',
            'published_at' => 'nullable|date',
            'expires_at' => 'nullable|date',
            'status' => 'in:draft,published,archived',
        ]);

        // Auto-set published_at if changing to published
        if (isset($validated['status']) && $validated['status'] === 'published' 
            && $announcement->status !== 'published' && empty($validated['published_at'])) {
            $validated['published_at'] = now();
        }

        $announcement->update($validated);
        
        return response()->json([
            'success' => true,
            'message' => 'Announcement updated successfully',
            'data' => $announcement->load(['author', 'section', 'class'])
        ]);
    }

    /**
     * Remove the specified announcement
     */
    public function destroy(Announcement $announcement)
    {
        $announcement->delete();
        
        return response()->json([
            'success' => true,
            'message' => 'Announcement deleted successfully'
        ]);
    }

    /**
     * Get announcements for a specific section
     */
    public function bySection($sectionId, Request $request)
    {
        $query = Announcement::where(function ($q) use ($sectionId) {
            $q->where('section_id', $sectionId)
              ->orWhere('target_audience', 'all')
              ->orWhere('target_audience', 'students');
        })
        ->where('status', 'published')
        ->where(function ($q) {
            $q->whereNull('expires_at')
              ->orWhere('expires_at', '>', now());
        })
        ->with('author')
        ->orderBy('priority', 'desc')
        ->orderBy('published_at', 'desc');
        
        $perPage = $request->get('per_page', 15);
        $announcements = $query->paginate($perPage);
        
        return response()->json($announcements);
    }

    /**
     * Get announcements for a specific class
     */
    public function byClass($classId, Request $request)
    {
        $query = Announcement::where(function ($q) use ($classId) {
            $q->where('class_id', $classId)
              ->orWhere('target_audience', 'all')
              ->orWhere('target_audience', 'students');
        })
        ->where('status', 'published')
        ->where(function ($q) {
            $q->whereNull('expires_at')
              ->orWhere('expires_at', '>', now());
        })
        ->with('author')
        ->orderBy('priority', 'desc')
        ->orderBy('published_at', 'desc');
        
        $perPage = $request->get('per_page', 15);
        $announcements = $query->paginate($perPage);
        
        return response()->json($announcements);
    }
}
