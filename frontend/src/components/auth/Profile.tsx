import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Edit2,
  Save,
  X,
  Camera,
  Loader,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

export default function Profile() {
  const { user, updateProfile, loading: authLoading } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    bio: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        username: user.username || "",
        bio: user.bio || "",
      });
    }
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await updateProfile(formData);
      setSuccess("Profile updated successfully!");
      setIsEditing(false);

      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.username?.[0] ||
        "Failed to update profile. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        username: user.username || "",
        bio: user.bio || "",
      });
    }
    setIsEditing(false);
    setError("");
  };

  if (authLoading || !user) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background:
            "linear-gradient(135deg, #1f1c2c 0%, #2d2840 50%, #928dab 100%)",
        }}
      >
        <Loader className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen px-4 py-12 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #1f1c2c 0%, #2d2840 50%, #928dab 100%)",
      }}
    >
      {/* Ambient Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-purple-600/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-[140px]" />
      </div>

      <div className="max-w-2xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
            <p className="text-gray-300">Manage your account information</p>
          </div>

          {/* Success Message */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3"
            >
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              <p className="text-green-400 font-medium">{success}</p>
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </motion.div>
          )}

          {/* Profile Card */}
          <div className="backdrop-blur-xl bg-white/5 rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
            {/* Profile Header with Avatar */}
            <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 p-8 text-center relative">
              <div className="relative inline-block">
                <div
                  className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 
                              flex items-center justify-center text-white text-3xl font-bold shadow-lg"
                >
                  {user.first_name
                    ? user.first_name[0].toUpperCase()
                    : user.username[0].toUpperCase()}
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-purple-500 rounded-full 
                           flex items-center justify-center text-white shadow-lg hover:bg-purple-600 
                           transition-colors"
                  title="Change avatar"
                >
                  <Camera className="w-4 h-4" />
                </motion.button>
              </div>

              <h2 className="mt-4 text-2xl font-bold text-white">
                {user.first_name || user.last_name
                  ? `${user.first_name} ${user.last_name}`.trim()
                  : user.username}
              </h2>
              <p className="text-gray-300 mt-1">{user.email}</p>

              {(user as any).date_joined && (
                <p className="text-gray-400 text-sm mt-2">
                  Member since{" "}
                  {new Date((user as any).date_joined).toLocaleDateString(
                    "en-US",
                    {
                      month: "long",
                      year: "numeric",
                    }
                  )}
                </p>
              )}
            </div>

            {/* Profile Form */}
            <div className="p-8">
              {/* Edit Toggle Button */}
              <div className="flex justify-end mb-6">
                {!isEditing ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-400 
                             rounded-lg border border-purple-400/20 hover:bg-purple-500/30 
                             transition-all font-medium"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Profile
                  </motion.button>
                ) : (
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCancel}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-500/20 text-gray-400 
                               rounded-lg border border-gray-400/20 hover:bg-gray-500/30 
                               transition-all font-medium"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </motion.button>
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="first_name"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      First Name
                    </label>
                    <div className="relative">
                      <User
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
                        aria-hidden="true"
                      />
                      <input
                        type="text"
                        id="first_name"
                        name="first_name"
                        autoComplete="given-name"
                        value={formData.first_name}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg 
                                 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400/50 
                                 focus:ring-2 focus:ring-purple-400/20 transition-all
                                 disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="John"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="last_name"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      Last Name
                    </label>
                    <div className="relative">
                      <User
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
                        aria-hidden="true"
                      />
                      <input
                        type="text"
                        id="last_name"
                        name="last_name"
                        autoComplete="family-name"
                        value={formData.last_name}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg 
                                 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400/50 
                                 focus:ring-2 focus:ring-purple-400/20 transition-all
                                 disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                </div>

                {/* Email (Read-only) */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
                      aria-hidden="true"
                    />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      autoComplete="email"
                      value={user.email}
                      disabled
                      aria-readonly="true"
                      className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg 
                               text-gray-400 cursor-not-allowed opacity-50"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    Email cannot be changed
                  </p>
                </div>

                {/* Username */}
                <div>
                  <label
                    htmlFor="username"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Username
                  </label>
                  <div className="relative">
                    <User
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
                      aria-hidden="true"
                    />
                    <input
                      type="text"
                      id="username"
                      name="username"
                      autoComplete="username"
                      value={formData.username}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg 
                               text-white placeholder-gray-400 focus:outline-none focus:border-purple-400/50 
                               focus:ring-2 focus:ring-purple-400/20 transition-all
                               disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="johndoe"
                    />
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label
                    htmlFor="bio"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    disabled={!isEditing}
                    rows={4}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg 
                             text-white placeholder-gray-400 focus:outline-none focus:border-purple-400/50 
                             focus:ring-2 focus:ring-purple-400/20 transition-all resize-none
                             disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Tell us about yourself..."
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    {formData.bio.length}/500 characters
                  </p>
                </div>

                {/* Save Button */}
                {isEditing && (
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                    className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-blue-500 
                             text-white font-semibold rounded-lg shadow-lg hover:shadow-purple-500/50 
                             transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                             flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Saving changes...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Save Changes
                      </>
                    )}
                  </motion.button>
                )}
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
