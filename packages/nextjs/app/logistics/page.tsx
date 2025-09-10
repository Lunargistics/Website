"use client";

import type { NextPage } from "next";
import {
  ClockIcon,
  CogIcon,
  DocumentTextIcon,
  MapPinIcon,
  ShoppingBagIcon,
  TruckIcon,
} from "@heroicons/react/24/outline";

const LogisticsPage: NextPage = () => {
  const programFeatures = [
    {
      name: "Advanced Tracking & Logistics Suite",
      description:
        "Utilize our comprehensive suite of tools for real-time tracking, fleet management, and end-to-end logistical control for all your space-related assets.",
      icon: MapPinIcon,
    },
    {
      name: "Full PNT Suite Integration",
      description:
        "Benefit from our complete Position, Navigation, and Timing (PNT) services, ensuring precise data and reliability for your critical operations.",
      icon: ClockIcon,
    },
    {
      name: "Branded Digital & Physical Forms",
      description:
        "Streamline your operations with our customizable digital and physical forms, branded to your specifications for professional consistency.",
      icon: DocumentTextIcon,
    },
    {
      name: "Customization SDK",
      description:
        "Integrate and customize our logistics tools with your existing systems using our flexible Software Development Kit for a seamless workflow.",
      icon: CogIcon,
    },
    {
      name: "Asset Procurement & Leasing",
      description:
        "Gain access to options for purchasing or leasing essential logistical assets, including trucks, flats, ships, and even satellite capacity.",
      icon: TruckIcon,
    },
    {
      name: "Display Merchandising Solutions",
      description:
        "Craft the perfect Lunargistics experience for your partners and clients with our tailored display merchandising options.",
      icon: ShoppingBagIcon,
    },
  ];

  return (
    <div className="min-h-screen bg-base-100 text-base-content py-10 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto">
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
          <h2 className="text-3xl font-bold text-primary mb-6">Elevate Your Logistics with Lunargistics</h2>
          <p className="text-lg text-base-content/80 mb-8 max-w-2xl mx-auto">
            From ground control to orbital deployment, our logistics program provides the critical infrastructure and
            tools for mission success. Discover how we can support your journey.
          </p>
          <button
            onClick={() => {
              const subject = encodeURIComponent("Logistics Consultation Request - Lunargistics");
              const body = encodeURIComponent(`Dear Logan,

I would like to request a consultation regarding Lunargistics' Logistics Program.

Company Information:
Organization: [Your Organization Name]
Contact Name: [Your Name]
Title: [Your Title]
Email: [Your Email]
Phone: [Your Phone Number]

Current Logistics Challenges:
- [ ] Asset Tracking & Fleet Management
- [ ] Supply Chain Optimization
- [ ] PNT (Position, Navigation, Timing) Requirements
- [ ] Documentation & Forms Management
- [ ] Integration with Existing Systems
- [ ] Other: [Please specify]

Services of Interest:
- [ ] Advanced Tracking & Logistics Suite
- [ ] Full PNT Suite Integration
- [ ] Branded Digital & Physical Forms
- [ ] Customization SDK
- [ ] Asset Procurement & Leasing (trucks, flats, ships, satellite capacity)
- [ ] Display Merchandising Solutions

Project Timeline:
- [ ] Immediate (within 30 days)
- [ ] Near-term (1-3 months)
- [ ] Long-term planning (3+ months)

Budget Range:
- [ ] Under $50K
- [ ] $50K - $250K
- [ ] $250K - $1M
- [ ] $1M+
- [ ] To be determined

Additional Details:
[Please provide any specific requirements or questions about your logistics needs]

Preferred consultation format:
- [ ] Phone Call
- [ ] Video Conference
- [ ] In-person meeting

Thank you for your time.

Best regards,
[Your Name]`);
              window.location.href = `mailto:logan@lunargistics.com?subject=${subject}&body=${body}`;
            }}
            className="btn btn-primary btn-lg hover:bg-primary-focus transition-colors"
          >
            Request a Logistics Consultation
          </button>
        </section>
      </div>
    </div>
  );
};

export default LogisticsPage;
