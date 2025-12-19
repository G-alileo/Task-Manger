import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Shield,
  Mail,
  Lock,
  Save,
  Check,
  Camera,
  Upload,
  Trash2,
  AlertCircle,
  Eye,
  EyeOff
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
  const securitySettingsRef = useRef<any>(null);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (activeTab === 'profile' && profileSettingsRef.current?.saveProfile) {
        await profileSettingsRef.current.saveProfile();
      } else if (activeTab === 'security' && securitySettingsRef.current?.savePassword) {
        await securitySettingsRef.current.savePassword();
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
                  <SecuritySettings ref={securitySettingsRef} logout={logout} />
                )}

                {/* Save Button */}
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
                      <span>Settings saved successfully!</span>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const ProfileSettings = React.forwardRef(({ user, updateProfile }: { user: any; updateProfile: any }, ref) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileImage, setProfileImage] = useState<string | null>(user?.profile_picture || null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    bio: user?.bio || '',
  });

  // Expose save method to parent
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
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (max 2MB for base64 storage)
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
          // Upload to backend
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
      <h2 className="text-2xl font-bold text-white mb-6">Profile Information</h2>
      
      <div className="space-y-6">
        {/* Profile Picture Section */}
        <div className="pb-6 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Profile Picture</h3>
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
                  {user?.full_name?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              
              {/* Upload overlay */}
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
                  {uploading ? 'Uploading...' : 'Upload Photo'}
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
                Allowed formats: JPG, PNG, GIF
              </p>
              <p className="text-sm text-gray-400">
                Max file size: 5MB
              </p>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="First Name"
                value={formData.first_name}
                icon={User}
                placeholder="Enter first name"
                onChange={(value) => handleInputChange('first_name', value)}
              />
              
              <FormField
                label="Last Name"
                value={formData.last_name}
                icon={User}
                placeholder="Enter last name"
                onChange={(value) => handleInputChange('last_name', value)}
              />
            </div>
            
            <FormField
              label="Email Address"
              value={user?.email || ''}
              icon={Mail}
              type="email"
              placeholder="your.email@example.com"
              disabled
            />
            
            <FormField
              label="Username"
              value={user?.username || ''}
              icon={User}
              disabled
              placeholder="username"
            />

            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2 uppercase">Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6b668c] transition-all resize-none"
                rows={4}
                placeholder="Tell us about yourself..."
              />
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="pt-6 border-t border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Additional Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Phone Number"
              type="tel"
              placeholder="+1 (555) 000-0000"
            />
            <FormField
              label="Location"
              placeholder="City, Country"
            />
          </div>
        </div>
      </div>
    </div>
  );
});

ProfileSettings.displayName = 'ProfileSettings';

function NotificationSettings({ settings, setSettings }: any) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Notification Preferences</h2>
      
      <div className="space-y-6">
        <div className="pb-6 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Bell size={20} className="text-[#928dab]" />
            Notification Channels
          </h3>
          
          <ToggleField
            label="Email Notifications"
            description="Receive notifications via email"
            checked={settings.emailNotifications}
            onChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
          />
          
          <ToggleField
            label="Push Notifications"
            description="Receive browser push notifications"
            checked={settings.pushNotifications}
            onChange={(checked) => setSettings({ ...settings, pushNotifications: checked })}
          />
          
          <ToggleField
            label="Sound Effects"
            description="Play sounds for notifications"
            checked={settings.soundEnabled}
            onChange={(checked) => setSettings({ ...settings, soundEnabled: checked })}
            icon={settings.soundEnabled ? Volume2 : VolumeX}
          />
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock size={20} className="text-[#928dab]" />
            Notification Types
          </h3>
          
          <ToggleField
            label="Task Reminders"
            description="Get reminded about upcoming task deadlines"
            checked={settings.taskReminders}
            onChange={(checked) => setSettings({ ...settings, taskReminders: checked })}
          />
          
          <ToggleField
            label="Weekly Digest"
            description="Receive a weekly summary of your tasks"
            checked={settings.weeklyDigest}
            onChange={(checked) => setSettings({ ...settings, weeklyDigest: checked })}
          />
        </div>

        <div className="pt-6 border-t border-white/10">
          <label className="block text-sm font-semibold text-gray-400 mb-2 uppercase">
            Default Reminder Time
          </label>
          <input
            type="time"
            value={settings.reminderTime}
            onChange={(e) => setSettings({ ...settings, reminderTime: e.target.value })}
            className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#6b668c] transition-all"
          />
        </div>
      </div>
    </div>
  );
}

