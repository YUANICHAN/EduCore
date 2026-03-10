import '../../App.css'
import { useState, useEffect } from "react";
import Sidebar from "../../Components/Admin/Sidebar.jsx";
import settingsService from "../../service/settingsService";
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
  Loader2
} from 'lucide-react';

function Settings() {
  const [activeItem, setActiveItem] = useState("Settings");
  const [activeTab, setActiveTab] = useState('general');
  const [saveStatus, setSaveStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        if (data.general) setGeneralSettings(prev => ({...prev, ...data.general}));
        if (data.academic) setAcademicSettings(prev => ({...prev, ...data.academic}));
        if (data.users) setUserRoleSettings(prev => ({...prev, ...data.users}));
        if (data.enrollment) setEnrollmentRules(prev => ({...prev, ...data.enrollment}));
        if (data.grading) setGradingSettings(prev => ({...prev, ...data.grading}));
        if (data.security) setSystemSecurity(prev => ({...prev, ...data.security}));
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

  // Handle Save
  const handleSave = async (section) => {
    setSaveStatus('saving');
    setError(null);
    
    try {
      let settingsData = {};
      switch(section) {
        case 'general':
          settingsData = { general: generalSettings };
          break;
        case 'academic':
          settingsData = { academic: academicSettings };
          break;
        case 'users':
          settingsData = { users: userRoleSettings };
          break;
        case 'enrollment':
          settingsData = { enrollment: enrollmentRules };
          break;
        case 'grading':
          settingsData = { grading: gradingSettings };
          break;
        case 'security':
          settingsData = { security: systemSecurity };
          break;
        case 'backup':
          settingsData = { backup: backupLogs };
          break;
        default:
          break;
      }
      
      await settingsService.update(section, settingsData);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError('Failed to save settings. Please try again.');
      setSaveStatus(null);
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
            {/* Info Banner */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-amber-900 font-medium">Super Admin Only</p>
                <p className="text-xs text-amber-700 mt-1">Changes here affect the entire platform. Proceed with caution.</p>
              </div>
            </div>

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
                <span>Settings saved successfully!</span>
              </>
            ) : (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Saving settings...</span>
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
