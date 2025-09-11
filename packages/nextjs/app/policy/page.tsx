"use client";

import { Footer } from "~~/components/Footer";
import { Header } from "~~/components/Header";

export default function PrivacyPolicy() {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-base-100">
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
          <p className="text-sm text-base-content/60 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="space-y-8 text-base-content/80">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
              <p className="mb-4">We collect information you provide directly to us, such as:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Account information (email address, username, wallet address)</li>
                <li>Transaction data related to your use of our services</li>
                <li>Communications you send to us</li>
                <li>Information submitted through forms on our website</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
              <p className="mb-4">We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send related information</li>
                <li>Send technical notices and support messages</li>
                <li>Respond to your comments and questions</li>
                <li>Prevent fraudulent transactions and protect against illegal activities</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Blockchain Data</h2>
              <p className="mb-4">
                Please note that transactions on the blockchain are publicly visible. While we do not publicly associate
                your personal information with your wallet address, your transaction history on the blockchain is
                permanently recorded and publicly accessible.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Information Sharing</h2>
              <p className="mb-4">
                We do not sell, trade, or rent your personal information. We may share your information:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>With your consent or at your direction</li>
                <li>To comply with legal obligations</li>
                <li>To protect our rights, privacy, safety, or property</li>
                <li>With service providers who assist in our operations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
              <p className="mb-4">
                We implement appropriate technical and organizational measures to protect your personal information
                against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission
                over the Internet or electronic storage is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>
              <p className="mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access your personal information</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Object to our use of your data</li>
                <li>Port your data to another service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Cookies and Tracking</h2>
              <p className="mb-4">
                We use cookies and similar tracking technologies to track activity on our website and hold certain
                information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being
                sent.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Children&rsquo;s Privacy</h2>
              <p className="mb-4">
                Our services are not directed to individuals under 18. We do not knowingly collect personal information
                from children under 18. If we become aware that a child under 18 has provided us with personal
                information, we will take steps to delete such information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Changes to This Policy</h2>
              <p className="mb-4">
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new
                Privacy Policy on this page and updating the &ldquo;Last updated&rdquo; date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Contact Us</h2>
              <p className="mb-4">
                If you have any questions about this Privacy Policy, please contact us through our website or via the
                contact information provided on our platform.
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
