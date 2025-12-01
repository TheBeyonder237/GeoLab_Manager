import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { User, Lock, Mail, UserPlus } from 'lucide-react';
import { register, selectAuthLoading, selectAuthError } from '../store/slices/authSlice';
import AuthLayout from '../components/auth/AuthLayout';
import FormField from '../components/auth/FormField';

function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isLoading = useSelector(selectAuthLoading);
  const serverError = useSelector(selectAuthError);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    full_name: ''
  });
  const [validationError, setValidationError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError(null);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setValidationError('Les mots de passe ne correspondent pas');
      return;
    }

    try {
      // Suppression du champ confirmPassword avant d'envoyer au serveur
      const { confirmPassword, ...registerData } = formData;
      await dispatch(register(registerData)).unwrap();
      navigate('/login');
    } catch (error) {
      console.error('Error during registration:', error);
      // L'erreur est déjà gérée par le store Redux
    }
  };

  return (
    <AuthLayout
      title="Créer un compte"
      subtitle="Rejoignez GeoLab Manager"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {(validationError || serverError) && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-600">{validationError || serverError}</p>
          </div>
        )}

        <div className="space-y-4">
          <FormField
            label="Nom complet"
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            icon={User}
            required
            autoComplete="name"
          />

          <FormField
            label="Nom d'utilisateur"
            type="text"
            name="username"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            icon={UserPlus}
            required
            autoComplete="username"
          />

          <FormField
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            icon={Mail}
            required
            autoComplete="email"
          />

          <FormField
            label="Mot de passe"
            type="password"
            name="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            icon={Lock}
            required
            autoComplete="new-password"
          />

          <FormField
            label="Confirmer le mot de passe"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            icon={Lock}
            required
            autoComplete="new-password"
          />
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
                Inscription en cours...
              </span>
            ) : (
              'Créer mon compte'
            )}
          </button>
        </div>

        <p className="text-center text-sm text-gray-600 mt-8">
          Vous avez déjà un compte ?{' '}
          <Link
            to="/login"
            className="font-medium text-blue-600 hover:text-blue-800"
          >
            Se connecter
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export default RegisterPage;