function PreferencesSettings({ settings, setSettings }: any) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">App Preferences</h2>
      
      <div className="space-y-6">
        <div className="pb-6 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Palette size={20} className="text-[#928dab]" />
            Appearance
          </h3>
          
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-400 mb-2 uppercase">Theme</label>
            <div className="flex gap-3">
              <button
                onClick={() => setSettings({ ...settings, theme: 'dark' })}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${
                  settings.theme === 'dark'
                    ? 'bg-[#6b668c] border-[#6b668c] text-white'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                }`}
              >
                <Moon size={18} />
                Dark
              </button>
              <button
                onClick={() => setSettings({ ...settings, theme: 'light' })}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${
                  settings.theme === 'light'
                    ? 'bg-[#6b668c] border-[#6b668c] text-white'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                }`}
              >
                <Sun size={18} />
                Light
              </button>
            </div>
          </div>
        </div>

        <div className="pb-6 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar size={20} className="text-[#928dab]" />
            Date & Time
          </h3>
          
          <SelectField
            label="Date Format"
            value={settings.dateFormat}
            onChange={(value) => setSettings({ ...settings, dateFormat: value })}
            options={[
              { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
              { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
              { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' }
            ]}
          />
          
          <SelectField
            label="Time Format"
            value={settings.timeFormat}
            onChange={(value) => setSettings({ ...settings, timeFormat: value })}
            options={[
              { value: '12h', label: '12-hour (AM/PM)' },
              { value: '24h', label: '24-hour' }
            ]}
          />
          
          <SelectField
            label="First Day of Week"
            value={settings.firstDayOfWeek}
            onChange={(value) => setSettings({ ...settings, firstDayOfWeek: value })}
            options={[
              { value: 'sunday', label: 'Sunday' },
              { value: 'monday', label: 'Monday' }
            ]}
          />
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock size={20} className="text-[#928dab]" />
            Task Defaults
          </h3>
          
          <SelectField
            label="Default Priority"
            value={settings.defaultPriority}
            onChange={(value) => setSettings({ ...settings, defaultPriority: value })}
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
              { value: 'urgent', label: 'Urgent' }
            ]}
          />
          
          <SelectField
            label="Default Status"
            value={settings.defaultStatus}
            onChange={(value) => setSettings({ ...settings, defaultStatus: value })}
            options={[
              { value: 'todo', label: 'To Do' },
              { value: 'in_progress', label: 'In Progress' }
            ]}
          />
          
          <SelectField
            label="Tasks Per Page"
            value={settings.tasksPerPage.toString()}
            onChange={(value) => setSettings({ ...settings, tasksPerPage: parseInt(value) })}
            options={[
              { value: '10', label: '10' },
              { value: '20', label: '20' },
              { value: '50', label: '50' },
              { value: '100', label: '100' }
            ]}
          />
          
          <ToggleField
            label="Auto-archive Completed Tasks"
            description="Automatically archive tasks after 30 days of completion"
            checked={settings.autoArchive}
            onChange={(checked) => setSettings({ ...settings, autoArchive: checked })}
          />
        </div>
      </div>
    </div>
  );
}

function SecuritySettings() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Security Settings</h2>
      
      <div className="space-y-6">
        <div className="pb-6 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Lock size={20} className="text-[#928dab]" />
            Change Password
          </h3>
          
          <div className="space-y-4">
            <FormField
              label="Current Password"
              type="password"
              icon={Lock}
            />
            <FormField
              label="New Password"
              type="password"
              icon={Lock}
            />
            <FormField
              label="Confirm New Password"
              type="password"
              icon={Lock}
            />
            
            <button className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white transition-all font-medium">
              Update Password
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Shield size={20} className="text-[#928dab]" />
            Account Security
          </h3>
          
          <div className="space-y-4">
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-white mb-1">Two-Factor Authentication</p>
                  <p className="text-sm text-gray-400">Add an extra layer of security to your account</p>
                </div>
                <button className="px-4 py-2 bg-[#6b668c] hover:bg-[#928dab] rounded-lg text-white text-sm transition-all">
                  Enable
                </button>
              </div>
            </div>
            
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-white mb-1">Active Sessions</p>
                  <p className="text-sm text-gray-400">Manage devices where you're currently logged in</p>
                </div>
                <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-sm transition-all">
                  View
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-white/10">
          <h3 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h3>
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="font-semibold text-white mb-2">Delete Account</p>
            <p className="text-sm text-gray-400 mb-4">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <button className="px-4 py-2 bg-red-500/20 hover:bg-red-500 border border-red-500/30 hover:border-red-500 rounded-lg text-red-400 hover:text-white text-sm transition-all">
              Delete My Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormField({
  label,
  value,
  icon: Icon,
  type = 'text',
  disabled = false,
  placeholder,
  onChange
}: {
  label: string;
  value?: string;
  icon?: React.ElementType;
  type?: string;
  disabled?: boolean;
  placeholder?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-400 mb-2 uppercase">{label}</label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        )}
        <input
          type={type}
          value={value}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full ${Icon ? 'pl-12' : 'pl-4'} pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6b668c] transition-all ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        />
      </div>
    </div>
  );
}

function ToggleField({
  label,
  description,
  checked,
  onChange,
  icon: Icon
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon?: React.ElementType;
}) {
  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-start gap-3 flex-1">
        {Icon && <Icon size={20} className="text-gray-400 mt-1" />}
        <div>
          <p className="font-medium text-white">{label}</p>
          <p className="text-sm text-gray-400">{description}</p>
        </div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-14 h-7 rounded-full transition-colors ${
          checked ? 'bg-[#6b668c]' : 'bg-white/10'
        }`}
      >
        <div
          className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-7' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-gray-400 mb-2 uppercase">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#6b668c] focus:border-[#928dab] transition-all appearance-none cursor-pointer hover:bg-white/10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23928dab'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 0.75rem center',
            backgroundSize: '1.25rem'
          }}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-[#2A2A2A] text-white">
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
