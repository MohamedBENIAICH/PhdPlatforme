import React, { useState, useEffect, useRef  } from 'react';
import { Users, MessageCircle, BookOpen, Activity, Plus, Mail, Clock, Eye, X } from 'lucide-react';
import axios from 'axios';

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'professor';
}

interface Student {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  lastLogin?: string;
  totalReadingTime: number;
  articlesRead: number;
}

interface Activity {
  id: number;
  studentName: string;
  action: string;
  timestamp: string;
  details?: string;
}

interface Message {
  id: number;
  content: string;
  sender: string;
  senderRole: string;
  timestamp: string;
}

interface ProfessorDashboardProps {
  user: User;
}

const ProfessorDashboard: React.FC<ProfessorDashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [students, setStudents] = useState<Student[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentName, setNewStudentName] = useState({ firstName: '', lastName: '' });
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  

  // Polling for students and activities (auto-refresh)
  useEffect(() => {
    let studentsInterval: NodeJS.Timeout | null = null;
    let activitiesInterval: NodeJS.Timeout | null = null;

    // Always fetch immediately
    fetchStudents();
    fetchActivities();

    // Poll students and activities every 3s unless in messages or add-student tab
    if (activeTab !== 'messages' && activeTab !== 'add-student') {
      studentsInterval = setInterval(fetchStudents, 3000);
      activitiesInterval = setInterval(fetchActivities, 3000);
    }

    return () => {
      if (studentsInterval) clearInterval(studentsInterval);
      if (activitiesInterval) clearInterval(activitiesInterval);
    };
  }, [activeTab]);


  const fetchStudents = async () => {
    try {
      const response = await axios.get('/api/admin/students');
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchMessages = async (studentId: number) => {
    try {
      const response = await axios.get(`/api/messages?studentId=${studentId}`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Polling for messages (auto-refresh)
  useEffect(() => {
    if (activeTab === 'messages' && selectedStudent) {
      fetchMessages(selectedStudent.id); // Fetch immediately
      pollingRef.current = setInterval(() => {
        fetchMessages(selectedStudent.id);
      }, 3000);
      return () => {
        if (pollingRef.current) clearInterval(pollingRef.current);
      };
    } else {
      if (pollingRef.current) clearInterval(pollingRef.current);
    }
  }, [activeTab, selectedStudent]);


  const sendMessage = async () => {
    if (!selectedStudent || !newMessage.trim()) return;
    try {
      await axios.post('/api/messages', {
        recipientId: selectedStudent.id,
        content: newMessage,
        role: 'professor'
      });
      setNewMessage('');
      fetchMessages(selectedStudent.id);
    } catch (error) {
      alert("Erreur lors de l'envoi du message.");
      console.error('Error sending message:', error);
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await axios.get('/api/admin/activities');
      setActivities(response.data);
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/students', {
        email: newStudentEmail,
        firstName: newStudentName.firstName,
        lastName: newStudentName.lastName
      });
      setNewStudentEmail('');
      setNewStudentName({ firstName: '', lastName: '' });
      fetchStudents();
    } catch (error) {
      console.error('Error adding student:', error);
    }
  };

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'login':
        return <Users className="w-4 h-4 text-green-500" />;
      case 'logout':
        return <Users className="w-4 h-4 text-red-500" />;
      case 'reading':
        return <BookOpen className="w-4 h-4 text-blue-500" />;
      case 'message':
        return <MessageCircle className="w-4 h-4 text-purple-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const tabs = [
    { id: 'overview', label: 'Aperçu', icon: Activity },
    { id: 'students', label: 'Étudiants', icon: Users },
    { id: 'activities', label: 'Activités', icon: Clock },
    { id: 'messages', label: 'Messages', icon: MessageCircle },
    { id: 'add-student', label: 'Ajouter Étudiant', icon: Plus }
  ];

  const handleDeleteStudent = async (studentId: number) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cet étudiant ?")) return;
    try {
      await axios.delete(`/api/admin/students/${studentId}`);
      setStudents(students.filter((s) => s.id !== studentId));
    } catch (error) {
      alert("Erreur lors de la suppression de l'étudiant.");
      console.error('Error deleting student:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">
          Tableau de Bord - Professeur {user.firstName} {user.lastName}
        </h2>
        <p className="opacity-90">
          Suivez l'activité de vos étudiants et gérez votre plateforme éducative.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Étudiants</p>
              <p className="text-2xl font-bold text-gray-900">{students.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <BookOpen className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Articles Lus</p>
              <p className="text-2xl font-bold text-gray-900">
                {students.reduce((sum, student) => sum + student.articlesRead, 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Temps Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {(() => {
                  const totalSeconds = students.reduce((sum, student) => sum + student.totalReadingTime, 0);
                  const h = Math.floor(totalSeconds / 3600);
                  const m = Math.floor((totalSeconds % 3600) / 60);
                  const s = totalSeconds % 60;
                  return `${h}h ${m}m ${s}s`;
                })()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Activity className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Activités</p>
              <p className="text-2xl font-bold text-gray-900">{activities.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Étudiants Actifs Récemment</h3>
                <div className="space-y-3">
                  {students.slice(0, 5).map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-medium">
                          {student.firstName.charAt(0)}
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-gray-900">
                            {student.firstName} {student.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{student.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {student.articlesRead} articles
                        </p>
                        <p className="text-sm text-gray-500">
                          {Math.floor(student.totalReadingTime / 60)}h {student.totalReadingTime % 60}m
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Activités Récentes</h3>
                <div className="space-y-3">
                  {activities.slice(0, 8).map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-3 text-sm">
                      {getActivityIcon(activity.action)}
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">{activity.studentName}</span>
                        <span className="text-gray-600 ml-2">{activity.action}</span>
                        {activity.details && (
                          <span className="text-gray-500 ml-2">- {activity.details}</span>
                        )}
                      </div>
                      <span className="text-gray-400">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Students Tab */}
          {activeTab === 'students' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Liste des Étudiants</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Étudiant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dernière Connexion
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Articles Lus
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Temps de Lecture
                      </th>
                      <th className="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                              {student.firstName.charAt(0)}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {student.firstName} {student.lastName}
                              </div>
                              <div className="text-sm text-gray-500">{student.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.lastLogin 
                            ? new Date(student.lastLogin).toLocaleDateString()
                            : 'Jamais connecté'
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.articlesRead}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {Math.floor(student.totalReadingTime / 60)}h {student.totalReadingTime % 60}m
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => handleDeleteStudent(student.id)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Supprimer l'étudiant"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Activities Tab */}
          {activeTab === 'activities' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Historique des Activités</h3>
              <div className="bg-gray-50 rounded-xl p-4 max-h-96 overflow-y-auto">
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                      <div className="flex items-center space-x-3">
                        {getActivityIcon(activity.action)}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{activity.studentName}</p>
                          <p className="text-xs text-gray-500">
                            {activity.action} {activity.details && `- ${activity.details}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {new Date(activity.timestamp).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(activity.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Messages Tab */}
          {activeTab === 'messages' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Messagerie</h3>
              <div className="flex space-x-4">
                {/* Student list */}
                <div className="w-1/3">
                  <ul>
                    {students.map(student => (
                      <li
                        key={student.id}
                        className={`p-2 cursor-pointer rounded ${selectedStudent?.id === student.id ? 'bg-indigo-100' : ''}`}
                        onClick={() => {
                          setSelectedStudent(student);
                          fetchMessages(student.id);
                        }}
                      >
                        {student.firstName} {student.lastName}
                      </li>
                    ))}
                  </ul>
                </div>
                {/* Chat section */}
                <div className="flex-1 flex flex-col border rounded-xl p-4 bg-white">
                  <div className="flex-1 overflow-y-auto mb-4">
                    {messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg max-w-xs ${
                          msg.sender === user.email
                            ? 'bg-indigo-500 text-white ml-auto'
                            : 'bg-white border border-gray-200'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p className={`text-xs mt-1 ${
                          msg.sender === user.email ? 'text-indigo-100' : 'text-gray-500'
                        }`}>
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    ))}
                  </div>
                  {selectedStudent && (
                    <div className="flex">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        className="flex-1 border rounded-l-lg p-2"
                        placeholder="Votre message..."
                      />
                      <button
                        onClick={sendMessage}
                        className="bg-indigo-600 text-white px-4 rounded-r-lg"
                      >
                        Envoyer
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Add Student Tab */}
          {activeTab === 'add-student' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Ajouter un Nouvel Étudiant</h3>
              <div className="bg-blue-50 rounded-xl p-4 mb-6">
                <div className="flex items-center">
                  <Mail className="w-5 h-5 text-blue-600 mr-2" />
                  <p className="text-sm text-blue-800">
                    Un mot de passe temporaire sera automatiquement généré et envoyé par email à l'étudiant.
                  </p>
                </div>
              </div>
              <form onSubmit={handleAddStudent} className="space-y-4 max-w-md">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prénom
                    </label>
                    <input
                      type="text"
                      value={newStudentName.firstName}
                      onChange={(e) => setNewStudentName({ ...newStudentName, firstName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Prénom"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom
                    </label>
                    <input
                      type="text"
                      value={newStudentName.lastName}
                      onChange={(e) => setNewStudentName({ ...newStudentName, lastName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Nom"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse Email
                  </label>
                  <input
                    type="email"
                    value={newStudentEmail}
                    onChange={(e) => setNewStudentEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="etudiant@exemple.com"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Ajouter l'Étudiant
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfessorDashboard;