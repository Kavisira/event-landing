import { useNavigate } from "react-router-dom";

const CheckCircleIcon = () => (
  <svg className="w-24 h-24 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ConfettiPiece = ({ delay, duration, left, top }) => (
  <div
    className="fixed pointer-events-none"
    style={{
      left: `${left}%`,
      top: `${top}%`,
      animation: `fall ${duration}s linear ${delay}s infinite`,
    }}
  >
    <div className="text-4xl">🎉</div>
  </div>
);

export default function Success() {
  const navigate = useNavigate();

  const confetti = Array.from({ length: 12 }).map((_, i) => ({
    id: i,
    delay: (i * 0.1) % 2,
    duration: 2 + (i % 3),
    left: Math.random() * 100,
    top: Math.random() * 20 - 10,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4 overflow-hidden relative">
      <style>{`
        @keyframes fall {
          to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
        @keyframes bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Confetti Animation */}
      {confetti.map((piece) => (
        <ConfettiPiece
          key={piece.id}
          delay={piece.delay}
          duration={piece.duration}
          left={piece.left}
          top={piece.top}
        />
      ))}

      {/* Success Card */}
      <div className="w-full max-w-2xl">
        <div
          className="bg-white rounded-3xl shadow-2xl p-8 sm:p-12 text-center"
          style={{ animation: "slideIn 0.6s ease-out" }}
        >
          {/* Icon */}
          <div
            className="flex justify-center mb-8"
            style={{ animation: "bounce 1s ease-in-out infinite" }}
          >
            <CheckCircleIcon />
          </div>

          {/* Main Message */}
          <h1 className="text-4xl sm:text-5xl font-bold text-green-600 mb-4">
            Submitted Successfully!
          </h1>

          {/* Description */}
          <p className="text-lg sm:text-xl text-gray-600 mb-3 leading-relaxed">
            Thank you for your submission
          </p>

          <p className="text-base text-gray-500 mb-8 max-w-xl mx-auto">
            Your form has been received and recorded. We appreciate your participation and will review your information shortly.
          </p>

          {/* Success Badge */}
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-8">
            <p className="text-green-800 font-semibold">
              ✓ Your submission has been confirmed
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate("/")}
              className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Explore More Events
            </button>
            <button
              onClick={() => window.location.href = "/"}
              className="px-8 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all duration-200"
            >
              Home
            </button>
          </div>

          {/* Additional Info */}
          <p className="text-sm text-gray-500 mt-8">
            You will receive a confirmation email shortly
          </p>
        </div>
      </div>
    </div>
  );
}
