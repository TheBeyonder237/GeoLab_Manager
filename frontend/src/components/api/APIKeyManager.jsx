import { useState, useEffect } from 'react';
import { Key, Plus, Trash2, Copy, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function APIKeyManager() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newKey, setNewKey] = useState({
    name: '',
    description: '',
    permissions: [],
    expires_at: ''
  });

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    try {
      const response = await api.get('/api-keys/');
      setKeys(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des clés API:', error);
      toast.error('Erreur lors du chargement des clés API');
    } finally {
      setLoading(false);
    }
  };

  const createKey = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/api-keys/', newKey);
      setKeys([...keys, response.data]);
      setShowNewKeyModal(false);
      setNewKey({
        name: '',
        description: '',
        permissions: [],
        expires_at: ''
      });
      toast.success('Clé API créée avec succès');
      
      // Copier la clé dans le presse-papiers
      await navigator.clipboard.writeText(response.data.key);
      toast.success('Clé copiée dans le presse-papiers');
    } catch (error) {
      console.error('Erreur lors de la création de la clé:', error);
      toast.error('Erreur lors de la création de la clé');
    }
  };

  const revokeKey = async (keyId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir révoquer cette clé ?')) return;

    try {
      await api.delete(`/api-keys/${keyId}`);
      setKeys(keys.filter(k => k.id !== keyId));
      toast.success('Clé API révoquée');
    } catch (error) {
      console.error('Erreur lors de la révocation de la clé:', error);
      toast.error('Erreur lors de la révocation de la clé');
    }
  };

  const copyKey = async (key) => {
    try {
      await navigator.clipboard.writeText(key);
      toast.success('Clé copiée dans le presse-papiers');
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
      toast.error('Erreur lors de la copie');
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Key className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Clés API</h2>
        </div>
        <button
          onClick={() => setShowNewKeyModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nouvelle clé
        </button>
      </div>

      {/* Liste des clés */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      ) : keys.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Aucune clé API
        </div>
      ) : (
        <div className="grid gap-4">
          {keys.map((key) => (
            <div
              key={key.id}
              className={`p-4 rounded-lg border ${
                key.active
                  ? 'bg-white border-gray-200'
                  : 'bg-gray-50 border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {key.active ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <h3 className="font-medium text-gray-900">{key.name}</h3>
                    {key.expires_at && (
                      <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Expire le {format(new Date(key.expires_at), 'PPP', { locale: fr })}
                      </span>
                    )}
                  </div>
                  {key.description && (
                    <p className="text-sm text-gray-600 mb-2">{key.description}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                      {key.key.slice(0, 10)}...{key.key.slice(-10)}
                    </code>
                    <button
                      onClick={() => copyKey(key.key)}
                      className="p-1 text-gray-500 hover:text-gray-700"
                      title="Copier la clé"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {key.permissions.map((perm) => (
                      <span
                        key={perm}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                      >
                        {perm}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => revokeKey(key.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Révoquer la clé"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              {key.last_used && (
                <div className="mt-2 text-xs text-gray-500">
                  Dernière utilisation: {format(new Date(key.last_used), 'PPP à HH:mm', { locale: fr })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal de création */}
      {showNewKeyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">
                Nouvelle clé API
              </h3>
              <button
                onClick={() => setShowNewKeyModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={createKey} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de l'application
                </label>
                <input
                  type="text"
                  required
                  value={newKey.name}
                  onChange={(e) => setNewKey({ ...newKey, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newKey.description}
                  onChange={(e) => setNewKey({ ...newKey, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Permissions
                </label>
                <div className="space-y-2">
                  {['read', 'write', 'delete'].map((perm) => (
                    <label key={perm} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={newKey.permissions.includes(perm)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewKey({
                              ...newKey,
                              permissions: [...newKey.permissions, perm]
                            });
                          } else {
                            setNewKey({
                              ...newKey,
                              permissions: newKey.permissions.filter(p => p !== perm)
                            });
                          }
                        }}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        {perm.charAt(0).toUpperCase() + perm.slice(1)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date d'expiration (optionnel)
                </label>
                <input
                  type="datetime-local"
                  value={newKey.expires_at}
                  onChange={(e) => setNewKey({ ...newKey, expires_at: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewKeyModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Créer la clé
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
