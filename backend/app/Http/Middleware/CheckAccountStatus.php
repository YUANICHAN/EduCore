<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckAccountStatus
{
    /**
     * Handle an incoming request.
     *
     * Check if the user's account is active and not locked.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
     */
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated. Please login to continue.',
                'error' => 'unauthenticated'
            ], 401);
        }

        // Check if account is locked
        if ($user->account_locked) {
            // Revoke all tokens for this user
            $user->tokens()->delete();
            
            return response()->json([
                'success' => false,
                'message' => 'Your account has been locked. Please contact the administrator.',
                'error' => 'account_locked',
                'locked_at' => $user->locked_at
            ], 403);
        }

        // Check if account status is inactive
        if ($user->status === 'inactive') {
            return response()->json([
                'success' => false,
                'message' => 'Your account is inactive. Please contact the administrator to activate your account.',
                'error' => 'account_inactive'
            ], 403);
        }

        // Check if account status is suspended
        if ($user->status === 'suspended') {
            return response()->json([
                'success' => false,
                'message' => 'Your account has been suspended. Please contact the administrator.',
                'error' => 'account_suspended'
            ], 403);
        }

        return $next($request);
    }
}
