"use client";

import Link from "next/link";
import type { NextPage } from "next";
import {
  BanknotesIcon,
  ChartBarIcon,
  DocumentDuplicateIcon,
  GlobeAltIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

const Home: NextPage = () => {
  const coreServices = [
    {
      icon: ChartBarIcon,
      title: "Asteroid Trading",
      description:
        "Trade tokenized asteroid commodities on our decentralized exchange. Access the $700 quintillion space economy with instant swaps, liquidity pools, and futures trading.",
      link: "/asteroids",
      linkText: "Start Trading",
      highlight: "NEW: Futures Trading",
    },
    {
      icon: DocumentDuplicateIcon,
      title: "License",
      description:
        "Issue Mission Certificates and create new file types for space documentation. Every document gets a digital verification key through our LunarLicense NFT system.",
      link: "/licensing",
      linkText: "Get Licensed",
      highlight: "Mission Certificates",
    },
    {
      icon: RocketLaunchIcon,
      title: "Launch",
      description:
        "Connect with launch providers through our Dutch Auction style bidding system. Track global launch schedules and availability through 2030.",
      link: "/dashboard",
      linkText: "Book Launch",
      highlight: "Dutch Auction",
    },
    {
      icon: BanknotesIcon,
      title: "Collateralize",
      description:
        "Access funding through our investor network. Secure the capital needed for your space ventures with transparent on-chain collateralization.",
      link: "/activities",
      linkText: "Get Funding",
      highlight: "Investor Network",
    },
  ];

  const features = [
    {
      icon: ShieldCheckIcon,
      title: "Compliance Launch Mediator",
      description: "Automating the Space Regulator with peer-to-peer regulatory framework",
    },
    {
      icon: ChartBarIcon,
      title: "Real-Time Tracking",
      description: "Monitor launches, satellites, and space assets with integrated dashboards",
    },
    {
      icon: GlobeAltIcon,
      title: "Global Network",
      description: "Connect with launch providers and operators worldwide",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-base-100 to-base-200">
      {/* Hero Section */}
      <section
        className="relative min-h-[75vh] sm:min-h-[85vh] flex flex-col items-center justify-center px-4 py-12 sm:py-20"
        style={{
          backgroundImage: 'url("/LunarBkg1.png")',
          backgroundSize: "cover",
          backgroundPosition: "center top",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
        }}
      >
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/40 z-0"></div>

        <div className="max-w-6xl mx-auto text-center relative z-10 px-2">
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-8 text-white drop-shadow-2xl">
            Space Launch Simplified™
          </h1>
          <p className="text-base sm:text-xl md:text-2xl text-white/90 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed drop-shadow-lg">
            Bringing You the Necessary Technology to Facilitate or Implement Space for your Customers
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6">
            <Link
              href="/activities/new"
              className="btn btn-primary w-full sm:w-auto px-8 sm:px-12 py-3 sm:py-4 text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              FACILITATE
            </Link>
            <Link
              href="/dashboard"
              className="btn btn-outline w-full sm:w-auto px-8 sm:px-12 py-3 sm:py-4 text-base sm:text-lg font-semibold hover:shadow-lg transition-all transform hover:scale-105 border-white text-white hover:bg-white hover:text-black"
            >
              IMPLEMENT
            </Link>
          </div>
        </div>
      </section>

      {/* Compliance Launch Mediator Section */}
      <section className="py-12 sm:py-20 px-4 bg-base-200/50">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-primary">
            Compliance Launch Mediator
          </h2>
          <div className="space-y-2">
            <p className="text-lg sm:text-xl text-base-content/80 font-medium">Automating the Space Regulator</p>
            <p className="text-base sm:text-lg text-base-content/70">Peer to Peer Regulatory Framework</p>
          </div>
        </div>
      </section>

      {/* Core Services Section */}
      <section className="py-12 sm:py-20 px-4 bg-base-100">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
            {coreServices.map((service, index) => {
              const IconComponent = service.icon;
              return (
                <div
                  key={index}
                  className="group relative bg-base-200 rounded-2xl p-6 sm:p-8 hover:shadow-2xl transition-all duration-300 border border-base-300 hover:border-primary/30"
                >
                  <div className="absolute top-0 right-0 mt-4 mr-4">
                    <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                      {service.highlight}
                    </span>
                  </div>
                  <div className="flex flex-col h-full">
                    <div className="w-16 h-16 flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl mb-6 group-hover:scale-110 transition-transform">
                      <IconComponent className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4">{service.title}</h3>
                    <p className="text-base-content/70 mb-6 flex-grow">{service.description}</p>
                    <Link
                      href={service.link}
                      className="btn btn-primary btn-sm w-full group-hover:btn-secondary transition-colors"
                    >
                      {service.linkText}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-12 sm:py-20 px-4 bg-base-200/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 flex items-center justify-center bg-primary/10 rounded-full mx-auto mb-4">
                    <IconComponent className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-base-content/70">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-12 sm:py-20 px-4 bg-base-100">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">
                Blockchain-Powered Infrastructure
              </h2>
              <p className="text-base sm:text-lg text-base-content/70 mb-4">
                Our platform leverages Web3 technology to create immutable records, transparent transactions, and
                decentralized verification systems for all space operations.
              </p>
              <ul className="space-y-3 text-base-content/70">
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>Smart contract automation for compliance</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>NFT-based mission certificates</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>On-chain activity attestations</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>Decentralized document storage</span>
                </li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-8 border border-primary/20">
              <div className="text-center">
                <div className="text-6xl font-bold text-primary mb-2">Web3</div>
                <p className="text-lg text-base-content/70">Secured by Blockchain</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20 px-4 bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">Ready to Launch?</h2>
          <p className="text-base sm:text-lg text-base-content/70 mb-6 sm:mb-8">
            Join the next generation of space operators using blockchain technology for transparent, secure operations.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <Link href="/activities/new" className="btn btn-primary w-full sm:w-auto">
              Get Started
            </Link>
            <Link href="/dashboard" className="btn btn-outline w-full sm:w-auto">
              View Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-12 sm:py-20 px-4 bg-base-200/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-8 sm:mb-16">Our Team</h2>

          {/* Co-founders */}
          <div className="mb-12 sm:mb-16">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold text-center mb-6 sm:mb-10 text-primary">
              Co-founders
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
              <div className="bg-base-100 rounded-2xl p-4 sm:p-6 text-center shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-24 sm:w-32 h-24 sm:h-32 mx-auto mb-3 sm:mb-4 rounded-full overflow-hidden border-4 border-primary/20">
                  <img src="/team/logan-golema.jpeg" alt="Logan Golema" className="w-full h-full object-cover" />
                </div>
                <h4 className="text-xl font-bold mb-2">Logan Golema</h4>
                <p className="text-base-content/70 mb-3">Co-founder</p>
                <a
                  href="https://linkedin.com/futjr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:text-primary-focus transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                  LinkedIn
                </a>
              </div>
              <div className="bg-base-100 rounded-2xl p-4 sm:p-6 text-center shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-24 sm:w-32 h-24 sm:h-32 mx-auto mb-3 sm:mb-4 rounded-full overflow-hidden border-4 border-primary/20">
                  <img src="/team/vishal-singh.jpeg" alt="Vishal Singh" className="w-full h-full object-cover" />
                </div>
                <h4 className="text-xl font-bold mb-2">Vishal Singh</h4>
                <p className="text-base-content/70 mb-3">Co-founder</p>
                <a
                  href="https://www.linkedin.com/in/vishal0103/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:text-primary-focus transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                  LinkedIn
                </a>
              </div>
            </div>
          </div>

          {/* Co-chairs of the Board */}
          <div className="mb-12 sm:mb-16">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold text-center mb-6 sm:mb-10 text-primary">
              Co-chairs of the Board
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
              <div className="bg-base-100 rounded-2xl p-4 sm:p-6 text-center shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-24 sm:w-32 h-24 sm:h-32 mx-auto mb-3 sm:mb-4 rounded-full overflow-hidden border-4 border-secondary/20">
                  <img src="/team/yasu-yamazaki.jpeg" alt="Yasu Yamazaki" className="w-full h-full object-cover" />
                </div>
                <h4 className="text-xl font-bold mb-2">Yasu Yamazaki</h4>
                <p className="text-base-content/70 mb-3">Co-chair of the Board</p>
                <a
                  href="https://www.linkedin.com/in/yasu-yamazaki/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:text-primary-focus transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                  LinkedIn
                </a>
              </div>
              <div className="bg-base-100 rounded-2xl p-4 sm:p-6 text-center shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-24 sm:w-32 h-24 sm:h-32 mx-auto mb-3 sm:mb-4 rounded-full overflow-hidden border-4 border-secondary/20">
                  <img src="/team/rachel-lyons.jpeg" alt="Rachel Lyons" className="w-full h-full object-cover" />
                </div>
                <h4 className="text-xl font-bold mb-2">Rachel Lyons</h4>
                <p className="text-base-content/70 mb-3">Co-chair of the Board</p>
                <a
                  href="https://www.linkedin.com/in/rachelalyons/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:text-primary-focus transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                  LinkedIn
                </a>
              </div>
            </div>
          </div>

          {/* Advisors */}
          <div>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold text-center mb-6 sm:mb-10 text-primary">
              Advisors
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
              <div className="bg-base-100 rounded-2xl p-4 sm:p-6 text-center shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-24 sm:w-32 h-24 sm:h-32 mx-auto mb-3 sm:mb-4 rounded-full overflow-hidden border-4 border-accent/20">
                  <img src="/team/amos-behana.jpg" alt="Amos Behana" className="w-full h-full object-cover" />
                </div>
                <h4 className="text-xl font-bold mb-2">Amos Behana</h4>
                <p className="text-base-content/70 mb-3">Advisor</p>
                <a
                  href="https://www.linkedin.com/in/amosbehana/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:text-primary-focus transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                  LinkedIn
                </a>
              </div>
              <div className="bg-base-100 rounded-2xl p-4 sm:p-6 text-center shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-24 sm:w-32 h-24 sm:h-32 mx-auto mb-3 sm:mb-4 rounded-full overflow-hidden border-4 border-accent/20">
                  <img
                    src="/team/angelina-bekasova.jpeg"
                    alt="Angelina Bekasova"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h4 className="text-xl font-bold mb-2">Angelina Bekasova</h4>
                <p className="text-base-content/70 mb-3">Advisor</p>
                <a
                  href="https://www.linkedin.com/in/angelina-bekasova/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:text-primary-focus transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                  LinkedIn
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-12 sm:py-20 px-4 bg-base-100">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-8">Get in Touch</h2>
          <p className="text-lg sm:text-xl text-base-content/80 mb-2">Partnerships@lunargistics.com</p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mt-6 sm:mt-8">
            <Link href="/activities/new" className="btn btn-primary w-full sm:w-auto">
              Start Application
            </Link>
            <button
              onClick={() => {
                const subject = encodeURIComponent("Partnership Inquiry - Lunargistics");
                const body = encodeURIComponent(`Dear Lunargistics Team,

I am interested in exploring partnership opportunities with Lunargistics.

Organization Name: [Your Organization]
Contact Name: [Your Name]
Role/Title: [Your Title]

Areas of Interest:
- [ ] License Program
- [ ] Launch Services
- [ ] Collateralization
- [ ] Technology Integration
- [ ] Other: [Please specify]

Brief Description:
[Please describe your partnership proposal or area of collaboration]

Best time to schedule a call:
[Your availability]

Thank you for your time and consideration.

Best regards,
[Your Name]`);
                window.location.href = `mailto:partnerships@lunargistics.com?subject=${subject}&body=${body}`;
              }}
              className="btn btn-outline w-full sm:w-auto"
            >
              Contact Us
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
