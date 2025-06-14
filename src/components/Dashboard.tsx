import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import StudentDashboard from './dashboard/StudentDashboard';
import ProfessorDashboard from './dashboard/ProfessorDashboard';
import { LogOut, User } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Plateforme Éducative
              </h1>
              <span className="ml-4 px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                {user.role === 'student' ? 'Étudiant' : 'Professeur'}
              </span>
            </div>
            
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 text-gray-700 hover:text-gray-900 transition-colors"
              >
                <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full text-white text-sm font-medium">
                  {user.firstName.charAt(0).toUpperCase()}
                </div>
                <span className="font-medium">{user.firstName} {user.lastName}</span>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={logout}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Se Déconnecter
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {user.role === 'student' ? (
          <StudentDashboard user={user} />
        ) : (
          <ProfessorDashboard user={user} />
        )}
      </main>
    </div>
  );
};

export default Dashboard;