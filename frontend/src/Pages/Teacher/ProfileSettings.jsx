import '../../App.css';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import Sidebar from '../../Components/Teacher/Sidebar.jsx';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Lock,
  Bell,
  Eye,
  EyeOff,
  Camera,
  Save,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import authService from '../../service/authService';
import teacherService from '../../service/teacherService';

function TeacherProfileSettings() {
  const [activeItem, setActiveItem] = useState('Profile & Settings');
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'settings'
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const navigate = useNavigate();

  // Profile Data
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    department: '',
    role: '',
    joinDate: '',
    employeeId: '',
    profileImage: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Notification Preferences
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    classReminders: true,
    gradeSubmissionReminders: true,
    attendanceAlerts: true,
    announcementUpdates: true,
    systemUpdates: false,
    weeklyReports: true,
    instantNotifications: true,
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

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authService.getProfile();
      const user = response.data || response;
      
      setProfileData({
        firstName: user.first_name || user.firstName || user.name?.split(' ')[0] || 'Teacher',
        lastName: user.last_name || user.lastName || user.name?.split(' ').slice(1).join(' ') || '',
        email: user.email || '',
        phone: user.phone || user.contact_number || '',
        address: user.address || '',
        department: user.department || user.program?.name || 'Department',
        role: user.role || 'Teacher',
        joinDate: user.created_at || user.join_date || '',
        employeeId: user.employee_id || user.id_number || `TEA-${user.id || '001'}`,
        profileImage: user.profile_image || user.avatar || '',
      });
      setProfileImageFile(null);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      // Keep default values
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleProfileChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleProfileImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setProfileImageFile(null);
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setProfileImageFile(file);
    setProfileData((prev) => ({
      ...prev,
      profileImage: previewUrl,
    }));
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const payload = new FormData();
      payload.append('name', `${profileData.firstName} ${profileData.lastName}`.trim());
      payload.append('email', profileData.email || '');
      payload.append('phone', profileData.phone || '');
      payload.append('address', profileData.address || '');

      if (profileImageFile) {
        payload.append('avatar', profileImageFile);
      }

      const response = await authService.updateProfile(payload);
      const updatedUser = response?.user || response?.data?.user;

      if (updatedUser) {
        setProfileData((prev) => ({
          ...prev,
          profileImage: updatedUser.profile_image || updatedUser.avatar || prev.profileImage,
        }));
      }

      setProfileImageFile(null);
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      await Swal.fire({
        title: 'Profile Updated',
        text: 'Your profile information has been saved successfully.',
        icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: '#2563eb',
      });
    } catch (err) {
      console.error('Failed to update profile:', err);
      await Swal.fire({
        title: 'Update Failed',
        text: err?.response?.data?.message || 'Failed to update profile. Please try again.',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#dc2626',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      await Swal.fire({
        title: 'Missing Fields',
        text: 'Please fill in all password fields.',
        icon: 'warning',
        confirmButtonText: 'OK',
        confirmButtonColor: '#f59e0b',
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      await Swal.fire({
        title: 'Password Mismatch',
        text: 'New passwords do not match.',
        icon: 'warning',
        confirmButtonText: 'OK',
        confirmButtonColor: '#f59e0b',
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      await Swal.fire({
        title: 'Weak Password',
        text: 'New password must be at least 8 characters long.',
        icon: 'warning',
        confirmButtonText: 'OK',
        confirmButtonColor: '#f59e0b',
      });
      return;
    }

    setSaving(true);
    try {
      await authService.updatePassword(
        passwordData.currentPassword,
        passwordData.newPassword,
        passwordData.confirmPassword,
      );
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setShowPasswordForm(false);
      setSuccessMessage('Password changed successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      await Swal.fire({
        title: 'Password Updated',
        text: 'Your password has been changed successfully.',
        icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: '#2563eb',
      });
    } catch (err) {
      console.error('Failed to change password:', err);
      await Swal.fire({
        title: 'Password Update Failed',
        text: err?.response?.data?.message || 'Failed to change password. Please check your current password.',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#dc2626',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleNotification = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSaveNotifications = async () => {
    setSuccessMessage('Notification preferences saved!');
    setTimeout(() => setSuccessMessage(''), 3000);
    await Swal.fire({
      title: 'Preferences Saved',
      text: 'Notification preferences have been saved successfully.',
      icon: 'success',
      confirmButtonText: 'OK',
      confirmButtonColor: '#2563eb',
    });
  };

  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="ml-2 text-gray-600">Loading profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
      <main className="flex-1 h-full overflow-y-auto p-8">
        <div className="flex flex-col gap-6">
          <header className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Profile & Settings</h1>
                <p className="text-sm text-gray-600">Manage your personal information and preferences</p>
              </div>
            </div>
          </header>

          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <p className="text-sm text-green-800">{successMessage}</p>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'profile'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
            >
              Profile Information
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'settings'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
            >
              Preferences & Security
            </button>
          </div>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <>
              {/* Profile Picture Section */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Profile Picture</h2>
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <img
                      src={resolveImageUrl(profileData.profileImage) || 'https://via.placeholder.com/96x96?text=User'}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover border-4 border-blue-100"
                    />
                    <label htmlFor="teacher-profile-image" className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors cursor-pointer">
                      <Camera className="w-4 h-4" />
                    </label>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Upload a new profile picture</p>
                    <p className="text-xs text-gray-600 mt-1">JPG, PNG or GIF (max. 2MB)</p>
                    <label
                      htmlFor="teacher-profile-image"
                      className="mt-3 inline-flex px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      Choose File
                    </label>
                    <input
                      id="teacher-profile-image"
                      type="file"
                      accept="image/*"
                      onChange={handleProfileImageChange}
                      className="hidden"
                    />
                    {profileImageFile ? (
                      <>
                        <p className="text-xs text-gray-500 mt-2">Selected: {profileImageFile.name}</p>
                        <button
                          onClick={handleSaveProfile}
                          disabled={saving}
                          className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
                        >
                          {saving ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              Save Photo
                            </>
                          )}
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Personal Information</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                    <input
                      type="text"
                      value={profileData.firstName}
                      onChange={(e) => handleProfileChange('firstName', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    <input
                      type="text"
                      value={profileData.lastName}
                      onChange={(e) => handleProfileChange('lastName', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => handleProfileChange('email', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => handleProfileChange('phone', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                    <input
                      type="text"
                      value={profileData.address}
                      onChange={(e) => handleProfileChange('address', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>

              {/* Employment Information (Read-only) */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-start gap-3 mb-4">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">Employment Information</span> - Contact HR to update role or department
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs text-gray-600 uppercase tracking-wide mb-1">Employee ID</label>
                    <input
                      type="text"
                      value={profileData.employeeId}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 uppercase tracking-wide mb-1">Role</label>
                    <input
                      type="text"
                      value={profileData.role}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 uppercase tracking-wide mb-1">Department</label>
                    <input
                      type="text"
                      value={profileData.department}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 uppercase tracking-wide mb-1">Join Date</label>
                    <input
                      type="text"
                      value={profileData.joinDate}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <>
              {/* Change Password */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-gray-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Security</h2>
                  </div>
                </div>

                {!showPasswordForm ? (
                  <button
                    onClick={() => setShowPasswordForm(true)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Change Password
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={passwordData.currentPassword}
                          onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                          placeholder="Enter current password"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={passwordData.newPassword}
                          onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                          placeholder="Enter new password (min. 8 characters)"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                        placeholder="Confirm new password"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={handleChangePassword}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        Update Password
                      </button>
                      <button
                        onClick={() => setShowPasswordForm(false)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Notification Preferences */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Bell className="w-5 h-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>
                </div>

                <div className="space-y-4 mb-6">
                  {[
                    { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive notifications via email' },
                    { key: 'classReminders', label: 'Class Reminders', description: 'Get reminders before your classes' },
                    { key: 'gradeSubmissionReminders', label: 'Grade Submission Reminders', description: 'Reminders to submit grades' },
                    { key: 'attendanceAlerts', label: 'Attendance Alerts', description: 'Alerts for attendance anomalies' },
                    { key: 'announcementUpdates', label: 'Announcement Updates', description: 'Updates on new announcements' },
                    { key: 'systemUpdates', label: 'System Updates', description: 'Important system notifications' },
                    { key: 'weeklyReports', label: 'Weekly Reports', description: 'Receive weekly activity reports' },
                    { key: 'instantNotifications', label: 'Instant Notifications', description: 'Real-time notifications' },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{item.label}</p>
                        <p className="text-xs text-gray-600">{item.description}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications[item.key]}
                          onChange={() => handleToggleNotification(item.key)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                      </label>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleSaveNotifications}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Save className="w-4 h-4" />
                  Save Preferences
                </button>
              </div>

              {/* Restrictions Info */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-900 mb-2">Restrictions & Limitations</p>
                    <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
                      <li>You cannot change your role. Contact your administrator to request role changes.</li>
                      <li>You cannot edit class assignments. Contact your department head for assignment modifications.</li>
                      <li>All profile changes are logged for security purposes.</li>
                      <li>Password changes take effect immediately and will require you to log in again.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default TeacherProfileSettings;
