import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-12 text-center">
          {/* 404 Icon */}
          <div className="mb-8">
            <div className="text-7xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent mb-4">
              404
            </div>
            <svg className="w-24 h-24 mx-auto text-red-500 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          {/* Error Message */}
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Page Not Found
          </h1>

          <p className="text-lg sm:text-xl text-gray-600 mb-8">
            The page you're looking for doesn't exist or has been removed.
          </p>

          {/* Illustration */}
          <div className="bg-gradient-to-br from-orange-100 to-red-100 rounded-2xl p-8 mb-8">
            <svg className="w-32 h-32 mx-auto text-orange-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M13 10V3L4 14h7v7l9-11h-7z" clipRule="evenodd" />
            </svg>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate("/")}
              className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Explore Events
            </button>
            <button
              onClick={() => window.history.back()}
              className="px-8 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all duration-200"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
