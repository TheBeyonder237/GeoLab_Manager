import { useState, useEffect } from 'react';
import { X, AlertTriangle, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function NonConformiteForm({ isOpen, onClose, onSave, nonConformite = null }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    type: 'materiel',
    gravite: 3,
    origine: '',
    essai_id: '',
    action_immediate: '',
    action_corrective: ''
  });
  const [essais, setEssais] = useState([]);

  useEffect(() => {
    if (isOpen) {
      loadEssais();
      if (nonConformite) {
        setFormData({
          titre: nonConformite.titre,
          description: nonConformite.description,
          type: nonConformite.type,
          gravite: nonConformite.gravite,
          origine: nonConformite.origine,
          essai_id: nonConformite.essai_id,
          action_immediate: nonConformite.action_immediate || '',
          action_corrective: nonConformite.action_corrective || ''
        });
      }
    }
  }, [isOpen, nonConformite]);

  const loadEssais = async () => {
    try {
      const response = await api.get('/essais/', {
        params: {
          limit: 1000,
          order_by: '-date_essai'
        }
      });
      setEssais(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des essais:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let response;
      if (nonConformite) {
        response = await api.put(`/qualite/non-conformites/${nonConformite.id}`, formData);
      } else {
        response = await api.post('/qualite/non-conformites/', formData);
      }
      toast.success(
        nonConformite
          ? 'Non-conformité mise à jour avec succès'
          : 'Non-conformité créée avec succès'
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
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <h2 className="text-xl font-semibold text-gray-900">
              {nonConformite ? 'Modifier la non-conformité' : 'Nouvelle non-conformité'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titre
              </label>
              <input
                type="text"
                value={formData.titre}
                onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="materiel">Matériel</option>
                  <option value="methode">Méthode</option>
                  <option value="personnel">Personnel</option>
                  <option value="environnement">Environnement</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gravité (1-5)
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={formData.gravite}
                  onChange={(e) => setFormData({ ...formData, gravite: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Origine
              </label>
              <input
                type="text"
                value={formData.origine}
                onChange={(e) => setFormData({ ...formData, origine: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                placeholder="Ex: Erreur de manipulation, Panne équipement..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Essai concerné
              </label>
              <select
                value={formData.essai_id}
                onChange={(e) => setFormData({ ...formData, essai_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner un essai</option>
                {essais.map((essai) => (
                  <option key={essai.id} value={essai.id}>
                    {essai.numero_essai} - {essai.type_essai}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Action immédiate
              </label>
              <textarea
                value={formData.action_immediate}
                onChange={(e) => setFormData({ ...formData, action_immediate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Action prise immédiatement pour corriger le problème"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Action corrective
              </label>
              <textarea
                value={formData.action_corrective}
                onChange={(e) => setFormData({ ...formData, action_corrective: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Action à long terme pour éviter que le problème ne se reproduise"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
