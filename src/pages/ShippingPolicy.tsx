import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const ShippingPolicy = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('introduction');

  const sections = [
    { id: 'introduction', title: 'Introduction' },
    { id: 'types-deliveries', title: 'Types of Deliveries' },
    { id: 'delivery-timelines', title: 'Delivery Timelines' },
    { id: 'shipping-charges', title: 'Shipping Charges' },
    { id: 'delivery-issues', title: 'Delivery Issues' },
    { id: 'order-tracking', title: 'Order Tracking' },
    { id: 'international-shipping', title: 'International Shipping' },
    { id: 'non-deliverable', title: 'Non-Deliverable Locations' },
    { id: 'incorrect-address', title: 'Incorrect Address / Failed Delivery' },
  ];

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

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
              <h2 className="text-xl font-bold text-blue-600 mb-4">Shipping Policy</h2>
              <nav className="space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`block w-full text-left px-3 py-2 rounded-md transition-colors ${
                      activeSection === section.id
                        ? 'bg-blue-50 text-blue-600 font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {section.title}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Right Column - Content */}
          <div className="lg:w-3/4">
            <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-blue-600 mb-2">Shipping Policy</h1>
              <p className="text-gray-600 mb-8">Last Updated: 04 June 2025</p>

              <div className="space-y-8 text-gray-700">
                <section id="introduction" className="scroll-mt-8">
                  <h2 className="text-2xl font-bold text-blue-600 mb-4">1. Introduction</h2>
                  <p className="leading-relaxed">
                    This Shipping Policy explains how ISML delivers digital learning services, physical materials (if applicable) and access credentials. ISML primarily provides digital services; physical shipments apply only where specified.
                  </p>
                </section>

                <section id="types-deliveries" className="scroll-mt-8">
                  <h2 className="text-2xl font-bold text-blue-600 mb-4">2. Types of Deliveries</h2>
                  
                  <h3 className="text-xl font-bold text-blue-600 mb-2 mt-4">A. Digital Deliveries (Primary Mode)</h3>
                  <p className="mb-2 leading-relaxed">
                    LMS access, PDFs, recorded videos, assignments, e-certificates, digital membership cards, portal logins.
                  </p>
                  <p className="mb-4 leading-relaxed">
                    <strong>Accessible via:</strong> student portal and website.
                  </p>

                  <h3 className="text-xl font-bold text-blue-600 mb-2 mt-4">B. Physical Deliveries (If Applicable)</h3>
                  <p className="leading-relaxed">
                    Printed books, printed certificates, welcome kits, merchandise.
                  </p>
                </section>

                <section id="delivery-timelines" className="scroll-mt-8">
                  <h2 className="text-2xl font-bold text-blue-600 mb-4">3. Delivery Timelines</h2>
                  
                  <h3 className="text-xl font-bold text-blue-600 mb-2 mt-4">Digital Services</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Course Access:</strong> 1-12 hours after payment.</li>
                    <li><strong>LMS Login:</strong> 1-24 hours.</li>
                    <li><strong>Study Materials (PDF):</strong> Instant or within 24 hours.</li>
                    <li><strong>Digital Certificates:</strong> 7-14 working days after course completion.</li>
                  </ul>

                  <h3 className="text-xl font-bold text-blue-600 mb-2 mt-4">Physical Shipping (if applicable)</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Ship within 3-7 working days.</li>
                    <li>Delivery: 7-12 working days depending on location.</li>
                    <li>Tracking information shared via email/SMS/WhatsApp.</li>
                    <li>Usual courier partners: India Post, Delhivery, DTDC, Blue Dart (or equivalent).</li>
                  </ul>
                </section>

                <section id="shipping-charges" className="scroll-mt-8">
                  <h2 className="text-2xl font-bold text-blue-600 mb-4">4. Shipping Charges</h2>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Digital materials:</strong> No shipping fee.</li>
                    <li><strong>Physical items:</strong> Charges depend on weight, location, courier. Typical standard shipping ₹49–₹149; bulk/franchise shipping per agreement.</li>
                  </ul>
                </section>

                <section id="delivery-issues" className="scroll-mt-8">
                  <h2 className="text-2xl font-bold text-blue-600 mb-4">5. Delivery Issues</h2>
                  
                  <h3 className="text-xl font-bold text-blue-600 mb-2 mt-4">Digital Access Issues</h3>
                  <p className="leading-relaxed">
                    Contact support via email, WhatsApp or raise a ticket in the student portal. ISML will resolve within 24–48 hours.
                  </p>

                  <h3 className="text-xl font-bold text-blue-600 mb-2 mt-4">Physical Delivery Issues</h3>
                  <p className="leading-relaxed">
                    ISML is not responsible for courier delays, weather, remote pin codes or incorrect addresses. Returns due to incorrect addresses require re-shipping charges payable by student.
                  </p>
                </section>

                <section id="order-tracking" className="scroll-mt-8">
                  <h2 className="text-2xl font-bold text-blue-600 mb-4">6. Order Tracking</h2>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Digital:</strong> Portal login / Email / WhatsApp confirmations.</li>
                    <li><strong>Physical:</strong> Tracking ID via Email/SMS/WhatsApp and (if enabled) student portal.</li>
                  </ul>
                </section>

                <section id="international-shipping" className="scroll-mt-8">
                  <h2 className="text-2xl font-bold text-blue-600 mb-4">7. International Shipping</h2>
                  <p className="leading-relaxed">
                    ISML does not ship physical items outside India. International students receive digital access only.
                  </p>
                </section>

                <section id="non-deliverable" className="scroll-mt-8">
                  <h2 className="text-2xl font-bold text-blue-600 mb-4">8. Non-Deliverable Locations</h2>
                  <p className="leading-relaxed">
                    If courier cannot service an address, ISML will notify the student; student may cancel or provide an alternate address. Refunds (if eligible) follow Refund Policy.
                  </p>
                </section>

                <section id="incorrect-address" className="scroll-mt-8">
                  <h2 className="text-2xl font-bold text-blue-600 mb-4">9. Incorrect Address / Failed Delivery</h2>
                  <p className="leading-relaxed">
                    Couriers attempt delivery 1-3 times; failed deliveries returned to ISML. Re-delivery costs borne by student. ISML is not liable for wrong address, recipient unavailability, or refusal to accept package.
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

export default ShippingPolicy;
