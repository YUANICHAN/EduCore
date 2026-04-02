<?php

namespace App\Http\Controllers;

use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class DepartmentController extends Controller
{
    private function uploadBannerImage(Request $request, ?Department $department = null): ?string
    {
        if (!$request->hasFile('banner_image')) {
            return null;
        }

        if ($department && $department->banner_image) {
            if (str_starts_with($department->banner_image, 'storage/')) {
                Storage::disk('public')->delete(str_replace('storage/', '', $department->banner_image));
            } elseif (file_exists(public_path($department->banner_image))) {
                @unlink(public_path($department->banner_image));
            }
        }

        $file = $request->file('banner_image');
        $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
        $storedPath = $file->storeAs('uploads/departments', $filename, 'public');

        return 'storage/' . $storedPath;
    }

    /**
     * Display a listing of departments.
     */
    public function index(Request $request)
    {
        $query = Department::query();

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Count relationships
        $query->withCount(['programs', 'teachers']);
        $query->with(['programs:id,department_id,program_name,program_code']);

        // Sort
        $sortBy = $request->get('sort_by', 'name');
        $sortOrder = $request->get('sort_order', 'asc');
        $query->orderBy($sortBy, $sortOrder);

        // Paginate or get all
        if ($request->has('per_page')) {
            $perPage = $request->get('per_page', 15);
            return response()->json($query->paginate($perPage));
        }

        return response()->json($query->get());
    }

    /**
     * Store a newly created department.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'code' => 'required|string|max:50|unique:departments,code',
            'name' => 'required|string|max:255|unique:departments,name',
            'description' => 'nullable|string',
            'color' => 'nullable|string|max:50',
            'banner_image' => 'nullable|file|mimes:jpeg,jpg,png,webp|max:10240',
            'status' => 'nullable|in:active,inactive',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $validator->validated();

        // Handle file upload
        if ($request->hasFile('banner_image')) {
            $data['banner_image'] = $this->uploadBannerImage($request);
        }

        $department = Department::create($data);

        return response()->json([
            'message' => 'Department created successfully',
            'data' => $department
        ], 201);
    }

    /**
     * Display the specified department.
     */
    public function show($id)
    {
        $department = Department::withCount(['programs', 'teachers'])->findOrFail($id);
        return response()->json($department);
    }

    /**
     * Update the specified department.
     */
    public function update(Request $request, $id)
    {
        $department = Department::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'code' => 'required|string|max:50|unique:departments,code,' . $id,
            'name' => 'required|string|max:255|unique:departments,name,' . $id,
            'description' => 'nullable|string',
            'color' => 'nullable|string|max:50',
            'banner_image' => 'nullable|file|mimes:jpeg,jpg,png,webp|max:10240',
            'status' => 'nullable|in:active,inactive',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $validator->validated();

        // Handle file upload
        if ($request->hasFile('banner_image')) {
            $data['banner_image'] = $this->uploadBannerImage($request, $department);
        }

        $department->update($data);

        return response()->json([
            'message' => 'Department updated successfully',
            'data' => $department
        ]);
    }

    /**
     * Remove the specified department.
     */
    public function destroy(Request $request, $id)
    {
        $department = Department::withCount(['programs', 'teachers'])->findOrFail($id);

        // Check if department has associated records
        if ($department->programs_count > 0 || $department->teachers_count > 0) {
            // Check if a target department is provided for reassignment
            if ($request->has('move_to_department_id')) {
                $targetDepartmentId = $request->move_to_department_id;
                $targetDepartment = Department::findOrFail($targetDepartmentId);

                // Prevent moving to the same department
                if ($targetDepartmentId == $id) {
                    return response()->json([
                        'message' => 'Cannot move to the same department'
                    ], 422);
                }

                // Move all programs to target department using FK as source of truth.
                \App\Models\Program::where(function ($query) use ($department) {
                    $query->where('department_id', $department->id)
                        ->orWhere('department', $department->name)
                        ->orWhere('department', $department->code);
                })->update([
                    'department_id' => $targetDepartment->id,
                    'department' => $targetDepartment->name,
                ]);

                // Move all teachers to target department using FK as source of truth.
                \App\Models\Teachers::where(function ($query) use ($department) {
                    $query->where('department_id', $department->id)
                        ->orWhere('department', $department->name)
                        ->orWhere('department', $department->code);
                })->update([
                    'department_id' => $targetDepartment->id,
                    'department' => $targetDepartment->name,
                ]);

                $department->delete();

                return response()->json([
                    'message' => 'Department deleted successfully. Programs and teachers moved to ' . $targetDepartment->name,
                    'moved' => [
                        'programs' => $department->programs_count,
                        'teachers' => $department->teachers_count,
                        'to_department' => $targetDepartment->name
                    ]
                ]);
            }

            // If no target department provided, return error with counts
            return response()->json([
                'message' => 'Cannot delete department with associated programs or teachers. Please select a department to move them to.',
                'programs_count' => $department->programs_count,
                'teachers_count' => $department->teachers_count,
                'requires_reassignment' => true
            ], 422);
        }

        if ($department->banner_image) {
            if (str_starts_with($department->banner_image, 'storage/')) {
                Storage::disk('public')->delete(str_replace('storage/', '', $department->banner_image));
            } elseif (file_exists(public_path($department->banner_image))) {
                @unlink(public_path($department->banner_image));
            }
        }

        $department->delete();

        return response()->json([
            'message' => 'Department deleted successfully'
        ]);
    }
}
