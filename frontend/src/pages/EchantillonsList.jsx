import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Flask, Filter, Plus, Search, QrCode, Download, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function EchantillonsList() {
  const navigate = useNavigate();
  const [echantillons, setEchantillons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    statut: '',
    type: '',
    projet_id: '',
    search: '',
    date_debut: '',
    date_fin: ''
  });
  const [projets, setProjets] = useState([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  useEffect(() => {
    loadEchantillons();
    loadProjets();
  }, [filters]);

  const loadEchantillons = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await api.get(`/echantillons/?${params}`);
      setEchantillons(response.data.items);
    } catch (error) {
      console.error('Erreur lors du chargement des échantillons:', error);
      toast.error('Erreur lors du chargement des échantillons');
    } finally {
      setLoading(false);
    }
  };

  const loadProjets = async () => {
    try {
      const response = await api.get('/projets/');
      setProjets(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des projets:', error);
    }
  };

  const handleDownloadQR = async (id) => {
    try {
      const response = await api.get(`/echantillons/${id}/qr-code`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `echantillon-${id}-qr.png`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Erreur lors du téléchargement du QR code:', error);
      toast.error('Erreur lors du téléchargement du QR code');
    }
  };

  const getStatutColor = (statut) => {
    const colors = {
      recu: 'bg-blue-100 text-blue-800',
      en_cours: 'bg-yellow-100 text-yellow-800',
      en_attente: 'bg-orange-100 text-orange-800',
      epuise: 'bg-red-100 text-red-800',
      archive: 'bg-gray-100 text-gray-800'
    };
    return colors[statut] || 'bg-gray-100 text-gray-800';
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'sol':
        return Box;
      case 'roche':
        return Box;
      case 'granulat':
        return Box;
      case 'eau':
        return Flask;
      default:
        return Box;
    }
  };

  return (
    <div className="px-4 py-6 max-w-7xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Flask className="w-8 h-8" />
              Gestion des échantillons
            </h1>
            <p className="text-gray-600 mt-1">
              Suivi et traçabilité des échantillons du laboratoire
            </p>
          </div>
          <button
            onClick={() => navigate('/echantillons/nouveau')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nouvel échantillon
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Filtres de recherche</h3>
          </div>
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            {showAdvancedFilters ? 'Masquer les filtres avancés' : 'Afficher les filtres avancés'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          
          <select
            value={filters.statut}
            onChange={(e) => setFilters({ ...filters, statut: e.target.value })}
            className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tous les statuts</option>
            <option value="recu">Reçu</option>
            <option value="en_cours">En cours</option>
            <option value="en_attente">En attente</option>
            <option value="epuise">Épuisé</option>
            <option value="archive">Archivé</option>
          </select>

          <select
            value={filters.projet_id}
            onChange={(e) => setFilters({ ...filters, projet_id: e.target.value })}
            className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tous les projets</option>
            {projets.map((projet) => (
              <option key={projet.id} value={projet.id}>
                {projet.nom}
              </option>
            ))}
          </select>
        </div>

        {showAdvancedFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tous les types</option>
              <option value="sol">Sol</option>
              <option value="roche">Roche</option>
              <option value="granulat">Granulat</option>
              <option value="eau">Eau</option>
              <option value="autre">Autre</option>
            </select>

            <input
              type="date"
              value={filters.date_debut}
              onChange={(e) => setFilters({ ...filters, date_debut: e.target.value })}
              className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Date début"
            />

            <input
              type="date"
              value={filters.date_fin}
              onChange={(e) => setFilters({ ...filters, date_fin: e.target.value })}
              className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Date fin"
            />
          </div>
        )}
      </div>

      {/* Liste des échantillons */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : echantillons.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-16 text-center">
          <Flask className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucun échantillon trouvé
          </h3>
          <p className="text-gray-600 mb-6">
            Commencez par ajouter votre premier échantillon
          </p>
          <button
            onClick={() => navigate('/echantillons/nouveau')}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nouvel échantillon
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {echantillons.map((echantillon) => {
            const TypeIcon = getTypeIcon(echantillon.type_echantillon);
            return (
              <div
                key={echantillon.id}
                className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-200 overflow-hidden"
              >
                <div className="p-6">
                  {/* En-tête */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatutColor(echantillon.statut)}`}>
                          {echantillon.statut}
                        </span>
                        <TypeIcon className="w-5 h-5 text-gray-500" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {echantillon.reference}
                      </h3>
                    </div>
                    <button
                      onClick={() => handleDownloadQR(echantillon.id)}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                      title="Télécharger QR Code"
                    >
                      <QrCode className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Informations */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm">
                      <span className="font-medium text-gray-700 w-24">Projet:</span>
                      <span className="text-gray-600">{echantillon.projet?.nom || 'N/A'}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="font-medium text-gray-700 w-24">Prélèvement:</span>
                      <span className="text-gray-600">
                        {format(new Date(echantillon.date_prelevement), 'dd MMM yyyy', { locale: fr })}
                      </span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="font-medium text-gray-700 w-24">Quantité:</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">
                            {echantillon.quantite_restante} / {echantillon.quantite_initiale} {echantillon.unite_quantite}
                          </span>
                          <span className={`text-xs font-medium ${
                            echantillon.pourcentage_restant > 50 ? 'text-green-600' :
                            echantillon.pourcentage_restant > 20 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {echantillon.pourcentage_restant?.toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full mt-1">
                          <div
                            className={`h-full rounded-full ${
                              echantillon.pourcentage_restant > 50 ? 'bg-green-500' :
                              echantillon.pourcentage_restant > 20 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${echantillon.pourcentage_restant}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => navigate(`/echantillons/${echantillon.id}`)}
                      className="flex-1 px-4 py-2 bg-gray-50 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors text-sm"
                    >
                      Voir détails
                    </button>
                    {echantillon.photos?.length > 0 && (
                      <button
                        onClick={() => {/* TODO: Afficher galerie */}}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                        title="Photos"
                      >
                        <Upload className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDownloadQR(echantillon.id)}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                      title="Télécharger"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
