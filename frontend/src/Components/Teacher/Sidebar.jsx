import {
  LayoutDashboard,
  BookOpen,
  Library,
  FileText,
  Users,
  Calendar,
  Volume2,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
} from "lucide-react";
import '../../App.css';
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Swal from 'sweetalert2';
import authService from '../../service/authService';
import schoolLogo from '../../assets/ACLC_LOGO.jpg';

function Sidebar({ activeItem, setActiveItem }) {
  const navRef = useRef(null);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(() => {
    const saved = localStorage.getItem('teacherSidebarOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [isMobile, setIsMobile] = useState(false);
  const [teacherProfile, setTeacherProfile] = useState({
    name: 'Teacher',
    email: '',
    avatar: '',
  });

  const resolveImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (/^https?:\/\//i.test(imagePath) || imagePath.startsWith('data:') || imagePath.startsWith('blob:')) {
      return imagePath;
    }

    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
    const backendOrigin = apiBaseUrl.replace(/\/api\/?$/, '');

    let normalizedPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    if (!normalizedPath.startsWith('storage/') && normalizedPath.startsWith('avatars/')) {
      normalizedPath = `storage/${normalizedPath}`;
    }
    if (normalizedPath.startsWith('public/')) {
      normalizedPath = normalizedPath.replace(/^public\//, 'storage/');
    }

    return `${backendOrigin}/${normalizedPath}`;
  };

  const getInitials = (nameValue) => {
    const words = String(nameValue || '').trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return 'T';
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase();
  };

  const mapUserToSidebarProfile = (rawUser) => {
    const user = rawUser || {};
    const teacher = user.teacher || {};
    const name = user.name
      || `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim()
      || 'Teacher';

    setTeacherProfile({
      name,
      email: user.email || teacher.email || '',
      avatar: user.avatar || user.profile_image || teacher.profile_image || '',
    });
  };

  useEffect(() => {
    const loadSidebarProfile = async () => {
      try {
        const response = await authService.getProfile();
        const user = response?.data || response || {};
        mapUserToSidebarProfile(user);
      } catch (error) {
        const cachedUser = authService.getCurrentUser();
        if (cachedUser) {
          mapUserToSidebarProfile(cachedUser);
        }
      }
    };

    loadSidebarProfile();

    const handleAuthUserUpdated = () => {
      loadSidebarProfile();
    };

    window.addEventListener('auth-user-updated', handleAuthUserUpdated);
    return () => {
      window.removeEventListener('auth-user-updated', handleAuthUserUpdated);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('teacherSidebarOpen', JSON.stringify(isOpen));
  }, [isOpen]);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 1024px)');
    const update = () => {
      setIsMobile(media.matches);
      if (media.matches) {
        setIsOpen(false);
      }
    };
    update();
    if (media.addEventListener) {
      media.addEventListener('change', update);
      return () => media.removeEventListener('change', update);
    }
    media.addListener(update);
    return () => media.removeListener(update);
  }, []);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) {
      return;
    }

    const savedScroll = localStorage.getItem('teacherSidebarScrollTop');
    if (savedScroll !== null) {
      nav.scrollTop = Number(savedScroll) || 0;
    }

    const handleScroll = () => {
      localStorage.setItem('teacherSidebarScrollTop', String(nav.scrollTop));
    };

    nav.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      nav.removeEventListener('scroll', handleScroll);
      localStorage.setItem('teacherSidebarScrollTop', String(nav.scrollTop));
    };
  }, []);

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/teacher/dashboard" },
    { name: "My Classes", icon: BookOpen, path: "/teacher/classes" },
    { name: "Subjects", icon: Library, path: "/teacher/subjects" },
    { name: "Gradebook", icon: FileText, path: "/teacher/gradebook" },
    { name: "Attendance", icon: Users, path: "/teacher/attendance" },
    { name: "Students", icon: Users, path: "/teacher/students" },
    { name: "Reports", icon: FileText, path: "/teacher/reports" },
    { name: "Announcements", icon: Volume2, path: "/teacher/announcements" },
    { name: "Schedule", icon: Calendar, path: "/teacher/schedule" },
    { name: "Profile & Settings", icon: Settings, path: "/teacher/profile-settings" },
    { name: "Logout", icon: LogOut, path: "#", isLogout: true },
  ];

  const handleNavigation = (path) => {
    if (path !== "#") {
      navigate(path);
    }
  };

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
    });

    if (result.isConfirmed) {
      try {
        Swal.fire({
          title: 'Logging out...',
          allowOutsideClick: false,
          allowEscapeKey: false,
          didOpen: () => Swal.showLoading(),
        });

        await authService.logout();

        await Swal.fire({
          title: 'Logged Out!',
          text: 'You have been successfully logged out.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
        });

        navigate('/');
      } catch (error) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        navigate('/');
      }
    }
  };

  return (
    <>
      {isMobile && isOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}
      <div
        className={`h-screen transition-[width] duration-300 ease-in-out ${
          isMobile && isOpen ? 'fixed inset-y-0 left-0 z-50' : 'relative'
        } ${isOpen ? 'w-64' : 'w-16'}`}
      >
      <button
        aria-label={isOpen ? 'Hide sidebar' : 'Show sidebar'}
        onClick={() => setIsOpen((prev) => !prev)}
        className="absolute -right-3 top-4 z-40 bg-[#0f235f] border border-white/15 shadow-sm rounded-full p-1 hover:bg-white/10 transition-all duration-200"
      >
        {isOpen ? <PanelLeftClose className="w-4 h-4 text-white" /> : <PanelLeftOpen className="w-4 h-4 text-white" />}
      </button>

      <aside
        className={`absolute inset-0 bg-[#0b1c4a] border-r border-white/10 text-white flex flex-col transition-all duration-300 ease-in-out ${
          isOpen
            ? 'translate-x-0'
            : '-translate-x-[calc(100%-4rem)]'
        }`}
      >
        <div className={`h-16 flex items-center ${isOpen ? 'px-6' : 'px-3'} border-b border-white/10`}>
          <div className={`flex items-center ${isOpen ? 'space-x-2' : 'justify-center w-full'}`}>
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/20 bg-white">
              <img src={schoolLogo} alt="ACLC College" className="w-full h-full object-cover" />
            </div>
            {isOpen && (
              <span className="text-xl font-semibold text-white">
                ACLC College
              </span>
            )}
          </div>
        </div>

        <nav ref={navRef} className="flex-1 overflow-y-auto py-4 px-3 sidebar-scrollbar">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.name;
              const isLogout = item.isLogout;

              return (
                <li key={item.name}>
                  <button
                    onClick={() => {
                      if (isLogout) {
                        handleLogout();
                      } else {
                        setActiveItem(item.name);
                        handleNavigation(item.path);
                      }
                    }}
                    className={`w-full flex items-center ${isOpen ? 'space-x-3 px-3' : 'justify-center px-0'} py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isLogout
                        ? "text-[#e31b23] hover:bg-[#e31b23]/10"
                        : isActive
                          ? "bg-white/10 text-white"
                          : "text-white/80 hover:bg-white/10"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {isOpen && <span>{item.name}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className={`${isOpen ? 'p-4' : 'p-3'} border-t border-white/10`}>
          <div className={`flex items-center ${isOpen ? 'space-x-3' : 'justify-center'}`}>
            <div className="w-9 h-9 bg-white/10 rounded-full overflow-hidden flex items-center justify-center">
              {resolveImageUrl(teacherProfile.avatar) ? (
                <img
                  src={resolveImageUrl(teacherProfile.avatar)}
                  alt={teacherProfile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm font-medium text-white">{getInitials(teacherProfile.name)}</span>
              )}
            </div>
            {isOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {teacherProfile.name}
                </p>
                <p className="text-xs text-white/60 truncate">
                  {teacherProfile.email || 'No email'}
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>
      </div>
    </>
  );
}

export default Sidebar;
