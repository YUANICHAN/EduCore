import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import Swal from 'sweetalert2';
import authService from '../../service/authService';

function LogoutButton({ variant = 'default', className = '' }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'Logout Confirmation',
      text: 'Are you sure you want to logout?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, logout',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'rounded-lg',
        cancelButton: 'rounded-lg',
      },
    });

    if (result.isConfirmed) {
      try {
        // Show loading
        Swal.fire({
          title: 'Logging out...',
          allowOutsideClick: false,
          allowEscapeKey: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        // Call logout API
        await authService.logout();

        // Show success message
        await Swal.fire({
          title: 'Logged Out!',
          text: 'You have been successfully logged out.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          customClass: {
            popup: 'rounded-2xl',
          },
        });

        // Redirect to home page
        navigate('/');
      } catch (error) {
        // Even if API fails, clear local storage and redirect
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        
        await Swal.fire({
          title: 'Logged Out',
          text: 'You have been logged out.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
        });

        navigate('/');
      }
    }
  };

  // Different button variants
  const variants = {
    default: `flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors ${className}`,
    danger: `flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors ${className}`,
    sidebar: `flex items-center gap-3 w-full px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors ${className}`,
    icon: `p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ${className}`,
    navbar: `flex items-center gap-2 px-4 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors ${className}`,
  };

  return (
    <button
      onClick={handleLogout}
      className={variants[variant] || variants.default}
      title="Logout"
    >
      <LogOut className="w-5 h-5" />
      {variant !== 'icon' && <span>Logout</span>}
    </button>
  );
}

export default LogoutButton;
