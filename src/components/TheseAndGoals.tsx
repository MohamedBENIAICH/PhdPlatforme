import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Calendar, ArrowRight, CheckCircle } from 'lucide-react';
import axios from 'axios';

interface Thesis {
  id?: number;
  title: string;
  description: string;
}

interface YearlyObjective {
  yearNumber: number;
  objectives: string;
}

const TheseAndGoals: React.FC = () => {
  const [step, setStep] = useState<number>(1);
  const [thesis, setThesis] = useState<Thesis>({ title: '', description: '' });
  const [objectives, setObjectives] = useState<YearlyObjective[]>([
    { yearNumber: 1, objectives: '' },
    { yearNumber: 2, objectives: '' },
    { yearNumber: 3, objectives: '' },
  ]);
  const [currentYear, setCurrentYear] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const navigate = useNavigate();

  // Load existing thesis and objectives
  useEffect(() => {
    const fetchThesis = async () => {
      try {
        const response = await axios.get('/api/theses/me', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        
        if (response.data) {
          setThesis({
            title: response.data.title,
            description: response.data.description,
          });
          setStep(2); // Skip to objectives if thesis exists
          
          // Fetch objectives
          const objResponse = await axios.get(`/api/theses/${response.data.id}/objectives`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          });
          
          if (objResponse.data && objResponse.data.length > 0) {
            const updatedObjectives = [...objectives];
            objResponse.data.forEach((obj: any) => {
              const index = obj.year_number - 1;
              if (index >= 0 && index < 3) {
                updatedObjectives[index] = {
                  yearNumber: obj.year_number,
                  objectives: obj.objectives,
                };
              }
            });
            setObjectives(updatedObjectives);
          }
        }
      } catch (error) {
        console.error('Error fetching thesis:', error);
      }
    };

    fetchThesis();
  }, []);

  const handleThesisSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        '/api/theses',
        { title: thesis.title, description: thesis.description },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      setThesis({ ...thesis, id: response.data.id });
      setStep(2);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erreur lors de la création de la thèse');
    } finally {
      setLoading(false);
    }
  };

  const handleObjectiveChange = (year: number, value: string) => {
    const updatedObjectives = [...objectives];
    const index = year - 1;
    updatedObjectives[index] = { yearNumber: year, objectives: value };
    setObjectives(updatedObjectives);
  };

  const saveObjectives = async (year: number) => {
    try {
      if (!thesis.id) {
        setError('Thèse non trouvée');
        return;
      }

      const objective = objectives[year - 1];
      await axios.post(
        `/api/theses/${thesis.id}/objectives`,
        { yearNumber: year, objectives: objective.objectives },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      setSuccess(`Objectifs de l'année ${year} enregistrés avec succès`);
      
      // Move to next year or complete
      if (year < 3) {
        setCurrentYear(year + 1);
        // Clear success message after a short delay
        setTimeout(() => setSuccess(''), 3000);
      } else {
        // After saving the last year's objectives, redirect to dashboard after a short delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erreur lors de la sauvegarde des objectifs');
    }
  };

  const renderThesisForm = () => (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center">
        <BookOpen className="mr-2" /> Informations sur la thèse
      </h2>
      
      <form onSubmit={handleThesisSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Titre de la thèse *
          </label>
          <input
            type="text"
            id="title"
            value={thesis.title}
            onChange={(e) => setThesis({ ...thesis, title: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description *
          </label>
          <textarea
            id="description"
            rows={5}
            value={thesis.description}
            onChange={(e) => setThesis({ ...thesis, description: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        {error && <div className="text-red-500 text-sm">{error}</div>}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !thesis.title || !thesis.description}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 flex items-center"
          >
            {loading ? 'Enregistrement...' : 'Suivant'} <ArrowRight className="ml-2 h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );

  const renderYearTabs = () => (
    <div className="flex justify-center mb-8">
      {[1, 2, 3].map((year) => (
        <button
          key={year}
          onClick={() => setCurrentYear(year)}
          className={`px-6 py-2 mx-1 rounded-t-lg font-medium ${
            currentYear === year
              ? 'bg-white text-blue-600 border-t-2 border-l-2 border-r-2 border-blue-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Année {year}
          {objectives[year - 1]?.objectives && (
            <CheckCircle className="inline-block ml-2 h-4 w-4 text-green-500" />
          )}
        </button>
      ))}
    </div>
  );

  const renderObjectivesForm = () => {
    const currentObjective = objectives.find((obj) => obj.yearNumber === currentYear) || {
      yearNumber: currentYear,
      objectives: '',
    };

    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center">
          <Calendar className="mr-2" /> Objectifs de la thèse
        </h2>
        
        {renderYearTabs()}
        
        <div className="border rounded-b-lg p-6">
          <h3 className="text-xl font-semibold mb-4">
            Objectifs de l'année {currentYear}
          </h3>
          
          <div className="mb-6">
            <label htmlFor={`objectives-${currentYear}`} className="block text-sm font-medium text-gray-700 mb-2">
              Décrivez vos objectifs pour cette année *
            </label>
            <textarea
              id={`objectives-${currentYear}`}
              rows={8}
              value={currentObjective.objectives}
              onChange={(e) => handleObjectiveChange(currentYear, e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Décrivez en détail vos objectifs pour cette année..."
              required
            />
          </div>

          {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
          {success && <div className="text-green-500 text-sm mb-4">{success}</div>}

          <div className="flex justify-between">
            {currentYear > 1 && (
              <button
                type="button"
                onClick={() => setCurrentYear(currentYear - 1)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
              >
                Précédent
              </button>
            )}
            
            <button
              type="button"
              onClick={() => saveObjectives(currentYear)}
              disabled={!currentObjective.objectives.trim()}
              className={`ml-auto px-6 py-2 ${
                currentObjective.objectives.trim()
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
            >
              {currentYear < 3 ? 'Enregistrer et continuer' : 'Terminer'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {step === 1 ? renderThesisForm() : renderObjectivesForm()}
      </div>
    </div>
  );
};

export default TheseAndGoals;
