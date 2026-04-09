<?php

namespace App\Http\Controllers;

use App\Models\Classes;
use App\Models\ClassGradingScheme;
use Illuminate\Http\Request;

class ClassGradingSchemeController extends Controller
{
    private const BASE_WEIGHT_KEYS = [
        'quizzes',
        'exams',
        'projects',
        'attendance',
        'performance_task',
        'activity_task',
    ];

    private const DEFAULT_WEIGHTS = [
        'quizzes' => 20.0,
        'exams' => 50.0,
        'projects' => 20.0,
        'attendance' => 10.0,
        'performance_task' => 0.0,
        'activity_task' => 0.0,
    ];

    /**
     * Get grading weights for a class.
     */
    public function show(Classes $class)
    {
        $scheme = ClassGradingScheme::where('class_id', $class->id)->first();
        $customComponents = $this->customComponentsFromScheme($scheme);
        $weights = $this->weightsFromScheme($scheme);

        return response()->json([
            'success' => true,
            'data' => [
                'class_id' => $class->id,
                'weights' => $weights,
                'custom_components' => $customComponents,
                'hidden_base_components' => $this->hiddenBaseComponentsFromScheme($scheme),
                'has_custom_scheme' => (bool) $scheme,
            ],
        ]);
    }

    /**
     * Create or update grading weights for a class.
     */
    public function update(Request $request, Classes $class)
    {
        $validated = $request->validate([
            'quizzes' => 'required|numeric|min:0|max:100',
            'exams' => 'required|numeric|min:0|max:100',
            'projects' => 'required|numeric|min:0|max:100',
            'attendance' => 'required|numeric|min:0|max:100',
            'performance_task' => 'nullable|numeric|min:0|max:100',
            'activity_task' => 'nullable|numeric|min:0|max:100',
            'custom_components' => 'nullable|array',
            'custom_components.*.name' => 'required_with:custom_components|string|max:80',
            'custom_components.*.weight' => 'required_with:custom_components|numeric|min:0|max:100',
            'hidden_base_components' => 'nullable|array',
            'hidden_base_components.*' => 'string|in:quizzes,exams,projects,attendance,performance_task,activity_task',
        ]);

        $existingScheme = ClassGradingScheme::where('class_id', $class->id)->first();
        $customComponents = array_key_exists('custom_components', $validated)
            ? $this->sanitizeCustomComponents($validated['custom_components'] ?? [])
            : $this->customComponentsFromScheme($existingScheme);

        $hiddenBaseComponents = array_key_exists('hidden_base_components', $validated)
            ? $this->sanitizeHiddenBaseComponents($validated['hidden_base_components'] ?? [])
            : $this->hiddenBaseComponentsFromScheme($existingScheme);

        $customWeightTotal = collect($customComponents)->sum(function ($component) {
            return (float) ($component['weight'] ?? 0);
        });

        $sum = (float) $validated['quizzes']
            + (float) $validated['exams']
            + (float) $validated['projects']
            + (float) $validated['attendance']
            + (float) ($validated['performance_task'] ?? 0)
            + (float) ($validated['activity_task'] ?? 0)
            + (float) $customWeightTotal;

        if (abs($sum - 100.0) > 0.001) {
            return response()->json([
                'success' => false,
                'message' => 'Total grading weight must equal 100%.',
                'total' => round($sum, 2),
            ], 422);
        }

        $scheme = ClassGradingScheme::updateOrCreate(
            ['class_id' => $class->id],
            [
                'quizzes_weight' => $validated['quizzes'],
                'exams_weight' => $validated['exams'],
                'projects_weight' => $validated['projects'],
                'attendance_weight' => $validated['attendance'],
                'performance_task_weight' => $validated['performance_task'] ?? 0,
                'activity_task_weight' => $validated['activity_task'] ?? 0,
                'custom_weights' => $customComponents,
                'hidden_base_components' => $hiddenBaseComponents,
                'created_by' => $request->user()->id ?? null,
            ]
        );

        $weights = $this->weightsFromScheme($scheme);

        return response()->json([
            'success' => true,
            'message' => 'Class grading scheme saved successfully.',
            'data' => [
                'class_id' => $class->id,
                'weights' => $weights,
                'custom_components' => $this->customComponentsFromScheme($scheme),
                'hidden_base_components' => $this->hiddenBaseComponentsFromScheme($scheme),
                'has_custom_scheme' => true,
            ],
        ]);
    }

    private function hiddenBaseComponentsFromScheme(?ClassGradingScheme $scheme): array
    {
        if (!$scheme || !is_array($scheme->hidden_base_components)) {
            return [];
        }

        return $this->sanitizeHiddenBaseComponents($scheme->hidden_base_components);
    }

    private function sanitizeHiddenBaseComponents(array $components): array
    {
        $valid = array_values(array_intersect(self::BASE_WEIGHT_KEYS, array_map(function ($value) {
            return (string) $value;
        }, $components)));

        return array_values(array_unique($valid));
    }

    private function customComponentsFromScheme(?ClassGradingScheme $scheme): array
    {
        if (!$scheme || !is_array($scheme->custom_weights)) {
            return [];
        }

        return $this->sanitizeCustomComponents($scheme->custom_weights);
    }

    private function sanitizeCustomComponents(array $components): array
    {
        $sanitized = [];

        foreach ($components as $component) {
            $name = trim((string) ($component['name'] ?? ''));
            $weight = (float) ($component['weight'] ?? 0);

            if ($name === '') {
                continue;
            }

            $key = trim((string) ($component['key'] ?? ''));
            if ($key === '') {
                $key = strtolower(preg_replace('/[^a-z0-9]+/', '_', $name) ?? '');
                $key = trim($key, '_');
            }

            if ($key === '') {
                continue;
            }

            $sanitized[] = [
                'key' => $key,
                'name' => $name,
                'weight' => round($weight, 2),
            ];
        }

        return array_values($sanitized);
    }

    private function weightsFromScheme(?ClassGradingScheme $scheme): array
    {
        if (!$scheme) {
            return self::DEFAULT_WEIGHTS;
        }

        return [
            'quizzes' => (float) $scheme->quizzes_weight,
            'exams' => (float) $scheme->exams_weight,
            'projects' => (float) $scheme->projects_weight,
            'attendance' => (float) $scheme->attendance_weight,
            'performance_task' => (float) ($scheme->performance_task_weight ?? 0),
            'activity_task' => (float) ($scheme->activity_task_weight ?? 0),
        ];
    }
}
