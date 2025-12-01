import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function ControleQualiteModal({ 
  isOpen, 
  onClose, 
  controleId = null,
  onSave 
}) {
  const [formData, setFormData] = useState({
    type: 'verification_donnees',
    titre: '',
    description: '',
    date_prevue: '',
    responsable_id: '',
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      if (controleId) {
        loadControle();
      }
    }
  }, [isOpen, controleId]);

  const loadUsers = async () => {
    try {
      const response = await api.get('/users/');
      setUsers(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    }
  };

  const loadControle = async () => {
    try {
      const response = await api.get(`/qualite/controles/${controleId}`);
      setFormData({
        type: response.data.type,
        titre: response.data.titre,
        description: response.data.description,
        date_prevue: response.data.date_prevue.split('T')[0],
        responsable_id: response.data.responsable_id,
      });
    } catch (error) {
      console.error('Erreur lors du chargement du contrôle:', error);
      toast.error('Erreur lors du chargement du contrôle');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let response;
      if (controleId) {
        response = await api.put(`/qualite/controles/${controleId}`, formData);
      } else {
        response = await api.post('/qualite/controles/', formData);
      }

      toast.success(
        controleId 
          ? 'Contrôle modifié avec succès' 
          : 'Contrôle créé avec succès'
      );
      
      if (onSave) {
        onSave(response.data);
      }
      onClose();
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {controleId ? 'Modifier le contrôle' : 'Nouveau contrôle qualité'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type de contrôle
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="verification_donnees">Vérification des données</option>
              <option value="calibration">Calibration</option>
              <option value="maintenance">Maintenance</option>
              <option value="audit">Audit</option>
              <option value="formation">Formation</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titre
            </label>
            <input
              type="text"
              value={formData.titre}
              onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date prévue
            </label>
            <input
              type="date"
              value={formData.date_prevue}
              onChange={(e) => setFormData({ ...formData, date_prevue: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Responsable
            </label>
            <select
              value={formData.responsable_id}
              onChange={(e) => setFormData({ ...formData, responsable_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Sélectionner un responsable</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name || user.username}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
