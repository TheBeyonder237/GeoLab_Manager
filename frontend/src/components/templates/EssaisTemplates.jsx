import { useState, useEffect } from 'react';
import { Save, Edit, Trash2, Copy, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function EssaisTemplates({ type }) {
  const [templates, setTemplates] = useState([]);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [newTemplate, setNewTemplate] = useState({
    nom: '',
    description: '',
    type_essai: type,
    parametres: {}
  });

  useEffect(() => {
    loadTemplates();
  }, [type]);

  const loadTemplates = async () => {
    try {
      const response = await api.get(`/templates/?type_essai=${type}`);
      setTemplates(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des modèles:', error);
      toast.error('Erreur lors du chargement des modèles');
    }
  };

  const getDefaultParameters = () => {
    switch (type) {
      case 'proctor':
        return {
          type_proctor: 'normal',
          nombre_couches: 3,
          nombre_coups: 25,
          masse_mouton: 2.49,
          hauteur_chute: 305
        };

      case 'cbr':
        return {
          energie_compactage: 'OPM',
          nombre_couches: 3,
          nombre_coups: 56,
          temps_immersion: 96
        };

      case 'atterberg':
        return {
          wl_methode: 'casagrande',
          temperature: 20,
          humidite_relative: 50
        };

      case 'granulometrie':
        return {
          type_essai: 'tamisage',
          methode: 'humide',
          tamis_standards: true
        };

      default:
        return {};
    }
  };

  const handleCreateTemplate = async () => {
    try {
      const response = await api.post('/templates/', {
        ...newTemplate,
        parametres: {
          ...getDefaultParameters(),
          ...newTemplate.parametres
        }
      });
      setTemplates([...templates, response.data]);
      toast.success('Modèle créé avec succès');
      setNewTemplate({
        nom: '',
        description: '',
        type_essai: type,
        parametres: {}
      });
    } catch (error) {
      console.error('Erreur lors de la création du modèle:', error);
      toast.error('Erreur lors de la création du modèle');
    }
  };

  const handleUpdateTemplate = async (id) => {
    try {
      const response = await api.put(`/templates/${id}`, editingTemplate);
      setTemplates(templates.map(t => t.id === id ? response.data : t));
      setEditingTemplate(null);
      toast.success('Modèle mis à jour avec succès');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du modèle:', error);
      toast.error('Erreur lors de la mise à jour du modèle');
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce modèle ?')) return;

    try {
      await api.delete(`/templates/${id}`);
      setTemplates(templates.filter(t => t.id !== id));
      toast.success('Modèle supprimé avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression du modèle:', error);
      toast.error('Erreur lors de la suppression du modèle');
    }
  };

  const handleDuplicateTemplate = async (template) => {
    try {
      const response = await api.post('/templates/', {
        ...template,
        nom: `${template.nom} (copie)`,
        id: undefined
      });
      setTemplates([...templates, response.data]);
      toast.success('Modèle dupliqué avec succès');
    } catch (error) {
      console.error('Erreur lors de la duplication du modèle:', error);
      toast.error('Erreur lors de la duplication du modèle');
    }
  };

  const renderParameterFields = (parameters) => {
    return Object.entries(parameters).map(([key, value]) => (
      <div key={key} className="col-span-1">
        <label className="block text-sm font-medium text-gray-700">
          {key.replace(/_/g, ' ').charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}
        </label>
        {typeof value === 'boolean' ? (
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => handleParameterChange(key, e.target.checked)}
            className="mt-1 focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
          />
        ) : (
          <input
            type={typeof value === 'number' ? 'number' : 'text'}
            value={value}
            onChange={(e) => handleParameterChange(key, e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        )}
      </div>
    ));
  };

  const handleParameterChange = (key, value) => {
    if (editingTemplate) {
      setEditingTemplate({
        ...editingTemplate,
        parametres: {
          ...editingTemplate.parametres,
          [key]: value
        }
      });
    } else {
      setNewTemplate({
        ...newTemplate,
        parametres: {
          ...newTemplate.parametres,
          [key]: value
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Création d'un nouveau modèle */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Nouveau modèle</h3>
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nom du modèle
            </label>
            <input
              type="text"
              value={newTemplate.nom}
              onChange={(e) => setNewTemplate({ ...newTemplate, nom: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              value={newTemplate.description}
              onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {renderParameterFields(getDefaultParameters())}
          </div>
          <div>
            <button
              onClick={handleCreateTemplate}
              disabled={!newTemplate.nom}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
            >
              <Plus className="w-4 h-4 mr-2" />
              Créer le modèle
            </button>
          </div>
        </div>
      </div>

      {/* Liste des modèles existants */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Modèles existants</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {templates.map((template) => (
            <div key={template.id} className="p-6">
              {editingTemplate?.id === template.id ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={editingTemplate.nom}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, nom: e.target.value })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  <textarea
                    value={editingTemplate.description}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                    rows={3}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {renderParameterFields(editingTemplate.parametres)}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateTemplate(template.id)}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Enregistrer
                    </button>
                    <button
                      onClick={() => setEditingTemplate(null)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">{template.nom}</h4>
                      <p className="mt-1 text-sm text-gray-500">{template.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingTemplate(template)}
                        className="inline-flex items-center p-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDuplicateTemplate(template)}
                        className="inline-flex items-center p-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="inline-flex items-center p-2 border border-red-300 rounded-md text-red-700 bg-white hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(template.parametres).map(([key, value]) => (
                      <div key={key} className="text-sm">
                        <span className="font-medium text-gray-500">
                          {key.replace(/_/g, ' ').charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}:
                        </span>
                        <span className="ml-1 text-gray-900">
                          {typeof value === 'boolean' ? (value ? 'Oui' : 'Non') : value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
