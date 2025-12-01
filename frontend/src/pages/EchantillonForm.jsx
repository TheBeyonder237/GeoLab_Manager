import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Flask, 
  Save, 
  ArrowLeft, 
  Map, 
  Upload, 
  Trash2, 
  Plus,
  X,
  Camera
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function EchantillonForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [projets, setProjets] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [previewPhotos, setPreviewPhotos] = useState([]);
  const [formData, setFormData] = useState({
    reference: '',
    projet_id: '',
    date_prelevement: new Date().toISOString().split('T')[0],
    lieu_prelevement: '',
    coordonnees: { latitude: '', longitude: '' },
    profondeur_debut: '',
    profondeur_fin: '',
    methode_prelevement: 'manuel',
    type_echantillon: 'sol',
    description: '',
    couleur: '',
    humidite: '',
    texture: '',
    particularites: '',
    conditions_stockage: '',
    localisation_stockage: '',
    temperature_stockage: '',
    humidite_stockage: '',
    quantite_initiale: '',
    unite_quantite: 'kg',
    commentaires: ''
  });

  useEffect(() => {
    loadProjets();
    if (id) {
      loadEchantillon();
    }
  }, [id]);

  const loadProjets = async () => {
    try {
      const response = await api.get('/projets/');
      setProjets(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des projets:', error);
      toast.error('Erreur lors du chargement des projets');
    }
  };

  const loadEchantillon = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/echantillons/${id}`);
      const data = response.data;
      
      // Formater les données pour le formulaire
      setFormData({
        ...data,
        date_prelevement: data.date_prelevement.split('T')[0],
        coordonnees: data.coordonnees || { latitude: '', longitude: '' }
      });
      
      if (data.photos) {
        setPhotos(data.photos);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'échantillon:', error);
      toast.error('Erreur lors du chargement de l\'échantillon');
      navigate('/echantillons');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      
      // Préparer les données
      const data = {
        ...formData,
        coordonnees: {
          latitude: parseFloat(formData.coordonnees.latitude) || null,
          longitude: parseFloat(formData.coordonnees.longitude) || null
        }
      };
      
      // Nettoyer les valeurs vides
      Object.keys(data).forEach(key => {
        if (data[key] === '') {
          data[key] = null;
        }
      });
      
      let response;
      if (id) {
        response = await api.put(`/echantillons/${id}`, data);
      } else {
        response = await api.post('/echantillons/', data);
      }
      
      // Upload des photos si nécessaire
      if (previewPhotos.length > 0) {
        const formData = new FormData();
        previewPhotos.forEach(photo => {
          formData.append('files', photo);
        });
        
        await api.post(`/echantillons/${response.data.id}/photos`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }
      
      toast.success(
        id 
          ? 'Échantillon mis à jour avec succès'
          : 'Échantillon créé avec succès'
      );
      navigate(`/echantillons/${response.data.id}`);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    setPreviewPhotos(prev => [...prev, ...files]);
    
    // Créer les previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPreviewPhotos(prev => prev.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-5xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/echantillons')}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {id ? 'Modifier l\'échantillon' : 'Nouvel échantillon'}
              </h1>
              <p className="text-gray-600">
                {id ? 'Modifier les informations de l\'échantillon' : 'Créer un nouvel échantillon'}
              </p>
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Informations de base */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Informations de base
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Référence
              </label>
              <input
                type="text"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Référence unique de l'échantillon"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Projet
              </label>
              <select
                value={formData.projet_id}
                onChange={(e) => setFormData({ ...formData, projet_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Sélectionner un projet</option>
                {projets.map((projet) => (
                  <option key={projet.id} value={projet.id}>
                    {projet.nom}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type d'échantillon
              </label>
              <select
                value={formData.type_echantillon}
                onChange={(e) => setFormData({ ...formData, type_echantillon: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="sol">Sol</option>
                <option value="roche">Roche</option>
                <option value="granulat">Granulat</option>
                <option value="eau">Eau</option>
                <option value="autre">Autre</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de prélèvement
              </label>
              <input
                type="date"
                value={formData.date_prelevement}
                onChange={(e) => setFormData({ ...formData, date_prelevement: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Localisation */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Localisation
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lieu de prélèvement
              </label>
              <input
                type="text"
                value={formData.lieu_prelevement}
                onChange={(e) => setFormData({ ...formData, lieu_prelevement: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                placeholder="Description du lieu"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.coordonnees.latitude}
                  onChange={(e) => setFormData({
                    ...formData,
                    coordonnees: {
                      ...formData.coordonnees,
                      latitude: e.target.value
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: 48.8566"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.coordonnees.longitude}
                  onChange={(e) => setFormData({
                    ...formData,
                    coordonnees: {
                      ...formData.coordonnees,
                      longitude: e.target.value
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: 2.3522"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Profondeur début (m)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.profondeur_debut}
                  onChange={(e) => setFormData({ ...formData, profondeur_debut: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: 1.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Profondeur fin (m)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.profondeur_fin}
                  onChange={(e) => setFormData({ ...formData, profondeur_fin: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: 2.0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Méthode de prélèvement
              </label>
              <select
                value={formData.methode_prelevement}
                onChange={(e) => setFormData({ ...formData, methode_prelevement: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="tariere">Tarière</option>
                <option value="carottage">Carottage</option>
                <option value="pelle">Pelle</option>
                <option value="manuel">Manuel</option>
                <option value="autre">Autre</option>
              </select>
            </div>
          </div>

          {/* Caractéristiques */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Caractéristiques
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Description détaillée de l'échantillon"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Couleur
                </label>
                <input
                  type="text"
                  value={formData.couleur}
                  onChange={(e) => setFormData({ ...formData, couleur: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Brun foncé"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Humidité
                </label>
                <input
                  type="text"
                  value={formData.humidite}
                  onChange={(e) => setFormData({ ...formData, humidite: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Sec, Humide"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Texture
              </label>
              <input
                type="text"
                value={formData.texture}
                onChange={(e) => setFormData({ ...formData, texture: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Sableux, Argileux"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Particularités
              </label>
              <textarea
                value={formData.particularites}
                onChange={(e) => setFormData({ ...formData, particularites: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
                placeholder="Particularités notables"
              />
            </div>
          </div>

          {/* Stockage */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Stockage et quantité
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantité initiale
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={formData.quantite_initiale}
                    onChange={(e) => setFormData({ ...formData, quantite_initiale: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    placeholder="Ex: 5.0"
                  />
                  <select
                    value={formData.unite_quantite}
                    onChange={(e) => setFormData({ ...formData, unite_quantite: e.target.value })}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="l">L</option>
                    <option value="ml">mL</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Localisation stockage
                </label>
                <input
                  type="text"
                  value={formData.localisation_stockage}
                  onChange={(e) => setFormData({ ...formData, localisation_stockage: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Étagère A3"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Conditions de stockage
              </label>
              <input
                type="text"
                value={formData.conditions_stockage}
                onChange={(e) => setFormData({ ...formData, conditions_stockage: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Température ambiante, à l'abri de la lumière"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Température (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.temperature_stockage}
                  onChange={(e) => setFormData({ ...formData, temperature_stockage: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: 20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Humidité (%)
                </label>
                <input
                  type="number"
                  step="1"
                  value={formData.humidite_stockage}
                  onChange={(e) => setFormData({ ...formData, humidite_stockage: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: 50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Photos */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Photos
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {photos.map((photo, index) => (
              <div
                key={index}
                className="relative aspect-square rounded-lg overflow-hidden border border-gray-200"
              >
                <img
                  src={photo}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            
            <label className="relative aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 cursor-pointer flex flex-col items-center justify-center">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <Camera className="w-8 h-8 text-gray-400" />
              <span className="mt-2 text-sm text-gray-500">
                Ajouter des photos
              </span>
            </label>
          </div>
        </div>

        {/* Commentaires */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Commentaires
          </h2>
          
          <textarea
            value={formData.commentaires}
            onChange={(e) => setFormData({ ...formData, commentaires: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
            placeholder="Commentaires additionnels"
          />
        </div>
      </form>
    </div>
  );
}
