"use client";

import { useEffect, useState } from "react";
import { InformationCircleIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";

const GDPRConsent = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Check if user has already given consent
    const hasConsented = localStorage.getItem("gdpr-consent");
    if (!hasConsented) {
      // Delay showing the popup for better UX
      setTimeout(() => setIsVisible(true), 1000);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("gdpr-consent", "accepted");
    localStorage.setItem("gdpr-consent-date", new Date().toISOString());
    setIsVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem("gdpr-consent", "rejected");
    localStorage.setItem("gdpr-consent-date", new Date().toISOString());
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={() => setIsExpanded(false)}
      />

      {/* Drawer */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 transform transition-all duration-500 ease-out ${
          isVisible ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="bg-base-100 border-t-2 border-primary/20 shadow-2xl rounded-t-3xl">
          {/* Handle bar for mobile */}
          <div className="flex justify-center pt-3 pb-2 md:hidden">
            <div className="w-12 h-1.5 bg-base-300 rounded-full" />
          </div>

          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-start gap-3 mb-4">
              <ShieldCheckIcon className="w-6 h-6 sm:w-7 sm:h-7 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h2 className="text-lg sm:text-xl font-bold text-base-content mb-2">Your Privacy Matters</h2>
                <p className="text-sm sm:text-base text-base-content/80 leading-relaxed">
                  We use cookies and process data to provide you with the best experience on our platform. Under GDPR,
                  you have important rights regarding your personal information.
                </p>
              </div>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="btn btn-ghost btn-sm btn-circle"
                aria-label="Toggle details"
              >
                <InformationCircleIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Expandable Details */}
            <div
              className={`overflow-hidden transition-all duration-300 ${
                isExpanded ? "max-h-96 opacity-100 mb-4" : "max-h-0 opacity-0"
              }`}
            >
              <div className="bg-base-200/50 rounded-xl p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <span className="text-primary">•</span>
                    Your Rights Under GDPR
                  </h3>
                  <ul className="text-sm text-base-content/70 space-y-1 ml-4">
                    <li>• Right to access your personal data</li>
                    <li>• Right to rectification of inaccurate data</li>
                    <li>• Right to erasure (&quot;right to be forgotten&quot;)</li>
                    <li>• Right to restrict processing</li>
                    <li>• Right to data portability</li>
                    <li>• Right to object to processing</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <span className="text-primary">•</span>
                    How We Use Your Data
                  </h3>
                  <ul className="text-sm text-base-content/70 space-y-1 ml-4">
                    <li>• Essential cookies for platform functionality</li>
                    <li>• Analytics to improve user experience</li>
                    <li>• Secure authentication and session management</li>
                    <li>• Mission planning and tracking features</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <span className="text-primary">•</span>
                    Data Protection
                  </h3>
                  <p className="text-sm text-base-content/70 ml-4">
                    Your data is encrypted, stored securely, and never sold to third parties. We comply with all GDPR
                    requirements and you can request data deletion at any time by contacting{" "}
                    <a href="mailto:privacy@lunargistics.com" className="text-primary hover:underline">
                      privacy@lunargistics.com
                    </a>
                  </p>
                </div>
              </div>
            </div>

            {/* Cookie Categories */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div className="bg-base-200/30 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <input type="checkbox" checked disabled className="checkbox checkbox-primary checkbox-sm" />
                  <span className="font-medium text-sm">Essential</span>
                </div>
                <p className="text-xs text-base-content/60">Required for basic functionality</p>
              </div>

              <div className="bg-base-200/30 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <input type="checkbox" defaultChecked className="checkbox checkbox-primary checkbox-sm" />
                  <span className="font-medium text-sm">Analytics</span>
                </div>
                <p className="text-xs text-base-content/60">Help us improve the platform</p>
              </div>

              <div className="bg-base-200/30 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <input type="checkbox" defaultChecked className="checkbox checkbox-primary checkbox-sm" />
                  <span className="font-medium text-sm">Preferences</span>
                </div>
                <p className="text-xs text-base-content/60">Remember your settings</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={handleAccept} className="btn btn-primary flex-1">
                Accept All Cookies
              </button>
              <button onClick={handleAccept} className="btn btn-outline btn-primary flex-1">
                Accept Selected
              </button>
              <button onClick={handleReject} className="btn btn-ghost flex-1">
                Reject Non-Essential
              </button>
            </div>

            {/* Legal Links */}
            <div className="mt-4 pt-4 border-t border-base-300 flex flex-wrap justify-center gap-4 text-xs">
              <a href="/privacy-policy" className="link link-hover text-base-content/60">
                Privacy Policy
              </a>
              <a href="/cookie-policy" className="link link-hover text-base-content/60">
                Cookie Policy
              </a>
              <a href="/terms" className="link link-hover text-base-content/60">
                Terms of Service
              </a>
              <a href="mailto:privacy@lunargistics.com" className="link link-hover text-base-content/60">
                Contact DPO
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GDPRConsent;
