import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  User,
  Loader,
  AlertCircle,
  CheckCircle,
  UserPlus,
  Sparkles,
} from "lucide-react";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    password_confirm: "",
    first_name: "",
    last_name: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "password") {
      calculatePasswordStrength(value);
    }
  };

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;
    setPasswordStrength(strength);
  };

  const getPasswordStrengthColor = () => {
    const colors = ["#ef4444", "#f59e0b", "#eab308", "#22c55e"];
    return colors[passwordStrength - 1] || "#ef4444";
  };

  const getPasswordStrengthText = () => {
    const texts = ["Weak", "Fair", "Good", "Strong"];
    return texts[passwordStrength - 1] || "Too weak";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.password_confirm) {
      setError("Passwords do not match");
      return;
    }

    if (passwordStrength < 2) {
      setError(
        "Password is too weak. Use a combination of uppercase, lowercase, numbers and symbols."
      );
      return;
    }

    setLoading(true);

    try {
      await register(formData);
      setSuccess(true);

      // Redirect to dashboard after 1.5 seconds
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (err: any) {
      // Handle backend validation errors
      const errors = err.response?.data?.errors;
      let errorMessage = "Registration failed. Please try again.";

      if (errors) {
        // Extract first error from the errors object
        if (errors.password) {
          errorMessage = Array.isArray(errors.password)
            ? errors.password[0]
            : errors.password;
        } else if (errors.email) {
          errorMessage = Array.isArray(errors.email)
            ? errors.email[0]
            : errors.email;
        } else if (errors.username) {
          errorMessage = Array.isArray(errors.username)
            ? errors.username[0]
            : errors.username;
        } else if (errors.password_confirm) {
          errorMessage = Array.isArray(errors.password_confirm)
            ? errors.password_confirm[0]
            : errors.password_confirm;
        } else {
          // Get first error from any field
          const firstErrorKey = Object.keys(errors)[0];
          const firstError = errors[firstErrorKey];
          errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
        }
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#1f1c2c] via-[#2d2840] to-[#928dab] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-purple-600/10 blur-[140px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-lg relative z-10"
      >
        {/* Glassmorphic Card */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] overflow-hidden">
          {/* Decorative Top Border */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#928dab] to-transparent opacity-50" />

          <div className="p-8 md:p-10">
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#928dab] to-[#6b668c] flex items-center justify-center shadow-lg shadow-purple-500/30"
              >
                <UserPlus className="text-white" size={28} />
              </motion.div>

              <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
                Create Account
              </h1>
              <p className="text-gray-400 text-sm">
                Join Quid and start managing your tasks
              </p>
            </div>

            {/* Success Message */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3"
              >
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <div>
                  <p className="text-green-400 font-medium">
                    Registration successful!
                  </p>
                  <p className="text-green-300/70 text-sm">
                    Redirecting to dashboard...
                  </p>
                </div>
              </motion.div>
            )}

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm flex-1">{error}</p>
              </motion.div>
            )}

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name Fields Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="first_name"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    First Name
                  </label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-[#928dab] transition-colors w-5 h-5" />
                    <input
                      type="text"
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl 
                               text-white placeholder-gray-500 focus:outline-none focus:border-[#928dab]/50 
                               focus:ring-2 focus:ring-[#928dab]/20 transition-all hover:bg-white/[0.07]"
                      placeholder="John"
                      required
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
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-[#928dab] transition-colors w-5 h-5" />
                    <input
                      type="text"
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl 
                               text-white placeholder-gray-500 focus:outline-none focus:border-[#928dab]/50 
                               focus:ring-2 focus:ring-[#928dab]/20 transition-all hover:bg-white/[0.07]"
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-[#928dab] transition-colors w-5 h-5" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl 
                             text-white placeholder-gray-500 focus:outline-none focus:border-[#928dab]/50 
                             focus:ring-2 focus:ring-[#928dab]/20 transition-all hover:bg-white/[0.07]"
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>

              {/* Username Field */}
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Username
                </label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-[#928dab] transition-colors w-5 h-5" />
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl 
                             text-white placeholder-gray-500 focus:outline-none focus:border-[#928dab]/50 
                             focus:ring-2 focus:ring-[#928dab]/20 transition-all hover:bg-white/[0.07]"
                    placeholder="johndoe"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-[#928dab] transition-colors w-5 h-5" />
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl 
                             text-white placeholder-gray-500 focus:outline-none focus:border-[#928dab]/50 
                             focus:ring-2 focus:ring-[#928dab]/20 transition-all hover:bg-white/[0.07]"
                    placeholder="••••••••"
                    required
                  />
                </div>

                {/* Password Strength Indicator */}
                {formData.password && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-2.5"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className="h-1.5 flex-1 rounded-full transition-all duration-300"
                          style={{
                            backgroundColor:
                              level <= passwordStrength
                                ? getPasswordStrengthColor()
                                : "rgba(255,255,255,0.1)",
                          }}
                        />
                      ))}
                    </div>
                    <p
                      className="text-xs font-medium"
                      style={{ color: getPasswordStrengthColor() }}
                    >
                      Password strength: {getPasswordStrengthText()}
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label
                  htmlFor="password_confirm"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Confirm Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-[#928dab] transition-colors w-5 h-5" />
                  <input
                    type="password"
                    id="password_confirm"
                    name="password_confirm"
                    value={formData.password_confirm}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl 
                             text-white placeholder-gray-500 focus:outline-none focus:border-[#928dab]/50 
                             focus:ring-2 focus:ring-[#928dab]/20 transition-all hover:bg-white/[0.07]"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={loading || success}
                whileHover={{ scale: loading || success ? 1 : 1.02 }}
                whileTap={{ scale: loading || success ? 1 : 0.98 }}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-[#6b668c] to-[#928dab] 
                         text-white font-semibold rounded-xl shadow-lg hover:shadow-[#928dab]/30 
                         transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2 mt-6"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Creating account...
                  </>
                ) : success ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Account created!
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Create Account
                  </>
                )}
              </motion.button>
            </form>

            {/* Footer Links */}
            <div className="mt-6 text-center">
              <p className="text-gray-400 text-sm">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-[#928dab] hover:text-[#6b668c] font-medium transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Terms Notice */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center text-gray-400 text-xs px-4"
        >
          By creating an account, you agree to our{" "}
          <a
            href="/terms"
            className="text-[#928dab] hover:text-[#6b668c] transition-colors"
          >
            Terms of Service
          </a>{" "}
          and{" "}
          <a
            href="/privacy"
            className="text-[#928dab] hover:text-[#6b668c] transition-colors"
          >
            Privacy Policy
          </a>
        </motion.p>
      </motion.div>
    </div>
  );
}
