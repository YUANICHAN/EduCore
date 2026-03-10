<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class SettingsController extends Controller
{
    /**
     * Get all settings
     */
    public function index()
    {
        $settings = [
            'general' => $this->getGeneralSettings(),
            'academic' => $this->getAcademicSettings(),
            'user_roles' => $this->getUserRoleSettings(),
            'enrollment' => $this->getEnrollmentSettings(),
            'grading' => $this->getGradingSettings(),
            'system' => $this->getSystemSettings(),
        ];

        return response()->json($settings);
    }

    /**
     * Get general settings
     */
    public function getGeneralSettings()
    {
        return Cache::remember('general_settings', 3600, function () {
            return [
                'school_name' => Setting::getValue('school_name', 'EduCore Academy'),
                'school_logo' => Setting::getValue('school_logo', '/logo.png'),
                'address' => Setting::getValue('school_address', '123 Education Street, Metro City'),
                'phone' => Setting::getValue('school_phone', '+1 (555) 123-4567'),
                'email' => Setting::getValue('school_email', 'admin@educore.edu'),
                'timezone' => Setting::getValue('timezone', 'Asia/Manila'),
                'date_format' => Setting::getValue('date_format', 'MM/DD/YYYY'),
                'language' => Setting::getValue('language', 'en'),
            ];
        });
    }

    /**
     * Get academic settings
     */
    public function getAcademicSettings()
    {
        return Cache::remember('academic_settings', 3600, function () {
            return [
                'default_academic_year' => Setting::getValue('default_academic_year', '2024-2025'),
                'semester_type' => Setting::getValue('semester_type', 'semester'),
                'number_of_year_levels' => Setting::getValue('number_of_year_levels', 4),
                'section_name_format' => Setting::getValue('section_name_format', 'numeric'),
                'max_students_per_section' => Setting::getValue('max_students_per_section', 50),
                'enable_prerequisites' => Setting::getValue('enable_prerequisites', true),
                'allow_cross_enrollment' => Setting::getValue('allow_cross_enrollment', false),
            ];
        });
    }

    /**
     * Get user role settings
     */
    public function getUserRoleSettings()
    {
        return Cache::remember('user_role_settings', 3600, function () {
            return [
                'enable_admin' => Setting::getValue('enable_admin', true),
                'enable_teacher' => Setting::getValue('enable_teacher', true),
                'enable_student' => Setting::getValue('enable_student', true),
                'enable_registrar' => Setting::getValue('enable_registrar', true),
                'password_min_length' => Setting::getValue('password_min_length', 8),
                'require_special_chars' => Setting::getValue('require_special_chars', true),
                'session_timeout' => Setting::getValue('session_timeout', 30),
                'max_login_attempts' => Setting::getValue('max_login_attempts', 5),
            ];
        });
    }

    /**
     * Get enrollment settings
     */
    public function getEnrollmentSettings()
    {
        return Cache::remember('enrollment_settings', 3600, function () {
            return [
                'enrollment_open' => Setting::getValue('enrollment_open', true),
                'allow_late_enrollment' => Setting::getValue('allow_late_enrollment', true),
                'late_enrollment_deadline' => Setting::getValue('late_enrollment_deadline', 14),
                'max_units_per_semester' => Setting::getValue('max_units_per_semester', 24),
                'enforce_prerequisites' => Setting::getValue('enforce_prerequisites', true),
                'auto_close_full_sections' => Setting::getValue('auto_close_full_sections', true),
                'require_approval' => Setting::getValue('require_approval', false),
            ];
        });
    }

    /**
     * Get grading settings
     */
    public function getGradingSettings()
    {
        return Cache::remember('grading_settings', 3600, function () {
            return [
                'grading_scale' => Setting::getValue('grading_scale', '1.0-5.0'),
                'passing_grade' => Setting::getValue('passing_grade', 3.0),
                'decimal_places' => Setting::getValue('decimal_places', 2),
                'gpa_computation_method' => Setting::getValue('gpa_computation_method', 'weighted'),
                'grade_lock_after_submission' => Setting::getValue('grade_lock_after_submission', true),
                'allow_grade_revision' => Setting::getValue('allow_grade_revision', false),
                'include_incomplete_grades' => Setting::getValue('include_incomplete_grades', false),
            ];
        });
    }

    /**
     * Get system settings
     */
    public function getSystemSettings()
    {
        return Cache::remember('system_settings', 3600, function () {
            return [
                'maintenance_mode' => Setting::getValue('maintenance_mode', false),
                'enable_audit_logs' => Setting::getValue('enable_audit_logs', true),
                'enable_two_factor' => Setting::getValue('enable_two_factor', false),
                'ip_restrictions' => Setting::getValue('ip_restrictions', false),
                'allowed_ips' => Setting::getValue('allowed_ips', ''),
                'encryption_enabled' => Setting::getValue('encryption_enabled', true),
                'api_rate_limit' => Setting::getValue('api_rate_limit', 1000),
            ];
        });
    }

    /**
     * Update general settings
     */
    public function updateGeneral(Request $request)
    {
        $validated = $request->validate([
            'school_name' => 'string|max:255',
            'address' => 'string|max:500',
            'phone' => 'string|max:20',
            'email' => 'email|max:255',
            'timezone' => 'string|max:50',
            'date_format' => 'string|max:20',
            'language' => 'string|max:10',
        ]);

        // Persist to database
        foreach ($validated as $key => $value) {
            $dbKey = $key === 'address' ? 'school_address' : 
                    ($key === 'phone' ? 'school_phone' : 
                    ($key === 'email' ? 'school_email' : $key));
            Setting::setValue($dbKey, $value, 'string', 'general');
        }

        Cache::forget('general_settings');

        return response()->json([
            'success' => true,
            'message' => 'General settings updated successfully',
            'settings' => $this->getGeneralSettings(),
        ]);
    }

    /**
     * Update academic settings
     */
    public function updateAcademic(Request $request)
    {
        $validated = $request->validate([
            'default_academic_year' => 'string',
            'semester_type' => 'in:semester,trimester,quarter',
            'number_of_year_levels' => 'integer|min:1|max:10',
            'section_name_format' => 'in:numeric,alphabetic',
            'max_students_per_section' => 'integer|min:1|max:100',
            'enable_prerequisites' => 'boolean',
            'allow_cross_enrollment' => 'boolean',
        ]);

        // Persist to database
        foreach ($validated as $key => $value) {
            $type = is_bool($value) ? 'boolean' : (is_int($value) ? 'integer' : 'string');
            Setting::setValue($key, $value, $type, 'academic');
        }

        Cache::forget('academic_settings');

        return response()->json([
            'success' => true,
            'message' => 'Academic settings updated successfully',
            'settings' => $this->getAcademicSettings(),
        ]);
    }

    /**
     * Update user role settings
     */
    public function updateUserRoles(Request $request)
    {
        $validated = $request->validate([
            'enable_admin' => 'boolean',
            'enable_teacher' => 'boolean',
            'enable_student' => 'boolean',
            'enable_registrar' => 'boolean',
            'password_min_length' => 'integer|min:6|max:32',
            'require_special_chars' => 'boolean',
            'session_timeout' => 'integer|min:5|max:480',
            'max_login_attempts' => 'integer|min:3|max:10',
        ]);

        // Persist to database
        foreach ($validated as $key => $value) {
            $type = is_bool($value) ? 'boolean' : 'integer';
            Setting::setValue($key, $value, $type, 'user_roles');
        }

        Cache::forget('user_role_settings');

        return response()->json([
            'success' => true,
            'message' => 'User role settings updated successfully',
            'settings' => $this->getUserRoleSettings(),
        ]);
    }

    /**
     * Update enrollment settings
     */
    public function updateEnrollment(Request $request)
    {
        $validated = $request->validate([
            'enrollment_open' => 'boolean',
            'allow_late_enrollment' => 'boolean',
            'late_enrollment_deadline' => 'integer|min:1|max:30',
            'max_units_per_semester' => 'integer|min:12|max:36',
            'enforce_prerequisites' => 'boolean',
            'auto_close_full_sections' => 'boolean',
            'require_approval' => 'boolean',
        ]);

        // Persist to database
        foreach ($validated as $key => $value) {
            $type = is_bool($value) ? 'boolean' : 'integer';
            Setting::setValue($key, $value, $type, 'enrollment');
        }

        Cache::forget('enrollment_settings');

        return response()->json([
            'success' => true,
            'message' => 'Enrollment settings updated successfully',
            'settings' => $this->getEnrollmentSettings(),
        ]);
    }

    /**
     * Update grading settings
     */
    public function updateGrading(Request $request)
    {
        $validated = $request->validate([
            'grading_scale' => 'in:1.0-5.0,A-F,percentage',
            'passing_grade' => 'numeric',
            'decimal_places' => 'integer|min:0|max:4',
            'gpa_computation_method' => 'in:weighted,unweighted',
            'grade_lock_after_submission' => 'boolean',
            'allow_grade_revision' => 'boolean',
            'include_incomplete_grades' => 'boolean',
        ]);

        // Persist to database
        foreach ($validated as $key => $value) {
            $type = is_bool($value) ? 'boolean' : (is_numeric($value) ? 'float' : 'string');
            if ($key === 'decimal_places') $type = 'integer';
            Setting::setValue($key, $value, $type, 'grading');
        }

        Cache::forget('grading_settings');

        return response()->json([
            'success' => true,
            'message' => 'Grading settings updated successfully',
            'settings' => $this->getGradingSettings(),
        ]);
    }

    /**
     * Update system settings
     */
    public function updateSystem(Request $request)
    {
        $validated = $request->validate([
            'maintenance_mode' => 'boolean',
            'enable_audit_logs' => 'boolean',
            'enable_two_factor' => 'boolean',
            'ip_restrictions' => 'boolean',
            'allowed_ips' => 'nullable|string',
            'encryption_enabled' => 'boolean',
            'api_rate_limit' => 'integer|min:100|max:10000',
        ]);

        // Persist to database
        foreach ($validated as $key => $value) {
            $type = is_bool($value) ? 'boolean' : (is_int($value) ? 'integer' : 'string');
            Setting::setValue($key, $value, $type, 'system');
        }

        Cache::forget('system_settings');

        return response()->json([
            'success' => true,
            'message' => 'System settings updated successfully',
            'settings' => $this->getSystemSettings(),
        ]);
    }

    /**
     * Upload school logo
     */
    public function uploadLogo(Request $request)
    {
        $request->validate([
            'logo' => 'required|image|mimes:jpeg,png,jpg,svg|max:2048',
        ]);

        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store('logos', 'public');
            $url = Storage::url($path);
            
            // Persist to database
            Setting::setValue('school_logo', $url, 'string', 'general');
            Cache::forget('general_settings');
            
            return response()->json([
                'success' => true,
                'message' => 'Logo uploaded successfully',
                'path' => $url,
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'No file uploaded'
        ], 400);
    }

    /**
     * Get a single setting by key
     */
    public function getSetting($key)
    {
        $setting = Setting::where('key', $key)->first();
        
        if (!$setting) {
            return response()->json([
                'success' => false,
                'message' => 'Setting not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'key' => $setting->key,
                'value' => Setting::getValue($key),
                'type' => $setting->type,
                'category' => $setting->category,
            ]
        ]);
    }

    /**
     * Update a single setting
     */
    public function updateSetting(Request $request, $key)
    {
        $validated = $request->validate([
            'value' => 'required',
            'type' => 'in:string,boolean,integer,float,array,json',
            'category' => 'string|max:50',
        ]);

        $type = $validated['type'] ?? 'string';
        $category = $validated['category'] ?? 'general';

        Setting::setValue($key, $validated['value'], $type, $category);
        
        // Clear relevant cache
        Cache::forget("{$category}_settings");

        return response()->json([
            'success' => true,
            'message' => 'Setting updated successfully',
            'data' => [
                'key' => $key,
                'value' => Setting::getValue($key),
            ]
        ]);
    }

    /**
     * Get public settings (for unauthenticated access)
     */
    public function publicSettings()
    {
        return response()->json([
            'success' => true,
            'data' => [
                'school_name' => Setting::getValue('school_name', 'EduCore Academy'),
                'school_logo' => Setting::getValue('school_logo', '/logo.png'),
                'timezone' => Setting::getValue('timezone', 'Asia/Manila'),
                'maintenance_mode' => Setting::getValue('maintenance_mode', false),
            ]
        ]);
    }
}
