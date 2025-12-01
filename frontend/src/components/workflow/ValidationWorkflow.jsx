import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Clock, ArrowRight, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const NIVEAU_LABELS = {
  technicien: 'Technicien',
  chef_labo: 'Chef de laboratoire',
  ingenieur: 'Ingénieur',
  admin: 'Administrateur'
};

const STATUT_STYLES = {
  en_attente: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-800',
    icon: Clock
  },
  approuve: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    icon: CheckCircle2
  },
  rejete: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    icon: XCircle
  },
  revision_demandee: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-800',
    icon: AlertCircle
  }
};

export default function ValidationWorkflow({ essaiId, onValidationComplete }) {
  const [workflow, setWorkflow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentaire, setCommentaire] = useState('');
  const [showCommentaire, setShowCommentaire] = useState(false);
  const [criteres, setCriteres] = useState([]);

  useEffect(() => {
    loadWorkflow();
    loadCriteres();
  }, [essaiId]);

  const loadWorkflow = async () => {
    try {
      const response = await api.get(`/workflow/validation/${essaiId}`);
      setWorkflow(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement du workflow:', error);
      toast.error('Erreur lors du chargement du workflow');
    } finally {
      setLoading(false);
    }
  };

  const loadCriteres = async () => {
    try {
      const response = await api.get('/workflow/criteres', {
        params: {
          type_essai: workflow?.essai?.type_essai,
          niveau: workflow?.niveau_actuel
        }
      });
      setCriteres(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des critères:', error);
    }
  };

  const handleValidation = async (statut) => {
    if (statut !== 'approuve' && !commentaire) {
      toast.error('Un commentaire est requis pour un rejet ou une demande de révision');
      return;
    }

    try {
      const response = await api.put(`/workflow/validation/${workflow.id}`, {
        statut,
        commentaire: commentaire || undefined
      });
      
      setWorkflow(response.data);
      toast.success(
        statut === 'approuve'
          ? 'Validation effectuée avec succès'
          : statut === 'rejete'
          ? 'Essai rejeté'
          : 'Demande de révision envoyée'
      );
      
      if (onValidationComplete) {
        onValidationComplete(response.data);
      }
      
      setCommentaire('');
      setShowCommentaire(false);
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      toast.error('Erreur lors de la validation');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucun workflow de validation en cours
          </h3>
          <p className="text-gray-600">
            Cet essai n'a pas encore de workflow de validation associé.
          </p>
        </div>
      </div>
    );
  }

  const { bg, border, text, icon: StatusIcon } = STATUT_STYLES[workflow.statut];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* En-tête */}
      <div className={`flex items-center gap-3 p-4 rounded-lg ${bg} ${border} mb-6`}>
        <StatusIcon className={`w-6 h-6 ${text}`} />
        <div>
          <h3 className={`font-medium ${text}`}>
            Statut: {workflow.statut.replace('_', ' ').charAt(0).toUpperCase() + workflow.statut.slice(1)}
          </h3>
          <p className="text-sm text-gray-600">
            Niveau actuel: {NIVEAU_LABELS[workflow.niveau_actuel]}
          </p>
        </div>
      </div>

      {/* Progression */}
      <div className="mb-8">
        <h4 className="text-sm font-medium text-gray-700 mb-4">Progression de la validation</h4>
        <div className="flex items-center justify-between">
          {workflow.workflow_config.map((niveau, index) => (
            <div key={niveau} className="flex items-center">
              <div className={`flex flex-col items-center ${
                index < workflow.workflow_config.indexOf(workflow.niveau_actuel)
                  ? 'text-green-600'
                  : index === workflow.workflow_config.indexOf(workflow.niveau_actuel)
                  ? 'text-blue-600'
                  : 'text-gray-400'
              }`}>
                <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center mb-2">
                  {index < workflow.workflow_config.indexOf(workflow.niveau_actuel) ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                <span className="text-xs text-center">{NIVEAU_LABELS[niveau]}</span>
              </div>
              {index < workflow.workflow_config.length - 1 && (
                <ArrowRight className="w-4 h-4 mx-2 text-gray-400" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Critères de validation */}
      {criteres.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Critères de validation pour ce niveau
          </h4>
          <div className="space-y-2">
            {criteres.map((critere, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="mt-1">•</div>
                <div className="text-sm text-gray-600">{critere.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historique */}
      {workflow.historique_validations?.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Historique des validations</h4>
          <div className="space-y-3">
            {workflow.historique_validations.map((validation, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
              >
                {validation.statut === 'approuve' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : validation.statut === 'rejete' ? (
                  <XCircle className="w-5 h-5 text-red-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                )}
                <div>
                  <div className="text-sm font-medium">
                    {NIVEAU_LABELS[validation.niveau]} - {validation.statut}
                  </div>
                  {validation.commentaire && (
                    <p className="text-sm text-gray-600 mt-1">
                      {validation.commentaire}
                    </p>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(validation.date).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions de validation */}
      {workflow.statut === 'en_attente' && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => handleValidation('approuve')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              Valider
            </button>
            <button
              onClick={() => setShowCommentaire(true)}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2"
            >
              <AlertCircle className="w-5 h-5" />
              Demander une révision
            </button>
            <button
              onClick={() => setShowCommentaire(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
            >
              <XCircle className="w-5 h-5" />
              Rejeter
            </button>
          </div>

          {showCommentaire && (
            <div className="mt-4">
              <div className="flex items-start gap-2 mb-2">
                <MessageSquare className="w-5 h-5 text-gray-500" />
                <label className="text-sm font-medium text-gray-700">
                  Commentaire
                </label>
              </div>
              <textarea
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={4}
                placeholder="Entrez votre commentaire..."
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => setShowCommentaire(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleValidation('revision_demandee')}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Demander une révision
                </button>
                <button
                  onClick={() => handleValidation('rejete')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Rejeter
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
