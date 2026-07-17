import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, BookOpen } from 'lucide-react';

const TermsAndConditions = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('introduction');

  const sections = [
    { id: 'introduction', title: 'Introduction' },
    { id: 'platforms', title: 'Official Platforms' },
    { id: 'definitions', title: 'Definitions' },
    { id: 'eligibility', title: 'Eligibility' },
    { id: 'enrollment', title: 'Student Enrollment & Fees' },
    { id: 'class-rules', title: 'Class Rules & Attendance' },
    { id: 'study-materials', title: 'Study Materials, Videos & LMS' },
    { id: 'assessments', title: 'Assessments, Certifications & Exams' },
    { id: 'behaviour', title: 'Behaviour & Code of Conduct' },
    { id: 'portal-usage', title: 'Portal Usage Rules' },
    { id: 'intellectual-property', title: 'Intellectual Property' },
    { id: 'payment-refund', title: 'Payment & Refund Policy' },
    { id: 'limitation', title: 'Limitation of Liability' },
    { id: 'modifications', title: 'Modifications' },
    { id: 'governing-law', title: 'Governing Law' },
    { id: 'contact', title: 'Contact Information' },
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
                    Terms & Conditions
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Legal terms and policies
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
                  Terms & Conditions
                </h1>
                <p className="text-sm sm:text-base text-gray-600">Effective Date: 04 June 2025</p>
              </div>

              <div className="space-y-8 text-gray-700">
                <section id="introduction" className="scroll-mt-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-blue-100">1. Introduction</h2>
                  <p className="leading-relaxed">
                    These Terms & Conditions ("Terms") govern the use of all services, platforms, programs and operations provided by Indian School for Modern Languages (ISML), operated by Iypan Educational Centre Private Limited, through its websites, portals, online classes, offline centres and franchise networks. By accessing any ISML website, portal or enrolling in any program, you agree to these Terms.
                  </p>
                </section>

                <section id="platforms" className="scroll-mt-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-blue-100">2. Official Platforms Covered Under These Terms</h2>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Website: indianschoolformodernlanguages.com</li>
                    <li>Student Portal: ismlstudents.iypan.com</li>
                    <li>Admin Portal: ismladmin.iypan.com</li>
                  </ul>
                  <p className="mt-3 leading-relaxed">These Terms apply to all websites, internal systems, CRM, LMS and third-party tools used by ISML.</p>
                </section>

                <section id="definitions" className="scroll-mt-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-blue-100">3. Definitions</h2>
                  <ul className="space-y-2">
                    <li><strong>Company</strong> - Iypan Educational Centre Private Limited</li>
                    <li><strong>ISML</strong> - Indian School for Modern Languages</li>
                    <li><strong>Student</strong> - Any registered learner</li>
                    <li><strong>User</strong> - Anyone accessing ISML systems</li>
                    <li><strong>Franchisee / Synergy Partner</strong> - Franchise partners operating under ISML Synergy</li>
                    <li><strong>Master Franchisee (MF)</strong> - State-level franchise leader</li>
                    <li><strong>Portal</strong> - ISML student portal and admin portal</li>
                    <li><strong>Content</strong> - Course materials, LMS resources, videos, documents, etc.</li>
                  </ul>
                </section>

                <section id="eligibility" className="scroll-mt-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-blue-100">4. Eligibility</h2>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Minimum age for enrollment: 9 years.</li>
                    <li>Users must provide accurate personal and academic details.</li>
                    <li>Minors must enroll with parental/guardian consent.</li>
                  </ul>
                </section>

                <section id="enrollment" className="scroll-mt-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-blue-100">5. Student Enrollment & Fees</h2>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Enrollment is confirmed only upon successful fee payment.</li>
                    <li>Fees are non-refundable, non-transferable and non-adjustable unless specified in the Refund & Cancellation Policy.</li>
                    <li>ISML may change course fees without prior notice.</li>
                    <li>Discounts, promotions and memberships are time-bound and discretionary.</li>
                  </ul>
                </section>

                <section id="class-rules" className="scroll-mt-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-blue-100">6. Class Rules & Attendance</h2>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Students must attend classes on time.</li>
                    <li>Missed classes will not be compensated unless approved by ISML.</li>
                    <li>ISML may reschedule classes, change faculty, or shift platforms when required.</li>
                  </ul>
                </section>

                <section id="study-materials" className="scroll-mt-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-blue-100">7. Study Materials, Videos & LMS</h2>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>All materials provided via student portal, admin portal, LMS or WhatsApp are owned by ISML.</li>
                    <li>Users must not copy, forward, screen-record, publish or distribute ISML content.</li>
                    <li>Violations may lead to account suspension and legal action.</li>
                  </ul>
                </section>

                <section id="assessments" className="scroll-mt-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-blue-100">8. Assessments, Certifications & Exams</h2>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Internal assessments are mandatory.</li>
                    <li>ISML certificates are provided only to eligible students.</li>
                    <li>International exam fees (DELF/DALF/Goethe/JLPT/TCF) are not included unless clearly specified.</li>
                  </ul>
                </section>

                <section id="behaviour" className="scroll-mt-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-blue-100">9. Behaviour & Code of Conduct</h2>
                  <p className="mb-3 leading-relaxed">Users must not:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Harass faculty or staff.</li>
                    <li>Share vulgar or abusive content.</li>
                    <li>Disrupt online/offline classes.</li>
                    <li>Manipulate attendance or certification rules.</li>
                    <li>Misuse ISML name, brand or social media assets.</li>
                  </ul>
                  <p className="mt-3 leading-relaxed">Accounts may be terminated immediately for misconduct.</p>
                </section>

                <section id="portal-usage" className="scroll-mt-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-blue-100">10. Portal Usage Rules</h2>
                  <p className="mb-3 leading-relaxed">
                    <strong>Student Portal:</strong> ismlstudents.iypan.com<br />
                    <strong>Admin Portal:</strong> ismladmin.iypan.com
                  </p>
                  <p className="mb-3 leading-relaxed">Users agree to:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Keep login credentials confidential.</li>
                    <li>Not share screenshots, passwords or recordings of protected content.</li>
                    <li>Use the platform only for educational purposes.</li>
                    <li>Report technical issues immediately.</li>
                  </ul>
                  <p className="mt-3 leading-relaxed">Unauthorized access will lead to suspension.</p>
                </section>

                <section id="intellectual-property" className="scroll-mt-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-blue-100">11. Intellectual Property</h2>
                  <p className="leading-relaxed">
                    All logos, course structures, PDFs, videos, LMS content, study materials, branding and portals/CRM code are the exclusive property of ISML / Iypan Educational Centre Private Limited. Copying or sharing is strictly prohibited.
                  </p>
                </section>

                <section id="payment-refund" className="scroll-mt-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-blue-100">12. Payment & Refund Policy</h2>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>No refunds for voluntary withdrawal, attendance issues or personal reasons unless expressly permitted by the Refund & Cancellation Policy.</li>
                    <li>ISML may offer refunds only in exceptional, admin-approved cases.</li>
                    <li>Refunds, if approved, take 15-30 business days.</li>
                    <li>Payment disputes must be emailed to ISML with proof.</li>
                  </ul>
                </section>

                <section id="limitation" className="scroll-mt-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-blue-100">13. Limitation of Liability</h2>
                  <p className="mb-3 leading-relaxed">ISML is not liable for:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Network/technical issues.</li>
                    <li>International exam outcomes.</li>
                    <li>Student academic performance.</li>
                    <li>Franchisee mismanagement (unless proven attributable to ISML).</li>
                    <li>Third-party tool issues (Zoom, Google Meet, WhatsApp, Razorpay, etc.).</li>
                  </ul>
                </section>

                <section id="modifications" className="scroll-mt-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-blue-100">14. Modifications</h2>
                  <p className="leading-relaxed">
                    ISML reserves the right to update the Terms at any time. Updates will be published on the Website, Student Portal and Admin Portal. Continued use constitutes acceptance.
                  </p>
                </section>

                <section id="governing-law" className="scroll-mt-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-blue-100">15. Governing Law</h2>
                  <p className="leading-relaxed">
                    These Terms are governed by the laws of India, with jurisdiction at Chennai, Tamil Nadu.
                  </p>
                </section>

                <section id="contact" className="scroll-mt-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-blue-100">16. Contact Information</h2>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 sm:p-6 rounded-xl border border-blue-200 shadow-sm">
                    <p className="font-bold text-gray-900 mb-3 text-base sm:text-lg">Iypan Educational Centre Private Limited</p>
                    <div className="space-y-2 text-sm sm:text-base text-gray-700">
                      <p className="mb-1">8/3, Athreyapuram 2nd Street,</p>
                      <p className="mb-1">Choolaimedu, Chennai - 600094</p>
                      <p className="mb-1">📩 Email: enquiry.isml@gmail.com</p>
                      <p className="mb-1">📞 Phone: +91 - 73388 81781</p>
                      <p className="mb-1">🌐 Website: www.indianschoolformodernlanguages.com</p>
                      <p className="mb-1">🎓 Student Portal: ismlstudents.iypan.com</p>
                      <p className="mb-1">🛠 Admin Portal: ismladmin.iypan.com</p>
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

export default TermsAndConditions;
