"use client";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-8">Terms & Conditions</h1>

          <div className="space-y-6 text-gray-600">
            <section>
              <p className="text-sm text-gray-500 mb-6">Effective Date: {new Date().toLocaleDateString()}</p>
              <p className="mb-4">
                Welcome to Lunargistics (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). These Terms & Conditions (&quot;Terms&quot;) govern your use of
                our website, services, and asteroid commodity trading platform (collectively, the &quot;Services&quot;). By
                accessing or using our Services, you agree to be bound by these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Acceptance of Terms</h2>
              <p>
                By creating an account or using any part of our Services, you acknowledge that you have read,
                understood, and agree to be bound by these Terms and our Privacy Policy. If you do not agree to these
                Terms, you may not use our Services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Eligibility</h2>
              <p>
                You must be at least 18 years old and have the legal capacity to enter into binding contracts to use our
                Services. By using our Services, you represent and warrant that you meet these eligibility requirements.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Account Registration</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>You must provide accurate, current, and complete information during registration</li>
                <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                <li>You are responsible for all activities that occur under your account</li>
                <li>You must notify us immediately of any unauthorized use of your account</li>
                <li>We reserve the right to suspend or terminate accounts that violate these Terms</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Services Description</h2>
              <p className="mb-4">
                Lunargistics provides a platform for simulated asteroid commodity trading, space logistics planning, and
                related educational services. Our Services include:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Virtual asteroid mining and trading simulations</li>
                <li>Launch planning and mission design tools</li>
                <li>Educational resources about space commerce</li>
                <li>Community features and marketplace</li>
                <li>Data analytics and reporting tools</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. User Conduct</h2>
              <p className="mb-4">You agree not to:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Use the Services for any illegal or unauthorized purpose</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe upon the rights of others</li>
                <li>Transmit any malicious code, viruses, or harmful content</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Engage in any activity that disrupts or interferes with the Services</li>
                <li>Use automated systems or bots without our permission</li>
                <li>Impersonate any person or entity</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Virtual Currency and Credits</h2>
              <p className="mb-4">Our platform uses virtual credits for simulation purposes. These credits:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Have no real-world monetary value</li>
                <li>Cannot be exchanged for real currency</li>
                <li>Are for entertainment and educational purposes only</li>
                <li>May be reset or adjusted at our discretion</li>
                <li>Are non-transferable between accounts</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Intellectual Property</h2>
              <p>
                All content, features, and functionality of our Services, including but not limited to text, graphics,
                logos, images, and software, are the exclusive property of Lunargistics or its licensors and are
                protected by copyright, trademark, and other intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. User Content</h2>
              <p className="mb-4">By submitting content to our Services, you:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>
                  Grant us a non-exclusive, worldwide, royalty-free license to use, reproduce, and display your content
                </li>
                <li>Represent that you have the right to submit the content</li>
                <li>Agree that your content does not violate any third-party rights</li>
                <li>Acknowledge that we may remove content that violates these Terms</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">9. Privacy Policy</h2>
              <p>
                Your use of our Services is also governed by our Privacy Policy, which describes how we collect, use,
                and protect your personal information. By using our Services, you consent to our data practices as
                described in the Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">10. Disclaimers</h2>
              <p className="mb-4">
                THE SERVICES ARE PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
                IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
                AND NON-INFRINGEMENT.
              </p>
              <p>
                We do not guarantee that the Services will be uninterrupted, secure, or error-free. The simulations and
                data provided are for educational and entertainment purposes only and should not be relied upon for
                actual investment or business decisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">11. Limitation of Liability</h2>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, LUNARGISTICS AND ITS AFFILIATES, OFFICERS, DIRECTORS, EMPLOYEES,
                AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
                DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR USE, ARISING OUT OF OR RELATED TO YOUR
                USE OF THE SERVICES.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">12. Indemnification</h2>
              <p>
                You agree to indemnify, defend, and hold harmless Lunargistics and its affiliates from any claims,
                losses, damages, liabilities, and expenses (including attorneys&apos; fees) arising from your use of the
                Services or violation of these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">13. Modifications to Terms</h2>
              <p>
                We reserve the right to modify these Terms at any time. We will notify you of any material changes by
                posting the new Terms on our website and updating the effective date. Your continued use of the Services
                after such modifications constitutes your acceptance of the updated Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">14. Termination</h2>
              <p>
                We may terminate or suspend your account and access to the Services at any time, with or without cause,
                and with or without notice. You may also terminate your account at any time by contacting us. Upon
                termination, all provisions of these Terms that by their nature should survive will continue in effect.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">15. Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which
                Lunargistics is incorporated, without regard to its conflict of law provisions. Any disputes arising
                from these Terms shall be resolved in the courts of that jurisdiction.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">16. Dispute Resolution</h2>
              <p>
                Any disputes arising out of or relating to these Terms or the Services shall first be attempted to be
                resolved through good faith negotiations. If such negotiations fail, the dispute shall be submitted to
                binding arbitration in accordance with the rules of the applicable arbitration association.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">17. Contact Information</h2>
              <p className="mb-4">If you have any questions about these Terms, please contact us at:</p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-semibold">Lunargistics Corporation</p>
                <p>
                  Email:{" "}
                  <a href="mailto:legal@lunargistics.com" className="text-indigo-600 hover:text-indigo-800">
                    legal@lunargistics.com
                  </a>
                </p>
                <p>
                  Support:{" "}
                  <a href="mailto:support@lunargistics.com" className="text-indigo-600 hover:text-indigo-800">
                    support@lunargistics.com
                  </a>
                </p>
              </div>
            </section>

            <section className="pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500 text-center">
                By using Lunargistics, you acknowledge that you have read and understood these Terms & Conditions and
                agree to be bound by them.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
