export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="w-full max-w-md relative">
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <div className="mb-6">
            <div className="h-16 flex items-center justify-center">
              <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                GeoLab Manager
              </span>
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900">
            {title}
          </h2>

          {subtitle && (
            <p className="mt-2 text-gray-600">
              {subtitle}
            </p>
          )}
        </div>

        {/* Carte d'authentification */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden hover:shadow-2xl transition-shadow duration-300">
          <div className="p-8">
            {children}
          </div>
        </div>

        {/* Bordures décoratives */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" />
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full" />
      </div>
    </div>
  );
}
