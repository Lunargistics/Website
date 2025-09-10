"use client";

import {
  ClockIcon,
  CogIcon,
  DocumentTextIcon,
  MapPinIcon,
  ShoppingBagIcon,
  TruckIcon,
} from "@heroicons/react/24/outline";

export const LogisticsDashboard = () => {
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
    <div className="space-y-8">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {programFeatures.map(feature => (
          <div
            key={feature.name}
            className="bg-gray-800 border border-gray-700 p-6 rounded-lg shadow-lg flex flex-col items-center text-center hover:border-purple-500/50 transition-all duration-200"
          >
            <feature.icon className="h-12 w-12 text-purple-500 mb-4" />
            <h2 className="text-2xl font-semibold text-white mb-2">{feature.name}</h2>
            <p className="text-gray-400 flex-grow">{feature.description}</p>
          </div>
        ))}
      </div>

      <section className="mt-16 text-center bg-gray-800 border border-gray-700 p-8 rounded-lg shadow-xl">
        <h2 className="text-3xl font-bold text-white mb-6">Elevate Your Logistics with Lunargistics</h2>
        <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
          Whether you&apos;re managing a single satellite deployment or coordinating a multi-phase lunar mission,
          Lunargistics provides the tools, expertise, and infrastructure you need to succeed.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
          <div className="bg-gray-900 p-4 rounded-lg border border-gray-600">
            <h3 className="text-lg font-semibold text-purple-400 mb-2">Real-Time Visibility</h3>
            <p className="text-sm text-gray-400">
              Track your assets and shipments in real-time with our advanced monitoring systems.
            </p>
          </div>
          <div className="bg-gray-900 p-4 rounded-lg border border-gray-600">
            <h3 className="text-lg font-semibold text-purple-400 mb-2">Scalable Solutions</h3>
            <p className="text-sm text-gray-400">
              From small payloads to massive infrastructure projects, our platform scales with your needs.
            </p>
          </div>
          <div className="bg-gray-900 p-4 rounded-lg border border-gray-600">
            <h3 className="text-lg font-semibold text-purple-400 mb-2">Expert Support</h3>
            <p className="text-sm text-gray-400">
              Our team of logistics experts is available 24/7 to support your mission-critical operations.
            </p>
          </div>
        </div>
      </section>

      <div className="mt-12 text-center">
        <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-purple-700/50 p-6 rounded-lg">
          <h3 className="text-xl font-bold text-white mb-4">Ready to Get Started?</h3>
          <p className="text-gray-300 mb-6">
            Contact our team to learn how Lunargistics can transform your space logistics operations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
              Schedule Consultation
            </button>
            <button className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
              View Documentation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
