import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

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
              <h2 className="text-xl font-bold text-blue-600 mb-4">Refund & Cancellation Policy</h2>
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
              <h1 className="text-3xl sm:text-4xl font-bold text-blue-600 mb-2">Refund & Cancellation Policy</h1>
              <p className="text-gray-600 mb-8">Last Updated: 04 June 2025</p>

              <div className="space-y-8 text-gray-700">
                <section id="general-policy" className="scroll-mt-8">
                  <h2 className="text-2xl font-bold text-blue-600 mb-4">1. General Policy</h2>
                  <p className="leading-relaxed">
                    All course fees, memberships and program fees paid to ISML are non-refundable, non-transferable and non-adjustable, except in specific exceptional cases subject to ISML management approval (see below).
                  </p>
                </section>

                <section id="exceptions" className="scroll-mt-8">
                  <h2 className="text-2xl font-bold text-blue-600 mb-4">2. Exceptions for Refund Eligibility (subject to approval)</h2>
                  
                  <div id="natural-calamities" className="scroll-mt-8 mt-6">
                    <h3 className="text-xl font-bold text-blue-600 mb-3">2.1 Natural Calamities / Force Majeure</h3>
                    <p className="mb-3 leading-relaxed">
                      A refund may be processed if: a government-declared natural calamity directly prevents ISML from conducting the course and the batch cannot continue for more than 30 days.
                    </p>
                    <p className="leading-relaxed">
                      <strong>Remedies:</strong> Full refund, batch transfer or course credit valid for 6 months.
                    </p>
                  </div>

                  <div id="operational-issues" className="scroll-mt-8 mt-6">
                    <h3 className="text-xl font-bold text-blue-600 mb-3">2.2 ISML-Side Operational Issues</h3>
                    <p className="mb-3 leading-relaxed">
                      Refunds may be considered if ISML cancels a batch permanently, is unable to assign a teacher for more than 21 consecutive days, discontinues the course permanently, or repeatedly cancels classes due to internal faults.
                    </p>
                    <p className="leading-relaxed">
                      <strong>Remedies:</strong> Full refund, free batch transfer, extended LMS access or course credit.
                    </p>
                  </div>

                  <div id="midway-cancellation" className="scroll-mt-8 mt-6">
                    <h3 className="text-xl font-bold text-blue-600 mb-3">2.3 Student Midway Cancellation — Special Category Only</h3>
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
                  <h2 className="text-2xl font-bold text-blue-600 mb-4">3. Non-Refundable Items (always)</h2>
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
                  <h2 className="text-2xl font-bold text-blue-600 mb-4">4. Duplicate / Excess Payments</h2>
                  <p className="leading-relaxed">
                    If a student accidentally pays twice, refund will be processed after verification within 7-14 working days. Original receipt required.
                  </p>
                </section>

                <section id="course-cancellation" className="scroll-mt-8">
                  <h2 className="text-2xl font-bold text-blue-600 mb-4">5. Course Cancellation by ISML</h2>
                  <p className="leading-relaxed">
                    If ISML cancels a program permanently, student may choose full refund, batch transfer or credit note.
                  </p>
                </section>

                <section id="processing-time" className="scroll-mt-8">
                  <h2 className="text-2xl font-bold text-blue-600 mb-4">6. Processing Time</h2>
                  <p className="leading-relaxed">
                    For eligible refunds: 7-21 working days. Refunds are returned to the original payment method only.
                  </p>
                </section>

                <section id="chargeback" className="scroll-mt-8">
                  <h2 className="text-2xl font-bold text-blue-600 mb-4">7. Chargeback Policy</h2>
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
