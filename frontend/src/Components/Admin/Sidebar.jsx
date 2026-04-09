import {
  LayoutDashboard,
  Users,
  GraduationCap as StudentsIcon,
  UserCheck,
  BookOpen,
  Library,
  Grid,
  UserPlus,
  Calendar,
  FileText,
  Settings,
  ChevronDown,
  ChevronRight,
  Shield,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  Building2,
} from "lucide-react";
import '../../App.css';
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Swal from 'sweetalert2';
import authService from '../../service/authService';
import schoolLogo from '../../assets/ACLC_LOGO.jpg';

function Sidebar({ activeItem, setActiveItem }) {
  const navRef = useRef(null);
  const [currentUser, setCurrentUser] = useState(() => authService.getCurrentUser());
  const [isUsersOpen, setIsUsersOpen] = useState(() => {
    const saved = localStorage.getItem('adminSidebarUsersOpen');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [isStudentsOpen, setIsStudentsOpen] = useState(() => {
    const saved = localStorage.getItem('adminSidebarStudentsOpen');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [isTeachersOpen, setIsTeachersOpen] = useState(() => {
    const saved = localStorage.getItem('adminSidebarTeachersOpen');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [isOpen, setIsOpen] = useState(() => {
    const saved = localStorage.getItem('adminSidebarOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    localStorage.setItem('adminSidebarOpen', JSON.stringify(isOpen));
  }, [isOpen]);
  useEffect(() => {
    localStorage.setItem('adminSidebarUsersOpen', JSON.stringify(isUsersOpen));
  }, [isUsersOpen]);
  useEffect(() => {
    localStorage.setItem('adminSidebarStudentsOpen', JSON.stringify(isStudentsOpen));
  }, [isStudentsOpen]);
  useEffect(() => {
    localStorage.setItem('adminSidebarTeachersOpen', JSON.stringify(isTeachersOpen));
  }, [isTeachersOpen]);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 1024px)');
    const update = () => {
      setIsMobile(media.matches);
      if (media.matches) {
        setIsOpen(false);
        setIsUsersOpen(false);
        setIsStudentsOpen(false);
        setIsTeachersOpen(false);
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
    const fetchProfile = async () => {
      try {
        const response = await authService.getProfile();
        const user = response?.data || response || null;
        if (user) {
          setCurrentUser(user);
          localStorage.setItem('user', JSON.stringify(user));
        }
      } catch (error) {
        // Keep local user fallback if profile request fails.
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    const handleUserUpdated = (event) => {
      const updatedUser = event?.detail;
      if (updatedUser) {
        setCurrentUser(updatedUser);
      }
    };

    window.addEventListener('auth-user-updated', handleUserUpdated);
    return () => window.removeEventListener('auth-user-updated', handleUserUpdated);
  }, []);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) {
      return;
    }

    const savedScroll = localStorage.getItem('adminSidebarScrollTop');
    if (savedScroll !== null) {
      nav.scrollTop = Number(savedScroll) || 0;
    }

    const handleScroll = () => {
      localStorage.setItem('adminSidebarScrollTop', String(nav.scrollTop));
    };

    nav.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      nav.removeEventListener('scroll', handleScroll);
      localStorage.setItem('adminSidebarScrollTop', String(nav.scrollTop));
    };
  }, []);

  const navigate = useNavigate();

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
  };

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

  const roleMap = {
    admin: 'Administrator',
    teacher: 'Teacher',
    student: 'Student',
    registrar: 'Registrar',
  };

  const roleLabel = currentUser?.role
    ? roleMap[currentUser.role] || `${currentUser.role.charAt(0).toUpperCase()}${currentUser.role.slice(1)}`
    : 'User';
  const avatarUrl = resolveImageUrl(currentUser?.avatar);

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
    {
      name: "Users",
      icon: Users,
      hasDropdown: true,
      subItems: [
        { name: "All Users", icon: Users, path: "/admin/users/all" },
        { name: "Admins", icon: Shield, path: "/admin/users" },
        { name: "Student Accounts", icon: StudentsIcon, path: "/admin/users/student-accounts" },
        { name: "Teacher Accounts", icon: UserCheck, path: "/admin/users/teacher-accounts" },
      ]
    },
    {
      name: "Student Management",
      icon: StudentsIcon,
      hasDropdown: true,
      subItems: [
        { name: "Assigned Students", icon: StudentsIcon, path: "/admin/students/assigned" },
        { name: "Unassigned Students", icon: UserPlus, path: "/admin/students/unassigned" },
        { name: "Students List", icon: Users, path: "/admin/students/list" },
      ]
    },
    { name: "Enrollment", icon: UserPlus, path: "/admin/enrollment" },
    {
      name: "Teachers Side",
      icon: UserCheck,
      hasDropdown: true,
      subItems: [
        { name: "Teachers List", icon: UserCheck, path: "/admin/teachers/list" },
        { name: "Teachers", icon: UserCheck, path: "/admin/teachers" },
        { name: "Teacher Workload", icon: BookOpen, path: "/admin/teacher-workload" },
      ]
    },
    { name: "Programs", icon: BookOpen, path: "/admin/programs" },
    { name: "Classes", icon: BookOpen, path: "/admin/classes" },
    { name: "Departments", icon: Building2, path: "/admin/departments" },
    { name: "Subjects", icon: Library, path: "/admin/subjects" },
    { name: "Sections", icon: Grid, path: "/admin/sections" },
    { name: "Rooms", icon: Building2, path: "/admin/rooms" },
    { name: "Academic Year", icon: Calendar, path: "/admin/academic-year" },
    { name: "Reports", icon: FileText, path: "/admin/reports" },
    { name: "Settings", icon: Settings, path: "/admin/settings" },
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

  const handleToggle = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (!next) {
        setIsUsersOpen(false);
        setIsStudentsOpen(false);
        setIsTeachersOpen(false);
      }
      return next;
    });
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
        onClick={handleToggle}
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

              if (item.hasDropdown) {
                let dropdownOpen = false;
                let toggleDropdown = null;

                if (item.name === "Users") {
                  dropdownOpen = isOpen && isUsersOpen;
                  toggleDropdown = () => setIsUsersOpen(!isUsersOpen);
                } else if (item.name === "Student Management") {
                  dropdownOpen = isOpen && isStudentsOpen;
                  toggleDropdown = () => setIsStudentsOpen(!isStudentsOpen);
                } else if (item.name === "Teachers Side") {
                  dropdownOpen = isOpen && isTeachersOpen;
                  toggleDropdown = () => setIsTeachersOpen(!isTeachersOpen);
                }

                return (
                  <li key={item.name}>
                    <button
                      onClick={() => {
                        if (!isOpen) return;
                        toggleDropdown();
                      }}
                      className={`w-full flex items-center ${isOpen ? 'justify-between px-3' : 'justify-center px-0'} py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        dropdownOpen
                          ? 'text-white bg-white/10'
                          : isActive
                            ? 'bg-white/10 text-white'
                            : 'text-white/80 hover:bg-white/10'
                      }`}
                    >
                      <div className={`flex items-center ${isOpen ? 'space-x-3' : 'justify-center'}`}>
                        <Icon className="w-5 h-5" />
                        {isOpen && <span>{item.name}</span>}
                      </div>
                      {isOpen && (dropdownOpen ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      ))}
                    </button>
                    {dropdownOpen && (
                      <ul className="mt-1 space-y-0.5 border-l border-white/10 pl-3 py-1">
                        {item.subItems.map((subItem, index) => {
                          const SubIcon = subItem.icon;
                          const isSubActive = activeItem === subItem.name;
                          return (
                            <li key={subItem.name}>
                              <button
                                onClick={() => {
                                  setActiveItem(subItem.name);
                                  handleNavigation(subItem.path);
                                }}
                                className={`w-full flex items-center space-x-2 px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                                  isSubActive
                                    ? 'bg-white/10 text-white'
                                    : 'text-white/70 hover:bg-white/10'
                                }`}
                              >
                                <SubIcon className="w-4 h-4" />
                                <span>{subItem.name}</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              }

              return (
                <li key={item.name}>
                  <button
                    onClick={() => {
                      if (item.isLogout) {
                        handleLogout();
                      } else {
                        setActiveItem(item.name);
                        handleNavigation(item.path);
                      }
                    }}
                    className={`w-full flex items-center ${isOpen ? 'space-x-3 px-3' : 'justify-center px-0'} py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      item.isLogout
                        ? 'text-[#e31b23] hover:bg-[#e31b23]/10'
                        : isActive
                          ? 'bg-white/10 text-white'
                          : 'text-white/80 hover:bg-white/10'
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
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-medium text-white">{getInitials(currentUser?.name)}</span>
              )}
            </div>
            {isOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {currentUser?.name || 'Unknown User'}
                </p>
                <p className="text-xs text-white/60 truncate">
                  {roleLabel}
                </p>
              </div>
            )}
            {isOpen && (
              <button
                type="button"
                onClick={handleLogout}
                className="ml-auto h-9 w-9 rounded-full border border-white/15 text-[#e31b23] hover:bg-[#e31b23]/10 flex items-center justify-center"
                aria-label="Logout"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </aside>
      </div>
    </>
  );
}

export default Sidebar;
