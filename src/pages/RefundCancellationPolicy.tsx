import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, BookOpen } from 'lucide-react';

const RefundCancellationPolicy = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('general-policy');

  const sections = [
    { id: 'general-policy', title: 'General Policy' },
    { id: 'exceptions', title: 'Exceptions for Refund Eligibility' },
    { id: 'natural-calamities', title: 'Natural Calamities / Force Majeure' },
    { id: 'operational-issues', title: 'ISML-Side Operational Issues' },
    { id: 'midway-cancellation', title: 'Student Midway Cancellation' },
    { id: 'non-refundable', title: 'Non-Refundable Items' },
    { id: 'duplicate-payments', title: 'Duplicate / Excess Payments' },
    { id: 'course-cancellation', title: 'Course Cancellation by ISML' },
    { id: 'processing-time', title: 'Processing Time' },
    { id: 'chargeback', title: 'Chargeback Policy' },
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
      let currentSection = 'general-policy';
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
                    Refund & Cancellation Policy
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Refund and cancellation terms
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
                  Refund & Cancellation Policy
                </h1>
                <p className="text-sm sm:text-base text-gray-600">Last Updated: 04 June 2025</p>
              </div>

              <div className="space-y-8 text-gray-700">
                <section id="general-policy" className="scroll-mt-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-blue-100">1. General Policy</h2>
                  <p className="leading-relaxed">
                    All course fees, memberships and program fees paid to ISML are non-refundable, non-transferable and non-adjustable, except in specific exceptional cases subject to ISML management approval (see below).
                  </p>
                </section>

                <section id="exceptions" className="scroll-mt-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-blue-100">2. Exceptions for Refund Eligibility (subject to approval)</h2>
                  
                  <div id="natural-calamities" className="scroll-mt-8 mt-6">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3">2.1 Natural Calamities / Force Majeure</h3>
                    <p className="mb-3 leading-relaxed">
                      A refund may be processed if: a government-declared natural calamity directly prevents ISML from conducting the course and the batch cannot continue for more than 30 days.
                    </p>
                    <p className="leading-relaxed">
                      <strong>Remedies:</strong> Full refund, batch transfer or course credit valid for 6 months.
                    </p>
                  </div>

                  <div id="operational-issues" className="scroll-mt-8 mt-6">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3">2.2 ISML-Side Operational Issues</h3>
                    <p className="mb-3 leading-relaxed">
                      Refunds may be considered if ISML cancels a batch permanently, is unable to assign a teacher for more than 21 consecutive days, discontinues the course permanently, or repeatedly cancels classes due to internal faults.
                    </p>
                    <p className="leading-relaxed">
                      <strong>Remedies:</strong> Full refund, free batch transfer, extended LMS access or course credit.
                    </p>
                  </div>

                  <div id="midway-cancellation" className="scroll-mt-8 mt-6">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3">2.3 Student Midway Cancellation — Special Category Only</h3>
                    <p className="mb-3 leading-relaxed">
                      Midway cancellations are accepted only for students in the Special Category:
                    </p>
                    <p className="mb-2 font-semibold">Special Category includes:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                      <li>Major medical emergency (doctor's certificate)</li>
                      <li>Sudden relocation outside India</li>
                      <li>Family bereavement (proof required)</li>
                      <li>Permanent disability preventing attendance</li>
                      <li>Government/defence transfer</li>
                      <li>Other exceptional circumstances approved by ISML management</li>
                    </ul>
                    <p className="mb-2 font-semibold">Important Conditions:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Refunds calculated only for remaining sessions, not for completed classes.</li>
                      <li>Registration fee, admin fee and material fee are non-refundable.</li>
                      <li>LMS access already used will be deducted from the refundable amount.</li>
                      <li>Student must submit a written request, supporting documents and parent/guardian signature for minors.</li>
                      <li>Final decision rests solely with ISML management.</li>
                    </ul>
                  </div>
                </section>

                <section id="non-refundable" className="scroll-mt-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-blue-100">3. Non-Refundable Items (always)</h2>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Already attended classes.</li>
                    <li>LMS materials, videos, PDFs.</li>
                    <li>Membership fees (EduPass, ScholarPass, InfinityPass).</li>
                    <li>Franchise fees & royalty.</li>
                    <li>Enrollment charges, platform/technology fees.</li>
                    <li>Exams, mock tests, workshops, internships.</li>
                    <li>Digital products once delivered.</li>
                  </ul>
                </section>

                <section id="duplicate-payments" className="scroll-mt-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-blue-100">4. Duplicate / Excess Payments</h2>
                  <p className="leading-relaxed">
                    If a student accidentally pays twice, refund will be processed after verification within 7-14 working days. Original receipt required.
                  </p>
                </section>

                <section id="course-cancellation" className="scroll-mt-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-blue-100">5. Course Cancellation by ISML</h2>
                  <p className="leading-relaxed">
                    If ISML cancels a program permanently, student may choose full refund, batch transfer or credit note.
                  </p>
                </section>

                <section id="processing-time" className="scroll-mt-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-blue-100">6. Processing Time</h2>
                  <p className="leading-relaxed">
                    For eligible refunds: 7-21 working days. Refunds are returned to the original payment method only.
                  </p>
                </section>

                <section id="chargeback" className="scroll-mt-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-blue-100">7. Chargeback Policy</h2>
                  <p className="leading-relaxed">
                    If a student initiates a false chargeback, ISML will immediately terminate services, suspend portal access and may pursue legal recovery.
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

export default RefundCancellationPolicy;
