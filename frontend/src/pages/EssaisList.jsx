import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Search, Filter, Plus, Eye, Edit, Trash2, FileText, Download, X, Shield, User, FileSpreadsheet, FileDown } from "lucide-react";
import toast from "react-hot-toast";
import { deleteEssai, fetchEssais, updateEssai } from "../store/slices/essaisSlice";
import api from "../services/api";

function EssaisList() {
  const dispatch = useDispatch();
  const { essais, loading, error } = useSelector((state) => state.essais);
  const { user } = useSelector((state) => state.auth);
  const [filters, setFilters] = useState({
    type_essai: "",
    statut: "",
    search: "",
    operateur_id: "",
    projet_id: "",
    date_debut: "",
    date_fin: "",
  });
  const [projets, setProjets] = useState([]);
  const [changingStatut, setChangingStatut] = useState(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  useEffect(() => {
    fetchProjets();
  }, []);

  useEffect(() => {
    const fetchParams = {
      type_essai: filters.type_essai || undefined,
      statut: filters.statut || undefined,
      search: filters.search || undefined,
      operateur_id: filters.operateur_id || undefined,
      projet_id: filters.projet_id || undefined,
      date_debut: filters.date_debut || undefined,
      date_fin: filters.date_fin || undefined,
    };
    // Retirer les valeurs vides
    Object.keys(fetchParams).forEach(key => {
      if (fetchParams[key] === undefined || fetchParams[key] === '') {
        delete fetchParams[key];
      }
    });
    dispatch(fetchEssais(fetchParams));
  }, [dispatch, filters]);

  const fetchProjets = async () => {
    try {
      const response = await api.get('/projets/?statut=actif&archive=false');
      setProjets(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des projets:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet essai ?")) {
      try {
        await dispatch(deleteEssai(id)).unwrap();
        toast.success("Essai supprimé avec succès");
        dispatch(fetchEssais(filters));
      } catch (error) {
        toast.error("Erreur lors de la suppression");
      }
    }
  };

  const handleDownloadPDF = async (id) => {
    try {
      const response = await api.get(`/rapports/${id}/pdf`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `essai-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Rapport PDF téléchargé avec succès");
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      toast.error("Erreur lors du téléchargement du PDF");
    }
  };

  const handleQuickStatutChange = async (essaiId, nouveauStatut) => {
    setChangingStatut(essaiId);
    try {
      await dispatch(updateEssai({ 
        id: essaiId, 
        data: { statut: nouveauStatut } 
      })).unwrap();
      toast.success(`Statut changé en "${nouveauStatut}"`);
      dispatch(fetchEssais(filters));
    } catch (error) {
      toast.error(error || 'Erreur lors du changement de statut');
    } finally {
      setChangingStatut(null);
    }
  };

  const canValidate = user?.role && ['admin', 'chef_lab', 'ingenieur'].includes(user.role);

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.type_essai) params.append('type_essai', filters.type_essai);
      if (filters.statut) params.append('statut', filters.statut);
      if (filters.search) params.append('search', filters.search);
      
      const response = await api.get(`/export/essais/csv?${params}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `essais_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Export CSV téléchargé avec succès");
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      toast.error("Erreur lors de l'export CSV");
    }
  };

  const handleExportExcel = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.type_essai) params.append('type_essai', filters.type_essai);
      if (filters.statut) params.append('statut', filters.statut);
      if (filters.search) params.append('search', filters.search);
      
      const response = await api.get(`/export/essais/excel?${params}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `essais_export_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Export Excel téléchargé avec succès");
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      toast.error("Erreur lors de l'export Excel");
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      atterberg: "Limites d'Atterberg",
      cbr: "CBR",
      proctor: "Proctor",
      granulometrie: "Granulométrie",
      autre: "Autre",
    };
    return labels[type] || type;
  };

  const getStatutBadge = (statut) => {
    const badges = {
      brouillon: "bg-gray-100 text-gray-800",
      en_cours: "bg-yellow-100 text-yellow-800",
      termine: "bg-blue-100 text-blue-800",
      valide: "bg-green-100 text-green-800",
    };
    return badges[statut] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="px-4 py-6 max-w-7xl mx-auto">
      {/* En-tête */}
      <div className="mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3 text-gray-900">
                <FileText className="w-8 h-8" />
                Essais géotechniques
              </h1>
              <p className="text-gray-600">
                Gestion complète de vos essais de laboratoire
              </p>
            </div>
            <Link
              to="/dashboard/essais/nouveau"
              className="bg-gray-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Nouvel essai
            </Link>
          </div>
        </div>
      </div>

      {/* Filtres améliorés */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Filtres de recherche</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 text-sm"
              title="Exporter en CSV"
            >
              <FileDown className="w-4 h-4" />
              CSV
            </button>
            <button
              onClick={handleExportExcel}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 text-sm"
              title="Exporter en Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Excel
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type d'essai
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              value={filters.type_essai}
              onChange={(e) =>
                setFilters({ ...filters, type_essai: e.target.value })
              }
            >
              <option value="">Tous</option>
              <option value="atterberg">Atterberg</option>
              <option value="cbr">CBR</option>
              <option value="proctor">Proctor</option>
              <option value="granulometrie">Granulométrie</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Statut
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              value={filters.statut}
              onChange={(e) =>
                setFilters({ ...filters, statut: e.target.value })
              }
            >
              <option value="">Tous</option>
              <option value="brouillon">Brouillon</option>
              <option value="en_cours">En cours</option>
              <option value="termine">Terminé</option>
              <option value="valide">Validé</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Projet
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              value={filters.projet_id}
              onChange={(e) =>
                setFilters({ ...filters, projet_id: e.target.value })
              }
            >
              <option value="">Tous les projets</option>
              {projets.map((projet) => (
                <option key={projet.id} value={projet.id}>
                  {projet.nom} ({projet.code_projet})
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-end mt-4">
          <button
            onClick={() =>
              setFilters({ type_essai: "", statut: "", search: "", operateur_id: "", projet_id: "", date_debut: "", date_fin: "" })
            }
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Réinitialiser
          </button>
        </div>
      </div>

      {/* Liste des essais avec cartes modernes */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Chargement des essais...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
          <p className="text-sm text-red-800 font-medium">{error}</p>
        </div>
      ) : essais.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-16 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-600 mb-2">Aucun essai trouvé</p>
          <p className="text-sm text-gray-500 mb-6">Créez votre premier essai pour commencer</p>
          <Link
            to="/dashboard/essais/nouveau"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Créer un essai
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {essais.map((essai) => (
            <div
              key={essai.id}
              className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
            >
              {/* En-tête de la carte avec gradient selon le type */}
              <div className={`h-2 ${
                essai.type_essai === 'atterberg' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                essai.type_essai === 'cbr' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                essai.type_essai === 'proctor' ? 'bg-gradient-to-r from-purple-500 to-purple-600' :
                essai.type_essai === 'granulometrie' ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                'bg-gradient-to-r from-gray-500 to-gray-600'
              }`}></div>
              
              <div className="p-6">
                {/* En-tête avec statut et type */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatutBadge(
                          essai.statut
                        )}`}
                      >
                        {essai.statut}
                      </span>
                      <span className="text-xs text-gray-500 font-medium">
                        {getTypeLabel(essai.type_essai)}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {essai.numero_essai}
                    </h3>
                  </div>
                </div>

                {/* Informations */}
                <div className="space-y-2 mb-4">
                  {(essai.projet_nom || essai.projet) && (
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium mr-2">Projet:</span>
                      <span>{essai.projet_nom || essai.projet}</span>
                    </div>
                  )}
                  {essai.echantillon && (
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium mr-2">Échantillon:</span>
                      <span>{essai.echantillon}</span>
                    </div>
                  )}
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="font-medium mr-2">Opérateur:</span>
                    <span>{essai.operateur?.full_name || essai.operateur?.username || 'N/A'}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-medium mr-2">Date:</span>
                    <span>
                      {format(new Date(essai.date_essai), "dd MMM yyyy", {
                        locale: fr,
                      })}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-4 border-t border-gray-200">
                  {/* Changement rapide de statut */}
                  {essai.statut !== 'valide' && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 font-medium">Statut rapide:</span>
                      <div className="flex gap-1 flex-1">
                        {['en_cours', 'termine'].map((statut) => {
                          const canChange = canValidate || (essai.operateur_id === user?.id);
                          if (!canChange && statut === 'valide') return null;
                          return (
                            <button
                              key={statut}
                              onClick={() => handleQuickStatutChange(essai.id, statut)}
                              disabled={changingStatut === essai.id || essai.statut === statut}
                              className={`flex-1 px-2 py-1 text-xs rounded font-medium transition-colors ${
                                essai.statut === statut
                                  ? 'bg-blue-100 text-blue-700 cursor-default'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {statut === 'en_cours' ? 'En cours' : 'Terminé'}
                            </button>
                          );
                        })}
                        {canValidate && (
                          <button
                            onClick={() => handleQuickStatutChange(essai.id, 'valide')}
                            disabled={changingStatut === essai.id || essai.statut === 'valide' || !essai.resultats}
                            className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
                              essai.statut === 'valide'
                                ? 'bg-green-100 text-green-700 cursor-default'
                                : 'bg-green-50 text-green-700 hover:bg-green-100'
                            }`}
                            title={!essai.resultats ? 'Résultats requis' : 'Valider'}
                          >
                            <Shield className="w-3 h-3 inline mr-1" />
                            Valider
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/dashboard/essais/${essai.id}`}
                      className="flex-1 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors text-center text-sm flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Voir
                    </Link>
                    {(essai.operateur_id === user?.id || canValidate) && (
                      <Link
                        to={`/dashboard/essais/${essai.id}/modifier`}
                        className="px-4 py-2 bg-gray-50 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors text-sm flex items-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                    )}
                    <button
                      onClick={() => handleDownloadPDF(essai.id)}
                      className="px-4 py-2 bg-green-50 text-green-600 rounded-lg font-medium hover:bg-green-100 transition-colors text-sm"
                      title="Télécharger PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    {(essai.operateur_id === user?.id || canValidate) && (
                      <button
                        onClick={() => handleDelete(essai.id)}
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors text-sm"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default EssaisList;
