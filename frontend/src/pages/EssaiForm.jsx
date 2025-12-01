import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import AtterbergForm from "../components/forms/AtterbergForm";
import CBRForm from "../components/forms/CBRForm";
import GranulometrieForm from "../components/forms/GranulometrieForm";
import ProctorForm from "../components/forms/ProctorForm";
import api from "../services/api";
import {
  createEssai,
  fetchEssai,
  updateEssai,
} from "../store/slices/essaisSlice";

function EssaiForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const projetIdFromUrl = searchParams.get('projet_id');
  const isEdit = !!id;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentEssai } = useSelector((state) => state.essais);
  const [projets, setProjets] = useState([]);

  const [formData, setFormData] = useState({
    numero_essai: "",
    type_essai: "atterberg",
    projet: "",
    projet_id: projetIdFromUrl ? parseInt(projetIdFromUrl) : null,
    echantillon: "",
    observations: "",
  });

  const [essaiId, setEssaiId] = useState(null);
  const [essaiData, setEssaiData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1); // 1: Infos générales, 2: Données spécifiques

  useEffect(() => {
    if (isEdit && id) {
      dispatch(fetchEssai(id));
    }
    fetchProjets();
  }, [dispatch, id, isEdit]);

  const fetchProjets = async () => {
    try {
      // Charger tous les projets actifs (pas seulement ceux non archivés)
      const response = await api.get('/projets/?statut=actif&archive=false&limit=1000');
      setProjets(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des projets:', error);
      toast.error('Erreur lors du chargement des projets');
    }
  };

  useEffect(() => {
    if (isEdit && currentEssai) {
      setFormData({
        numero_essai: currentEssai.numero_essai || "",
        type_essai: currentEssai.type_essai || "atterberg",
        projet: currentEssai.projet_nom || currentEssai.projet || "",
        projet_id: currentEssai.projet_id || null,
        echantillon: currentEssai.echantillon || "",
        observations: currentEssai.observations || "",
      });
      setEssaiId(currentEssai.id);
      setStep(2);

      // Charger les données spécifiques de l'essai
      loadEssaiSpecificData(currentEssai.id, currentEssai.type_essai);
    }
  }, [isEdit, currentEssai]);

  const loadEssaiSpecificData = async (id, type) => {
    try {
      const endpoints = {
        atterberg: `/essais/atterberg/`,
        cbr: `/essais/cbr/`,
        proctor: `/essais/proctor/`,
        granulometrie: `/essais/granulometrie/`,
      };

      if (endpoints[type]) {
        const response = await api.get(endpoints[type]);
        const data = response.data.find((item) => item.essai_id === id);
        if (data) {
          setEssaiData(data);
        }
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
    }
  };

  const handleSubmitGeneral = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Préparer les données avec projet_id
      const submitData = {
        ...formData,
        projet_id: formData.projet_id || undefined
      };
      
      let result;
      if (isEdit) {
        result = await dispatch(updateEssai({ id, data: submitData })).unwrap();
        setEssaiId(result.id);
      } else {
        result = await dispatch(createEssai(submitData)).unwrap();
        setEssaiId(result.id);
      }
      setStep(2);
      toast.success(
        "Essai créé avec succès ! Remplissez maintenant les données spécifiques."
      );
    } catch (err) {
      setError(err || "Une erreur est survenue");
      toast.error(err || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSpecific = (data) => {
    setEssaiData(data);
    toast.success("Données enregistrées avec succès !");
  };

  const handleFinish = () => {
    toast.success("Essai complété avec succès !");
    navigate("/essais");
  };

  const renderSpecificForm = () => {
    if (!essaiId) return null;

    const props = {
      essaiId,
      initialData: essaiData,
      onSave: handleSaveSpecific,
    };

    switch (formData.type_essai) {
      case "atterberg":
        return <AtterbergForm {...props} />;
      case "proctor":
        return <ProctorForm {...props} />;
      case "cbr":
        return <CBRForm {...props} />;
      case "granulometrie":
        return <GranulometrieForm {...props} />;
      default:
        return null;
    }
  };

  return (
    <div className="px-4 py-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {isEdit ? "Modifier l'essai" : "Nouvel essai"}
        </h1>
        {step === 2 && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
              Étape 2/2
            </span>
            <span>Données spécifiques - {formData.type_essai}</span>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {step === 1 ? (
        <form
          onSubmit={handleSubmitGeneral}
          className="bg-white shadow rounded-lg p-6"
        >
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Numéro d'essai *
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                value={formData.numero_essai}
                onChange={(e) =>
                  setFormData({ ...formData, numero_essai: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type d'essai *
              </label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                value={formData.type_essai}
                onChange={(e) =>
                  setFormData({ ...formData, type_essai: e.target.value })
                }
              >
                <option value="atterberg">Limites d'Atterberg</option>
                <option value="cbr">CBR</option>
                <option value="proctor">Proctor</option>
                <option value="granulometrie">Granulométrie</option>
                <option value="autre">Autre</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Projet
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                value={formData.projet_id || ''}
                onChange={(e) => {
                  const selectedProjetId = e.target.value ? parseInt(e.target.value) : null;
                  const selectedProjet = projets.find(p => p.id === selectedProjetId);
                  setFormData({ 
                    ...formData, 
                    projet_id: selectedProjetId,
                    projet: selectedProjet ? selectedProjet.nom : ''
                  });
                }}
              >
                <option value="">
                  {projets.length === 0 ? 'Aucun projet disponible - Cliquez pour créer un projet' : 'Aucun projet'}
                </option>
                {projets.map((projet) => (
                  <option key={projet.id} value={projet.id}>
                    {projet.nom} ({projet.code_projet || 'N/A'})
                  </option>
                ))}
              </select>
              {projets.length === 0 && (
                <p className="mt-1 text-xs text-gray-500">
                  Aucun projet actif trouvé. <Link to="/projets/nouveau" className="text-blue-600 hover:underline">Créer un projet</Link>
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Échantillon
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                value={formData.echantillon}
                onChange={(e) =>
                  setFormData({ ...formData, echantillon: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observations
              </label>
              <textarea
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                value={formData.observations}
                onChange={(e) =>
                  setFormData({ ...formData, observations: e.target.value })
                }
              />
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate("/essais")}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Enregistrement..." : "Continuer"}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Informations générales
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Numéro:</span>{" "}
                <span className="font-medium">{formData.numero_essai}</span>
              </div>
              <div>
                <span className="text-gray-600">Type:</span>{" "}
                <span className="font-medium">{formData.type_essai}</span>
              </div>
              <div>
                <span className="text-gray-600">Projet:</span>{" "}
                <span className="font-medium">{formData.projet || "-"}</span>
              </div>
              <div>
                <span className="text-gray-600">Échantillon:</span>{" "}
                <span className="font-medium">
                  {formData.echantillon || "-"}
                </span>
              </div>
            </div>
          </div>

          {renderSpecificForm()}

          <div className="flex justify-end space-x-4">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Retour
            </button>
            <button
              onClick={handleFinish}
              className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 transition-colors"
            >
              Terminer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default EssaiForm;
