import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  User,
  Loader,
  AlertCircle,
  CheckCircle,
  UserPlus,
  Sparkles,
  X,
  Check,
} from "lucide-react";

interface FieldError {
  field: string;
  message: string;
}

interface PasswordRequirement {
  met: boolean;
  label: string;
  description: string;
}

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
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
  const [success, setSuccess] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Password requirements state
  const [passwordRequirements, setPasswordRequirements] = useState<
    PasswordRequirement[]
  >([
    {
      met: false,
      label: "8+ characters",
      description: "At least 8 characters long",
    },
    {
      met: false,
      label: "Uppercase & lowercase",
      description: "Mix of upper and lowercase letters",
    },
    { met: false, label: "Numbers", description: "At least one number" },
    {
      met: false,
      label: "Special characters",
      description: "At least one special character (!@#$%^&*)",
    },
  ]);

  // Real-time password validation
  useEffect(() => {
    if (formData.password) {
      const password = formData.password;
      setPasswordRequirements([
        {
          met: password.length >= 8,
          label: "8+ characters",
          description: "At least 8 characters long",
        },
        {
          met: /[a-z]/.test(password) && /[A-Z]/.test(password),
          label: "Uppercase & lowercase",
          description: "Mix of upper and lowercase letters",
        },
        {
          met: /\d/.test(password),
          label: "Numbers",
          description: "At least one number",
        },
        {
          met: /[^a-zA-Z\d]/.test(password),
          label: "Special characters",
          description: "At least one special character (!@#$%^&*)",
        },
      ]);
    } else {
      setPasswordRequirements([
        {
          met: false,
          label: "8+ characters",
          description: "At least 8 characters long",
        },
        {
          met: false,
          label: "Uppercase & lowercase",
          description: "Mix of upper and lowercase letters",
        },
        { met: false, label: "Numbers", description: "At least one number" },
        {
          met: false,
          label: "Special characters",
          description: "At least one special character (!@#$%^&*)",
        },
      ]);
    }
  }, [formData.password]);

  // Real-time password match validation
  useEffect(() => {
    if (touched.password_confirm && formData.password_confirm) {
      if (formData.password !== formData.password_confirm) {
        setFieldErrors((prev) => {
          const filtered = prev.filter((e) => e.field !== "password_confirm");
          return [
            ...filtered,
            { field: "password_confirm", message: "Passwords do not match" },
          ];
        });
      } else {
        setFieldErrors((prev) =>
          prev.filter((e) => e.field !== "password_confirm")
        );
      }
    }
  }, [formData.password, formData.password_confirm, touched.password_confirm]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear field-specific error when user starts typing
    setFieldErrors((prev) => prev.filter((err) => err.field !== name));

    // Real-time username validation
    if (name === "username" && value) {
      if (value.includes(" ")) {
        setFieldErrors((prev) => {
          const filtered = prev.filter((e) => e.field !== "username");
          return [
            ...filtered,
            { field: "username", message: "Username cannot contain spaces" },
          ];
        });
      } else if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
        setFieldErrors((prev) => {
          const filtered = prev.filter((e) => e.field !== "username");
          return [
            ...filtered,
            {
              field: "username",
              message:
                "Username can only contain letters, numbers, underscores, and hyphens",
            },
          ];
        });
      } else if (value.length < 3) {
        setFieldErrors((prev) => {
          const filtered = prev.filter((e) => e.field !== "username");
          return [
            ...filtered,
            {
              field: "username",
              message: "Username must be at least 3 characters",
            },
          ];
        });
      }
    }
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const getFieldError = (field: string): string | null => {
    const error = fieldErrors.find((e) => e.field === field);
    return error ? error.message : null;
  };

  const hasFieldError = (field: string): boolean => {
    return fieldErrors.some((e) => e.field === field);
  };

  const getPasswordStrength = (): number => {
    return passwordRequirements.filter((req) => req.met).length;
  };

  const getPasswordStrengthColor = (): string => {
    const strength = getPasswordStrength();
    const colors = ["#ef4444", "#f59e0b", "#eab308", "#22c55e"];
    return colors[strength - 1] || "#ef4444";
  };

  const getPasswordStrengthText = (): string => {
    const strength = getPasswordStrength();
    const texts = ["Weak", "Fair", "Good", "Strong"];
    return texts[strength - 1] || "Too weak";
  };

  const validateForm = (): boolean => {
    const errors: FieldError[] = [];

    // Check all required fields
    if (!formData.first_name.trim()) {
      errors.push({ field: "first_name", message: "First name is required" });
    }
    if (!formData.last_name.trim()) {
      errors.push({ field: "last_name", message: "Last name is required" });
    }
    if (!formData.email.trim()) {
      errors.push({ field: "email", message: "Email is required" });
    }
    if (!formData.username.trim()) {
      errors.push({ field: "username", message: "Username is required" });
    } else {
      // Username format validation
      if (formData.username.includes(" ")) {
        errors.push({
          field: "username",
          message: "Username cannot contain spaces",
        });
      } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
        errors.push({
          field: "username",
          message:
            "Username can only contain letters, numbers, underscores, and hyphens",
        });
      } else if (formData.username.length < 3) {
        errors.push({
          field: "username",
          message: "Username must be at least 3 characters",
        });
      } else if (formData.username.length > 150) {
        errors.push({
          field: "username",
          message: "Username must be less than 150 characters",
        });
      }
    }
    if (!formData.password) {
      errors.push({ field: "password", message: "Password is required" });
    }
    if (!formData.password_confirm) {
      errors.push({
        field: "password_confirm",
        message: "Please confirm your password",
      });
    }

    // Password match check
    if (
      formData.password &&
      formData.password_confirm &&
      formData.password !== formData.password_confirm
    ) {
      errors.push({
        field: "password_confirm",
        message: "Passwords do not match",
      });
    }

    // Password strength check
    const unmetRequirements = passwordRequirements.filter((req) => !req.met);
    if (unmetRequirements.length > 0) {
      errors.push({
        field: "password",
        message: `Password must meet all requirements: ${unmetRequirements
          .map((r) => r.label)
          .join(", ")}`,
      });
    }

    setFieldErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      first_name: true,
      last_name: true,
      email: true,
      username: true,
      password: true,
      password_confirm: true,
    });

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await register(formData);
      setSuccess(true);

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (err: any) {
      // Handle backend validation errors
      const errors = err.response?.data?.errors;
      const newErrors: FieldError[] = [];

      if (errors) {
        // Map backend errors to field errors
        Object.keys(errors).forEach((field) => {
          const errorMessages = errors[field];
          const message = Array.isArray(errorMessages)
            ? errorMessages[0]
            : errorMessages;

          // Add helpful context to common errors
          let enhancedMessage = message;
          if (field === "password") {
            if (message.includes("numeric")) {
              enhancedMessage =
                "Password cannot be entirely numeric. Please include letters and special characters.";
            } else if (message.includes("common")) {
              enhancedMessage =
                "This password is too common. Please choose a more unique password.";
            } else if (message.includes("short")) {
              enhancedMessage =
                "Password is too short. Please use at least 8 characters.";
            }
          } else if (field === "email") {
            if (message.includes("already exists")) {
              enhancedMessage =
                "This email is already registered. Try logging in or use a different email.";
            }
          } else if (field === "username") {
            if (message.includes("already exists")) {
              enhancedMessage =
                "This username is taken. Please choose a different username.";
            } else if (
              message.includes("valid") ||
              message.includes("alphanumeric")
            ) {
              enhancedMessage =
                "Username can only contain letters, numbers, underscores, and hyphens (no spaces).";
            }
          }

          newErrors.push({ field, message: enhancedMessage });
        });
      } else if (err.response?.data?.message) {
        // Generic error message
        newErrors.push({
          field: "general",
          message: err.response.data.message,
        });
      } else {
        newErrors.push({
          field: "general",
          message:
            "Registration failed. Please check your information and try again.",
        });
      }

      setFieldErrors(newErrors);
    } finally {
      setLoading(false);
    }
  };

  const generalError = fieldErrors.find((e) => e.field === "general");

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
        className="w-full max-w-2xl relative z-10"
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
            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3"
                >
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <div>
                    <p className="text-green-400 font-medium">
                      Registration successful!
                    </p>
                    <p className="text-green-300/70 text-sm">
                      Redirecting to your dashboard...
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* General Error Message */}
            <AnimatePresence>
              {generalError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-300 text-sm flex-1">
                    {generalError.message}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name Fields Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="first_name"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    First Name <span className="text-red-400">*</span>
                  </label>
                  <div className="relative group">
                    <User
                      className={`absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors w-5 h-5 ${
                        hasFieldError("first_name")
                          ? "text-red-400"
                          : "text-gray-400 group-focus-within:text-[#928dab]"
                      }`}
                    />
                    <input
                      type="text"
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      onBlur={() => handleBlur("first_name")}
                      className={`w-full pl-12 pr-4 py-3.5 bg-white/5 border rounded-xl 
                               text-white placeholder-gray-500 focus:outline-none 
                               focus:ring-2 transition-all hover:bg-white/[0.07] ${
                                 hasFieldError("first_name")
                                   ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20"
                                   : "border-white/10 focus:border-[#928dab]/50 focus:ring-[#928dab]/20"
                               }`}
                      placeholder="John"
                    />
                  </div>
                  <AnimatePresence>
                    {hasFieldError("first_name") && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-1.5 text-xs text-red-400 flex items-center gap-1"
                      >
                        <AlertCircle size={12} />
                        {getFieldError("first_name")}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <div>
                  <label
                    htmlFor="last_name"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Last Name <span className="text-red-400">*</span>
                  </label>
                  <div className="relative group">
                    <User
                      className={`absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors w-5 h-5 ${
                        hasFieldError("last_name")
                          ? "text-red-400"
                          : "text-gray-400 group-focus-within:text-[#928dab]"
                      }`}
                    />
                    <input
                      type="text"
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      onBlur={() => handleBlur("last_name")}
                      className={`w-full pl-12 pr-4 py-3.5 bg-white/5 border rounded-xl 
                               text-white placeholder-gray-500 focus:outline-none 
                               focus:ring-2 transition-all hover:bg-white/[0.07] ${
                                 hasFieldError("last_name")
                                   ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20"
                                   : "border-white/10 focus:border-[#928dab]/50 focus:ring-[#928dab]/20"
                               }`}
                      placeholder="Doe"
                    />
                  </div>
                  <AnimatePresence>
                    {hasFieldError("last_name") && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-1.5 text-xs text-red-400 flex items-center gap-1"
                      >
                        <AlertCircle size={12} />
                        {getFieldError("last_name")}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Email Address <span className="text-red-400">*</span>
                </label>
                <div className="relative group">
                  <Mail
                    className={`absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors w-5 h-5 ${
                      hasFieldError("email")
                        ? "text-red-400"
                        : "text-gray-400 group-focus-within:text-[#928dab]"
                    }`}
                  />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={() => handleBlur("email")}
                    className={`w-full pl-12 pr-4 py-3.5 bg-white/5 border rounded-xl 
                             text-white placeholder-gray-500 focus:outline-none 
                             focus:ring-2 transition-all hover:bg-white/[0.07] ${
                               hasFieldError("email")
                                 ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20"
                                 : "border-white/10 focus:border-[#928dab]/50 focus:ring-[#928dab]/20"
                             }`}
                    placeholder="john@example.com"
                  />
                </div>
                <AnimatePresence>
                  {hasFieldError("email") && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-1.5 text-xs text-red-400 flex items-center gap-1"
                    >
                      <AlertCircle size={12} />
                      {getFieldError("email")}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Username Field */}
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Username <span className="text-red-400">*</span>
                </label>
                <div className="relative group">
                  <User
                    className={`absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors w-5 h-5 ${
                      hasFieldError("username")
                        ? "text-red-400"
                        : "text-gray-400 group-focus-within:text-[#928dab]"
                    }`}
                  />
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    onBlur={() => handleBlur("username")}
                    className={`w-full pl-12 pr-4 py-3.5 bg-white/5 border rounded-xl 
                             text-white placeholder-gray-500 focus:outline-none 
                             focus:ring-2 transition-all hover:bg-white/[0.07] ${
                               hasFieldError("username")
                                 ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20"
                                 : "border-white/10 focus:border-[#928dab]/50 focus:ring-[#928dab]/20"
                             }`}
                    placeholder="johndoe"
                  />
                </div>
                {!hasFieldError("username") && formData.username && (
                  <p className="mt-1.5 text-xs text-gray-400">
                    Use letters, numbers, underscores, or hyphens (no spaces)
                  </p>
                )}
                <AnimatePresence>
                  {hasFieldError("username") && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-1.5 text-xs text-red-400 flex items-center gap-1"
                    >
                      <AlertCircle size={12} />
                      {getFieldError("username")}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Password Field with Requirements */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Password <span className="text-red-400">*</span>
                </label>
                <div className="relative group">
                  <Lock
                    className={`absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors w-5 h-5 ${
                      hasFieldError("password")
                        ? "text-red-400"
                        : "text-gray-400 group-focus-within:text-[#928dab]"
                    }`}
                  />
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={() => handleBlur("password")}
                    className={`w-full pl-12 pr-4 py-3.5 bg-white/5 border rounded-xl 
                             text-white placeholder-gray-500 focus:outline-none 
                             focus:ring-2 transition-all hover:bg-white/[0.07] ${
                               hasFieldError("password")
                                 ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20"
                                 : "border-white/10 focus:border-[#928dab]/50 focus:ring-[#928dab]/20"
                             }`}
                    placeholder="••••••••"
                  />
                </div>

                {/* Password Requirements */}
                <AnimatePresence>
                  {formData.password && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 space-y-2"
                    >
                      {/* Strength Bar */}
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          {[1, 2, 3, 4].map((level) => (
                            <div
                              key={level}
                              className="h-1.5 flex-1 rounded-full transition-all duration-300"
                              style={{
                                backgroundColor:
                                  level <= getPasswordStrength()
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
                      </div>

                      {/* Requirements Checklist */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-3 bg-white/5 border border-white/10 rounded-lg">
                        {passwordRequirements.map((req, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-2 text-xs"
                          >
                            {req.met ? (
                              <Check
                                size={14}
                                className="text-green-400 flex-shrink-0 mt-0.5"
                              />
                            ) : (
                              <X
                                size={14}
                                className="text-gray-500 flex-shrink-0 mt-0.5"
                              />
                            )}
                            <span
                              className={
                                req.met ? "text-green-400" : "text-gray-400"
                              }
                            >
                              {req.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {hasFieldError("password") && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-1.5 text-xs text-red-400 flex items-start gap-1"
                    >
                      <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
                      <span>{getFieldError("password")}</span>
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Confirm Password Field */}
              <div>
                <label
                  htmlFor="password_confirm"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Confirm Password <span className="text-red-400">*</span>
                </label>
                <div className="relative group">
                  <Lock
                    className={`absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors w-5 h-5 ${
                      hasFieldError("password_confirm")
                        ? "text-red-400"
                        : "text-gray-400 group-focus-within:text-[#928dab]"
                    }`}
                  />
                  <input
                    type="password"
                    id="password_confirm"
                    name="password_confirm"
                    value={formData.password_confirm}
                    onChange={handleChange}
                    onBlur={() => handleBlur("password_confirm")}
                    className={`w-full pl-12 pr-4 py-3.5 bg-white/5 border rounded-xl 
                             text-white placeholder-gray-500 focus:outline-none 
                             focus:ring-2 transition-all hover:bg-white/[0.07] ${
                               hasFieldError("password_confirm")
                                 ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20"
                                 : "border-white/10 focus:border-[#928dab]/50 focus:ring-[#928dab]/20"
                             }`}
                    placeholder="••••••••"
                  />
                  {formData.password_confirm &&
                    formData.password === formData.password_confirm && (
                      <Check
                        size={18}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-green-400"
                      />
                    )}
                </div>
                <AnimatePresence>
                  {hasFieldError("password_confirm") && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-1.5 text-xs text-red-400 flex items-center gap-1"
                    >
                      <AlertCircle size={12} />
                      {getFieldError("password_confirm")}
                    </motion.p>
                  )}
                </AnimatePresence>
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
                         flex items-center justify-center gap-2 mt-8"
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
