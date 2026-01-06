import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Globe, MapPin } from 'lucide-react';

const ContactUs = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Login</span>
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - Navigation Menu */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h2 className="text-xl font-bold text-blue-600 mb-4">Contact Us</h2>
              <nav className="space-y-2">
                <div className="px-3 py-2 text-gray-700">
                  <p className="text-sm">Get in touch with Indian School for Modern Languages</p>
                </div>
              </nav>
            </div>
          </div>

          {/* Right Column - Content */}
          <div className="lg:w-3/4">
            <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-blue-600 mb-2">Contact Us</h1>
              <p className="text-gray-600 mb-8">Get in touch with Indian School for Modern Languages</p>

              <div className="space-y-6 text-gray-700">
                <section>
                  <h2 className="text-2xl font-bold text-blue-600 mb-4">Contact Information</h2>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-semibold mb-1">Address</p>
                        <p>Iypan Educational Centre Private Limited</p>
                        <p>8/3, Athreyapuram 2nd Street,</p>
                        <p>Choolaimedu, Chennai - 600094</p>
                        <p>India</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-semibold mb-1">Email</p>
                        <a href="mailto:enquiry.isml@gmail.com" className="text-blue-600 hover:underline">
                          enquiry.isml@gmail.com
                        </a>
                        <br />
                        <a href="mailto:learnwithisml@iypan.in" className="text-blue-600 hover:underline">
                          learnwithisml@iypan.in
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-semibold mb-1">Phone</p>
                        <a href="tel:+917338881781" className="text-blue-600 hover:underline">
                          +91 - 73388 81781
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Globe className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-semibold mb-1">Website</p>
                        <a href="https://www.indianschoolformodernlanguages.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          www.indianschoolformodernlanguages.com
                        </a>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="border-t pt-6">
                  <h2 className="text-2xl font-bold text-blue-600 mb-4">Portals</h2>
                  <div className="space-y-3">
                    <div>
                      <p className="font-semibold mb-1">🎓 Student Portal</p>
                      <a href="https://studentportal.iypan.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        studentportal.iypan.com
                      </a>
                    </div>
                    <div>
                      <p className="font-semibold mb-1">🛠 Admin Portal</p>
                      <a href="https://admin.iypan.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        admin.iypan.com
                      </a>
                    </div>
                  </div>
                </section>

                <section className="border-t pt-6">
                  <h2 className="text-2xl font-bold text-blue-600 mb-4">Office Hours</h2>
                  <p className="leading-relaxed">
                    Our support team is available during business hours. For urgent matters, please email or call us directly.
                  </p>
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
