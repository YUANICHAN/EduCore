import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  X,
  ArrowRight,
  AlertCircle,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import authService from '../../service/authService';
import schoolLogo from '../../assets/ACLC_LOGO.jpg';

function LoginModal({ isOpen, onClose, initialError = '', returnUrl = '' }) {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [authRequired, setAuthRequired] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false,
  });

  // Set initial error when modal opens with auth required
  useEffect(() => {
    if (isOpen && initialError) {
      setError(initialError);
      setAuthRequired(true);
    }
  }, [isOpen, initialError]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setError('');
      setAuthRequired(false);
    }
  }, [isOpen]);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear error and authRequired styling when user starts typing
    if (error) {
      setError('');
    }
    if (authRequired) {
      setAuthRequired(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setAuthRequired(false);

    try {
      // Call the backend API for authentication
      const response = await authService.login(formData.email, formData.password);
      
      // Get user role and redirect to appropriate dashboard
      const user = response.user;
      const role = user.role;

      onClose();

      // Define dashboard routes by role
      const dashboardRoutes = {
        student: '/student/dashboard',
        teacher: '/teacher/dashboard',
        admin: '/admin/dashboard',
      };

      // If there was a return URL and it matches the user's role, go there
      // Otherwise, go to the user's dashboard
      if (returnUrl && returnUrl.startsWith(`/${role}/`)) {
        navigate(returnUrl, { replace: true });
      } else {
        navigate(dashboardRoutes[role] || '/', { replace: true });
      }
    } catch (err) {
      // Log error for debugging
      console.error('Login error:', err);
      console.error('Error response:', err.response);
      console.error('Error request:', err.request);
      
      // Handle different error responses
      if (err.response) {
        const status = err.response.status;
        const data = err.response.data;
        console.error('Status:', status, 'Data:', data);

        if (status === 401 || status === 422) {
          setError(data.message || 'Invalid email or password. Please try again.');
        } else if (status === 429) {
          setError('Too many login attempts. Please try again later.');
        } else if (status === 403) {
          setError('Your account has been locked. Please contact support.');
        } else {
          setError(`Server error (${status}). Please try again later.`);
        }
      } else if (err.request) {
        setError('Unable to connect to server. Please check your internet connection.');
      } else {
        setError('An error occurred: ' + err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-transparent backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-white border border-gray-200">
              <img src={schoolLogo} alt="ACLC College" className="w-full h-full object-cover rounded-2xl" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome Back!</h2>
            <p className="text-gray-600 text-sm">Sign in to access your account</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="modal-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  id="modal-email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                  className={`w-full pl-11 pr-4 py-2.5 border rounded-xl focus:ring-2 transition-colors text-sm bg-white text-gray-900 placeholder:text-gray-400 ${
                    authRequired 
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="modal-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="modal-password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                  className={`w-full pl-11 pr-11 py-2.5 border rounded-xl focus:ring-2 transition-colors text-sm bg-white text-gray-900 placeholder:text-gray-400 ${
                    authRequired 
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="remember"
                  checked={formData.remember}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
              <button type="button" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginModal;
