import React, { useState, useEffect } from 'react';
import { Video, Calendar, Users, ExternalLink } from 'lucide-react';
import axios from 'axios';

interface Meeting {
  id: number;
  title: string;
  zoomLink: string;
  professorId: number;
  createdAt: string;
  participants: number[];
}

interface StudentMeetingsTabProps {
  userId: number;
}

const StudentMeetingsTab: React.FC<StudentMeetingsTabProps> = ({ userId }) => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentMeetings();
  }, []);

  const fetchStudentMeetings = async () => {
    try {
      const response = await axios.get('/api/student/meetings');
      setMeetings(response.data);
    } catch (error) {
      console.error('Error fetching student meetings:', error);
      setMeetings([]);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Mes Réunions</h3>
        <div className="text-center py-8">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 mt-2">Chargement des réunions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Mes Réunions</h3>
      
      {meetings.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Video className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">Aucune réunion planifiée</h4>
          <p className="text-gray-500">
            Vous n'avez pas encore de réunions planifiées avec votre professeur.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {meetings.map((meeting) => (
            <div key={meeting.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Video className="w-5 h-5 text-blue-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">{meeting.title}</h4>
                  </div>
                  
                  <div className="flex items-center space-x-6 text-sm text-gray-500 mb-4">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Organisée le {formatDate(meeting.createdAt)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{meeting.participants.length} participants</span>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-800">
                      <strong>Lien Zoom:</strong> 
                      <a 
                        href={meeting.zoomLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="ml-2 text-blue-600 hover:text-blue-800 underline break-all"
                      >
                        {meeting.zoomLink}
                      </a>
                    </p>
                  </div>
                </div>

                <div className="ml-4">
                  <a
                    href={meeting.zoomLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Rejoindre</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-blue-50 rounded-xl p-4 mt-6">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Video className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Informations sur les réunions</h4>
            <p className="text-sm text-blue-700">
              Votre professeur peut organiser des réunions Zoom pour discuter de vos projets, 
              répondre à vos questions ou faire des révisions. Vous recevrez une notification 
              par email avec le lien de la réunion.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentMeetingsTab; 