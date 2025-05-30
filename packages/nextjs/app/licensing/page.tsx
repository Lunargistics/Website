"use client";

import type { NextPage } from "next";
import { CogIcon, CubeTransparentIcon, ShieldCheckIcon, ShoppingBagIcon, UsersIcon } from "@heroicons/react/24/outline";

const LicensingPage: NextPage = () => {
  const programFeatures = [
    {
      name: "LunarStation Platform",
      description:
        "Access our powerful, secure, and compliant platform for managing all your space-related activities and documentation.",
      icon: CubeTransparentIcon,
    },
    {
      name: "Ransomware-Proof Documentation",
      description:
        "Utilize our cutting-edge, blockchain-secured (conceptual) system for document storage and verification, ensuring integrity and resistance to tampering.",
      icon: ShieldCheckIcon,
    },
    {
      name: "Customization SDK",
      description:
        "Leverage our Software Development Kit to tailor the platform experience to your brand and operational guidelines, ensuring seamless integration.",
      icon: CogIcon,
    },
    {
      name: "RideShare & Vendor Network Access",
      description:
        "Gain entry to our exclusive RideShare program and connect with a network of Interconnected Vendors for all your mission needs.",
      icon: UsersIcon,
    },
    {
      name: "Display Merchandising Solutions",
      description:
        "Enhance your brand presence with our display merchandising options to create your ideal Lunargistics experience for your clients and stakeholders.",
      icon: ShoppingBagIcon,
    },
  ];

  return (
    <div className="min-h-screen bg-base-100 text-base-content py-10 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-primary mb-4">LunarLicensing Program</h1>
          <p className="text-lg sm:text-xl text-base-content/80 max-w-3xl mx-auto">
            Empowering your space ventures with a comprehensive suite of tools and services designed for compliance,
            security, and operational excellence.
          </p>
        </header>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {programFeatures.map(feature => (
            <div
              key={feature.name}
              className="bg-base-200 p-6 rounded-lg shadow-lg flex flex-col items-center text-center"
            >
              <feature.icon className="h-12 w-12 text-accent mb-4" />
              <h2 className="text-2xl font-semibold text-secondary mb-2">{feature.name}</h2>
              <p className="text-base-content/70 flex-grow">{feature.description}</p>
            </div>
          ))}
        </div>

        <section className="mt-16 text-center bg-base-200 p-8 rounded-lg shadow-xl">
          <h2 className="text-3xl font-bold text-primary mb-6">Get Started with LunarLicensing</h2>
          <p className="text-lg text-base-content/80 mb-8 max-w-2xl mx-auto">
            Join the forefront of space commerce. Our licensing program is built to streamline your path to space,
            ensuring every mission is built on a foundation of trust and cutting-edge technology.
          </p>
          <button
            onClick={() => {
              const subject = encodeURIComponent("Licensing Program Inquiry - Lunargistics");
              const body = encodeURIComponent(`Dear Logan,

I am interested in learning more about the LunarLicensing Program.

Contact Information:
Organization: [Your Organization Name]
Name: [Your Name]
Email: [Your Email]
Phone: [Your Phone Number]

Current Operations:
- [ ] Satellite Operations
- [ ] Launch Services
- [ ] Space Tourism
- [ ] Research & Development
- [ ] Manufacturing
- [ ] Other: [Please specify]

Specific Interests:
- [ ] LunarStation Platform Access
- [ ] Ransomware-Proof Documentation System
- [ ] Customization SDK
- [ ] RideShare Program
- [ ] Vendor Network Access
- [ ] Display Merchandising Solutions

Questions/Requirements:
[Please describe your specific needs or questions about the licensing program]

Preferred follow-up method:
- [ ] Email
- [ ] Phone Call
- [ ] Video Conference

Best regards,
[Your Name]`);
              window.location.href = `mailto:logan@lunargistics.com?subject=${subject}&body=${body}`;
            }}
            className="btn btn-primary btn-lg hover:bg-primary-focus transition-colors"
          >
            Contact Us to Learn More
          </button>
        </section>
      </div>
    </div>
  );
};

export default LicensingPage;
