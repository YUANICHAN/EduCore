<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    /**
     * Display a listing of all users
     */
    public function index(Request $request)
    {
        $query = User::query();

        // Filter by role
        if ($request->has('role') && $request->role !== 'all') {
            $query->where('role', $request->role);
        }

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Search by name or email
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Sort
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $users = $query->paginate($request->get('per_page', 15));

        return response()->json($users);
    }

    /**
     * Store a newly created user
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role' => 'required|in:admin,teacher,student',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'status' => 'active',
        ]);

        return response()->json($user, 201);
    }

    /**
     * Display the specified user
     */
    public function show(User $user)
    {
        return response()->json($user);
    }

    /**
     * Update the specified user
     */
    public function update(Request $request, User $user)
    {
        $request->validate([
            'name' => 'string|max:255',
            'email' => 'string|email|max:255|unique:users,email,' . $user->id,
            'role' => 'in:admin,teacher,student',
            'status' => 'in:active,disabled',
        ]);

        $user->update($request->only(['name', 'email', 'role', 'status']));

        return response()->json($user);
    }

    /**
     * Remove the specified user
     */
    public function destroy(User $user)
    {
        $user->delete();
        return response()->json(['message' => 'User deleted successfully']);
    }

    /**
     * Lock a user account
     */
    public function lock(User $user)
    {
        $user->update([
            'account_locked' => true,
            'locked_at' => now(),
        ]);

        return response()->json(['message' => 'User account locked successfully', 'user' => $user]);
    }

    /**
     * Unlock a user account
     */
    public function unlock(User $user)
    {
        $user->update([
            'account_locked' => false,
            'locked_at' => null,
            'failed_login_attempts' => 0,
        ]);

        return response()->json(['message' => 'User account unlocked successfully', 'user' => $user]);
    }

    /**
     * Reset user password (admin function)
     */
    public function resetPassword(Request $request, User $user)
    {
        $request->validate([
            'password' => 'required|string|min:8',
        ]);

        $user->update([
            'password' => Hash::make($request->password),
        ]);

        return response()->json(['message' => 'Password reset successfully']);
    }

    /**
     * Force logout user (invalidate all tokens)
     */
    public function forceLogout(User $user)
    {
        $user->tokens()->delete();

        return response()->json(['message' => 'User has been logged out from all devices']);
    }

    /**
     * Get user statistics
     */
    public function statistics()
    {
        $stats = [
            'total_users' => User::count(),
            'admins' => User::where('role', 'admin')->count(),
            'teachers' => User::where('role', 'teacher')->count(),
            'students' => User::where('role', 'student')->count(),
            'active_users' => User::where('status', 'active')->count(),
            'disabled_users' => User::where('status', 'disabled')->count(),
            'locked_users' => User::where('account_locked', true)->count(),
        ];

        return response()->json($stats);
    }
}
