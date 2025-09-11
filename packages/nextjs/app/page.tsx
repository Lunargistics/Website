"use client";

import Image from "next/image";
import Link from "next/link";
import type { NextPage } from "next";
import {
  ChartBarIcon,
  CodeBracketIcon,
  CommandLineIcon,
  CpuChipIcon,
  CubeIcon,
  DocumentCheckIcon,
  GlobeAltIcon,
  MapIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  SparklesIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";

const Home: NextPage = () => {
  const platformCapabilities = [
    {
      category: "Mission Planning & Design",
      icon: RocketLaunchIcon,
      color: "from-blue-500 to-cyan-500",
      features: [
        {
          title: "Advanced Orbital Mechanics",
          description:
            "SGP4/SDP4 propagation, ground station visibility, eclipse predictions, and constellation design",
          link: "/dashboard",
          highlight: "Orekit-Ready",
        },
        {
          title: "3D Mission Visualization",
          description:
            "Real-time satellite tracking, sensor footprints, ground tracks, and day/night terminator display",
          link: "/dashboard",
          highlight: "WorldWind-Compatible",
        },
        {
          title: "Standards Compliance",
          description: "ECSS/CCSDS standards tracking with automated compliance verification and documentation",
          link: "/dashboard",
          highlight: "ECSS Certified",
        },
      ],
    },
    {
      category: "Technical Documentation & Drivers",
      icon: CodeBracketIcon,
      color: "from-purple-500 to-pink-500",
      features: [
        {
          title: "ICD Generation",
          description:
            "Automated Interface Control Documents with pinouts, timing diagrams, and protocol specifications",
          link: "/dashboard",
          highlight: "ECSS Compliant",
        },
        {
          title: "Multi-Language Driver Generation",
          description: "Auto-generate hardware drivers in C/C++, Python, Rust, JavaScript, VHDL, and Verilog",
          link: "/dashboard",
          highlight: "6 Languages",
        },
        {
          title: "Test Suite Generation",
          description: "Automated unit tests, simulation modes, and hardware abstraction layers for all drivers",
          link: "/dashboard",
          highlight: "Auto-Testing",
        },
      ],
    },
    {
      category: "Blockchain & NFT Marketplace",
      icon: CubeIcon,
      color: "from-green-500 to-emerald-500",
      features: [
        {
          title: "PNT Elements NFT Marketplace",
          description:
            "Trade Position Navigation Timing widgets as verifiable assets with 7.5% automatic royalty distribution",
          link: "/pnt-marketplace",
          highlight: "SeaPort Compatible",
        },
        {
          title: "Mission Registry On-Chain",
          description: "Immutable mission lifecycle tracking with phase management and requirements verification",
          link: "/activities",
          highlight: "Smart Contracts",
        },
        {
          title: "Equipment NFT Library",
          description: "Tokenized space equipment with specifications, compatibility checking, and heritage tracking",
          link: "/dashboard",
          highlight: "NFT-Based",
        },
      ],
    },
    {
      category: "Launch & Operations",
      icon: RocketLaunchIcon,
      color: "from-orange-500 to-red-500",
      features: [
        {
          title: "Launch Marketplace",
          description: "Dutch auction bidding system connecting payloads with launch providers globally",
          link: "/dashboard",
          highlight: "Dutch Auction",
        },
        {
          title: "Compliance Mediator",
          description: "Automated regulatory framework with peer-to-peer verification and attestations",
          link: "/licensing",
          highlight: "Auto-Compliance",
        },
        {
          title: "Mission Certificates",
          description: "NFT-based mission verification with on-chain attestations and IPFS document storage",
          link: "/licensing",
          highlight: "NFT Certificates",
        },
      ],
    },
    {
      category: "Enterprise Features",
      icon: ShieldCheckIcon,
      color: "from-indigo-500 to-blue-500",
      features: [
        {
          title: "Advanced Error Recovery",
          description: "Multi-level error boundaries, retry logic with circuit breakers, and graceful degradation",
          link: "/api-docs",
          highlight: "99.9% Uptime",
        },
        {
          title: "REST API with Rate Limiting",
          description: "OpenAPI documented endpoints with intelligent rate limiting and token bucket algorithms",
          link: "/api-docs",
          highlight: "API v1.0",
        },
        {
          title: "IPFS Integration",
          description: "Decentralized storage for mission data, ephemeris, equipment specs, and 3D models",
          link: "/dashboard",
          highlight: "Pinata Powered",
        },
      ],
    },
  ];

  const userTypes = [
    {
      title: "Space Engineers",
      icon: WrenchScrewdriverIcon,
      description: "Design missions with professional-grade tools",
      benefits: [
        "High-fidelity orbital mechanics",
        "Automated ICD generation",
        "Multi-language driver creation",
        "Standards compliance tracking",
      ],
      cta: "Start Engineering",
      link: "/dashboard",
      color: "primary",
    },
    {
      title: "Space Entrepreneurs",
      icon: SparklesIcon,
      description: "Launch your space business with blockchain",
      benefits: [
        "NFT marketplace for PNT widgets",
        "Launch service marketplace",
        "Mission funding collateralization",
        "Smart contract automation",
      ],
      cta: "Launch Business",
      link: "/activities/new",
      color: "secondary",
    },
    {
      title: "Space Speculators",
      icon: ChartBarIcon,
      description: "Invest in the $700 quintillion space economy",
      benefits: [
        "Trade tokenized asteroid commodities",
        "Equipment NFT investments",
        "Mission token offerings",
        "Futures trading platform",
      ],
      cta: "Start Trading",
      link: "/asteroids",
      color: "accent",
    },
  ];

  const stats = [
    { label: "Mission Types", value: "9+", desc: "Supported configurations" },
    { label: "Standards", value: "100%", desc: "ECSS/CCSDS compliant" },
    { label: "Languages", value: "6", desc: "Driver generation" },
    { label: "Uptime SLA", value: "99.9%", desc: "Enterprise ready" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-base-100 to-base-200">
      {/* Hero Section - Updated */}
      <section
        className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 py-20"
        style={{
          backgroundImage: 'url("/LunarBkg1.png")',
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-base-100 z-0"></div>

        <div className="max-w-7xl mx-auto text-center relative z-10 px-4">
          <div className="mb-6 inline-flex items-center gap-2 bg-primary/20 backdrop-blur-sm px-4 py-2 rounded-full">
            <SparklesIcon className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold text-primary">Free ICD & Driver Generation for a Limited Time</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-6 text-white drop-shadow-2xl">
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mt-2">
              Space Launch Simplified™
            </span>
          </h1>

          <p className="text-xl md:text-2xl lg:text-3xl text-white/90 mb-8 max-w-4xl mx-auto leading-relaxed drop-shadow-lg">
            From orbital mechanics to hardware drivers, from blockchain verification to launch marketplaces – everything
            you need to design, build, and launch space missions
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto mb-12">
            {userTypes.map((type, idx) => (
              <Link
                key={idx}
                href={type.link}
                className={`btn btn-${type.color} w-full px-6 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105`}
              >
                <type.icon className="w-5 h-5 mr-2" />
                {type.cta}
              </Link>
            ))}
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {stats.map((stat, idx) => (
              <div key={idx} className="bg-base-100/10 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                <div className="text-3xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-white/80">{stat.label}</div>
                <div className="text-xs text-white/60">{stat.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Capabilities - Comprehensive */}
      <section className="py-20 px-4 bg-base-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Everything for Space Operations</h2>
            <p className="text-xl text-base-content/70 max-w-3xl mx-auto">
              A unified platform combining orbital mechanics, blockchain technology, automated documentation, and
              marketplace capabilities for the modern space industry
            </p>
          </div>

          <div className="space-y-20">
            {platformCapabilities.map((category, categoryIdx) => (
              <div key={categoryIdx}>
                <div className="flex items-center gap-4 mb-8">
                  <div
                    className={`w-12 h-12 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center`}
                  >
                    <category.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold">{category.category}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {category.features.map((feature, featureIdx) => (
                    <Link
                      key={featureIdx}
                      href={feature.link}
                      className="group relative bg-base-200 rounded-xl p-6 hover:shadow-xl transition-all duration-300 border border-base-300 hover:border-primary/30"
                    >
                      <div className="absolute top-4 right-4">
                        <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                          {feature.highlight}
                        </span>
                      </div>

                      <h4 className="text-xl font-bold mb-3 pr-24 group-hover:text-primary transition-colors">
                        {feature.title}
                      </h4>
                      <p className="text-base-content/70">{feature.description}</p>

                      <div className="mt-4 flex items-center text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-sm font-semibold">Learn more</span>
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* User Types Section - Detailed */}
      <section className="py-20 px-4 bg-gradient-to-b from-base-200/50 to-base-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Built for Every Space Professional</h2>
            <p className="text-xl text-base-content/70">
              Whether you&apos;re engineering satellites, launching startups, or trading space assets
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {userTypes.map((user, idx) => (
              <div key={idx} className="bg-base-100 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all">
                <div className={`w-16 h-16 rounded-xl bg-${user.color}/10 flex items-center justify-center mb-6`}>
                  <user.icon className={`w-8 h-8 text-${user.color}`} />
                </div>

                <h3 className="text-2xl font-bold mb-3">{user.title}</h3>
                <p className="text-base-content/70 mb-6">{user.description}</p>

                <ul className="space-y-3 mb-8">
                  {user.benefits.map((benefit, benefitIdx) => (
                    <li key={benefitIdx} className="flex items-start">
                      <CheckIcon className={`w-5 h-5 text-${user.color} mr-2 mt-0.5 flex-shrink-0`} />
                      <span className="text-base-content/80">{benefit}</span>
                    </li>
                  ))}
                </ul>

                <Link href={user.link} className={`btn btn-${user.color} w-full`}>
                  {user.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Architecture */}
      <section className="py-20 px-4 bg-base-100">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Enterprise-Grade Architecture</h2>
              <p className="text-lg text-base-content/70 mb-6">
                Built with modern technologies and best practices for reliability, scalability, and security
              </p>

              <div className="space-y-4">
                <TechStack title="Frontend" items={["Next.js 15", "TypeScript", "Three.js", "TailwindCSS"]} />
                <TechStack title="Blockchain" items={["Ethereum", "IPFS", "OpenZeppelin", "Hardhat"]} />
                <TechStack title="Backend" items={["Node.js", "MongoDB", "Redis", "WebSockets"]} />
                <TechStack title="DevOps" items={["Docker", "CI/CD", "Sentry", "Monitoring"]} />
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-8 border border-primary/20">
              <div className="grid grid-cols-2 gap-6">
                <MetricCard label="Response Time" value="<2s" desc="API calls" />
                <MetricCard label="Uptime SLA" value="99.9%" desc="Guaranteed" />
                <MetricCard label="Test Coverage" value="80%" desc="Critical paths" />
                <MetricCard label="Security" value="A+" desc="Rating" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-base-200/50 to-base-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Development Roadmap</h2>
            <p className="text-xl text-base-content/70">Currently 65% production ready with clear path to 100%</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <RoadmapCard
              status="completed"
              title="Phase 1: Core Platform"
              items={[
                "Mission planning dashboard",
                "Smart contracts deployment",
                "ICD & driver generation",
                "Error handling system",
                "REST API implementation",
              ]}
            />
            <RoadmapCard
              status="in-progress"
              title="Phase 2: Integration"
              items={[
                "NASA WorldWind integration",
                "Advanced Orekit features",
                "External system APIs",
                "Performance optimization",
                "Security hardening",
              ]}
            />
            <RoadmapCard
              status="planned"
              title="Phase 3: Scale"
              items={[
                "Machine learning optimization",
                "Mobile applications",
                "Real-time collaboration",
                "Advanced analytics",
                "Global deployment",
              ]}
            />
          </div>
        </div>
      </section>

      {/* CTA Section - Enhanced */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Join the Space Revolution</h2>
          <p className="text-xl text-base-content/70 mb-8 max-w-3xl mx-auto">
            Whether you&apos;re building satellites, launching missions, or investing in space assets, our platform
            provides everything you need to succeed
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto mb-8">
            <Link href="/dashboard" className="btn btn-primary btn-lg w-full">
              <CommandLineIcon className="w-5 h-5 mr-2" />
              Start Building
            </Link>
            <Link href="/pnt-marketplace" className="btn btn-secondary btn-lg w-full">
              <CubeIcon className="w-5 h-5 mr-2" />
              Browse SpacElements
            </Link>
            <Link href="/api-docs" className="btn btn-accent btn-lg w-full">
              <DocumentCheckIcon className="w-5 h-5 mr-2" />
              View API Docs
            </Link>
          </div>

          <p className="text-sm text-base-content/60">
            No credit card required • Free tier available • Full documentation included
          </p>
        </div>
      </section>

      {/* Team Section - Keep existing */}
      <section className="py-20 px-4 bg-base-200/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">Built by Space Industry Veterans</h2>

          {/* Co-founders */}
          <div className="mb-16">
            <h3 className="text-2xl md:text-3xl font-semibold text-center mb-10 text-primary">Co-founders</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <TeamMember
                name="Logan Golema"
                role="Co-founder"
                image="/team/logan-golema.jpeg"
                linkedin="https://linkedin.com/in/futjr"
              />
              <TeamMember
                name="Vishal Singh"
                role="Co-founder"
                image="/team/vishal-singh.jpeg"
                linkedin="https://www.linkedin.com/in/vishal0103/"
              />
            </div>
          </div>

          {/* Co-chairs */}
          <div className="mb-16">
            <h3 className="text-2xl md:text-3xl font-semibold text-center mb-10 text-primary">
              Co-chairs of the Board
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <TeamMember
                name="Yasu Yamazaki"
                role="Co-chair of the Board"
                image="/team/yasu-yamazaki.jpeg"
                linkedin="https://www.linkedin.com/in/yasu-yamazaki/"
                borderColor="secondary"
              />
              <TeamMember
                name="Rachel Lyons"
                role="Co-chair of the Board"
                image="/team/rachel-lyons.jpeg"
                linkedin="https://www.linkedin.com/in/rachelalyons/"
                borderColor="secondary"
              />
            </div>
          </div>

          {/* Advisors */}
          <div>
            <h3 className="text-2xl md:text-3xl font-semibold text-center mb-10 text-primary">Advisors</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <TeamMember
                name="Amos Behana"
                role="Advisor"
                image="/team/amos-behana.jpg"
                linkedin="https://www.linkedin.com/in/amosbehana/"
                borderColor="accent"
              />
              <TeamMember
                name="Angelina Bekasova"
                role="Advisor"
                image="/team/angelina-bekasova.jpeg"
                linkedin="https://www.linkedin.com/in/angelina-bekasova/"
                borderColor="accent"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section - Enhanced */}
      <section className="py-20 px-4 bg-base-100">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">Ready to Launch Your Space Project?</h2>
          <p className="text-xl text-base-content/80 mb-8">
            Get in touch with our team for partnerships, integrations, or custom solutions
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <ContactCard icon={MapIcon} title="Partnerships" email="partnerships@lunargistics.com" />
            <ContactCard icon={CpuChipIcon} title="Technical Support" email="support@lunargistics.com" />
            <ContactCard icon={GlobeAltIcon} title="General Inquiries" email="info@lunargistics.com" />
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/activities/new" className="btn btn-primary btn-lg">
              Start Free Trial
            </Link>
            <Link href="/dashboard" className="btn btn-outline btn-lg">
              View Dashboard Demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

// Helper Components
const CheckIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const TechStack = ({ title, items }: { title: string; items: string[] }) => (
  <div className="flex items-center gap-4">
    <span className="font-semibold text-primary min-w-[100px]">{title}:</span>
    <div className="flex flex-wrap gap-2">
      {items.map((item, idx) => (
        <span key={idx} className="text-xs bg-base-200 px-2 py-1 rounded">
          {item}
        </span>
      ))}
    </div>
  </div>
);

const MetricCard = ({ label, value, desc }: { label: string; value: string; desc: string }) => (
  <div className="text-center">
    <div className="text-3xl font-bold text-primary">{value}</div>
    <div className="text-sm font-semibold">{label}</div>
    <div className="text-xs text-base-content/60">{desc}</div>
  </div>
);

const RoadmapCard = ({
  status,
  title,
  items,
}: {
  status: "completed" | "in-progress" | "planned";
  title: string;
  items: string[];
}) => {
  const statusColors = {
    completed: "bg-success/10 border-success text-success",
    "in-progress": "bg-warning/10 border-warning text-warning",
    planned: "bg-info/10 border-info text-info",
  };

  const statusLabels = {
    completed: "✓ Completed",
    "in-progress": "⚡ In Progress",
    planned: "📅 Planned",
  };

  return (
    <div className={`rounded-xl p-6 border-2 ${statusColors[status]}`}>
      <div className="text-sm font-semibold mb-2">{statusLabels[status]}</div>
      <h3 className="text-xl font-bold mb-4 text-base-content">{title}</h3>
      <ul className="space-y-2">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-start text-sm text-base-content/70">
            <span className="mr-2">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const TeamMember = ({
  name,
  role,
  image,
  linkedin,
  borderColor = "primary",
}: {
  name: string;
  role: string;
  image: string;
  linkedin: string;
  borderColor?: string;
}) => (
  <div className="bg-base-100 rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-shadow">
    <div className={`w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden border-4 border-${borderColor}/20`}>
      <Image src={image} alt={name} width={128} height={128} className="w-full h-full object-cover" />
    </div>
    <h4 className="text-xl font-bold mb-2">{name}</h4>
    <p className="text-base-content/70 mb-3">{role}</p>
    <a
      href={linkedin}
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
);

const ContactCard = ({ icon: Icon, title, email }: { icon: any; title: string; email: string }) => (
  <div className="bg-base-200 rounded-xl p-6">
    <Icon className="w-8 h-8 text-primary mx-auto mb-3" />
    <h3 className="font-semibold mb-2">{title}</h3>
    <a href={`mailto:${email}`} className="text-sm text-primary hover:underline">
      {email}
    </a>
  </div>
);

export default Home;
