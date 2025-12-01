import { Calculator, Plus, Trash2, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../services/api";
import CBRGraph from '../graphs/CBRGraph';

function CBRForm({ essaiId, initialData, onSave }) {
  const [formData, setFormData] = useState({
    // Conditions de préparation
    teneur_eau_preparation: "",
    densite_seche_preparation: "",
    energie_compactage: "",
    nombre_couches: "",
    nombre_coups: "",

    // Forces mesurées
    force_25mm: "",
    force_50mm: "",

    // Conditions après essai
    teneur_eau_finale: "",
    densite_seche_finale: "",
    gonflement: "",
    temps_immersion: "",
  });

  const [penetrationPoints, setPenetrationPoints] = useState([
    { penetration_mm: "", force_kN: "" },
  ]);

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({ ...prev, ...initialData }));
      if (initialData.points_penetration) {
        setPenetrationPoints(
          initialData.points_penetration.length > 0
            ? initialData.points_penetration
            : [{ penetration_mm: "", force_kN: "" }]
        );
      }
      if (
        initialData.cbr_final ||
        initialData.cbr_25mm ||
        initialData.cbr_50mm
      ) {
        setResults({
          cbr_25mm: initialData.cbr_25mm,
          cbr_50mm: initialData.cbr_50mm,
          cbr_final: initialData.cbr_final,
          classe_portance: initialData.classe_portance,
          module_ev2: initialData.module_ev2,
        });
      }
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value === "" ? "" : parseFloat(value) || "",
    }));
  };

  const handlePointChange = (index, field, value) => {
    const newPoints = [...penetrationPoints];
    newPoints[index] = {
      ...newPoints[index],
      [field]: value === "" ? "" : parseFloat(value) || "",
    };
    setPenetrationPoints(newPoints);

    // Extraire automatiquement les forces à 2.5mm et 5.0mm
    const point25 = newPoints.find(
      (p) => Math.abs(p.penetration_mm - 2.5) < 0.1
    );
    const point50 = newPoints.find(
      (p) => Math.abs(p.penetration_mm - 5.0) < 0.1
    );

    if (point25) {
      setFormData((prev) => ({ ...prev, force_25mm: point25.force_kN }));
    }
    if (point50) {
      setFormData((prev) => ({ ...prev, force_50mm: point50.force_kN }));
    }
  };

  const addPoint = () => {
    setPenetrationPoints([
      ...penetrationPoints,
      { penetration_mm: "", force_kN: "" },
    ]);
  };

  const removePoint = (index) => {
    if (penetrationPoints.length > 1) {
      setPenetrationPoints(penetrationPoints.filter((_, i) => i !== index));
    }
  };

  const calculateResults = async () => {
    if (!essaiId) {
      toast.error("Veuillez d'abord créer l'essai");
      return;
    }

    if (!formData.force_25mm && !formData.force_50mm) {
      toast.error("Au moins une force (2.5mm ou 5.0mm) est requise");
      return;
    }

    setLoading(true);
    try {
      const data = {
        essai_id: essaiId,
        ...Object.fromEntries(
          Object.entries(formData).map(([key, value]) => [
            key,
            value === ""
              ? null
              : typeof value === "string" && !isNaN(value)
              ? parseFloat(value)
              : value,
          ])
        ),
        points_penetration: penetrationPoints
          .filter((p) => p.penetration_mm && p.force_kN)
          .map((p) => ({
            penetration_mm: parseFloat(p.penetration_mm),
            force_kN: parseFloat(p.force_kN),
          })),
      };

      let response;
      if (initialData?.id) {
        response = await api.put(`/essais/cbr/${initialData.id}`, data);
      } else {
        response = await api.post("/essais/cbr/", data);
      }

      setResults({
        cbr_25mm: response.data.cbr_25mm,
        cbr_50mm: response.data.cbr_50mm,
        cbr_final: response.data.cbr_final,
        classe_portance: response.data.classe_portance,
        module_ev2: response.data.module_ev2,
      });

      toast.success("Calculs effectués avec succès !");
      if (onSave) onSave(response.data);
    } catch (error) {
      console.error("Erreur lors du calcul:", error);
      toast.error(error.response?.data?.detail || "Erreur lors du calcul");
    } finally {
      setLoading(false);
    }
  };

  // Préparer les données pour le graphique
  const chartData = penetrationPoints
    .filter((p) => p.penetration_mm && p.force_kN)
    .map((p) => ({
      penetration: parseFloat(p.penetration_mm),
      force: parseFloat(p.force_kN),
      name: `${p.penetration_mm}mm`,
    }))
    .sort((a, b) => a.penetration - b.penetration);

  return (
    <div className="space-y-6">
      {/* Conditions de préparation */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
          Conditions de préparation - NF P94-078
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Teneur en eau préparation (%)
            </label>
            <input
              type="number"
              step="0.01"
              name="teneur_eau_preparation"
              value={formData.teneur_eau_preparation}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Densité sèche préparation (g/cm³)
            </label>
            <input
              type="number"
              step="0.001"
              name="densite_seche_preparation"
              value={formData.densite_seche_preparation}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Énergie de compactage
            </label>
            <select
              name="energie_compactage"
              value={formData.energie_compactage}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sélectionner...</option>
              <option value="OPM">OPM</option>
              <option value="OPM+2%">OPM+2%</option>
              <option value="OPM-2%">OPM-2%</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Nombre de couches
            </label>
            <input
              type="number"
              name="nombre_couches"
              value={formData.nombre_couches}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="3"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Nombre de coups/couche
            </label>
            <input
              type="number"
              name="nombre_coups"
              value={formData.nombre_coups}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="56"
            />
          </div>
        </div>
      </div>

      {/* Courbe de pénétration */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Courbe de pénétration
          </h3>
          <button
            onClick={addPoint}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Ajouter un point
          </button>
        </div>

        <div className="space-y-4">
          {penetrationPoints.map((point, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-4 bg-gray-50"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-700">Point {index + 1}</h4>
                {penetrationPoints.length > 1 && (
                  <button
                    onClick={() => removePoint(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Pénétration (mm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={point.penetration_mm}
                    onChange={(e) =>
                      handlePointChange(index, "penetration_mm", e.target.value)
                    }
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    placeholder="2.5"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Force (kN)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={point.force_kN}
                    onChange={(e) =>
                      handlePointChange(index, "force_kN", e.target.value)
                    }
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    placeholder="3.5"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Forces directes (alternative) */}
        <div className="mt-6 grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Force à 2.5mm (kN)
            </label>
            <input
              type="number"
              step="0.01"
              name="force_25mm"
              value={formData.force_25mm}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Force à 5.0mm (kN)
            </label>
            <input
              type="number"
              step="0.01"
              name="force_50mm"
              value={formData.force_50mm}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Conditions après essai */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Conditions après essai
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Teneur en eau finale (%)
            </label>
            <input
              type="number"
              step="0.01"
              name="teneur_eau_finale"
              value={formData.teneur_eau_finale}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Densité sèche finale (g/cm³)
            </label>
            <input
              type="number"
              step="0.001"
              name="densite_seche_finale"
              value={formData.densite_seche_finale}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Gonflement (mm)
            </label>
            <input
              type="number"
              step="0.1"
              name="gonflement"
              value={formData.gonflement}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Temps d'immersion (h)
            </label>
            <input
              type="number"
              name="temps_immersion"
              value={formData.temps_immersion}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="96"
            />
          </div>
        </div>
      </div>

      {/* Graphique */}
      {(penetrationPoints.length > 0 || results) && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <CBRGraph 
            data={{
              points_penetration: penetrationPoints,
              force_25mm: formData.force_25mm,
              force_50mm: formData.force_50mm
            }} 
          />
        </div>
      )}

      {/* Résultats */}
      {results && (
        <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg shadow-lg p-6 border-2 border-blue-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Calculator className="w-6 h-6 text-blue-600" />
            Résultats Calculés
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {results.cbr_25mm && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-xs text-gray-500 uppercase">CBR 2.5mm</div>
                <div className="text-2xl font-bold text-blue-600">
                  {results.cbr_25mm}%
                </div>
              </div>
            )}
            {results.cbr_50mm && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-xs text-gray-500 uppercase">CBR 5.0mm</div>
                <div className="text-2xl font-bold text-green-600">
                  {results.cbr_50mm}%
                </div>
              </div>
            )}
            {results.cbr_final && (
              <div className="bg-white rounded-lg p-4 shadow-sm border-2 border-blue-500">
                <div className="text-xs text-gray-500 uppercase">CBR Final</div>
                <div className="text-2xl font-bold text-purple-600">
                  {results.cbr_final}%
                </div>
              </div>
            )}
            {results.classe_portance && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-xs text-gray-500 uppercase">Classe</div>
                <div className="text-lg font-semibold text-gray-800">
                  {results.classe_portance}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bouton de calcul */}
      <div className="flex justify-end">
        <button
          onClick={calculateResults}
          disabled={
            loading ||
            !essaiId ||
            (!formData.force_25mm && !formData.force_50mm)
          }
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg transition-all duration-200 hover:shadow-xl"
        >
          <Calculator className="w-5 h-5" />
          {loading ? "Calcul en cours..." : "Calculer les résultats"}
        </button>
      </div>
    </div>
  );
}

export default CBRForm;
