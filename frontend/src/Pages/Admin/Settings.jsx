import '../../App.css'
import { useState, useEffect } from "react";
import Swal from 'sweetalert2';
import Sidebar from "../../Components/Admin/Sidebar.jsx";
import settingsService from "../../service/settingsService";
import authService from "../../service/authService";
import {
  Settings as SettingsIcon,
  Save,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Upload,
  Download,
  Trash2,
  Clock,
  Shield,
  Users,
  BookOpen,
  Lock,
  Database,
  ToggleRight,
  ToggleLeft,
  ChevronDown,
  Info,
  Mail,
  Phone,
  MapPin,
  Globe,
  Loader2,
  User,
} from 'lucide-react';

function Settings() {
  const [activeItem, setActiveItem] = useState("Settings");
  const [activeTab, setActiveTab] = useState('general');
  const [saveStatus, setSaveStatus] = useState(null);
  const [saveMessage, setSaveMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    avatar: '',
    avatarFile: null,
    avatarPreview: null,
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });

  const resolveImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (/^https?:\/\//i.test(imagePath) || imagePath.startsWith('data:') || imagePath.startsWith('blob:')) {
      return imagePath;
    }
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
    const backendOrigin = apiBaseUrl.replace(/\/api\/?$/, '');

    let normalizedPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;

    // Laravel stores avatars as "avatars/..." on the public disk.
    // Public URLs for that disk are served under "/storage/...".
    if (!normalizedPath.startsWith('storage/') && normalizedPath.startsWith('avatars/')) {
      normalizedPath = `storage/${normalizedPath}`;
    }

    if (normalizedPath.startsWith('public/')) {
      normalizedPath = normalizedPath.replace(/^public\//, 'storage/');
    }

    return `${backendOrigin}/${normalizedPath}`;
  };

  // General Settings State
  const [generalSettings, setGeneralSettings] = useState({
    schoolName: 'EduCore Academy',
    schoolLogo: '/logo.png',
    address: '123 Education Street, Metro City',
    phone: '+1 (555) 123-4567',
    email: 'admin@educore.edu',
    timezone: 'Asia/Manila',
    dateFormat: 'MM/DD/YYYY',
    language: 'English'
  });

  // Academic Settings State
  const [academicSettings, setAcademicSettings] = useState({
    defaultAcademicYear: '2024-2025',
    semesterType: 'semester',
    numberOfYearLevels: 4,
    sectionNameFormat: 'numeric',
    maxStudentsPerSection: 50,
    enablePrerequisites: true,
    allowCrossEnrollment: false
  });

  // User & Role Settings State
  const [userRoleSettings, setUserRoleSettings] = useState({
    enableAdmin: true,
    enableTeacher: true,
    enableStudent: true,
    enableRegistrar: true,
    passwordMinLength: 8,
    requireSpecialChars: true,
    sessionTimeout: 30,
    maxLoginAttempts: 5
  });

  // Enrollment Rules State
  const [enrollmentRules, setEnrollmentRules] = useState({
    enrollmentOpen: true,
    allowLateEnrollment: true,
    lateEnrollmentDeadline: 14,
    maxUnitsPerSemester: 24,
    enforcePrerequisites: true,
    autoCloseFullSections: true,
    requireApproval: false
  });

  // Grading Settings State
  const [gradingSettings, setGradingSettings] = useState({
    gradingScale: '1.0-5.0',
    passingGrade: 3.0,
    decimalPlaces: 2,
    gpaComputationMethod: 'weighted',
    gradeLockAfterSubmission: true,
    allowGradeRevision: false,
    includeIncompleteGrades: false
  });

  // System & Security State
  const [systemSecurity, setSystemSecurity] = useState({
    maintenanceMode: false,
    enableAuditLogs: true,
    enableTwoFactor: false,
    ipRestrictions: false,
    allowedIPs: '',
    encryptionEnabled: true,
    apiRateLimit: 1000
  });

  // Backup & Logs State
  const [backupLogs, setBackupLogs] = useState({
    autoBackupEnabled: true,
    backupFrequency: 'weekly',
    lastBackup: '2024-01-15 02:30 AM',
    backupLocation: 'Cloud Storage',
    retentionDays: 90
  });

  // Load settings from API
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const response = await settingsService.getAll();
        const data = response.data || response;
        
        // Map API response to local state
        if (data.general) {
          setGeneralSettings(prev => ({
            ...prev,
            schoolName: data.general.school_name ?? prev.schoolName,
            schoolLogo: data.general.school_logo ?? prev.schoolLogo,
            address: data.general.address ?? prev.address,
            phone: data.general.phone ?? prev.phone,
            email: data.general.email ?? prev.email,
            timezone: data.general.timezone ?? prev.timezone,
            dateFormat: data.general.date_format ?? prev.dateFormat,
            language: data.general.language ?? prev.language,
          }));
        }

        if (data.academic) {
          setAcademicSettings(prev => ({
            ...prev,
            defaultAcademicYear: data.academic.default_academic_year ?? prev.defaultAcademicYear,
            semesterType: data.academic.semester_type ?? prev.semesterType,
            numberOfYearLevels: data.academic.number_of_year_levels ?? prev.numberOfYearLevels,
            sectionNameFormat: data.academic.section_name_format ?? prev.sectionNameFormat,
            maxStudentsPerSection: data.academic.max_students_per_section ?? prev.maxStudentsPerSection,
            enablePrerequisites: data.academic.enable_prerequisites ?? prev.enablePrerequisites,
            allowCrossEnrollment: data.academic.allow_cross_enrollment ?? prev.allowCrossEnrollment,
          }));
        }

        if (data.user_roles) {
          setUserRoleSettings(prev => ({
            ...prev,
            enableAdmin: data.user_roles.enable_admin ?? prev.enableAdmin,
            enableTeacher: data.user_roles.enable_teacher ?? prev.enableTeacher,
            enableStudent: data.user_roles.enable_student ?? prev.enableStudent,
            enableRegistrar: data.user_roles.enable_registrar ?? prev.enableRegistrar,
            passwordMinLength: data.user_roles.password_min_length ?? prev.passwordMinLength,
            requireSpecialChars: data.user_roles.require_special_chars ?? prev.requireSpecialChars,
            sessionTimeout: data.user_roles.session_timeout ?? prev.sessionTimeout,
            maxLoginAttempts: data.user_roles.max_login_attempts ?? prev.maxLoginAttempts,
          }));
        }

        if (data.enrollment) {
          setEnrollmentRules(prev => ({
            ...prev,
            enrollmentOpen: data.enrollment.enrollment_open ?? prev.enrollmentOpen,
            allowLateEnrollment: data.enrollment.allow_late_enrollment ?? prev.allowLateEnrollment,
            lateEnrollmentDeadline: data.enrollment.late_enrollment_deadline ?? prev.lateEnrollmentDeadline,
            maxUnitsPerSemester: data.enrollment.max_units_per_semester ?? prev.maxUnitsPerSemester,
            enforcePrerequisites: data.enrollment.enforce_prerequisites ?? prev.enforcePrerequisites,
            autoCloseFullSections: data.enrollment.auto_close_full_sections ?? prev.autoCloseFullSections,
            requireApproval: data.enrollment.require_approval ?? prev.requireApproval,
          }));
        }

        if (data.grading) {
          setGradingSettings(prev => ({
            ...prev,
            gradingScale: data.grading.grading_scale ?? prev.gradingScale,
            passingGrade: data.grading.passing_grade ?? prev.passingGrade,
            decimalPlaces: data.grading.decimal_places ?? prev.decimalPlaces,
            gpaComputationMethod: data.grading.gpa_computation_method ?? prev.gpaComputationMethod,
            gradeLockAfterSubmission: data.grading.grade_lock_after_submission ?? prev.gradeLockAfterSubmission,
            allowGradeRevision: data.grading.allow_grade_revision ?? prev.allowGradeRevision,
            includeIncompleteGrades: data.grading.include_incomplete_grades ?? prev.includeIncompleteGrades,
          }));
        }

        if (data.system) {
          setSystemSecurity(prev => ({
            ...prev,
            maintenanceMode: data.system.maintenance_mode ?? prev.maintenanceMode,
            enableAuditLogs: data.system.enable_audit_logs ?? prev.enableAuditLogs,
            enableTwoFactor: data.system.enable_two_factor ?? prev.enableTwoFactor,
            ipRestrictions: data.system.ip_restrictions ?? prev.ipRestrictions,
            allowedIPs: data.system.allowed_ips ?? prev.allowedIPs,
            encryptionEnabled: data.system.encryption_enabled ?? prev.encryptionEnabled,
            apiRateLimit: data.system.api_rate_limit ?? prev.apiRateLimit,
          }));
        }

        if (data.backup) setBackupLogs(prev => ({...prev, ...data.backup}));
      } catch (err) {
        console.error('Failed to load settings:', err);
        // Keep default values if API fails
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      setProfileLoading(true);
      try {
        const response = await authService.getProfile();
        const user = response?.data || response || {};
        setProfileForm((prev) => ({
          ...prev,
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          address: user.address || '',
          avatar: user.avatar || '',
          avatarPreview: null,
          avatarFile: null,
        }));
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setProfileLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleProfileImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setProfileForm((prev) => ({
      ...prev,
      avatarFile: file,
      avatarPreview: preview,
    }));
  };

  const handleSaveProfile = async () => {
    setSaveStatus('saving');
    setSaveMessage('Saving profile to database...');
    setError(null);
    try {
      const formData = new FormData();
      formData.append('name', profileForm.name || '');
      formData.append('email', profileForm.email || '');
      formData.append('phone', profileForm.phone || '');
      formData.append('address', profileForm.address || '');
      if (profileForm.avatarFile) {
        formData.append('avatar', profileForm.avatarFile);
      }

      const response = await authService.updateProfile(formData);
      const user = response?.user || response?.data?.user || null;
      if (user) {
        setProfileForm((prev) => ({
          ...prev,
          name: user.name || prev.name,
          email: user.email || prev.email,
          phone: user.phone || '',
          address: user.address || '',
          avatar: user.avatar || prev.avatar,
          avatarFile: null,
          avatarPreview: null,
        }));
      }
      setSaveStatus('success');
      setSaveMessage('Profile and photo saved successfully to database.');
      setTimeout(() => setSaveStatus(null), 3000);
      await Swal.fire({
        title: 'Profile Saved',
        text: 'Profile and photo were saved successfully.',
        icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: '#2563eb',
      });
    } catch (err) {
      console.error('Failed to update profile:', err);
      const message = err.response?.data?.message || 'Failed to update profile';
      setError(message);
      setSaveStatus(null);
      setSaveMessage('');
      await Swal.fire({
        title: 'Save Failed',
        text: message,
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#dc2626',
      });
    }
  };

  const handleChangePassword = async () => {
    setError(null);
    if (passwordForm.password !== passwordForm.password_confirmation) {
      setError('New password and confirmation do not match');
      await Swal.fire({
        title: 'Password Mismatch',
        text: 'New password and confirmation do not match.',
        icon: 'warning',
        confirmButtonText: 'OK',
        confirmButtonColor: '#f59e0b',
      });
      return;
    }

    setPasswordLoading(true);
    try {
      await authService.updatePassword(
        passwordForm.current_password,
        passwordForm.password,
        passwordForm.password_confirmation
      );
      setPasswordForm({
        current_password: '',
        password: '',
        password_confirmation: '',
      });
      setSaveStatus('success');
      setSaveMessage('Password updated successfully.');
      setTimeout(() => setSaveStatus(null), 3000);
      await Swal.fire({
        title: 'Password Updated',
        text: 'Your password has been updated successfully.',
        icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: '#2563eb',
      });
    } catch (err) {
      console.error('Failed to update password:', err);
      const message = err.response?.data?.message || 'Failed to update password';
      setError(message);
      setSaveMessage('');
      await Swal.fire({
        title: 'Password Update Failed',
        text: message,
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#dc2626',
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle Save
  const handleSave = async (section) => {
    setSaveStatus('saving');
    setSaveMessage('Saving settings...');
    setError(null);
    
    try {
      let settingsData = {};
      switch (section) {
        case 'general':
          settingsData = {
            general: {
              school_name: generalSettings.schoolName,
              address: generalSettings.address,
              phone: generalSettings.phone,
              email: generalSettings.email,
              timezone: generalSettings.timezone,
              date_format: generalSettings.dateFormat,
              language: generalSettings.language,
            },
          };
          break;
        case 'academic':
          settingsData = {
            academic: {
              default_academic_year: academicSettings.defaultAcademicYear,
              semester_type: academicSettings.semesterType,
              number_of_year_levels: academicSettings.numberOfYearLevels,
              section_name_format: academicSettings.sectionNameFormat,
              max_students_per_section: academicSettings.maxStudentsPerSection,
              enable_prerequisites: academicSettings.enablePrerequisites,
              allow_cross_enrollment: academicSettings.allowCrossEnrollment,
            },
          };
          break;
        case 'users':
          settingsData = {
            users: {
              enable_admin: userRoleSettings.enableAdmin,
              enable_teacher: userRoleSettings.enableTeacher,
              enable_student: userRoleSettings.enableStudent,
              enable_registrar: userRoleSettings.enableRegistrar,
              password_min_length: userRoleSettings.passwordMinLength,
              require_special_chars: userRoleSettings.requireSpecialChars,
              session_timeout: userRoleSettings.sessionTimeout,
              max_login_attempts: userRoleSettings.maxLoginAttempts,
            },
          };
          break;
        case 'enrollment':
          settingsData = {
            enrollment: {
              enrollment_open: enrollmentRules.enrollmentOpen,
              allow_late_enrollment: enrollmentRules.allowLateEnrollment,
              late_enrollment_deadline: enrollmentRules.lateEnrollmentDeadline,
              max_units_per_semester: enrollmentRules.maxUnitsPerSemester,
              enforce_prerequisites: enrollmentRules.enforcePrerequisites,
              auto_close_full_sections: enrollmentRules.autoCloseFullSections,
              require_approval: enrollmentRules.requireApproval,
            },
          };
          break;
        case 'grading':
          settingsData = {
            grading: {
              grading_scale: gradingSettings.gradingScale,
              passing_grade: gradingSettings.passingGrade,
              decimal_places: gradingSettings.decimalPlaces,
              gpa_computation_method: gradingSettings.gpaComputationMethod,
              grade_lock_after_submission: gradingSettings.gradeLockAfterSubmission,
              allow_grade_revision: gradingSettings.allowGradeRevision,
              include_incomplete_grades: gradingSettings.includeIncompleteGrades,
            },
          };
          break;
        case 'security':
          settingsData = {
            security: {
              maintenance_mode: systemSecurity.maintenanceMode,
              enable_audit_logs: systemSecurity.enableAuditLogs,
              enable_two_factor: systemSecurity.enableTwoFactor,
              ip_restrictions: systemSecurity.ipRestrictions,
              allowed_ips: systemSecurity.allowedIPs,
              encryption_enabled: systemSecurity.encryptionEnabled,
              api_rate_limit: systemSecurity.apiRateLimit,
            },
          };
          break;
        case 'backup':
          await Swal.fire({
            title: 'Not Available',
            text: 'Backup settings are not connected to a backend endpoint yet.',
            icon: 'info',
            confirmButtonText: 'OK',
            confirmButtonColor: '#2563eb',
          });
          setSaveStatus(null);
          setSaveMessage('');
          return;
        default:
          setSaveStatus(null);
          setSaveMessage('');
          return;
      }

      await settingsService.update(section, settingsData);
      setSaveStatus('success');
      setSaveMessage('Settings saved successfully.');
      setTimeout(() => setSaveStatus(null), 3000);
      await Swal.fire({
        title: 'Settings Saved',
        text: 'Settings were saved successfully to the database.',
        icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: '#2563eb',
      });
    } catch (err) {
      console.error('Failed to save settings:', err);
      const message = err?.response?.data?.message || 'Failed to save settings. Please try again.';
      setError(message);
      setSaveStatus(null);
      setSaveMessage('');
      await Swal.fire({
        title: 'Save Failed',
        text: message,
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#dc2626',
      });
    }
  };

  // Settings Tabs
  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'academic', label: 'Academic', icon: BookOpen },
    { id: 'users', label: 'Users & Roles', icon: Users },
    { id: 'enrollment', label: 'Enrollment Rules', icon: Mail },
    { id: 'grading', label: 'Grading', icon: CheckCircle },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'backup', label: 'Backup & Logs', icon: Database }
  ];

  return (
    <div className="flex h-screen">
      <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />

      <div className="h-screen bg-gray-50 p-8 flex-1 overflow-y-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">⚙️ System Settings</h1>
          <p className="text-gray-600 mt-1">Configure system-wide behavior and platform rules</p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mr-3" />
            <span className="text-gray-600">Loading settings...</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {!loading && (
          <>

        {/* Save Status */}
        {saveStatus && (
          <div className={`fixed top-4 right-4 p-4 rounded-lg flex items-center gap-2 ${
            saveStatus === 'success' 
              ? 'bg-green-100 text-green-700 border border-green-300' 
              : 'bg-blue-100 text-blue-700 border border-blue-300'
          }`}>
            {saveStatus === 'success' ? (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>{saveMessage || 'Saved successfully.'}</span>
              </>
            ) : (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>{saveMessage || 'Saving...'}</span>
              </>
            )}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
          <div className="flex overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          {/* PROFILE SETTINGS */}
          {activeTab === 'profile' && (
            <div className="p-6 space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                    <div className="w-28 h-28 rounded-full overflow-hidden bg-gray-200 mx-auto mb-4">
                      {(profileForm.avatarPreview || resolveImageUrl(profileForm.avatar)) ? (
                        <img
                          src={profileForm.avatarPreview || resolveImageUrl(profileForm.avatar)}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-10 h-10 text-gray-500" />
                        </div>
                      )}
                    </div>
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <Upload className="w-4 h-4" />
                      <span className="text-sm font-medium">Upload Photo</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleProfileImageChange} />
                    </label>
                    <p className="text-xs text-gray-500 mt-2">JPG, PNG up to 2MB</p>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
                  {profileLoading ? (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading profile...
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                          <input
                            type="text"
                            value={profileForm.name}
                            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                          <input
                            type="email"
                            value={profileForm.email}
                            onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                          <input
                            type="text"
                            value={profileForm.phone}
                            onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                          <input
                            type="text"
                            value={profileForm.address}
                            onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <button
                        onClick={handleSaveProfile}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        <Save className="w-4 h-4" />
                        Save Profile
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordForm.password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                      className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-10 text-gray-500"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordForm.password_confirmation}
                      onChange={(e) => setPasswordForm({ ...passwordForm, password_confirmation: e.target.value })}
                      className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-10 text-gray-500"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleChangePassword}
                  disabled={passwordLoading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors font-medium disabled:opacity-60"
                >
                  {passwordLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  Update Password
                </button>
              </div>
            </div>
          )}

          {/* GENERAL SETTINGS */}
          {activeTab === 'general' && (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">School Name</label>
                  <input
                    type="text"
                    value={generalSettings.schoolName}
                    onChange={(e) => setGeneralSettings({...generalSettings, schoolName: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={generalSettings.email}
                      onChange={(e) => setGeneralSettings({...generalSettings, email: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      value={generalSettings.phone}
                      onChange={(e) => setGeneralSettings({...generalSettings, phone: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={generalSettings.address}
                      onChange={(e) => setGeneralSettings({...generalSettings, address: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                  <select
                    value={generalSettings.timezone}
                    onChange={(e) => setGeneralSettings({...generalSettings, timezone: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option>Asia/Manila</option>
                    <option>UTC</option>
                    <option>America/New_York</option>
                    <option>Europe/London</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
                  <select
                    value={generalSettings.dateFormat}
                    onChange={(e) => setGeneralSettings({...generalSettings, dateFormat: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option>MM/DD/YYYY</option>
                    <option>DD/MM/YYYY</option>
                    <option>YYYY-MM-DD</option>
                  </select>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <button
                  onClick={() => handleSave('general')}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* ACADEMIC SETTINGS */}
          {activeTab === 'academic' && (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Default Academic Year</label>
                  <input
                    type="text"
                    value={academicSettings.defaultAcademicYear}
                    onChange={(e) => setAcademicSettings({...academicSettings, defaultAcademicYear: e.target.value})}
                    placeholder="e.g., 2024-2025"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Semester Type</label>
                  <select
                    value={academicSettings.semesterType}
                    onChange={(e) => setAcademicSettings({...academicSettings, semesterType: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="semester">Semester (2 terms)</option>
                    <option value="trimester">Trimester (3 terms)</option>
                    <option value="quarter">Quarter (4 terms)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Number of Year Levels</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={academicSettings.numberOfYearLevels}
                    onChange={(e) => setAcademicSettings({...academicSettings, numberOfYearLevels: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Section Name Format</label>
                  <select
                    value={academicSettings.sectionNameFormat}
                    onChange={(e) => setAcademicSettings({...academicSettings, sectionNameFormat: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="numeric">Numeric (1-A, 2-B)</option>
                    <option value="alpha">Alpha (A, B, C)</option>
                    <option value="alphanumeric">Alphanumeric (1A, 1B)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Students per Section</label>
                  <input
                    type="number"
                    value={academicSettings.maxStudentsPerSection}
                    onChange={(e) => setAcademicSettings({...academicSettings, maxStudentsPerSection: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Enable Prerequisites</p>
                    <p className="text-xs text-gray-600 mt-1">Enforce prerequisite courses for enrollment</p>
                  </div>
                  <button
                    onClick={() => setAcademicSettings({...academicSettings, enablePrerequisites: !academicSettings.enablePrerequisites})}
                    className="text-gray-400"
                  >
                    {academicSettings.enablePrerequisites ? (
                      <ToggleRight className="w-6 h-6 text-green-600" />
                    ) : (
                      <ToggleLeft className="w-6 h-6" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Allow Cross-Enrollment</p>
                    <p className="text-xs text-gray-600 mt-1">Allow students to enroll in courses from other programs</p>
                  </div>
                  <button
                    onClick={() => setAcademicSettings({...academicSettings, allowCrossEnrollment: !academicSettings.allowCrossEnrollment})}
                    className="text-gray-400"
                  >
                    {academicSettings.allowCrossEnrollment ? (
                      <ToggleRight className="w-6 h-6 text-green-600" />
                    ) : (
                      <ToggleLeft className="w-6 h-6" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <button
                  onClick={() => handleSave('academic')}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* USER & ROLE SETTINGS */}
          {activeTab === 'users' && (
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Roles</h3>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Admin Role</p>
                    <p className="text-xs text-gray-600 mt-1">Super admin access</p>
                  </div>
                  <button
                    onClick={() => setUserRoleSettings({...userRoleSettings, enableAdmin: !userRoleSettings.enableAdmin})}
                    className="text-gray-400"
                  >
                    {userRoleSettings.enableAdmin ? (
                      <ToggleRight className="w-6 h-6 text-green-600" />
                    ) : (
                      <ToggleLeft className="w-6 h-6" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Teacher Role</p>
                    <p className="text-xs text-gray-600 mt-1">Faculty access</p>
                  </div>
                  <button
                    onClick={() => setUserRoleSettings({...userRoleSettings, enableTeacher: !userRoleSettings.enableTeacher})}
                    className="text-gray-400"
                  >
                    {userRoleSettings.enableTeacher ? (
                      <ToggleRight className="w-6 h-6 text-green-600" />
                    ) : (
                      <ToggleLeft className="w-6 h-6" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Student Role</p>
                    <p className="text-xs text-gray-600 mt-1">Student access</p>
                  </div>
                  <button
                    onClick={() => setUserRoleSettings({...userRoleSettings, enableStudent: !userRoleSettings.enableStudent})}
                    className="text-gray-400"
                  >
                    {userRoleSettings.enableStudent ? (
                      <ToggleRight className="w-6 h-6 text-green-600" />
                    ) : (
                      <ToggleLeft className="w-6 h-6" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Registrar Role</p>
                    <p className="text-xs text-gray-600 mt-1">Enrollment management</p>
                  </div>
                  <button
                    onClick={() => setUserRoleSettings({...userRoleSettings, enableRegistrar: !userRoleSettings.enableRegistrar})}
                    className="text-gray-400"
                  >
                    {userRoleSettings.enableRegistrar ? (
                      <ToggleRight className="w-6 h-6 text-green-600" />
                    ) : (
                      <ToggleLeft className="w-6 h-6" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Password Policy</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Password Length</label>
                  <input
                    type="number"
                    min="6"
                    max="20"
                    value={userRoleSettings.passwordMinLength}
                    onChange={(e) => setUserRoleSettings({...userRoleSettings, passwordMinLength: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Require Special Characters</p>
                    <p className="text-xs text-gray-600 mt-1">Passwords must contain special characters</p>
                  </div>
                  <button
                    onClick={() => setUserRoleSettings({...userRoleSettings, requireSpecialChars: !userRoleSettings.requireSpecialChars})}
                    className="text-gray-400"
                  >
                    {userRoleSettings.requireSpecialChars ? (
                      <ToggleRight className="w-6 h-6 text-green-600" />
                    ) : (
                      <ToggleLeft className="w-6 h-6" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Session & Security</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
                    <input
                      type="number"
                      value={userRoleSettings.sessionTimeout}
                      onChange={(e) => setUserRoleSettings({...userRoleSettings, sessionTimeout: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Login Attempts</label>
                    <input
                      type="number"
                      min="1"
                      value={userRoleSettings.maxLoginAttempts}
                      onChange={(e) => setUserRoleSettings({...userRoleSettings, maxLoginAttempts: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <button
                  onClick={() => handleSave('users')}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* ENROLLMENT RULES */}
          {activeTab === 'enrollment' && (
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Enrollment Open</p>
                    <p className="text-xs text-gray-600 mt-1">Allow new enrollments</p>
                  </div>
                  <button
                    onClick={() => setEnrollmentRules({...enrollmentRules, enrollmentOpen: !enrollmentRules.enrollmentOpen})}
                    className="text-gray-400"
                  >
                    {enrollmentRules.enrollmentOpen ? (
                      <ToggleRight className="w-6 h-6 text-green-600" />
                    ) : (
                      <ToggleLeft className="w-6 h-6" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Allow Late Enrollment</p>
                    <p className="text-xs text-gray-600 mt-1">Permit enrollment after semester start</p>
                  </div>
                  <button
                    onClick={() => setEnrollmentRules({...enrollmentRules, allowLateEnrollment: !enrollmentRules.allowLateEnrollment})}
                    className="text-gray-400"
                  >
                    {enrollmentRules.allowLateEnrollment ? (
                      <ToggleRight className="w-6 h-6 text-green-600" />
                    ) : (
                      <ToggleLeft className="w-6 h-6" />
                    )}
                  </button>
                </div>

                {enrollmentRules.allowLateEnrollment && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Late Enrollment Deadline (days)</label>
                    <input
                      type="number"
                      value={enrollmentRules.lateEnrollmentDeadline}
                      onChange={(e) => setEnrollmentRules({...enrollmentRules, lateEnrollmentDeadline: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Units per Semester</label>
                  <input
                    type="number"
                    value={enrollmentRules.maxUnitsPerSemester}
                    onChange={(e) => setEnrollmentRules({...enrollmentRules, maxUnitsPerSemester: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Enforce Prerequisites</p>
                    <p className="text-xs text-gray-600 mt-1">Check prerequisites before enrollment</p>
                  </div>
                  <button
                    onClick={() => setEnrollmentRules({...enrollmentRules, enforcePrerequisites: !enrollmentRules.enforcePrerequisites})}
                    className="text-gray-400"
                  >
                    {enrollmentRules.enforcePrerequisites ? (
                      <ToggleRight className="w-6 h-6 text-green-600" />
                    ) : (
                      <ToggleLeft className="w-6 h-6" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Auto-close Full Sections</p>
                    <p className="text-xs text-gray-600 mt-1">Prevent enrollment in full sections</p>
                  </div>
                  <button
                    onClick={() => setEnrollmentRules({...enrollmentRules, autoCloseFullSections: !enrollmentRules.autoCloseFullSections})}
                    className="text-gray-400"
                  >
                    {enrollmentRules.autoCloseFullSections ? (
                      <ToggleRight className="w-6 h-6 text-green-600" />
                    ) : (
                      <ToggleLeft className="w-6 h-6" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Require Approval</p>
                    <p className="text-xs text-gray-600 mt-1">Registrar must approve enrollments</p>
                  </div>
                  <button
                    onClick={() => setEnrollmentRules({...enrollmentRules, requireApproval: !enrollmentRules.requireApproval})}
                    className="text-gray-400"
                  >
                    {enrollmentRules.requireApproval ? (
                      <ToggleRight className="w-6 h-6 text-green-600" />
                    ) : (
                      <ToggleLeft className="w-6 h-6" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <button
                  onClick={() => handleSave('enrollment')}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* GRADING SETTINGS */}
          {activeTab === 'grading' && (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Grading Scale</label>
                  <select
                    value={gradingSettings.gradingScale}
                    onChange={(e) => setGradingSettings({...gradingSettings, gradingScale: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="1.0-5.0">1.0 - 5.0 Scale</option>
                    <option value="75-100">75 - 100 Scale</option>
                    <option value="A-F">Letter Grade (A-F)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Passing Grade</label>
                  <input
                    type="number"
                    step="0.1"
                    value={gradingSettings.passingGrade}
                    onChange={(e) => setGradingSettings({...gradingSettings, passingGrade: parseFloat(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Decimal Places</label>
                  <input
                    type="number"
                    min="0"
                    max="4"
                    value={gradingSettings.decimalPlaces}
                    onChange={(e) => setGradingSettings({...gradingSettings, decimalPlaces: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">GPA Computation Method</label>
                  <select
                    value={gradingSettings.gpaComputationMethod}
                    onChange={(e) => setGradingSettings({...gradingSettings, gpaComputationMethod: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="weighted">Weighted Average</option>
                    <option value="simple">Simple Average</option>
                    <option value="cumulative">Cumulative</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Grade Lock After Submission</p>
                    <p className="text-xs text-gray-600 mt-1">Prevent grade changes after final submission</p>
                  </div>
                  <button
                    onClick={() => setGradingSettings({...gradingSettings, gradeLockAfterSubmission: !gradingSettings.gradeLockAfterSubmission})}
                    className="text-gray-400"
                  >
                    {gradingSettings.gradeLockAfterSubmission ? (
                      <ToggleRight className="w-6 h-6 text-green-600" />
                    ) : (
                      <ToggleLeft className="w-6 h-6" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Allow Grade Revision</p>
                    <p className="text-xs text-gray-600 mt-1">Allow teacher to revise submitted grades</p>
                  </div>
                  <button
                    onClick={() => setGradingSettings({...gradingSettings, allowGradeRevision: !gradingSettings.allowGradeRevision})}
                    className="text-gray-400"
                  >
                    {gradingSettings.allowGradeRevision ? (
                      <ToggleRight className="w-6 h-6 text-green-600" />
                    ) : (
                      <ToggleLeft className="w-6 h-6" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Include Incomplete Grades</p>
                    <p className="text-xs text-gray-600 mt-1">Allow Incomplete (INC) grades</p>
                  </div>
                  <button
                    onClick={() => setGradingSettings({...gradingSettings, includeIncompleteGrades: !gradingSettings.includeIncompleteGrades})}
                    className="text-gray-400"
                  >
                    {gradingSettings.includeIncompleteGrades ? (
                      <ToggleRight className="w-6 h-6 text-green-600" />
                    ) : (
                      <ToggleLeft className="w-6 h-6" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <button
                  onClick={() => handleSave('grading')}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* SYSTEM & SECURITY */}
          {activeTab === 'security' && (
            <div className="p-6 space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 mb-6">
                <Shield className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-900 font-medium">Security Settings</p>
                  <p className="text-xs text-red-700 mt-1">Changes here affect platform security. Modify only if you know what you're doing.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Maintenance Mode</p>
                    <p className="text-xs text-gray-600 mt-1">Disable access for non-admins</p>
                  </div>
                  <button
                    onClick={() => setSystemSecurity({...systemSecurity, maintenanceMode: !systemSecurity.maintenanceMode})}
                    className="text-gray-400"
                  >
                    {systemSecurity.maintenanceMode ? (
                      <ToggleRight className="w-6 h-6 text-red-600" />
                    ) : (
                      <ToggleLeft className="w-6 h-6" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Enable Audit Logs</p>
                    <p className="text-xs text-gray-600 mt-1">Record all system activities</p>
                  </div>
                  <button
                    onClick={() => setSystemSecurity({...systemSecurity, enableAuditLogs: !systemSecurity.enableAuditLogs})}
                    className="text-gray-400"
                  >
                    {systemSecurity.enableAuditLogs ? (
                      <ToggleRight className="w-6 h-6 text-green-600" />
                    ) : (
                      <ToggleLeft className="w-6 h-6" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Two-Factor Authentication</p>
                    <p className="text-xs text-gray-600 mt-1">Require 2FA for all users</p>
                  </div>
                  <button
                    onClick={() => setSystemSecurity({...systemSecurity, enableTwoFactor: !systemSecurity.enableTwoFactor})}
                    className="text-gray-400"
                  >
                    {systemSecurity.enableTwoFactor ? (
                      <ToggleRight className="w-6 h-6 text-green-600" />
                    ) : (
                      <ToggleLeft className="w-6 h-6" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">IP Restrictions</p>
                    <p className="text-xs text-gray-600 mt-1">Limit access to specific IPs</p>
                  </div>
                  <button
                    onClick={() => setSystemSecurity({...systemSecurity, ipRestrictions: !systemSecurity.ipRestrictions})}
                    className="text-gray-400"
                  >
                    {systemSecurity.ipRestrictions ? (
                      <ToggleRight className="w-6 h-6 text-green-600" />
                    ) : (
                      <ToggleLeft className="w-6 h-6" />
                    )}
                  </button>
                </div>

                {systemSecurity.ipRestrictions && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Allowed IPs (comma-separated)</label>
                    <input
                      type="text"
                      value={systemSecurity.allowedIPs}
                      onChange={(e) => setSystemSecurity({...systemSecurity, allowedIPs: e.target.value})}
                      placeholder="192.168.1.1, 10.0.0.1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Encryption Enabled</p>
                    <p className="text-xs text-gray-600 mt-1">Encrypt sensitive data</p>
                  </div>
                  <button
                    onClick={() => setSystemSecurity({...systemSecurity, encryptionEnabled: !systemSecurity.encryptionEnabled})}
                    disabled
                    className="text-gray-400"
                  >
                    {systemSecurity.encryptionEnabled ? (
                      <ToggleRight className="w-6 h-6 text-green-600" />
                    ) : (
                      <ToggleLeft className="w-6 h-6" />
                    )}
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">API Rate Limit (requests/hour)</label>
                  <input
                    type="number"
                    value={systemSecurity.apiRateLimit}
                    onChange={(e) => setSystemSecurity({...systemSecurity, apiRateLimit: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200 flex gap-3">
                <button
                  onClick={() => handleSave('security')}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
                <button
                  onClick={() => alert('Force logout all users?\n\n(Implementation pending)')}
                  className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  <Lock className="w-4 h-4" />
                  Force Logout All
                </button>
              </div>
            </div>
          )}

          {/* BACKUP & LOGS */}
          {activeTab === 'backup' && (
            <div className="p-6 space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3 mb-6">
                <Database className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-900 font-medium">Backup Management</p>
                  <p className="text-xs text-blue-700 mt-1">Manage system backups and activity logs</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Backup Configuration</h3>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Auto-Backup Enabled</p>
                    <p className="text-xs text-gray-600 mt-1">Schedule automatic backups</p>
                  </div>
                  <button
                    onClick={() => setBackupLogs({...backupLogs, autoBackupEnabled: !backupLogs.autoBackupEnabled})}
                    className="text-gray-400"
                  >
                    {backupLogs.autoBackupEnabled ? (
                      <ToggleRight className="w-6 h-6 text-green-600" />
                    ) : (
                      <ToggleLeft className="w-6 h-6" />
                    )}
                  </button>
                </div>

                {backupLogs.autoBackupEnabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Backup Frequency</label>
                      <select
                        value={backupLogs.backupFrequency}
                        onChange={(e) => setBackupLogs({...backupLogs, backupFrequency: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Retention (days)</label>
                      <input
                        type="number"
                        min="7"
                        value={backupLogs.retentionDays}
                        onChange={(e) => setBackupLogs({...backupLogs, retentionDays: parseInt(e.target.value)})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}

                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-2">Last Backup</p>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{backupLogs.lastBackup}</span>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-2">Backup Location</p>
                  <span className="text-sm text-gray-600">{backupLogs.backupLocation}</span>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200 flex gap-3">
                <button
                  onClick={() => {
                    alert('Starting manual backup...\n\n(Implementation pending)');
                  }}
                  className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  <Download className="w-4 h-4" />
                  Start Manual Backup
                </button>

                <button
                  onClick={() => {
                    alert('Exporting activity logs...\n\n(Implementation pending)');
                  }}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Download className="w-4 h-4" />
                  Export Logs
                </button>

                <button
                  onClick={() => {
                    if (confirm('This will delete all backups older than retention period. Continue?')) {
                      alert('Cleaning up old backups...\n\n(Implementation pending)');
                    }
                  }}
                  className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  Clean Old Backups
                </button>
              </div>

              <div className="space-y-4 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Activity Logs</h3>
                
                <div className="bg-gray-50 rounded-lg p-4 space-y-3 max-h-80 overflow-y-auto">
                  <div className="flex items-start gap-3 py-3 border-b border-gray-200">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">Backup completed successfully</p>
                      <p className="text-xs text-gray-500 mt-1">2024-01-15 02:30 AM</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 py-3 border-b border-gray-200">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">Security settings modified</p>
                      <p className="text-xs text-gray-500 mt-1">2024-01-14 10:15 AM</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 py-3 border-b border-gray-200">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">General settings updated</p>
                      <p className="text-xs text-gray-500 mt-1">2024-01-14 03:45 PM</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 py-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">Backup completed successfully</p>
                      <p className="text-xs text-gray-500 mt-1">2024-01-08 02:15 AM</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        </>
        )}
      </div>
    </div>
  );
}

export default Settings;
