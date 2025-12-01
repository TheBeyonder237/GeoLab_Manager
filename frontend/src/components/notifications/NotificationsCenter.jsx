import { useState, useEffect } from 'react';
import { Bell, Check, Archive, RefreshCw, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import api from '../../services/api';

const TYPE_ICONS = {
  validation_requise: "🔍",
  essai_valide: "✅",
  essai_rejete: "❌",
  commentaire: "💬",
  modification: "📝",
  rappel: "⏰",
  systeme: "🔔"
};

export default function NotificationsCenter() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({
    type: '',
    nonLues: true
  });
  const [stats, setStats] = useState({
    total: 0,
    nonLues: 0
  });

  useEffect(() => {
    loadNotifications();
  }, [filter]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.type) params.append('type', filter.type);
      if (filter.nonLues) params.append('non_lues', true);

      const response = await api.get(`/notifications/?${params.toString()}`);
      setNotifications(response.data.notifications);
      setStats({
        total: response.data.total,
        nonLues: response.data.non_lues
      });
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
      toast.error('Erreur lors du chargement des notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/lue`);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, lu: true } : n
      ));
      setStats(prev => ({ ...prev, nonLues: Math.max(0, prev.nonLues - 1) }));
    } catch (error) {
      console.error('Erreur lors du marquage de la notification:', error);
      toast.error('Erreur lors du marquage de la notification');
    }
  };

  const handleArchive = async (id) => {
    try {
      await api.put(`/notifications/${id}/archive`);
      setNotifications(notifications.filter(n => n.id !== id));
      setStats(prev => ({ ...prev, total: prev.total - 1 }));
      toast.success('Notification archivée');
    } catch (error) {
      console.error('Erreur lors de l\'archivage de la notification:', error);
      toast.error('Erreur lors de l\'archivage de la notification');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/notifications/lire-tout');
      setNotifications(notifications.map(n => ({ ...n, lu: true })));
      setStats(prev => ({ ...prev, nonLues: 0 }));
      toast.success('Toutes les notifications ont été marquées comme lues');
    } catch (error) {
      console.error('Erreur lors du marquage des notifications:', error);
      toast.error('Erreur lors du marquage des notifications');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* En-tête */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold">Centre de notifications</h2>
          {stats.nonLues > 0 && (
            <span className="px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
              {stats.nonLues} non lue{stats.nonLues > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => loadNotifications()}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
            title="Rafraîchir"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          {stats.nonLues > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-2 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-full"
            >
              <Check className="w-4 h-4" />
              Tout marquer comme lu
            </button>
          )}
        </div>
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <Filter className="w-5 h-5 text-gray-500" />
        <select
          value={filter.type}
          onChange={(e) => setFilter({ ...filter, type: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Tous les types</option>
          <option value="validation_requise">Validation requise</option>
          <option value="essai_valide">Essai validé</option>
          <option value="essai_rejete">Essai rejeté</option>
          <option value="commentaire">Commentaire</option>
          <option value="modification">Modification</option>
          <option value="rappel">Rappel</option>
          <option value="systeme">Système</option>
        </select>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={filter.nonLues}
            onChange={(e) => setFilter({ ...filter, nonLues: e.target.checked })}
            className="rounded text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Non lues uniquement</span>
        </label>
      </div>

      {/* Liste des notifications */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Aucune notification
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 rounded-lg border ${
                notif.lu ? 'bg-white border-gray-200' : 'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl" role="img" aria-label={notif.type}>
                      {TYPE_ICONS[notif.type]}
                    </span>
                    <h3 className="font-medium text-gray-900">{notif.titre}</h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{notif.message}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>
                      {format(new Date(notif.created_at), 'PPP à HH:mm', { locale: fr })}
                    </span>
                    {notif.emetteur && (
                      <span>
                        Par: {notif.emetteur.full_name || notif.emetteur.username}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!notif.lu && (
                    <button
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                      title="Marquer comme lu"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleArchive(notif.id)}
                    className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                    title="Archiver"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {notif.lien && (
                <a
                  href={notif.lien}
                  className="mt-2 inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                  Voir les détails →
                </a>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
