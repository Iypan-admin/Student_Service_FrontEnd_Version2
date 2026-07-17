import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, BookOpen } from 'lucide-react';

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
      // Scroll only the right content area, not the entire page
      const contentContainer = document.querySelector('.content-container') as HTMLElement;
      if (contentContainer) {
        // Calculate position relative to the content container
        const containerOffset = contentContainer.getBoundingClientRect().top;
        const elementOffset = element.getBoundingClientRect().top;
        const currentScroll = contentContainer.scrollTop;
        const targetScroll = currentScroll + (elementOffset - containerOffset) - 20; // 20px offset from top
        
        contentContainer.scrollTo({
          top: Math.max(0, targetScroll),
          behavior: 'smooth'
        });
      } else {
        // Fallback to default scroll if container not found
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // Update active section based on scroll position in right content area
  useEffect(() => {
    const contentContainer = document.querySelector('.content-container') as HTMLElement;
    if (!contentContainer) return;

    const handleScroll = () => {
      const allSections = sections.map(s => {
        const el = document.getElementById(s.id);
        return el ? { id: s.id, element: el } : null;
      }).filter(Boolean) as Array<{ id: string; element: HTMLElement }>;
      
      const containerRect = contentContainer.getBoundingClientRect();
      let currentSection = 'introduction';
      let minDistance = Infinity;

      // Find the section closest to the top of the visible area
      allSections.forEach(({ id, element }) => {
        const sectionRect = element.getBoundingClientRect();
        const distanceFromTop = Math.abs(sectionRect.top - (containerRect.top + 20));
        
        // Section is in view if it's within the container
        if (sectionRect.top <= containerRect.bottom && sectionRect.bottom >= containerRect.top) {
          if (distanceFromTop < minDistance) {
            minDistance = distanceFromTop;
            currentSection = id;
          }
        }
      });

      setActiveSection(currentSection);
    };

    // Use a small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      contentContainer.addEventListener('scroll', handleScroll);
      handleScroll();
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
      contentContainer.removeEventListener('scroll', handleScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
                    Shipping Policy
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Delivery and shipping information
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
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8" style={{ minHeight: 'calc(100vh - 120px)' }}>
          {/* Left Column - Navigation Menu - BERRY Style - Fixed */}
          <div className="lg:w-1/4 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 sm:p-6 lg:sticky lg:top-24 lg:self-start" style={{ height: 'calc(100vh - 180px)' }}>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg sm:text-xl font-bold text-gray-800">Navigation</h2>
              </div>
              <nav className="space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`block w-full text-left px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                      activeSection === section.id
                        ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 font-semibold border border-blue-200 shadow-sm'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                    }`}
                  >
                    {section.title}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Right Column - Content - BERRY Style - Scrollable */}
          <div className="lg:w-3/4 flex-1 min-w-0 flex flex-col">
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 sm:p-8 content-container overflow-y-auto" style={{ height: 'calc(100vh - 180px)' }}>
              <div className="mb-6 pb-4 border-b border-gray-200">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  Shipping Policy
                </h1>
                <p className="text-sm sm:text-base text-gray-600">Last Updated: 04 June 2025</p>
              </div>

              <div className="space-y-8 text-gray-700">
                <section id="introduction" className="scroll-mt-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-blue-100">1. Introduction</h2>
                  <p className="leading-relaxed">
                    This Shipping Policy explains how ISML delivers digital learning services, physical materials (if applicable) and access credentials. ISML primarily provides digital services; physical shipments apply only where specified.
                  </p>
                </section>

                <section id="types-deliveries" className="scroll-mt-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-blue-100">2. Types of Deliveries</h2>
                  
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 mt-4">A. Digital Deliveries (Primary Mode)</h3>
                  <p className="mb-2 leading-relaxed">
                    LMS access, PDFs, recorded videos, assignments, e-certificates, digital membership cards, portal logins.
                  </p>
                  <p className="mb-4 leading-relaxed">
                    <strong>Accessible via:</strong> student portal and website.
                  </p>

                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 mt-4">B. Physical Deliveries (If Applicable)</h3>
                  <p className="leading-relaxed">
                    Printed books, printed certificates, welcome kits, merchandise.
                  </p>
                </section>

                <section id="delivery-timelines" className="scroll-mt-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-blue-100">3. Delivery Timelines</h2>
                  
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 mt-4">Digital Services</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Course Access:</strong> 1-12 hours after payment.</li>
                    <li><strong>LMS Login:</strong> 1-24 hours.</li>
                    <li><strong>Study Materials (PDF):</strong> Instant or within 24 hours.</li>
                    <li><strong>Digital Certificates:</strong> 7-14 working days after course completion.</li>
                  </ul>

                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 mt-4">Physical Shipping (if applicable)</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Ship within 3-7 working days.</li>
                    <li>Delivery: 7-12 working days depending on location.</li>
                    <li>Tracking information shared via email/SMS/WhatsApp.</li>
                    <li>Usual courier partners: India Post, Delhivery, DTDC, Blue Dart (or equivalent).</li>
                  </ul>
                </section>

                <section id="shipping-charges" className="scroll-mt-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-blue-100">4. Shipping Charges</h2>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Digital materials:</strong> No shipping fee.</li>
                    <li><strong>Physical items:</strong> Charges depend on weight, location, courier. Typical standard shipping ₹49–₹149; bulk/franchise shipping per agreement.</li>
                  </ul>
                </section>

                <section id="delivery-issues" className="scroll-mt-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-blue-100">5. Delivery Issues</h2>
                  
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 mt-4">Digital Access Issues</h3>
                  <p className="leading-relaxed">
                    Contact support via email, WhatsApp or raise a ticket in the student portal. ISML will resolve within 24–48 hours.
                  </p>

                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 mt-4">Physical Delivery Issues</h3>
                  <p className="leading-relaxed">
                    ISML is not responsible for courier delays, weather, remote pin codes or incorrect addresses. Returns due to incorrect addresses require re-shipping charges payable by student.
                  </p>
                </section>

                <section id="order-tracking" className="scroll-mt-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-blue-100">6. Order Tracking</h2>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Digital:</strong> Portal login / Email / WhatsApp confirmations.</li>
                    <li><strong>Physical:</strong> Tracking ID via Email/SMS/WhatsApp and (if enabled) student portal.</li>
                  </ul>
                </section>

                <section id="international-shipping" className="scroll-mt-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-blue-100">7. International Shipping</h2>
                  <p className="leading-relaxed">
                    ISML does not ship physical items outside India. International students receive digital access only.
                  </p>
                </section>

                <section id="non-deliverable" className="scroll-mt-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-blue-100">8. Non-Deliverable Locations</h2>
                  <p className="leading-relaxed">
                    If courier cannot service an address, ISML will notify the student; student may cancel or provide an alternate address. Refunds (if eligible) follow Refund Policy.
                  </p>
                </section>

                <section id="incorrect-address" className="scroll-mt-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-blue-100">9. Incorrect Address / Failed Delivery</h2>
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
