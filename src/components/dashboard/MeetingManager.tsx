import React, { useState, useEffect } from 'react';
import { Video, Users, Mail, Calendar, Clock, Check, X } from 'lucide-react';
import axios from 'axios';

interface Student {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface Meeting {
  id: number;
  title: string;
  zoomLink: string;
  scheduledAt: string;
  participants: number[];
  createdAt: string;
}

interface MeetingManagerProps {
  students: Student[];
}

const MeetingManager: React.FC<MeetingManagerProps> = ({ students }) => {
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      const response = await axios.get('/api/meetings');
      setMeetings(response.data);
    } catch (error) {
      console.error('Error fetching meetings:', error);
    }
  };

  const handleStudentToggle = (studentId: number) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(s => s.id));
    }
  };

  const generateZoomLink = () => {
    // Générer un lien Zoom fictif (dans un vrai projet, vous utiliseriez l'API Zoom)
    const meetingId = Math.random().toString(36).substring(2, 15);
    return `https://zoom.us/j/${meetingId}`;
  };

  const handleOrganizeMeeting = async () => {
    if (selectedStudents.length === 0) {
      alert('Veuillez sélectionner au moins un étudiant');
      return;
    }
    setShowMeetingModal(false);
    setShowTitleModal(true);
  };

  const handleCreateMeeting = async () => {
    if (!meetingTitle.trim()) {
      alert('Veuillez saisir un titre pour la réunion');
      return;
    }

    setIsLoading(true);
    try {
      const zoomLink = generateZoomLink();
      await axios.post('/api/meetings', {
        title: meetingTitle,
        zoomLink,
        participantIds: selectedStudents
      });

      setMeetingTitle('');
      setSelectedStudents([]);
      setShowTitleModal(false);
      fetchMeetings();
      alert('Réunion créée avec succès ! Les emails ont été envoyés aux étudiants sélectionnés.');
    } catch (error) {
      console.error('Error creating meeting:', error);
      alert('Erreur lors de la création de la réunion');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Gestion des Réunions</h3>
        <button
          onClick={() => setShowMeetingModal(true)}
          className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Video className="w-4 h-4" />
          <span>Appeler Réunion</span>
        </button>
      </div>

      {/* Meetings List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">Réunions Organisées</h4>
          {meetings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Video className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Aucune réunion organisée pour le moment</p>
            </div>
          ) : (
            <div className="space-y-4">
              {meetings.map((meeting) => (
                <div key={meeting.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900">{meeting.title}</h5>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(meeting.createdAt)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>{meeting.participants.length} participants</span>
                        </div>
                      </div>
                    </div>
                    <a
                      href={meeting.zoomLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                    >
                      Rejoindre
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Student Selection Modal */}
      {showMeetingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Sélectionner les Étudiants</h3>
              <button
                onClick={() => setShowMeetingModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4">
              <button
                onClick={handleSelectAll}
                className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
              >
                {selectedStudents.length === students.length ? 'Désélectionner tout' : 'Sélectionner tout'}
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(student.id)}
                    onChange={() => handleStudentToggle(student.id)}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {student.firstName} {student.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{student.email}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowMeetingModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleOrganizeMeeting}
                disabled={selectedStudents.length === 0}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Organiser Réunion ({selectedStudents.length} étudiants)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Meeting Title Modal */}
      {showTitleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Titre de la Réunion</h3>
              <button
                onClick={() => setShowTitleModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titre de la réunion
              </label>
              <input
                type="text"
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                placeholder="Ex: Révision du cours de Machine Learning"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2 text-sm text-blue-800">
                <Mail className="w-4 h-4" />
                <span>
                  Un email avec le lien Zoom sera envoyé à {selectedStudents.length} étudiant(s)
                </span>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowTitleModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateMeeting}
                disabled={isLoading || !meetingTitle.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Création...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Créer et Envoyer</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingManager;
