import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const Header = () => (
  <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-20">
    <div className="max-w-7xl mx-auto px-6 py-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-lg">Q</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900">Qvent</h1>
      </div>
    </div>
  </header>
);

const CheckmarkIcon = () => (
  <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

const LoadingSpinner = () => (
  <div className="animate-spin">
    <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full"></div>
  </div>
);

// Markdown to HTML Renderer
const MarkdownRenderer = ({ text }) => {
  if (!text) return null;
  
  let html = text
    .split('\n')
    .map(line => {
      // Headings
      if (line.startsWith('# ')) return `<h2 class="text-xl font-bold mt-4 mb-2">${line.slice(2)}</h2>`;
      if (line.startsWith('## ')) return `<h3 class="text-lg font-bold mt-3 mb-2">${line.slice(3)}</h3>`;
      if (line.startsWith('### ')) return `<h4 class="text-base font-bold mt-2 mb-1">${line.slice(4)}</h4>`;
      // Lists
      if (line.startsWith('- ')) return `<li class="ml-4">${line.slice(2)}</li>`;
      return line;
    })
    .join('\n');

  // Inline formatting
  html = html
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
    .replace(/(?<!<li class="ml-4">)(.+?)(?=<li|<h|$)/g, (match) => {
      if (match.trim()) return `<p class="mb-2">${match.trim()}</p>`;
      return match;
    });

  return <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: html }} />;
};

