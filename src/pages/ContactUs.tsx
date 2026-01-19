import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Globe, MapPin, FileText } from 'lucide-react';

const ContactUs = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar - BERRY Style */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4 min-h-[4rem]">
            <div className="flex items-center gap-4">
              {/* Title Section - BERRY Style */}
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shadow-md"
                  style={{
                    background: "linear-gradient(to bottom right, #2196f3, #1976d2)",
                  }}
                >
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                    Contact Us
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Get in touch with ISML
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Login</span>
                <span className="sm:hidden">Back</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Left Column - Info Card - BERRY Style */}
          <div className="lg:w-1/4 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 sm:p-6 lg:sticky lg:top-24 lg:self-start">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3">Contact Us</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Get in touch with Indian School for Modern Languages. We're here to help you with any questions or concerns.
              </p>
            </div>
          </div>

          {/* Right Column - Content - BERRY Style */}
          <div className="lg:w-3/4 flex-1 min-w-0">
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 sm:p-8">
              <div className="mb-6 pb-4 border-b border-gray-200">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  Contact Us
                </h1>
                <p className="text-sm sm:text-base text-gray-600">Get in touch with Indian School for Modern Languages</p>
              </div>

              <div className="space-y-8 text-gray-700">
                <section>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 pb-2 border-b border-blue-100">Contact Information</h2>
                  <div className="grid gap-4 sm:gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 sm:p-6 rounded-xl border border-blue-200 shadow-sm">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-md">
                          <MapPin className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-900 mb-2 text-base sm:text-lg">Address</p>
                          <div className="text-sm sm:text-base text-gray-700 space-y-1">
                            <p>Iypan Educational Centre Private Limited</p>
                            <p>8/3, Athreyapuram 2nd Street,</p>
                            <p>Choolaimedu, Chennai - 600094</p>
                            <p>India</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 sm:p-6 rounded-xl border border-blue-200 shadow-sm">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-md">
                          <Mail className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-900 mb-2 text-base sm:text-lg">Email</p>
                          <div className="text-sm sm:text-base space-y-1">
                            <a href="mailto:enquiry.isml@gmail.com" className="text-blue-700 hover:text-blue-800 hover:underline font-medium block">
                              enquiry.isml@gmail.com
                            </a>
                            <a href="mailto:learnwithisml@iypan.in" className="text-blue-700 hover:text-blue-800 hover:underline font-medium block">
                              learnwithisml@iypan.in
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 sm:p-6 rounded-xl border border-blue-200 shadow-sm">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-md">
                          <Phone className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-900 mb-2 text-base sm:text-lg">Phone</p>
                          <a href="tel:+917338881781" className="text-blue-700 hover:text-blue-800 hover:underline font-medium text-sm sm:text-base">
                            +91 - 73388 81781
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 sm:p-6 rounded-xl border border-blue-200 shadow-sm">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-md">
                          <Globe className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-900 mb-2 text-base sm:text-lg">Website</p>
                          <a href="https://www.indianschoolformodernlanguages.com" target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:text-blue-800 hover:underline font-medium text-sm sm:text-base">
                            www.indianschoolformodernlanguages.com
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="border-t border-gray-200 pt-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-blue-100">Portals</h2>
                  <div className="grid gap-4 sm:gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 sm:p-6 rounded-xl border border-blue-200 shadow-sm">
                      <p className="font-bold text-gray-900 mb-2 text-base sm:text-lg">🎓 Student Portal</p>
                      <a href="https://studentportal.iypan.com" target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:text-blue-800 hover:underline font-medium text-sm sm:text-base">
                        studentportal.iypan.com
                      </a>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 sm:p-6 rounded-xl border border-blue-200 shadow-sm">
                      <p className="font-bold text-gray-900 mb-2 text-base sm:text-lg">🛠 Admin Portal</p>
                      <a href="https://admin.iypan.com" target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:text-blue-800 hover:underline font-medium text-sm sm:text-base">
                        admin.iypan.com
                      </a>
                    </div>
                  </div>
                </section>

                <section className="border-t border-gray-200 pt-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-blue-100">Office Hours</h2>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 sm:p-6 rounded-xl border border-blue-200 shadow-sm">
                    <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                      Our support team is available during business hours. For urgent matters, please email or call us directly.
                    </p>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
