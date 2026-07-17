import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, BookOpen } from 'lucide-react';

const PrivacyPolicy = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', title: 'What this policy covers' },
    { id: 'information-collect', title: 'Information We Collect' },
    { id: 'legal-basis', title: 'Legal Basis for Data Processing' },
    { id: 'how-we-use', title: 'How We Use Your Information' },
    { id: 'data-sharing', title: 'Data Sharing & Third-Party Disclosures' },
    { id: 'international-transfers', title: 'International Data Transfers' },
    { id: 'data-retention', title: 'Data Retention Policy' },
    { id: 'your-rights', title: 'Your Rights Under GDPR & Indian Laws' },
    { id: 'cookies', title: 'Cookies & Tracking Technologies' },
    { id: 'data-security', title: 'Data Security Measures' },
    { id: 'third-party-links', title: 'Third-Party Links' },
    { id: 'changes', title: 'Changes to This Privacy Policy' },
    { id: 'contact', title: 'Contact Us' },
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
      let currentSection = 'overview';
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
                    Privacy Policy
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Data protection and privacy information
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
                  Privacy Policy
                </h1>
                <p className="text-sm sm:text-base text-gray-600">Effective starting: October 2, 2024 (view archived versions)</p>
              </div>

              <div className="space-y-8 text-gray-700">
                <section id="overview" className="scroll-mt-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-blue-100">What this policy covers</h2>
                  <p className="leading-relaxed mb-3">
                    Your privacy is important to us, and so is being transparent about how we collect, use, and share information about you. This policy is intended to help you understand:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>What information we collect about you</li>
                    <li>How we use information we collect</li>
                    <li>How we disclose information we collect</li>
                    <li>How we store and secure information we collect</li>
                    <li>How long we keep information</li>
                    <li>How to access and control your information</li>
                  </ul>
                </section>

                <section id="information-collect" className="scroll-mt-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-blue-100">1. Information We Collect</h2>
                  <p className="mb-3 leading-relaxed">We may collect the following types of information when you use our website or services:</p>
                  
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 mt-4">1.1 Personal Information</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Full name, email address, phone number, and postal address</li>
                    <li>Date of birth, gender, nationality, and educational background (for course enrollment)</li>
                    <li>Payment details for course registration (processed securely via third-party payment providers)</li>
                    <li>Any other details you voluntarily provide (e.g., inquiries, feedback, or job applications)</li>
                  </ul>

                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 mt-4">1.2 Non-Personal Information</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Browser type, device information, and operating system</li>
                    <li>IP address and geographic location (if enabled by your device)</li>
                    <li>Website usage data, such as pages visited and time spent on our site</li>
                  </ul>
                </section>

                <section id="legal-basis" className="scroll-mt-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-blue-100">2. Legal Basis for Data Processing (GDPR & DPDP Compliance)</h2>
                  <p className="mb-3 leading-relaxed">We process your data based on:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Consent</strong> – When you voluntarily provide personal data (e.g., signing up for courses or newsletters).</li>
                    <li><strong>Contractual Necessity</strong> – To provide educational services as per your enrollment.</li>
                    <li><strong>Legitimate Interests</strong> – To improve our services and user experience.</li>
                    <li><strong>Legal Obligation</strong> – To comply with regulatory requirements under Indian law and GDPR.</li>
                  </ul>
                  <p className="mt-3 leading-relaxed">You have the right to withdraw your consent at any time.</p>
                </section>

                <section id="how-we-use" className="scroll-mt-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-blue-100">3. How We Use Your Information</h2>
                  <p className="mb-3 leading-relaxed">Your data is used for:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Processing course enrollments and providing educational services</li>
                    <li>Sending course updates, exam schedules, and administrative communications</li>
                    <li>Personalizing user experience and improving website functionality</li>
                    <li>Processing payments securely and preventing fraudulent transactions</li>
                    <li>Complying with legal and regulatory requirements</li>
                  </ul>
                  <p className="mt-3 leading-relaxed">We do not sell, rent, or trade your personal data.</p>
                </section>

                <section id="data-sharing" className="scroll-mt-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-blue-100">4. Data Sharing & Third-Party Disclosures</h2>
                  <p className="mb-3 leading-relaxed">We may share your data with:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Service providers (e.g., payment gateways, email platforms, cloud storage)</li>
                    <li>Government authorities when required by law</li>
                    <li>Accredited institutions or partners for certification, training, or placements</li>
                  </ul>
                  <p className="mt-3 leading-relaxed">All third-party providers comply with GDPR, DPDP Act, and IT Act security standards.</p>
                </section>

                <section id="international-transfers" className="scroll-mt-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-blue-100">5. International Data Transfers (GDPR Compliance)</h2>
                  <p className="mb-3 leading-relaxed">If we transfer your data outside the European Economic Area (EEA), we ensure adequate safeguards are in place, such as:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Data Protection Agreements with third parties</li>
                    <li>Standard Contractual Clauses (SCCs) approved by the European Commission</li>
                  </ul>
                </section>

                <section id="data-retention" className="scroll-mt-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-blue-100">6. Data Retention Policy</h2>
                  <p className="mb-3 leading-relaxed">We retain your personal data only for as long as necessary:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Course-related data:</strong> 5 years after completion</li>
                    <li><strong>Financial transaction data:</strong> As per tax & legal requirements</li>
                    <li><strong>Marketing preferences:</strong> Until you opt-out</li>
                  </ul>
                  <p className="mt-3 leading-relaxed">Upon request, we delete or anonymize data per GDPR and DPDP guidelines.</p>
                </section>

                <section id="your-rights" className="scroll-mt-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-blue-100">7. Your Rights Under GDPR & Indian Data Protection Laws</h2>
                  <p className="mb-3 leading-relaxed">Under GDPR (for EU users), you have the right to:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Access, correct, or delete your data</li>
                    <li>Restrict or object to processing</li>
                    <li>Data portability (receive your data in a structured format)</li>
                    <li>Lodge a complaint with a Data Protection Authority (DPA)</li>
                  </ul>
                  <p className="mt-4 mb-3 leading-relaxed">Under the DPDP Act & IT Act (India), you have the right to:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Know how your data is being collected and used</li>
                    <li>Seek correction or deletion of your personal data</li>
                    <li>Withdraw consent at any time</li>
                  </ul>
                  <p className="mt-3 leading-relaxed">To exercise these rights, contact us at learnwithisml@iypan.in.</p>
                </section>

                <section id="cookies" className="scroll-mt-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-blue-100">8. Cookies & Tracking Technologies</h2>
                  <p className="leading-relaxed">
                    We use cookies to enhance user experience. You can control or disable cookies via your browser settings.
                  </p>
                </section>

                <section id="data-security" className="scroll-mt-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-blue-100">9. Data Security Measures</h2>
                  <p className="mb-3 leading-relaxed">We implement:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Encryption for data storage and transmission</li>
                    <li>Secure servers with restricted access</li>
                    <li>Regular security audits to prevent unauthorized access</li>
                  </ul>
                  <p className="mt-3 leading-relaxed">However, no system is 100% secure. You share data at your own risk.</p>
                </section>

                <section id="third-party-links" className="scroll-mt-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-blue-100">10. Third-Party Links</h2>
                  <p className="leading-relaxed">
                    Our website may contain links to external websites. We are not responsible for their privacy practices. Please review their policies before sharing data.
                  </p>
                </section>

                <section id="changes" className="scroll-mt-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-blue-100">11. Changes to This Privacy Policy</h2>
                  <p className="leading-relaxed">
                    We may update this policy periodically. Significant changes will be notified via email or website notice.
                  </p>
                </section>

                <section id="contact" className="scroll-mt-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-blue-100">12. Contact Us</h2>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 sm:p-6 rounded-xl border border-blue-200 shadow-sm">
                    <p className="font-bold text-gray-900 mb-3 text-base sm:text-lg">Indian School for Modern Languages (ISML)</p>
                    <p className="font-bold text-gray-900 mb-3 text-base sm:text-lg">IYPAN Educational Centre Pvt. Ltd.</p>
                    <div className="space-y-2 text-sm sm:text-base text-gray-700">
                      <p className="mb-1">📩 Email: learnwithisml@iypan.in</p>
                      <p className="mb-1">📞 Phone: +91-7338881781</p>
                    </div>
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

export default PrivacyPolicy;
