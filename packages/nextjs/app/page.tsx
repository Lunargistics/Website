"use client";

import Link from "next/link";
import type { NextPage } from "next";
import {
  CubeTransparentIcon,
  DocumentTextIcon,
  PresentationChartLineIcon,
  ShieldCheckIcon,
  TruckIcon,
} from "@heroicons/react/24/outline";

const Home: NextPage = () => {
  const corePillars = [
    {
      icon: PresentationChartLineIcon,
      title: "Comprehensive Monitoring",
      description:
        "Access real-time launch data, track vital space assets, and stay informed on celestial events with our integrated dashboard.",
      link: "/dashboard",
      linkText: "Explore Dashboard",
    },
    {
      icon: ShieldCheckIcon,
      title: "Assured Compliance",
      description:
        "Navigate complex regulations. Log your activities, manage documentation, and prepare for on-chain verification with our compliance tools.",
      link: "/activities", // Or a future dedicated compliance page
      linkText: "Manage Compliance",
    },
    {
      icon: CubeTransparentIcon,
      title: "Web3 Integrity",
      description:
        "Leveraging blockchain technology for secure, transparent, and immutable record-keeping of your critical space mission data and compliance artifacts.",
      link: "/licensing", // Example link, could be to a blog post about Web3 features
      linkText: "Learn About Web3",
    },
  ];

  const programs = [
    {
      icon: DocumentTextIcon,
      title: "LunarLicensing",
      description:
        "Standardize your journey to space with Mission Certificates, ransomware-proof documentation, and access to our network.",
      link: "/licensing",
      linkText: "Discover Licensing",
    },
    {
      icon: TruckIcon,
      title: "Lunargistics",
      description:
        "Optimize your supply chain with advanced tracking, PNT suites, and asset management for ground and space operations.",
      link: "/logistics",
      linkText: "Explore Logistics",
    },
  ];

  return (
    <div className="min-h-screen bg-base-100 text-base-content flex flex-col">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center text-center py-20 md:py-32 px-4 bg-gradient-to-br from-base-300 via-base-200 to-base-300">
        {/* Optional: Background image or subtle pattern here */}
        {/* <Image src="/path/to/space-background.jpg" layout="fill" objectFit="cover" alt="Background" className="opacity-20" /> */}
        <div className="relative z-10 max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-primary mb-6 leading-tight">
            Your Command Center for Space Operations & Compliance
          </h1>
          <p className="text-lg sm:text-xl text-base-content/80 mb-10 max-w-2xl mx-auto">
            Lunargistics provides an integrated platform for monitoring space activities, managing missions, and
            ensuring regulatory adherence with the power of Web3.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link
              href="/dashboard"
              className="btn btn-primary btn-lg hover:bg-primary-focus transition-colors px-8 py-3"
            >
              Explore Dashboard
            </Link>
            <Link
              href="/activities/new"
              className="btn btn-secondary btn-lg hover:bg-secondary-focus transition-colors px-8 py-3"
            >
              Log New Activity
            </Link>
          </div>
        </div>
      </section>

      {/* Core Pillars Section */}
      <section className="py-16 md:py-24 bg-base-200">
        <div className="container mx-auto px-4">
          <header className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-primary">Navigate the Future of Space</h2>
            <p className="mt-4 text-lg text-base-content/70 max-w-xl mx-auto">
              Our platform is built on three core pillars to support every stage of your mission.
            </p>
          </header>
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {corePillars.map(pillar => (
              <div
                key={pillar.title}
                className="bg-base-100 p-6 rounded-lg shadow-lg hover:shadow-primary/30 transition-shadow duration-300 flex flex-col"
              >
                <div className="flex-shrink-0">
                  <pillar.icon className="h-12 w-12 text-accent mb-4" />
                  <h3 className="text-2xl font-semibold text-secondary mb-3">{pillar.title}</h3>
                </div>
                <p className="text-base-content/70 mb-4 flex-grow">{pillar.description}</p>
                <Link
                  href={pillar.link}
                  className="btn btn-sm btn-outline btn-accent mt-auto self-start hover:bg-accent hover:text-accent-content"
                >
                  {pillar.linkText}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Programs Section */}
      <section className="py-16 md:py-24 bg-base-100">
        <div className="container mx-auto px-4">
          <header className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-primary">Lunargistics Programs</h2>
            <p className="mt-4 text-lg text-base-content/70 max-w-xl mx-auto">
              Specialized solutions to streamline your licensing and logistics needs in the space sector.
            </p>
          </header>
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {programs.map(program => (
              <div
                key={program.title}
                className="bg-base-200 p-8 rounded-lg shadow-xl hover:shadow-secondary/30 transition-shadow duration-300 flex flex-col items-center text-center"
              >
                <program.icon className="h-16 w-16 text-primary mb-6" />
                <h3 className="text-2xl font-semibold text-secondary mb-3">{program.title}</h3>
                <p className="text-base-content/70 mb-6 flex-grow">{program.description}</p>
                <Link href={program.link} className="btn btn-secondary hover:bg-secondary-focus">
                  {program.linkText}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-16 md:py-24 bg-base-200">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-6">Ready to Elevate Your Space Operations?</h2>
          <p className="text-lg text-base-content/80 mb-10 max-w-xl mx-auto">
            Discover the full potential of the Lunargistics platform and how our tailored solutions can propel your
            missions forward.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link
              href="/dashboard"
              className="btn btn-primary btn-lg hover:bg-primary-focus transition-colors px-8 py-3"
            >
              View Platform Features
            </Link>
            {/* <Link href="/contact" className="btn btn-outline btn-lg btn-accent hover:bg-accent hover:text-accent-content transition-colors px-8 py-3">
                Contact Sales
            </Link> */}
            <button
              onClick={() => {
                const subject = encodeURIComponent("Partnership Inquiry - Lunargistics Platform");
                const body = encodeURIComponent(`Dear Logan,

I am interested in exploring partnership opportunities with Lunargistics.

Organization Name: [Your Organization]
Contact Name: [Your Name]
Role/Title: [Your Title]

Areas of Interest:
- [ ] Licensing Program Partnership
- [ ] Logistics Program Partnership
- [ ] Technology Integration
- [ ] Other: [Please specify]

Brief Description of Partnership Opportunity:
[Please describe your partnership proposal or area of collaboration]

Best time to schedule a call:
[Your availability]

Thank you for your time and consideration.

Best regards,
[Your Name]`);
                window.location.href = `mailto:logan@lunargistics.com?subject=${subject}&body=${body}`;
              }}
              className="btn btn-outline btn-lg btn-accent hover:bg-accent hover:text-accent-content transition-colors px-8 py-3"
            >
              Contact Partnerships
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
