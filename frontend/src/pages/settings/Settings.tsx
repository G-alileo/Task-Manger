import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Shield,
  // Mail,
  // Lock,
  Save,
  Check,
  Camera,
  Upload,
  Trash2,
  AlertCircle,
  // Eye,
  // EyeOff,
  LogOut
} from 'lucide-react';
import { Sidebar } from '../../components/Sidebar';
import { useAuth } from '../../contexts/AuthContext';

type SettingsTab = 'profile' | 'security';

export default function Settings() {
  const { user, updateProfile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const profileSettingsRef = useRef<any>(null);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (activeTab === 'profile' && profileSettingsRef.current?.saveProfile) {
        await profileSettingsRef.current.saveProfile();
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error: any) {
      console.error('Failed to save:', error);
      alert(error.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'security' as const, label: 'Security', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1f1c2c] via-[#2d2840] to-[#928dab] flex">
      <Sidebar />
      
      <div className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
            <p className="text-gray-400">Manage your account and preferences</p>
          </div>

          <div className="flex gap-6">
            {/* Tabs Sidebar */}
            <div className="w-64 shrink-0">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl sticky top-8">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-2 ${
                        activeTab === tab.id
                          ? 'bg-[#6b668c] text-white'
                          : 'text-gray-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <Icon size={20} />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-xl">
                {activeTab === 'profile' && (
                  <ProfileSettings ref={profileSettingsRef} user={user} updateProfile={updateProfile} />
                )}
                
                {activeTab === 'security' && (
                  <SecuritySettings logout={logout} />
                )}

                {/* Save Button - Only show for profile tab */}
                {activeTab === 'profile' && (
                  <div className="flex items-center gap-4 pt-6 border-t border-white/10 mt-8">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#6b668c] to-[#928dab] hover:from-[#928dab] hover:to-[#6b668c] rounded-xl text-white font-medium transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save size={18} />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    
                    {saved && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2 text-green-400"
                      >
                        <Check size={18} />
                        <span>Saved successfully!</span>
                      </motion.div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Profile Settings Component
const ProfileSettings = React.forwardRef(({ user, updateProfile }: { user: any; updateProfile: any }, ref) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileImage, setProfileImage] = useState<string | null>(user?.profile_picture || null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    bio: user?.bio || '',
  });

  React.useImperativeHandle(ref, () => ({
    async saveProfile() {
      try {
        await updateProfile(formData);
      } catch (error) {
        console.error('Failed to save profile:', error);
        throw error;
      }
    }
  }));

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        alert('File size must be less than 2MB');
        return;
      }

      setUploading(true);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageDataUrl = e.target?.result as string;
        setProfileImage(imageDataUrl);
        
        try {
          const authService = (await import('../../services/authService')).default;
          await authService.updateProfile({ profile_picture: imageDataUrl });
          setUploading(false);
        } catch (error) {
          console.error('Failed to upload profile picture:', error);
          alert('Failed to upload profile picture. Please try again.');
          setProfileImage(user?.profile_picture || null);
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = async () => {
    try {
      const authService = (await import('../../services/authService')).default;
      await authService.updateProfile({ profile_picture: '' });
      setProfileImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Failed to remove profile picture:', error);
      alert('Failed to remove profile picture. Please try again.');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">
        Profile Information
      </h2>

      <div className="space-y-6">
        {/* Profile Picture */}
        <div className="pb-6 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">
            Profile Picture
          </h3>
          <div className="flex items-start gap-6">
            <div className="relative group">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover border-4 border-white/10 shadow-xl"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-[#6b668c] to-[#928dab] flex items-center justify-center text-white text-4xl font-bold shadow-xl border-4 border-white/10">
                  {user?.full_name?.charAt(0).toUpperCase() ||
                    user?.username?.charAt(0).toUpperCase() ||
                    "U"}
                </div>
              )}

              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Camera size={32} className="text-white" />
              </button>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2 bg-[#6b668c] hover:bg-[#928dab] text-white rounded-xl transition-all disabled:opacity-50"
                >
                  <Upload size={18} />
                  {uploading ? "Uploading..." : "Upload Photo"}
                </button>

                {profileImage && (
                  <button
                    onClick={handleRemoveImage}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500 border border-red-500/30 hover:border-red-500 text-red-400 hover:text-white rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                    Remove
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-400 mb-1">
                Allowed: JPG, PNG, GIF
              </p>
              <p className="text-sm text-gray-400">Max: 2MB</p>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">
            Basic Information
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="profile-first-name"
                  className="block text-sm font-semibold text-gray-400 mb-2 uppercase"
                >
                  First Name
                </label>
                <input
                  type="text"
                  id="profile-first-name"
                  name="first_name"
                  autoComplete="given-name"
                  value={formData.first_name}
                  onChange={(e) =>
                    handleInputChange("first_name", e.target.value)
                  }
                  placeholder="Enter first name"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6b668c] transition-all"
                />
              </div>

              <div>
                <label
                  htmlFor="profile-last-name"
                  className="block text-sm font-semibold text-gray-400 mb-2 uppercase"
                >
                  Last Name
                </label>
                <input
                  type="text"
                  id="profile-last-name"
                  name="last_name"
                  autoComplete="family-name"
                  value={formData.last_name}
                  onChange={(e) =>
                    handleInputChange("last_name", e.target.value)
                  }
                  placeholder="Enter last name"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6b668c] transition-all"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="profile-email"
                className="block text-sm font-semibold text-gray-400 mb-2 uppercase"
              >
                Email
              </label>
              <input
                type="email"
                id="profile-email"
                name="email"
                autoComplete="email"
                value={user?.email || ""}
                disabled
                aria-readonly="true"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white opacity-50 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">
                Email cannot be changed
              </p>
            </div>

            <div>
              <label
                htmlFor="profile-username"
                className="block text-sm font-semibold text-gray-400 mb-2 uppercase"
              >
                Username
              </label>
              <input
                type="text"
                id="profile-username"
                name="username"
                autoComplete="username"
                value={user?.username || ""}
                disabled
                aria-readonly="true"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white opacity-50 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">
                Username cannot be changed
              </p>
            </div>

            <div>
              <label
                htmlFor="profile-bio"
                className="block text-sm font-semibold text-gray-400 mb-2 uppercase"
              >
                Bio
              </label>
              <textarea
                id="profile-bio"
                name="bio"
                autoComplete="off"
                value={formData.bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                placeholder="Tell us about yourself..."
                rows={4}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6b668c] transition-all resize-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

ProfileSettings.displayName = 'ProfileSettings';

// Security Settings Component
function SecuritySettings({ logout }: { logout: () => void }) {
  const handleLogoutAll = () => {
    if (confirm('This will log you out from this device. Continue?')) {
      logout();
    }
  };

  const handleDeleteAccount = () => {
    if (confirm('⚠️ WARNING: This will permanently delete your account and all data!\n\nThis action CANNOT be undone. Are you absolutely sure?')) {
      if (confirm('Final confirmation required.\n\nType "DELETE" to proceed would normally be required.\n\nContinue?')) {
        alert('Account deletion functionality will be available in a future update.');
      }
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Security</h2>
      
      <div className="space-y-6">
        {/* Account Info */}
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-blue-400 mt-0.5" />
            <div>
              <p className="font-semibold text-white mb-1">Password Management</p>
              <p className="text-sm text-gray-400">
                Password change functionality will be added in a future update. 
                Please contact support if you need to reset your password.
              </p>
            </div>
          </div>
        </div>

        {/* Active Session */}
        <div className="pb-6 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Shield size={20} className="text-[#928dab]" />
            Active Session
          </h3>
          
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-white mb-1">Current Device</p>
                <p className="text-sm text-gray-400">You are currently logged in on this device</p>
              </div>
              <button
                onClick={handleLogoutAll}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-sm transition-all"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="pt-6 border-t border-white/10">
          <h3 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h3>
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="font-semibold text-white mb-2">Delete Account</p>
            <p className="text-sm text-gray-400 mb-4">
              Permanently delete your account, all tasks, and data. This action cannot be undone.
            </p>
            <button
              onClick={handleDeleteAccount}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500 border border-red-500/30 hover:border-red-500 rounded-lg text-red-400 hover:text-white text-sm transition-all"
            >
              Delete My Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
