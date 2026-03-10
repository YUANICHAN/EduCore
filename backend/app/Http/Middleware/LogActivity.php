<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class LogActivity
{
    /**
     * Handle an incoming request.
     *
     * Log user activity for security auditing.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
     */
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        // Only log for authenticated users
        if ($request->user()) {
            $this->logActivity($request, $response);
        }

        return $response;
    }

    /**
     * Log the activity.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  mixed  $response
     * @return void
     */
    protected function logActivity(Request $request, $response)
    {
        // Skip logging for certain routes
        $skipRoutes = [
            'api/user',
            'api/auth/profile',
        ];

        foreach ($skipRoutes as $route) {
            if ($request->is($route)) {
                return;
            }
        }

        // Only log write operations (POST, PUT, PATCH, DELETE)
        if (!in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'])) {
            return;
        }

        $logData = [
            'user_id' => $request->user()->id,
            'user_email' => $request->user()->email,
            'user_role' => $request->user()->role,
            'method' => $request->method(),
            'url' => $request->fullUrl(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'status_code' => $response->getStatusCode(),
            'timestamp' => now()->toDateTimeString(),
        ];

        Log::channel('daily')->info('User Activity', $logData);
    }
}
