import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, FileText, AlertCircle, Loader, Calendar, Target } from 'lucide-react';
import axios from 'axios';

// Interfaces for TypeScript
export interface Student {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  lastLogin?: string;
  totalReadingTime?: number;
  articlesRead?: number;
}

export interface Thesis {
  id: number;
  title: string;
  description: string;
  user_id: number;
  created_at: string;
  updated_at: string;
}

export interface YearlyObjective {
  id: number;
  thesis_id: number;
  year_number: number;
  objectives: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface StudentProfileProps {
  studentId?: string | number;
}

const StudentProfile: React.FC<StudentProfileProps> = ({ studentId: propStudentId }) => {
  const { studentId: urlStudentId } = useParams<{ studentId?: string }>();
  const navigate = useNavigate();
  
  // Use prop if provided, otherwise URL param
  const effectiveStudentId = propStudentId || urlStudentId;
  
  const [student, setStudent] = useState<Student | null>(null);
  const [thesis, setThesis] = useState<Thesis | null>(null);
  const [yearlyObjectives, setYearlyObjectives] = useState<YearlyObjective[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!effectiveStudentId) {
        setError('Aucun identifiant étudiant fourni');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        
        // Fetch student data
        const [studentRes, thesisRes, objectivesRes] = await Promise.all([
          axios.get<ApiResponse<Student>>(`/api/students/${effectiveStudentId}`),
          axios.get<ApiResponse<Thesis>>(`/api/students/${effectiveStudentId}/thesis`),
          axios.get<ApiResponse<YearlyObjective[]>>(`/api/students/${effectiveStudentId}/objectives`)
        ]);

        if (studentRes.data.success && studentRes.data.data) {
          setStudent(studentRes.data.data);
        } else {
          throw new Error(studentRes.data.error || 'Échec du chargement des données étudiant');
        }

        if (thesisRes.data.success && thesisRes.data.data) {
          setThesis(thesisRes.data.data);
        }

        if (objectivesRes.data.success && objectivesRes.data.data) {
          setYearlyObjectives(objectivesRes.data.data);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Erreur lors du chargement des données. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    };

    if (effectiveStudentId) {
      fetchStudentData();
    }
  }, [effectiveStudentId]);

  // No more toggle functionality needed as we're displaying goals as text only

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-col items-center space-y-4">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-gray-600 font-medium">Chargement des données de l'étudiant...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (!student) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Étudiant non trouvé</h2>
          <p className="text-gray-600 mb-6">Impossible de charger les données de l'étudiant demandé.</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à la liste des étudiants
          </button>
          
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-red-200">
            <div className="p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-6 w-6 text-red-500" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-red-800">Erreur de chargement</h3>
                  <p className="mt-2 text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button 
        onClick={() => navigate(-1)}
        className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Retour à la liste des étudiants
      </button>
          
          <div className="bg-white border-b border-gray-200 px-6 py-8 rounded-t-lg shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <div className="ml-6">
                <h1 className="text-3xl font-bold text-gray-900">
                  {student.firstName} {student.lastName}
                </h1>
                <p className="mt-1 text-lg text-gray-600">Profil étudiant</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Student Information */}
          <div className="lg:col-span-1 space-y-6">
            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Mail className="w-5 h-5 mr-2 text-gray-500" />
                  Informations de contact
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Nom complet</label>
                    <p className="text-base text-gray-900 font-medium">
                      {student.firstName} {student.lastName}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Adresse email</label>
                    <a 
                      href={`mailto:${student.email}`} 
                      className="text-base text-blue-600 hover:text-blue-800 font-medium transition-colors"
                    >
                      {student.email}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Thesis and Objectives */}
          <div className="lg:col-span-2 space-y-6">
            {/* Thesis Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-gray-500" />
                  Thèse de doctorat
                </h2>
              </div>
              <div className="p-6">
                {thesis ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-2">Titre</label>
                      <h3 className="text-xl font-semibold text-gray-900 leading-tight">
                        {thesis.title || 'Non spécifié'}
                      </h3>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-2">Description</label>
                      <div className="prose prose-sm max-w-none">
                        <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                          {thesis.description || 'Aucune description fournie.'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-1" />
                      {thesis.created_at && `Créée le ${new Date(thesis.created_at).toLocaleDateString('fr-FR')}`}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune thèse enregistrée</h3>
                    <p className="text-gray-600">Aucune thèse n'a été enregistrée pour cet étudiant.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Yearly Objectives */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Target className="w-5 h-5 mr-2 text-gray-500" />
                  Objectifs annuels
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Suivi des objectifs par année de thèse
                </p>
              </div>
              <div className="divide-y divide-gray-200">
                {yearlyObjectives.length > 0 ? (
                  yearlyObjectives
                    .sort((a, b) => a.year_number - b.year_number)
                    .map((objective) => (
                      <div key={objective.id} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start space-x-4">
                          <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 border-transparent flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3 mb-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Année {objective.year_number}
                              </span>
                            </div>
                            <p className="text-base leading-relaxed">
                              {objective.objectives}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="p-12 text-center">
                    <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun objectif défini</h3>
                    <p className="text-gray-600">
                      Aucun objectif n'a été défini pour cet étudiant.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;