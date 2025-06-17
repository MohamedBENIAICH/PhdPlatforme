import React, { useState, useEffect, useRef  } from 'react';
import { Clock, MessageCircle, BookOpen, PlusCircle, Eye, Calendar, Video, File, User } from 'lucide-react';
import StudentProfile from './StudentProfile';
import axios from 'axios';
import StudentMeetingsTab from './StudentMeetingsTab';

interface UserType {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'professor';
}

interface Article {
  id: number;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  readingTime?: number;
}

interface Message {
  id: number;
  content: string;
  sender: string;
  senderRole?: string;
  timestamp: string;
}

interface StudentDashboardProps {
  user: UserType;
}

interface Document {
  id: number;
  filename: string;
  filepath: string;
  uploader: string;
  created_at: Date;
}


const StudentDashboard: React.FC<StudentDashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [articles, setArticles] = useState<Article[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newArticle, setNewArticle] = useState({ title: '', content: '' });
  const [newMessage, setNewMessage] = useState('');
  const [professorId, setProfessorId] = useState<number | null>(null);
  const [articlesRead, setArticlesRead] = useState(0);
  const [totalReadingTime, setTotalReadingTime] = useState(0); // seconds
  const [activities, setActivities] = useState<any[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);

  


  // Fetch recent activities for the student
  const fetchActivities = async () => {
    setActivitiesLoading(true);
    try {
      const response = await axios.get('/api/activity/student'); // adjust endpoint if needed
      setActivities(response.data);
    } catch (error) {
      setActivities([]);
      console.error('Error fetching activities:', error);
    } finally {
      setActivitiesLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentArticle, setCurrentArticle] = useState<Article | null>(null);
  const [readingStartTime, setReadingStartTime] = useState<Date | null>(null);
  const [readingTimer, setReadingTimer] = useState(0);
  const [readArticles, setReadArticles] = useState<number[]>([]);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchArticles();
    fetchMessages();
    trackLogin();
    fetchProfessorId();
    fetchStudentStats();
    fetchReadArticles();
  }, []);

  const fetchStudentStats = async () => {
    try {
      const response = await axios.get('/api/student/stats');
      setArticlesRead(response.data.articlesRead);
      setTotalReadingTime(response.data.totalReadingTime);
    } catch (error) {
      console.error('Error fetching student stats:', error);
    }
  };

  const formatReadingTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  const fetchProfessorId = async () => {
    try {
      const response = await axios.get('/api/admin/professors');
      setProfessorId(response.data[0].id);
    } catch (error) {
      console.error('Error fetching professor ID:', error);
    }
  };

  const fetchArticles = async () => {
    try {
      const response = await axios.get('/api/articles');
      setArticles(response.data);
    } catch (error) {
      console.error('Error fetching articles:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await axios.get('/api/messages');
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Open the article dialog and start the timer
const handleOpenArticle = (articleId: number) => {
  const article = articles.find(a => a.id === articleId);
  if (!article) return;
  setCurrentArticle(article);
  setDialogOpen(true);
  setReadingStartTime(new Date());
  setReadingTimer(0);
};

// Close the article dialog and reset timer
const handleCloseDialog = () => {
  setDialogOpen(false);
  setCurrentArticle(null);
  setReadingStartTime(null);
  setReadingTimer(0);
};

const fetchReadArticles = async () => {
  try {
    const response = await axios.get('/api/student/reading-times');
    setReadArticles(response.data.map((rt: any) => rt.articleId));
  } catch (error) {
    console.error('Error fetching read articles:', error);
  }
};

// Mark the article as read, record reading time, update stats, and close dialog
const handleMarkAsRead = async () => {
  if (!currentArticle || !readingStartTime) return;
  const readingTime = Math.floor((Date.now() - readingStartTime.getTime()) / 1000);
  try {
    await axios.post('/api/activity/reading', {
      articleId: currentArticle.id,
      readingTime
    });
    fetchStudentStats();
    fetchReadArticles();
    handleCloseDialog();
  } catch (error) {
    console.error('Error marking article as read:', error);
  }
};

  useEffect(() => {
    if (activeTab === 'messages') {
      fetchMessages(); // Fetch immediately

      pollingRef.current = setInterval(() => {
        fetchMessages();
      }, 3000); // Poll every 3 seconds

      return () => {
        if (pollingRef.current) clearInterval(pollingRef.current);
      };
    } else {
      if (pollingRef.current) clearInterval(pollingRef.current);
    }
  }, [activeTab]);

  const trackLogin = async () => {
    try {
      await axios.post('/api/activity/login');
    } catch (error) {
      console.error('Error tracking login:', error);
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (dialogOpen && readingStartTime) {
      timer = setInterval(() => {
        setReadingTimer(Math.floor((Date.now() - readingStartTime.getTime()) / 1000));
      }, 1000);
    } else {
      setReadingTimer(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [dialogOpen, readingStartTime]);

  const handleSubmitArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/articles', newArticle);
      setNewArticle({ title: '', content: '' });
      fetchArticles();
    } catch (error) {
      console.error('Error creating article:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!professorId) return;
    try {
      await axios.post('/api/messages', { content: newMessage, recipientId: professorId });
      setNewMessage('');
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const fetchDocuments = async () => {
    const res = await axios.get("/api/documents");
    setDocuments(res.data);
  };

  const handleDownload = async (doc: Document) => {
    try {
      await axios.post(`/api/documents/download/${doc.id}`);
      window.open(`http://localhost:3009${doc.filepath}`, "_blank");
    } catch (err) {
      console.error("Error logging download:", err);
      alert("Erreur lors du téléchargement.");
    }
  };

  useEffect(() => { 
    if (activeTab === 'documents') fetchDocuments(); 
  }, [activeTab]);

  const tabs = [
    { id: 'overview', label: 'Aperçu', icon: Calendar },
    { id: 'articles', label: 'Articles', icon: BookOpen },
    { id: 'messages', label: 'Messages', icon: MessageCircle },
    { id: 'meetings', label: 'Réunions', icon: Video },
    { id: 'add-article', label: 'Ajouter Article', icon: PlusCircle },
    { id: 'documents', label: 'Documents', icon: File },
    { id: 'profile', label: 'Profil', icon: User }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">
          Bienvenue, {user.firstName} !
        </h2>
        <p className="opacity-90">
          Explorez les articles, communiquez avec votre professeur et partagez vos connaissances.
        </p>
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
                      ? 'border-blue-500 text-blue-600'
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-xl p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <BookOpen className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Articles Lus</p>
                      <p className="text-2xl font-bold text-gray-900">{articlesRead}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-xl p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <Clock className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                    <p>
                          Temps de lecture : {Math.floor(readingTimer / 60)}m {readingTimer % 60}s
                    </p>
                    <p className="text-2xl font-bold text-gray-900">{formatReadingTime(totalReadingTime)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-xl p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <MessageCircle className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Messages</p>
                      <p className="text-2xl font-bold text-gray-900">{messages.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Activité Récente</h3>
                <div className="space-y-3">
                  {activitiesLoading ? (
                    <div className="text-gray-500">Chargement...</div>
                  ) : activities.length === 0 ? (
                    <div className="text-gray-500">Aucune activité récente.</div>
                  ) : (
                    activities.slice(0, 5).map((activity: any) => (
                      <div key={activity.id} className="flex items-center text-sm text-gray-600">
                        <div className={`w-2 h-2 rounded-full mr-3 ${
                          activity.action === 'login' ? 'bg-green-400' :
                          activity.action === 'reading' ? 'bg-blue-400' :
                          activity.action === 'message' ? 'bg-purple-400' :
                          'bg-gray-300'}`}></div>
                        {activity.action === 'login' && (
                          <>Connexion le {new Date(activity.timestamp).toLocaleDateString()} à {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>
                        )}
                        {activity.action === 'reading' && (
                          <>Article "{activity.details}" lu ({Math.floor((activity.readingTime || 0) / 60)}m {(activity.readingTime || 0) % 60}s)</>
                        )}
                        {activity.action === 'message' && (
                          <>Message envoyé au professeur</>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Articles Tab */}
          {activeTab === 'articles' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Articles Disponibles</h3>
              <div className="grid gap-4">
                {articles.map((article) => {
                  const isRead = readArticles.includes(article.id);
                  return (
                    <div key={article.id} className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-2">{article.title}</h4>
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {article.content.substring(0, 150)}...
                          </p>
                          <div className="flex items-center text-xs text-gray-500 space-x-2">
                            <span>Par {article.author}</span>
                            <span className="mx-2">•</span>
                            <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                            <span className={`ml-4 px-2 py-1 rounded text-xs font-semibold ${isRead ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                              {isRead ? 'Lu' : 'Non lu'}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleOpenArticle(article.id)}
                          className="ml-4 flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Lire</span>
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Article Dialog */}
                {dialogOpen && currentArticle && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-xl shadow-lg max-w-lg w-full p-6 relative">
                      <button
                        className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
                        onClick={handleCloseDialog}
                      >
                        ×
                      </button>
                      <h4 className="text-xl font-bold mb-2">{currentArticle.title}</h4>
                      <div className="text-sm text-gray-700 mb-4 whitespace-pre-line">
                        {currentArticle.content}
                      </div>
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-xs text-gray-500">
                          Temps de lecture: {Math.floor(readingTimer / 60)} min {readingTimer % 60} sec
                        </span>
                        <span className="text-xs text-gray-500">
                          Par {currentArticle.author} • {new Date(currentArticle.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <button
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        onClick={handleMarkAsRead}
                      >
                        Marquer comme lu
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* Messages Tab */}
          {activeTab === 'messages' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Messages</h3>
              
              <div className="bg-gray-50 rounded-xl p-4 max-h-96 overflow-y-auto">
                <div className="space-y-3">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-3 rounded-lg max-w-xs ${
                        message.sender === user.email
                          ? 'bg-blue-600 text-white ml-auto'
                          : 'bg-white border border-gray-200'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender === user.email ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSendMessage} className="flex space-x-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Écrivez votre message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  disabled={!professorId}
                >
                  Envoyer
                </button>
              </form>
            </div>
          )}

          {/* Meetings Tab */}
          {activeTab === 'meetings' && (
            <StudentMeetingsTab userId={user.id} />
          )}

          {/* Add Article Tab */}
          {activeTab === 'add-article' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Ajouter un Nouvel Article</h3>
              
              <form onSubmit={handleSubmitArticle} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Titre de l'Article
                  </label>
                  <input
                    type="text"
                    value={newArticle.title}
                    onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Entrez le titre de votre article"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contenu
                  </label>
                  <textarea
                    value={newArticle.content}
                    onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
                    rows={8}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Écrivez le contenu de votre article..."
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Publier l'Article
                </button>
              </form>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Mon Profil</h2>
              <StudentProfile studentId={user.id} />
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Liste des Documents</h3>
              <div className="overflow-x-auto rounded-xl shadow border border-gray-200">
                <table className="min-w-full text-sm text-left">
                  <thead className="bg-indigo-600 text-white">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Nom du fichier</th>
                      <th className="px-6 py-3 font-semibold">Téléversé par</th>
                      <th className="px-6 py-3 font-semibold">Date</th>
                      <th className="px-6 py-3 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {documents.map(doc => (
                      <tr key={doc.id} className="hover:bg-indigo-50 transition">
                        <td className="px-6 py-4">{doc.filename}</td>
                        <td className="px-6 py-4">{doc.uploader}</td>
                        <td className="px-6 py-4">{new Date(doc.created_at).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleDownload(doc)}
                            className="inline-block px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
                          >
                            Télécharger
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;