<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\RateLimiter;

class PreventBruteForce
{
    /**
     * Maximum number of attempts before lockout.
     */
    protected int $maxAttempts = 5;

    /**
     * Lockout duration in minutes.
     */
    protected int $lockoutMinutes = 15;

    /**
     * Handle an incoming request.
     *
     * Prevent brute force attacks by rate limiting login attempts.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
     */
    public function handle(Request $request, Closure $next)
    {
        $key = $this->getRateLimitKey($request);

        // Check if IP is currently locked out
        if (RateLimiter::tooManyAttempts($key, $this->maxAttempts)) {
            $seconds = RateLimiter::availableIn($key);
            $minutes = ceil($seconds / 60);

            return response()->json([
                'success' => false,
                'message' => "Too many login attempts. Please try again in {$minutes} minute(s).",
                'error' => 'too_many_attempts',
                'retry_after' => $seconds,
                'retry_after_minutes' => $minutes
            ], 429);
        }

        $response = $next($request);

        // If login failed (401), increment the counter
        if ($response->getStatusCode() === 401) {
            RateLimiter::hit($key, $this->lockoutMinutes * 60);
        } else {
            // Clear attempts on successful login
            RateLimiter::clear($key);
        }

        return $response;
    }

    /**
     * Get the rate limiter key for the request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return string
     */
    protected function getRateLimitKey(Request $request): string
    {
        // Use IP address and email (if provided) as the key
        $email = $request->input('email', 'unknown');
        return 'login_attempts:' . sha1($request->ip() . '|' . $email);
    }
}
