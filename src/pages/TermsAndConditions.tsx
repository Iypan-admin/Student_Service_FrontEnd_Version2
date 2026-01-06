import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

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
              <h2 className="text-xl font-bold text-blue-600 mb-4">Terms & Conditions</h2>
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
              <h1 className="text-3xl sm:text-4xl font-bold text-blue-600 mb-2">Terms & Conditions</h1>
              <p className="text-gray-600 mb-8">Effective Date: 04 June 2025</p>

              <div className="space-y-8 text-gray-700">
                <section id="introduction" className="scroll-mt-8">
                  <h2 className="text-2xl font-bold text-blue-600 mb-4">1. Introduction</h2>
                  <p className="leading-relaxed">
                    These Terms & Conditions ("Terms") govern the use of all services, platforms, programs and operations provided by Indian School for Modern Languages (ISML), operated by Iypan Educational Centre Private Limited, through its websites, portals, online classes, offline centres and franchise networks. By accessing any ISML website, portal or enrolling in any program, you agree to these Terms.
                  </p>
                </section>

                <section id="platforms" className="scroll-mt-8">
                  <h2 className="text-2xl font-bold text-blue-600 mb-4">2. Official Platforms Covered Under These Terms</h2>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Website: indianschoolformodernlanguages.com</li>
                    <li>Student Portal: studentportal.iypan.com</li>
                    <li>Admin Portal: admin.iypan.com</li>
                  </ul>
                  <p className="mt-3 leading-relaxed">These Terms apply to all websites, internal systems, CRM, LMS and third-party tools used by ISML.</p>
                </section>

                <section id="definitions" className="scroll-mt-8">
                  <h2 className="text-2xl font-bold text-blue-600 mb-4">3. Definitions</h2>
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
                  <h2 className="text-2xl font-bold text-blue-600 mb-4">4. Eligibility</h2>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Minimum age for enrollment: 9 years.</li>
                    <li>Users must provide accurate personal and academic details.</li>
                    <li>Minors must enroll with parental/guardian consent.</li>
                  </ul>
                </section>

                <section id="enrollment" className="scroll-mt-8">
                  <h2 className="text-2xl font-bold text-blue-600 mb-4">5. Student Enrollment & Fees</h2>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Enrollment is confirmed only upon successful fee payment.</li>
                    <li>Fees are non-refundable, non-transferable and non-adjustable unless specified in the Refund & Cancellation Policy.</li>
                    <li>ISML may change course fees without prior notice.</li>
                    <li>Discounts, promotions and memberships are time-bound and discretionary.</li>
                  </ul>
                </section>

                <section id="class-rules" className="scroll-mt-8">
                  <h2 className="text-2xl font-bold text-blue-600 mb-4">6. Class Rules & Attendance</h2>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Students must attend classes on time.</li>
                    <li>Missed classes will not be compensated unless approved by ISML.</li>
                    <li>ISML may reschedule classes, change faculty, or shift platforms when required.</li>
                  </ul>
                </section>

                <section id="study-materials" className="scroll-mt-8">
                  <h2 className="text-2xl font-bold text-blue-600 mb-4">7. Study Materials, Videos & LMS</h2>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>All materials provided via student portal, admin portal, LMS or WhatsApp are owned by ISML.</li>
                    <li>Users must not copy, forward, screen-record, publish or distribute ISML content.</li>
                    <li>Violations may lead to account suspension and legal action.</li>
                  </ul>
                </section>

                <section id="assessments" className="scroll-mt-8">
                  <h2 className="text-2xl font-bold text-blue-600 mb-4">8. Assessments, Certifications & Exams</h2>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Internal assessments are mandatory.</li>
                    <li>ISML certificates are provided only to eligible students.</li>
                    <li>International exam fees (DELF/DALF/Goethe/JLPT/TCF) are not included unless clearly specified.</li>
                  </ul>
                </section>

                <section id="behaviour" className="scroll-mt-8">
                  <h2 className="text-2xl font-bold text-blue-600 mb-4">9. Behaviour & Code of Conduct</h2>
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
                  <h2 className="text-2xl font-bold text-blue-600 mb-4">10. Portal Usage Rules</h2>
                  <p className="mb-3 leading-relaxed">
                    <strong>Student Portal:</strong> studentportal.iypan.com<br />
                    <strong>Admin Portal:</strong> admin.iypan.com
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
                  <h2 className="text-2xl font-bold text-blue-600 mb-4">11. Intellectual Property</h2>
                  <p className="leading-relaxed">
                    All logos, course structures, PDFs, videos, LMS content, study materials, branding and portals/CRM code are the exclusive property of ISML / Iypan Educational Centre Private Limited. Copying or sharing is strictly prohibited.
                  </p>
                </section>

                <section id="payment-refund" className="scroll-mt-8">
                  <h2 className="text-2xl font-bold text-blue-600 mb-4">12. Payment & Refund Policy</h2>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>No refunds for voluntary withdrawal, attendance issues or personal reasons unless expressly permitted by the Refund & Cancellation Policy.</li>
                    <li>ISML may offer refunds only in exceptional, admin-approved cases.</li>
                    <li>Refunds, if approved, take 15-30 business days.</li>
                    <li>Payment disputes must be emailed to ISML with proof.</li>
                  </ul>
                </section>

                <section id="limitation" className="scroll-mt-8">
                  <h2 className="text-2xl font-bold text-blue-600 mb-4">13. Limitation of Liability</h2>
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
                  <h2 className="text-2xl font-bold text-blue-600 mb-4">14. Modifications</h2>
                  <p className="leading-relaxed">
                    ISML reserves the right to update the Terms at any time. Updates will be published on the Website, Student Portal and Admin Portal. Continued use constitutes acceptance.
                  </p>
                </section>

                <section id="governing-law" className="scroll-mt-8">
                  <h2 className="text-2xl font-bold text-blue-600 mb-4">15. Governing Law</h2>
                  <p className="leading-relaxed">
                    These Terms are governed by the laws of India, with jurisdiction at Chennai, Tamil Nadu.
                  </p>
                </section>

                <section id="contact" className="scroll-mt-8">
                  <h2 className="text-2xl font-bold text-blue-600 mb-4">16. Contact Information</h2>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-semibold mb-2">Iypan Educational Centre Private Limited</p>
                    <p className="mb-1">8/3, Athreyapuram 2nd Street,</p>
                    <p className="mb-1">Choolaimedu, Chennai - 600094</p>
                    <p className="mb-1">📩 Email: enquiry.isml@gmail.com</p>
                    <p className="mb-1">📞 Phone: +91 - 73388 81781</p>
                    <p className="mb-1">🌐 Website: www.indianschoolformodernlanguages.com</p>
                    <p className="mb-1">🎓 Student Portal: studentportal.iypan.com</p>
                    <p className="mb-1">🛠 Admin Portal: admin.iypan.com</p>
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
