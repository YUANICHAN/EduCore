import '../../App.css';
import { useState } from 'react';
import Sidebar from '../../Components/Student/Sidebar.jsx';
import { Shield, Bell, Globe, Moon, Lock, Loader2 } from 'lucide-react';
import authService from '../../service/authService';

function Settings() {
  const [activeItem, setActiveItem] = useState('Settings');
  const [notifications, setNotifications] = useState(true);
  const [theme, setTheme] = useState('light');
  const [saving, setSaving] = useState(false);
  
  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleUpdatePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      alert('Please fill in all password fields');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      alert('New password must be at least 8 characters long');
      return;
    }

    setSaving(true);
    try {
      await authService.changePassword({
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword,
        new_password_confirmation: passwordData.confirmPassword,
      });
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      alert('Password updated successfully!');
    } catch (err) {
      console.error('Failed to change password:', err);
      alert('Failed to update password. Please check your current password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
      <div className="h-screen bg-gray-50 p-8 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-1">Personal preferences. Cannot change academic data.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
            </div>
            <div className="space-y-4">
              <input 
                type="password" 
                placeholder="Current password" 
                value={passwordData.currentPassword}
                onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              />
              <input 
                type="password" 
                placeholder="New password" 
                value={passwordData.newPassword}
                onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              />
              <input 
                type="password" 
                placeholder="Confirm new password" 
                value={passwordData.confirmPassword}
                onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              />
              <button 
                onClick={handleUpdatePassword}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Password'
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-3">For security, academic data cannot be edited here.</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Notification Settings</h2>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">Enable notifications</p>
                <p className="text-xs text-gray-600">Announcements, attendance, grades</p>
              </div>
              <button
                onClick={() => setNotifications(!notifications)}
                className={`px-3 py-1 rounded-full border font-semibold text-xs ${
                  notifications ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 text-gray-700 border-gray-200'
                }`}
              >
                {notifications ? 'On' : 'Off'}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">Theme</p>
                <p className="text-xs text-gray-600">Light / Dark</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTheme('light')}
                  className={`px-3 py-1 rounded-full border text-xs font-semibold ${
                    theme === 'light' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 text-gray-700 border-gray-200'
                  }`}
                >
                  Light
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`px-3 py-1 rounded-full border text-xs font-semibold ${
                    theme === 'dark' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 text-gray-700 border-gray-200'
                  }`}
                >
                  Dark
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between opacity-70">
              <div>
                <p className="text-sm font-semibold text-gray-900">Language</p>
                <p className="text-xs text-gray-600">Coming soon</p>
              </div>
              <button className="px-3 py-1 rounded-full border text-xs font-semibold bg-gray-100 text-gray-500 border-gray-200" disabled>
                Future
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
