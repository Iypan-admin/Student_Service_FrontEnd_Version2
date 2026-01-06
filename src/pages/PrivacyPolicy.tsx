import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

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
              <h2 className="text-xl font-bold text-blue-600 mb-4">Privacy Policy</h2>
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
              <h1 className="text-3xl sm:text-4xl font-bold text-blue-600 mb-2">Privacy Policy</h1>
              <p className="text-gray-600 mb-8">Effective starting: October 2, 2024 (view archived versions)</p>

              <div className="space-y-8 text-gray-700">
                <section id="overview" className="scroll-mt-8">
                  <h2 className="text-2xl font-bold text-blue-600 mb-4">What this policy covers</h2>
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
                  <h2 className="text-2xl font-bold text-blue-600 mb-4">1. Information We Collect</h2>
                  <p className="mb-3 leading-relaxed">We may collect the following types of information when you use our website or services:</p>
                  
                  <h3 className="text-xl font-bold text-blue-600 mb-2 mt-4">1.1 Personal Information</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Full name, email address, phone number, and postal address</li>
                    <li>Date of birth, gender, nationality, and educational background (for course enrollment)</li>
                    <li>Payment details for course registration (processed securely via third-party payment providers)</li>
                    <li>Any other details you voluntarily provide (e.g., inquiries, feedback, or job applications)</li>
                  </ul>

                  <h3 className="text-xl font-bold text-blue-600 mb-2 mt-4">1.2 Non-Personal Information</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Browser type, device information, and operating system</li>
                    <li>IP address and geographic location (if enabled by your device)</li>
                    <li>Website usage data, such as pages visited and time spent on our site</li>
                  </ul>
                </section>

                <section id="legal-basis" className="scroll-mt-8">
                  <h2 className="text-2xl font-bold text-blue-600 mb-4">2. Legal Basis for Data Processing (GDPR & DPDP Compliance)</h2>
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
                  <h2 className="text-2xl font-bold text-blue-600 mb-4">3. How We Use Your Information</h2>
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
                  <h2 className="text-2xl font-bold text-blue-600 mb-4">4. Data Sharing & Third-Party Disclosures</h2>
                  <p className="mb-3 leading-relaxed">We may share your data with:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Service providers (e.g., payment gateways, email platforms, cloud storage)</li>
                    <li>Government authorities when required by law</li>
                    <li>Accredited institutions or partners for certification, training, or placements</li>
                  </ul>
                  <p className="mt-3 leading-relaxed">All third-party providers comply with GDPR, DPDP Act, and IT Act security standards.</p>
                </section>

                <section id="international-transfers" className="scroll-mt-8">
                  <h2 className="text-2xl font-bold text-blue-600 mb-4">5. International Data Transfers (GDPR Compliance)</h2>
                  <p className="mb-3 leading-relaxed">If we transfer your data outside the European Economic Area (EEA), we ensure adequate safeguards are in place, such as:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Data Protection Agreements with third parties</li>
                    <li>Standard Contractual Clauses (SCCs) approved by the European Commission</li>
                  </ul>
                </section>

                <section id="data-retention" className="scroll-mt-8">
                  <h2 className="text-2xl font-bold text-blue-600 mb-4">6. Data Retention Policy</h2>
                  <p className="mb-3 leading-relaxed">We retain your personal data only for as long as necessary:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Course-related data:</strong> 5 years after completion</li>
                    <li><strong>Financial transaction data:</strong> As per tax & legal requirements</li>
                    <li><strong>Marketing preferences:</strong> Until you opt-out</li>
                  </ul>
                  <p className="mt-3 leading-relaxed">Upon request, we delete or anonymize data per GDPR and DPDP guidelines.</p>
                </section>

                <section id="your-rights" className="scroll-mt-8">
                  <h2 className="text-2xl font-bold text-blue-600 mb-4">7. Your Rights Under GDPR & Indian Data Protection Laws</h2>
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
                  <h2 className="text-2xl font-bold text-blue-600 mb-4">8. Cookies & Tracking Technologies</h2>
                  <p className="leading-relaxed">
                    We use cookies to enhance user experience. You can control or disable cookies via your browser settings.
                  </p>
                </section>

                <section id="data-security" className="scroll-mt-8">
                  <h2 className="text-2xl font-bold text-blue-600 mb-4">9. Data Security Measures</h2>
                  <p className="mb-3 leading-relaxed">We implement:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Encryption for data storage and transmission</li>
                    <li>Secure servers with restricted access</li>
                    <li>Regular security audits to prevent unauthorized access</li>
                  </ul>
                  <p className="mt-3 leading-relaxed">However, no system is 100% secure. You share data at your own risk.</p>
                </section>

                <section id="third-party-links" className="scroll-mt-8">
                  <h2 className="text-2xl font-bold text-blue-600 mb-4">10. Third-Party Links</h2>
                  <p className="leading-relaxed">
                    Our website may contain links to external websites. We are not responsible for their privacy practices. Please review their policies before sharing data.
                  </p>
                </section>

                <section id="changes" className="scroll-mt-8">
                  <h2 className="text-2xl font-bold text-blue-600 mb-4">11. Changes to This Privacy Policy</h2>
                  <p className="leading-relaxed">
                    We may update this policy periodically. Significant changes will be notified via email or website notice.
                  </p>
                </section>

                <section id="contact" className="scroll-mt-8">
                  <h2 className="text-2xl font-bold text-blue-600 mb-4">12. Contact Us</h2>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-semibold mb-2">Indian School for Modern Languages (ISML)</p>
                    <p className="font-semibold mb-2">IYPAN Educational Centre Pvt. Ltd.</p>
                    <p className="mb-1">📩 Email: learnwithisml@iypan.in</p>
                    <p className="mb-1">📞 Phone: +91-7338881781</p>
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
