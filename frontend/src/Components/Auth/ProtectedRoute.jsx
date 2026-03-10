import { Navigate, useLocation } from 'react-router-dom';
import authService from '../../service/authService';

/**
 * ProtectedRoute Component
 * 
 * Protects routes from unauthorized access.
 * Redirects to homepage with login modal if user is not authenticated.
 * Redirects to appropriate dashboard if user doesn't have required role.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - The component to render if authorized
 * @param {string[]} props.allowedRoles - Array of roles that can access this route (e.g., ['admin', 'teacher'])
 */
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const location = useLocation();
  const isAuthenticated = authService.isAuthenticated();
  const currentUser = authService.getCurrentUser();

  // If not authenticated, redirect to homepage with login modal state
  if (!isAuthenticated) {
    return (
      <Navigate 
        to="/" 
        state={{ 
          showLoginModal: true, 
          loginError: 'Please log in to access this page.',
          from: location.pathname 
        }} 
        replace 
      />
    );
  }

  // If roles are specified, check if user has the required role
  if (allowedRoles.length > 0 && currentUser) {
    const userRole = currentUser.role;
    
    if (!allowedRoles.includes(userRole)) {
      // Redirect to user's own dashboard based on their role
      const dashboardRoutes = {
        admin: '/admin/dashboard',
        teacher: '/teacher/dashboard',
        student: '/student/dashboard',
      };
      
      const redirectPath = dashboardRoutes[userRole] || '/';
      return <Navigate to={redirectPath} replace />;
    }
  }

  // User is authenticated and has required role (if specified)
  return children;
};

export default ProtectedRoute;
