import useDarkMode from '../hooks/useDarkMode';

export default function SettingsPage() {
  const [darkMode, toggleDarkMode] = useDarkMode();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-gray-600 mt-1">
          Personnalisez votre expérience GeoLab Manager.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Apparence</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Mode sombre</p>
            <p className="text-xs text-gray-500">Active un thème sombre pour l'ensemble de l'interface.</p>
          </div>
          <button
            onClick={toggleDarkMode}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              darkMode ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                darkMode ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
        <p className="text-sm text-gray-600">
          (À implémenter) Choisir quelles notifications recevoir (nouveau projet, essai validé, non-conformité, etc.).
        </p>
      </div>
    </div>
  );
}
