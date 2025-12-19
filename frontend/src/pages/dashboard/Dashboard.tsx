/**
 * Dashboard Component
 *
 * Main dashboard view for authenticated users
 */

import React from "react";
import { useAuth } from "../../contexts/AuthContext";

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#1f1c2c] via-[#2d2840] to-[#928dab]">
      {/* Header */}
      <header className="bg-[#1f1c2c]/80 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Task Manager</h1>
          <div className="flex items-center gap-4">
            <span className="text-white/80">
              Welcome, {user?.first_name || user?.username}
            </span>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-white rounded-lg transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
          <h2 className="text-xl font-semibold text-white mb-4">Dashboard</h2>
          <p className="text-white/80">
            Welcome to your task management dashboard!
          </p>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