// Countdown Timer
const CountdownTimer = ({ expiryDate }) => {
  const [timeLeft, setTimeLeft] = useState({});

  const countdown = useMemo(() => {
    const eventDate = new Date(expiryDate);
    const now = new Date();
    const diff = eventDate - now;

    if (diff <= 0) {
      return { expired: true, days: 0, hours: 0, mins: 0, secs: 0 };
    }

    return {
      expired: false,
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      mins: Math.floor((diff / (1000 * 60)) % 60),
      secs: Math.floor((diff / 1000) % 60),
    };
  }, [expiryDate]);

  useEffect(() => {
    setTimeLeft(countdown);
    const interval = setInterval(() => {
      const eventDate = new Date(expiryDate);
      const now = new Date();
      const diff = eventDate - now;

      if (diff <= 0) {
        setTimeLeft({ expired: true, days: 0, hours: 0, mins: 0, secs: 0 });
        clearInterval(interval);
      } else {
        setTimeLeft({
          expired: false,
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          mins: Math.floor((diff / (1000 * 60)) % 60),
          secs: Math.floor((diff / 1000) % 60),
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiryDate]);

  if (timeLeft.expired) {
    return <div className="text-center p-2 bg-red-100 border border-red-300 rounded text-red-700 font-bold text-xs">Event Expired</div>;
  }

  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-4 gap-1">
        {[
          { label: 'Days', value: timeLeft.days },
          { label: 'Hours', value: timeLeft.hours },
          { label: 'Mins', value: timeLeft.mins },
          { label: 'Secs', value: timeLeft.secs },
        ].map((item) => (
          <div key={item.label} className="bg-white bg-opacity-20 rounded p-1.5 text-center transform hover:scale-105 transition-transform">
            <div className="text-sm font-bold text-white">{String(item.value).padStart(2, '0')}</div>
            <div className="text-xs text-indigo-100">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function EventPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const BASE_PATH = import.meta.env.VITE_API_BASE_URL;
  const [event, setEvent] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // Check if ID exists
  useEffect(() => {
    if (!id) navigate("/404");
  }, [id, navigate]);

  // Fetch event
  useEffect(() => {
    if (!id) return;

    const fetchEvent = async () => {
      try {
        const res = await axios.get(`${BASE_PATH}/public/event/${id}`);
        setEvent(res.data);
      } catch (err) {
        const status = err.response?.status;
        if (status === 404) navigate("/404");
        else if (status === 403 || status === 410) setError("This event is closed or expired");
        else setError("Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id, BASE_PATH, navigate]);

  // Validate form
  const validateForm = () => {
    const errors = {};
    for (const field of event.fields) {
      if (field.required && !formData[field.id]) {
        errors[field.id] = `${field.label} is required`;
      }
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit handler
  const submit = async () => {
    if (!validateForm()) return;

    // If paid event, show payment modal
    if (event.category === "paid") {
      setShowPaymentModal(true);
      return;
    }

    // If free event, submit directly
    submitFormData();
  };

  // Process payment and submit
  const processPayment = async () => {
    setPaymentProcessing(true);
    // Simulate payment processing
    setTimeout(() => {
      setPaymentProcessing(false);
      setShowPaymentModal(false);
      submitFormData();
    }, 2000);
  };

  // Submit form data
  const submitFormData = async () => {
    setSubmitting(true);
    try {
      await axios.post(`${BASE_PATH}/public/event/${id}/submit`, formData);
      setSubmitted(true);
      setTimeout(() => navigate("/success"), 2000);
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) alert("You have already submitted this form");
      else if (status === 403 || status === 410) alert("This event is closed");
      else alert(err.response?.data?.message || "Submission failed");
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-73px)]">
          <div className="text-center">
            <LoadingSpinner />
            <p className="mt-4 text-gray-600 font-medium">Loading event...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-73px)] p-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Event Closed</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate("/")}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-medium transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-73px)]">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4"><CheckmarkIcon /></div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Submission Successful!</h2>
            <p className="text-gray-600">Thank you for registering. Redirecting...</p>
          </div>
        </div>
      </div>
    );
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const CollapsibleSection = ({ title, icon, section, children }) => (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden animate-fade-in">
      <button
        onClick={() => toggleSection(section)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{icon}</span>
          <h3 className="font-semibold text-gray-900">{title}</h3>
        </div>
        <svg
          className={`w-5 h-5 text-gray-600 transition-transform duration-300 ${expandedSections[section] ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>
      {expandedSections[section] && (
        <div className="px-4 pb-4 border-t border-gray-100 animate-slide-down">
          {children}
        </div>
      )}
    </div>
  );

  // Payment Modal Component
  const PaymentModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
          <h2 className="text-2xl font-bold">Complete Payment</h2>
          <p className="text-indigo-100 text-sm mt-1">Secure payment gateway</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Amount */}
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-gray-600 text-sm mb-1">Amount Due</p>
            <p className="text-3xl font-bold text-indigo-600">₹{event.amount}</p>
          </div>

          {/* Payment Methods */}
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-3">Select Payment Method</p>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-3 p-3 border-2 border-indigo-200 rounded-lg hover:bg-indigo-50 transition-all">
                <span className="text-xl">💳</span>
                <div className="text-left">
                  <p className="font-semibold text-gray-900 text-sm">Credit/Debit Card</p>
                  <p className="text-xs text-gray-600">Visa, Mastercard, Amex</p>
                </div>
              </button>
              <button className="w-full flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
                <span className="text-xl">📱</span>
                <div className="text-left">
                  <p className="font-semibold text-gray-900 text-sm">UPI/Wallet</p>
                  <p className="text-xs text-gray-600">Google Pay, PayTM, etc.</p>
                </div>
              </button>
              <button className="w-full flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
                <span className="text-xl">🏦</span>
                <div className="text-left">
                  <p className="font-semibold text-gray-900 text-sm">Net Banking</p>
                  <p className="text-xs text-gray-600">All major banks</p>
                </div>
              </button>
            </div>
          </div>

          {/* Processing Info */}
          {paymentProcessing && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center animate-pulse">
              <div className="flex justify-center mb-2">
                <div className="animate-spin">
                  <div className="w-6 h-6 border-3 border-blue-300 border-t-blue-600 rounded-full"></div>
                </div>
              </div>
              <p className="text-sm font-semibold text-blue-900">Processing your payment...</p>
              <p className="text-xs text-blue-700 mt-1">Please do not refresh this page</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowPaymentModal(false)}
              disabled={paymentProcessing}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={processPayment}
              disabled={paymentProcessing}
              className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {paymentProcessing ? (
                <>
                  <div className="animate-spin">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  </div>
                  Processing...
                </>
              ) : (
                <>
                  ✓ Pay Now
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center">🔒 Your payment information is secure</p>
        </div>
      </div>
    </div>
  );

  // Main form
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-down {
          from { opacity: 0; max-height: 0; }
          to { opacity: 1; max-height: 1000px; }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.7); }
          50% { box-shadow: 0 0 0 10px rgba(99, 102, 241, 0); }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out;
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.5s ease-out;
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s infinite;
        }
      `}</style>

      <main className="max-w-5xl mx-auto px-3 py-6">
        {/* Compact Header */}
        <div className="mb-6 animate-slide-up">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{event.name}</h1>
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            {event.category === "free" ? (
              <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-bold">
                🎁 FREE
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-bold">
                💰 ₹{event.amount}
              </span>
            )}
            <span className="text-gray-600">
              📅 {new Date(event.expiryDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {/* Left: Compact Event Info - Collapsible */}
          <div className="space-y-3">
            {/* Countdown - Prominent */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg shadow-lg p-4 text-white animate-pulse-glow">
              <p className="text-xs font-semibold text-indigo-200 mb-2">EVENT STARTS IN</p>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { label: 'D', value: 0 },
                  { label: 'H', value: 0 },
                  { label: 'M', value: 0 },
                  { label: 'S', value: 0 },
                ].map((item) => (
                  <div key={item.label} className="bg-white bg-opacity-20 rounded p-1.5 text-center hover:bg-opacity-30 transition-all">
                    <div className="text-sm font-bold">00</div>
                    <div className="text-xs opacity-80">{item.label}</div>
                  </div>
                ))}
              </div>
              <div className="mt-2 pt-2 border-t border-white border-opacity-30 text-xs">
                <CountdownTimer expiryDate={event.expiryDate} />
              </div>
            </div>

            {/* Event Description */}
            {event.description && (
              <CollapsibleSection title="About" icon="📝" section="description">
                <div className="text-xs text-gray-700 space-y-1">
                  <MarkdownRenderer text={event.description} />
                </div>
              </CollapsibleSection>
            )}

            {/* Contact Info */}
            <CollapsibleSection title="Contact" icon="☎️" section="contact">
              <div className="space-y-1 text-xs">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-gray-600">{event.contactName}</span>
                  <a href={`tel:${event.contactPhone}`} className="text-indigo-600 font-semibold hover:text-indigo-700">
                    {event.contactPhone}
                  </a>
                </div>
              </div>
            </CollapsibleSection>

            {/* Location */}
            {event.location && (
              <CollapsibleSection title="Location" icon="📍" section="location">
                <div className="text-xs">
                  {event.locationType === "url" ? (
                    <a
                      href={event.location}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1"
                    >
                      View Maps →
                    </a>
                  ) : (
                    <p className="text-gray-700">{event.location}</p>
                  )}
                </div>
              </CollapsibleSection>
            )}
          </div>

          {/* Right: Form - Main Focus */}
          <div className="md:col-span-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-16">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Register Now</h2>
              
              <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-3.5">
                {event.fields.map((field, index) => (
                  <div key={index} className="group animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                    <label className="block text-xs font-semibold text-gray-900 mb-1.5 group-hover:text-indigo-600 transition-colors">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>

                    {field.type !== "dropdown" ? (
                      <input
                        type={field.type === "mobile" ? "tel" : field.type}
                        placeholder={`${field.label}...`}
                        value={formData[field.id] || ""}
                        onChange={(e) => {
                          setFormData({ ...formData, [field.id]: e.target.value });
                          if (validationErrors[field.id]) {
                            setValidationErrors({ ...validationErrors, [field.id]: "" });
                          }
                        }}
                        className={`w-full px-3 py-2.5 text-xs rounded-md border-2 transition-all duration-200 focus:outline-none transform group-hover:scale-102 ${
                          validationErrors[field.id]
                            ? "border-red-500 bg-red-50 focus:ring-2 focus:ring-red-500"
                            : "border-gray-200 bg-gray-50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                        }`}
                      />
                    ) : (
                      <select
                        value={formData[field.id] || ""}
                        onChange={(e) => {
                          setFormData({ ...formData, [field.id]: e.target.value });
                          if (validationErrors[field.id]) {
                            setValidationErrors({ ...validationErrors, [field.id]: "" });
                          }
                        }}
                        className={`w-full px-3 py-2.5 text-xs rounded-md border-2 transition-all duration-200 focus:outline-none transform group-hover:scale-102 ${
                          validationErrors[field.id]
                            ? "border-red-500 bg-red-50 focus:ring-2 focus:ring-red-500"
                            : "border-gray-200 bg-gray-50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                        }`}
                      >
                        <option value="">Select {field.label}</option>
                        {field.options?.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}

                    {validationErrors[field.id] && (
                      <p className="mt-1 text-xs text-red-600 font-medium animate-slide-down flex items-center gap-1">
                        ⚠️ {validationErrors[field.id]}
                      </p>
                    )}
                  </div>
                ))}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full mt-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white py-3 px-4 rounded-md font-bold text-sm transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      </div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Register</span>
                    </>
                  )}
                </button>
              </form>

              <p className="text-xs text-gray-500 text-center mt-3">✓ Your information is secure</p>
            </div>
          </div>
        </div>
      </main>

      {/* Payment Modal */}
      {showPaymentModal && <PaymentModal />}
    </div>
  );
}
