import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { User, Lock } from 'lucide-react'
import { login, selectAuthLoading, selectAuthError } from '../store/slices/authSlice'
import AuthLayout from '../components/auth/AuthLayout'
import FormField from '../components/auth/FormField'

function LoginPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const isLoading = useSelector(selectAuthLoading)
  const serverError = useSelector(selectAuthError)
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await dispatch(login(formData)).unwrap();
      navigate('/');
    } catch (error) {
      console.error('Error during login:', error);
      // Error is already handled by the Redux store
    }
  };

  return (
    <AuthLayout
      title="Bienvenue"
      subtitle="Connectez-vous à votre compte"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {serverError && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-600">{serverError}</p>
          </div>
        )}

        <div className="space-y-4">
          <FormField
            label="Nom d'utilisateur"
            type="text"
            name="username"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            icon={User}
            required
            autoComplete="username"
          />

          <FormField
            label="Mot de passe"
            type="password"
            name="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            icon={Lock}
            required
            autoComplete="current-password"
          />

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-600">
                Se souvenir de moi
              </span>
            </label>

            <Link
              to="/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Mot de passe oublié ?
            </Link>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className={`
              w-full py-3 px-4 rounded-lg text-white font-medium
              transition-all duration-200
              ${isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-100'
              }
            `}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Connexion en cours...
              </span>
            ) : (
              'Se connecter'
            )}
          </button>
        </div>

        <p className="text-center text-sm text-gray-600 mt-8">
          Vous n'avez pas de compte ?{' '}
          <Link
            to="/register"
            className="font-medium text-blue-600 hover:text-blue-800"
          >
            Créer un compte
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export default LoginPage;
