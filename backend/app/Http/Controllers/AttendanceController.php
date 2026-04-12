<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Classes;
use App\Models\AcademicYear;
use Illuminate\Http\Request;
use Carbon\Carbon;

class AttendanceController extends Controller
{
    /**
     * Display a paginated listing of attendance records
     */
    public function index(Request $request)
    {
        $query = Attendance::with(['class.subject', 'student', 'recorder']);
        
        // Filter by class
        if ($request->has('class_id')) {
            $query->where('class_id', $request->class_id);
        }
        
        // Filter by student
        if ($request->has('student_id')) {
            $query->where('student_id', $request->student_id);
        }
        
        // Filter by date
        if ($request->has('date')) {
            $query->where('date', $request->date);
        }
        
        // Filter by date range
        if ($request->has('from_date')) {
            $query->where('date', '>=', $request->from_date);
        }
        if ($request->has('to_date')) {
            $query->where('date', '<=', $request->to_date);
        }
        
        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        // Sorting
        $sortBy = $request->get('sort_by', 'date');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);
        
        // Pagination
        $perPage = $request->get('per_page', 15);
        $attendance = $query->paginate($perPage);
        
        return response()->json($attendance);
    }

    /**
     * Store a newly created attendance record
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'class_id' => 'required|exists:classes,id',
            'student_id' => 'required|exists:students,id',
            'date' => 'required|date',
            'time_in' => 'nullable|date_format:H:i:s',
            'time_out' => 'nullable|date_format:H:i:s',
            'status' => 'required|in:present,absent,late,excused',
            'remarks' => 'nullable|string',
            'recorded_by' => 'required|exists:users,id',
        ]);

        // Check if semester/academic year is still active
        $semesterCheck = $this->checkSemesterActive($validated['class_id'], $validated['date']);
        if (!$semesterCheck['active']) {
            return response()->json([
                'success' => false,
                'message' => $semesterCheck['message']
            ], 422);
        }

        // Check for duplicate attendance
        $exists = Attendance::where('class_id', $validated['class_id'])
            ->where('student_id', $validated['student_id'])
            ->where('date', $validated['date'])
            ->exists();
        
        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => 'Attendance record already exists for this student on this date'
            ], 422);
        }

        $attendance = Attendance::create($validated);
        
        return response()->json([
            'success' => true,
            'message' => 'Attendance recorded successfully',
            'data' => $attendance->load(['class.subject', 'student', 'recorder'])
        ], 201);
    }

    /**
     * Display the specified attendance record
     */
    public function show(Attendance $attendance)
    {
        return response()->json([
            'success' => true,
            'data' => $attendance->load(['class.subject', 'student', 'recorder'])
        ]);
    }

    /**
     * Update the specified attendance record
     */
    public function update(Request $request, Attendance $attendance)
    {
        $validated = $request->validate([
            'class_id' => 'exists:classes,id',
            'student_id' => 'exists:students,id',
            'date' => 'date',
            'time_in' => 'nullable|date_format:H:i:s',
            'time_out' => 'nullable|date_format:H:i:s',
            'status' => 'in:present,absent,late,excused',
            'remarks' => 'nullable|string',
            'recorded_by' => 'exists:users,id',
        ]);

        $attendance->update($validated);
        
        return response()->json([
            'success' => true,
            'message' => 'Attendance updated successfully',
            'data' => $attendance->load(['class.subject', 'student', 'recorder'])
        ]);
    }

    /**
     * Remove the specified attendance record
     */
    public function destroy(Attendance $attendance)
    {
        $attendance->delete();
        
        return response()->json([
            'success' => true,
            'message' => 'Attendance record deleted successfully'
        ]);
    }

    /**
     * Record attendance for a class (bulk)
     */
    public function record(Request $request)
    {
        $validated = $request->validate([
            'class_id' => 'required|exists:classes,id',
            'date' => 'required|date',
            'recorded_by' => 'nullable|exists:users,id',
            'students' => 'required|array|min:1',
            'students.*.student_id' => 'required|exists:students,id',
            'students.*.status' => 'required|in:present,absent,late,excused',
            'students.*.time_in' => 'nullable|date_format:H:i:s',
            'students.*.time_out' => 'nullable|date_format:H:i:s',
            'students.*.remarks' => 'nullable|string',
        ]);

        // Check if semester/academic year is still active
        $semesterCheck = $this->checkSemesterActive($validated['class_id'], $validated['date']);
        if (!$semesterCheck['active']) {
            return response()->json([
                'success' => false,
                'message' => $semesterCheck['message']
            ], 422);
        }

        $recorded = [];
        $errors = [];
        $recordedBy = $request->user()?->id ?? ($validated['recorded_by'] ?? null);

        if (!$recordedBy) {
            return response()->json([
                'success' => false,
                'message' => 'Unable to identify the user recording attendance.'
            ], 422);
        }

        foreach ($validated['students'] as $index => $studentData) {
            try {
                $attendance = Attendance::updateOrCreate(
                    [
                        'class_id' => $validated['class_id'],
                        'student_id' => $studentData['student_id'],
                        'date' => $validated['date'],
                    ],
                    [
                        'status' => $studentData['status'],
                        'time_in' => $studentData['time_in'] ?? null,
                        'time_out' => $studentData['time_out'] ?? null,
                        'remarks' => $studentData['remarks'] ?? null,
                        'recorded_by' => $recordedBy,
                    ]
                );
                $recorded[] = $attendance;
            } catch (\Exception $e) {
                $errors[] = "Failed to record attendance for student at index {$index}: " . $e->getMessage();
            }
        }

        if (!empty($errors)) {
            return response()->json([
                'success' => false,
                'message' => 'Some attendance records could not be saved',
                'errors' => $errors,
                'recorded' => $recorded
            ], 207);
        }

        return response()->json([
            'success' => true,
            'message' => count($recorded) . ' attendance records saved successfully',
            'data' => $recorded
        ], 201);
    }

    /**
     * Get attendance by class and date
     */
    public function byClassAndDate($classId, $date, Request $request)
    {
        $query = Attendance::where('class_id', $classId)
            ->where('date', $date)
            ->with(['student']);
        
        $query->orderBy('student_id');
        
        $attendance = $query->get();
        
        // Calculate summary
        $summary = [
            'total' => $attendance->count(),
            'present' => $attendance->where('status', 'present')->count(),
            'absent' => $attendance->where('status', 'absent')->count(),
            'late' => $attendance->where('status', 'late')->count(),
            'excused' => $attendance->where('status', 'excused')->count(),
        ];
        
        return response()->json([
            'attendance' => $attendance,
            'summary' => $summary
        ]);
    }

    /**
     * Check if the semester/academic year is active for attendance recording
     * Returns an array with 'active' (bool) and 'message' (string) keys
     */
    private function checkSemesterActive($classId, $attendanceDate)
    {
        try {
            $class = Classes::with('academicYear')->find($classId);
            
            if (!$class) {
                return [
                    'active' => false,
                    'message' => 'Class not found.'
                ];
            }
            
            $academicYear = $class->academicYear;
            
            if (!$academicYear) {
                return [
                    'active' => false,
                    'message' => 'Academic year not found for this class.'
                ];
            }
            
            $attendanceDate = Carbon::parse($attendanceDate)->format('Y-m-d');
            $startDate = $academicYear->start_date->format('Y-m-d');
            $endDate = $academicYear->end_date->format('Y-m-d');
            
            // Check if attendance date is before semester start
            if ($attendanceDate < $startDate) {
                $formattedStart = Carbon::parse($startDate)->format('F j, Y');
                return [
                    'active' => false,
                    'message' => "This semester has not started yet. Attendance can be recorded starting {$formattedStart}."
                ];
            }
            
            // Check if attendance date is after semester end
            if ($attendanceDate > $endDate) {
                $formattedEnd = Carbon::parse($endDate)->format('F j, Y');
                return [
                    'active' => false,
                    'message' => "This semester ended on {$formattedEnd}. Attendance cannot be recorded."
                ];
            }
            
            return [
                'active' => true,
                'message' => 'Semester is active'
            ];
        } catch (\Exception $e) {
            return [
                'active' => false,
                'message' => 'Error checking semester status: ' . $e->getMessage()
            ];
        }
    }
}
