"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowDownTrayIcon, ChevronUpIcon, DocumentTextIcon } from "@heroicons/react/24/outline";

export default function WhitepaperPage() {
  const [activeSection, setActiveSection] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll("section[id]");
      const scrollPosition = window.scrollY + 100;

      sections.forEach(section => {
        const sectionTop = (section as HTMLElement).offsetTop;
        const sectionHeight = (section as HTMLElement).offsetHeight;
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
          setActiveSection(section.id);
        }
      });

      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const tableOfContents = [
    { id: "abstract", title: "Abstract" },
    { id: "introduction", title: "1. Introduction" },
    { id: "problem", title: "2. Problem Statement" },
    { id: "solution", title: "3. Our Solution" },
    { id: "technology", title: "4. Technology Architecture" },
    { id: "tokenomics", title: "5. Tokenomics" },
    { id: "use-cases", title: "6. Use Cases" },
    { id: "roadmap", title: "7. Roadmap" },
    { id: "team", title: "8. Team" },
    { id: "conclusion", title: "9. Conclusion" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900/10 to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-transparent to-blue-600/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">Lunargistics Whitepaper</h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Democratizing Space Commerce Through Blockchain Technology
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <button
                onClick={() => scrollToSection("abstract")}
                className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
              >
                <DocumentTextIcon className="w-5 h-5" />
                Read Whitepaper
              </button>
              <a
                href="/whitepaper.pdf"
                download
                className="px-8 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
                Download PDF
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex gap-8">
          {/* Table of Contents - Sticky Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24">
              <h3 className="text-lg font-semibold text-white mb-4">Table of Contents</h3>
              <nav className="space-y-2">
                {tableOfContents.map(item => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className={`block w-full text-left px-4 py-2 rounded-lg transition-all duration-200 ${
                      activeSection === item.id
                        ? "bg-purple-600/20 text-purple-400 border-l-2 border-purple-400"
                        : "text-gray-400 hover:text-white hover:bg-gray-800"
                    }`}
                  >
                    {item.title}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 max-w-4xl">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 md:p-12 space-y-12">
              {/* Abstract */}
              <section id="abstract">
                <h2 className="text-3xl font-bold text-white mb-6">Abstract</h2>
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 leading-relaxed">
                    Lunargistics represents a paradigm shift in space commerce, leveraging blockchain technology to
                    create a decentralized marketplace for space missions, satellite deployments, and extraterrestrial
                    resource management. Our platform addresses the critical challenges facing the space industry: high
                    barriers to entry, lack of transparency, inefficient resource allocation, and limited access to
                    space-based services for smaller organizations.
                  </p>
                  <p className="text-gray-300 leading-relaxed mt-4">
                    By tokenizing space assets and missions, implementing smart contracts for automated operations, and
                    creating a global marketplace for space services, Lunargistics democratizes access to space while
                    ensuring security, transparency, and efficiency in all transactions.
                  </p>
                </div>
              </section>

              {/* Introduction */}
              <section id="introduction">
                <h2 className="text-3xl font-bold text-white mb-6">1. Introduction</h2>
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 leading-relaxed">
                    The space industry is experiencing unprecedented growth, with the global space economy valued at
                    over $469 billion in 2024 and projected to exceed $1 trillion by 2040. However, this growth is
                    constrained by traditional centralized systems that create bottlenecks in mission planning, resource
                    allocation, and market access.
                  </p>

                  <h3 className="text-xl font-semibold text-white mt-6 mb-3">1.1 The New Space Economy</h3>
                  <p className="text-gray-300 leading-relaxed">
                    The emergence of private space companies has revolutionized access to space, reducing launch costs
                    by over 90% in the past decade. This cost reduction has opened new opportunities for:
                  </p>
                  <ul className="list-disc list-inside text-gray-300 mt-4 space-y-2">
                    <li>Small satellite constellations for global internet coverage</li>
                    <li>Space manufacturing and research facilities</li>
                    <li>Asteroid mining and resource extraction</li>
                    <li>Space tourism and commercial space stations</li>
                    <li>Lunar and Mars colonization initiatives</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-white mt-6 mb-3">1.2 The Need for Decentralization</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Current space industry infrastructure relies on centralized authorities for mission approval,
                    resource allocation, and transaction processing. This creates inefficiencies, increases costs, and
                    limits innovation. Blockchain technology offers a solution through:
                  </p>
                  <ul className="list-disc list-inside text-gray-300 mt-4 space-y-2">
                    <li>Trustless peer-to-peer transactions</li>
                    <li>Immutable record keeping for mission data</li>
                    <li>Automated smart contract execution</li>
                    <li>Tokenization of space assets and services</li>
                    <li>Decentralized governance and decision-making</li>
                  </ul>
                </div>
              </section>

              {/* Problem Statement */}
              <section id="problem">
                <h2 className="text-3xl font-bold text-white mb-6">2. Problem Statement</h2>
                <div className="prose prose-invert max-w-none">
                  <h3 className="text-xl font-semibold text-white mb-3">2.1 High Barriers to Entry</h3>
                  <p className="text-gray-300 leading-relaxed">
                    The space industry remains inaccessible to most organizations due to:
                  </p>
                  <ul className="list-disc list-inside text-gray-300 mt-4 space-y-2">
                    <li>Complex regulatory requirements across multiple jurisdictions</li>
                    <li>High capital requirements for mission planning and execution</li>
                    <li>Limited access to launch providers and space infrastructure</li>
                    <li>Lack of standardized interfaces for space services</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-white mt-6 mb-3">2.2 Inefficient Resource Allocation</h3>
                  <p className="text-gray-300 leading-relaxed">Current systems suffer from:</p>
                  <ul className="list-disc list-inside text-gray-300 mt-4 space-y-2">
                    <li>Underutilized payload capacity on launches</li>
                    <li>Fragmented marketplace for space services</li>
                    <li>Lack of real-time pricing and availability data</li>
                    <li>Inefficient matching of supply and demand</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-white mt-6 mb-3">2.3 Lack of Transparency</h3>
                  <p className="text-gray-300 leading-relaxed">The industry lacks transparency in:</p>
                  <ul className="list-disc list-inside text-gray-300 mt-4 space-y-2">
                    <li>Mission success rates and performance metrics</li>
                    <li>Pricing structures and cost breakdowns</li>
                    <li>Resource availability and allocation decisions</li>
                    <li>Compliance and regulatory status</li>
                  </ul>
                </div>
              </section>

              {/* Solution */}
              <section id="solution">
                <h2 className="text-3xl font-bold text-white mb-6">3. Our Solution</h2>
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 leading-relaxed">
                    Lunargistics provides a comprehensive blockchain-based platform that addresses these challenges
                    through innovative technology and economic models.
                  </p>

                  <h3 className="text-xl font-semibold text-white mt-6 mb-3">3.1 Decentralized Space Marketplace</h3>
                  <p className="text-gray-300 leading-relaxed">Our platform creates a global marketplace where:</p>
                  <ul className="list-disc list-inside text-gray-300 mt-4 space-y-2">
                    <li>Launch providers can list available payload capacity</li>
                    <li>Satellite operators can offer data and communication services</li>
                    <li>Research facilities can share experiment slots</li>
                    <li>Space stations can rent habitation and storage modules</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-white mt-6 mb-3">3.2 Smart Contract Automation</h3>
                  <p className="text-gray-300 leading-relaxed">Automated smart contracts handle:</p>
                  <ul className="list-disc list-inside text-gray-300 mt-4 space-y-2">
                    <li>Mission planning and resource allocation</li>
                    <li>Payment processing and escrow services</li>
                    <li>Compliance verification and reporting</li>
                    <li>Performance tracking and milestone payments</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-white mt-6 mb-3">3.3 Tokenized Space Assets</h3>
                  <p className="text-gray-300 leading-relaxed">We enable tokenization of:</p>
                  <ul className="list-disc list-inside text-gray-300 mt-4 space-y-2">
                    <li>Satellite ownership and operation rights</li>
                    <li>Launch payload slots and mission shares</li>
                    <li>Space station modules and facilities</li>
                    <li>Asteroid mining claims and resources</li>
                  </ul>
                </div>
              </section>

              {/* Technology Architecture */}
              <section id="technology">
                <h2 className="text-3xl font-bold text-white mb-6">4. Technology Architecture</h2>
                <div className="prose prose-invert max-w-none">
                  <h3 className="text-xl font-semibold text-white mb-3">4.1 Blockchain Infrastructure</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Lunargistics is built on a multi-chain architecture supporting:
                  </p>
                  <ul className="list-disc list-inside text-gray-300 mt-4 space-y-2">
                    <li>Ethereum for smart contracts and DeFi integration</li>
                    <li>TEA Protocol for high-throughput mission data</li>
                    <li>IPFS for distributed data storage</li>
                    <li>Cross-chain bridges for interoperability</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-white mt-6 mb-3">4.2 Smart Contract Suite</h3>
                  <div className="bg-gray-900/50 rounded-lg p-6 mt-4">
                    <h4 className="text-lg font-semibold text-purple-400 mb-3">Core Contracts:</h4>
                    <ul className="space-y-3 text-gray-300">
                      <li>
                        <strong>MissionManager:</strong> Handles mission creation, planning, and execution
                      </li>
                      <li>
                        <strong>ResourceAllocator:</strong> Manages resource distribution and optimization
                      </li>
                      <li>
                        <strong>PaymentProcessor:</strong> Processes transactions and milestone payments
                      </li>
                      <li>
                        <strong>ComplianceVerifier:</strong> Ensures regulatory compliance across jurisdictions
                      </li>
                      <li>
                        <strong>TokenVault:</strong> Manages tokenized assets and staking mechanisms
                      </li>
                    </ul>
                  </div>

                  <h3 className="text-xl font-semibold text-white mt-6 mb-3">4.3 Oracle Integration</h3>
                  <p className="text-gray-300 leading-relaxed">Real-world data integration through:</p>
                  <ul className="list-disc list-inside text-gray-300 mt-4 space-y-2">
                    <li>Launch status and telemetry data feeds</li>
                    <li>Weather and space environment monitoring</li>
                    <li>Regulatory compliance verification</li>
                    <li>Market price feeds for resources and services</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-white mt-6 mb-3">4.4 Security Architecture</h3>
                  <p className="text-gray-300 leading-relaxed">Multi-layered security approach:</p>
                  <ul className="list-disc list-inside text-gray-300 mt-4 space-y-2">
                    <li>Formal verification of smart contracts</li>
                    <li>Multi-signature wallets for high-value transactions</li>
                    <li>Zero-knowledge proofs for privacy-sensitive data</li>
                    <li>Decentralized identity management</li>
                  </ul>
                </div>
              </section>

              {/* Tokenomics */}
              <section id="tokenomics">
                <h2 className="text-3xl font-bold text-white mb-6">5. Tokenomics</h2>
                <div className="prose prose-invert max-w-none">
                  <h3 className="text-xl font-semibold text-white mb-3">5.1 LUNAR Token</h3>
                  <p className="text-gray-300 leading-relaxed">
                    The LUNAR token serves as the native currency of the Lunargistics ecosystem:
                  </p>

                  <div className="bg-gray-900/50 rounded-lg p-6 mt-4">
                    <h4 className="text-lg font-semibold text-purple-400 mb-3">Token Distribution:</h4>
                    <ul className="space-y-2 text-gray-300">
                      <li>30% - Community and Ecosystem Development</li>
                      <li>25% - Protocol Treasury</li>
                      <li>20% - Team and Advisors (4-year vesting)</li>
                      <li>15% - Strategic Partnerships</li>
                      <li>10% - Public Sale</li>
                    </ul>
                  </div>

                  <h3 className="text-xl font-semibold text-white mt-6 mb-3">5.2 Token Utility</h3>
                  <ul className="list-disc list-inside text-gray-300 space-y-2">
                    <li>
                      <strong>Transaction Fees:</strong> Pay for platform services and smart contract execution
                    </li>
                    <li>
                      <strong>Staking:</strong> Stake tokens to become validators and earn rewards
                    </li>
                    <li>
                      <strong>Governance:</strong> Vote on protocol upgrades and parameter changes
                    </li>
                    <li>
                      <strong>Collateral:</strong> Use as collateral for mission insurance and bonds
                    </li>
                    <li>
                      <strong>Rewards:</strong> Earn tokens for contributing data and resources
                    </li>
                  </ul>

                  <h3 className="text-xl font-semibold text-white mt-6 mb-3">5.3 Economic Model</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Our economic model ensures sustainable growth through:
                  </p>
                  <ul className="list-disc list-inside text-gray-300 mt-4 space-y-2">
                    <li>Deflationary mechanisms through token burning</li>
                    <li>Dynamic fee adjustment based on network usage</li>
                    <li>Liquidity mining programs for market makers</li>
                    <li>Revenue sharing with token holders</li>
                  </ul>
                </div>
              </section>

              {/* Use Cases */}
              <section id="use-cases">
                <h2 className="text-3xl font-bold text-white mb-6">6. Use Cases</h2>
                <div className="prose prose-invert max-w-none">
                  <h3 className="text-xl font-semibold text-white mb-3">6.1 Small Satellite Operators</h3>
                  <div className="bg-gray-900/50 rounded-lg p-6 mt-4">
                    <p className="text-gray-300">
                      A startup wanting to deploy a constellation of Earth observation satellites can:
                    </p>
                    <ul className="list-disc list-inside text-gray-300 mt-3 space-y-2">
                      <li>Find and book rideshare launch opportunities</li>
                      <li>Tokenize satellite ownership to raise funding</li>
                      <li>Sell data services through smart contracts</li>
                      <li>Automate ground station scheduling and payments</li>
                    </ul>
                  </div>

                  <h3 className="text-xl font-semibold text-white mt-6 mb-3">6.2 Research Institutions</h3>
                  <div className="bg-gray-900/50 rounded-lg p-6 mt-4">
                    <p className="text-gray-300">Universities and research organizations can:</p>
                    <ul className="list-disc list-inside text-gray-300 mt-3 space-y-2">
                      <li>Book microgravity experiment slots on space stations</li>
                      <li>Share costs through collaborative mission planning</li>
                      <li>Access satellite data for research purposes</li>
                      <li>Verify experiment results on immutable blockchain</li>
                    </ul>
                  </div>

                  <h3 className="text-xl font-semibold text-white mt-6 mb-3">6.3 Space Tourism Providers</h3>
                  <div className="bg-gray-900/50 rounded-lg p-6 mt-4">
                    <p className="text-gray-300">Tourism companies can leverage the platform to:</p>
                    <ul className="list-disc list-inside text-gray-300 mt-3 space-y-2">
                      <li>Manage bookings and payments transparently</li>
                      <li>Issue NFT tickets as collectibles</li>
                      <li>Coordinate with multiple service providers</li>
                      <li>Ensure compliance across jurisdictions</li>
                    </ul>
                  </div>

                  <h3 className="text-xl font-semibold text-white mt-6 mb-3">6.4 Asteroid Mining Ventures</h3>
                  <div className="bg-gray-900/50 rounded-lg p-6 mt-4">
                    <p className="text-gray-300">Mining companies can utilize Lunargistics to:</p>
                    <ul className="list-disc list-inside text-gray-300 mt-3 space-y-2">
                      <li>Register and trade mining claims</li>
                      <li>Pre-sell extracted resources through futures contracts</li>
                      <li>Coordinate extraction and transportation logistics</li>
                      <li>Distribute profits to token holders automatically</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Roadmap */}
              <section id="roadmap">
                <h2 className="text-3xl font-bold text-white mb-6">7. Roadmap</h2>
                <div className="prose prose-invert max-w-none">
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-purple-900/50 to-transparent rounded-lg p-6">
                      <h3 className="text-xl font-semibold text-purple-400 mb-2">Phase 1: Foundation (Q1-Q2 2025)</h3>
                      <ul className="list-disc list-inside text-gray-300 space-y-2">
                        <li>Launch core smart contracts on Ethereum mainnet</li>
                        <li>Deploy TEA testnet integration</li>
                        <li>Release marketplace beta with initial partners</li>
                        <li>Conduct security audits and penetration testing</li>
                      </ul>
                    </div>

                    <div className="bg-gradient-to-r from-blue-900/50 to-transparent rounded-lg p-6">
                      <h3 className="text-xl font-semibold text-blue-400 mb-2">Phase 2: Expansion (Q3-Q4 2025)</h3>
                      <ul className="list-disc list-inside text-gray-300 space-y-2">
                        <li>Launch LUNAR token and liquidity pools</li>
                        <li>Integrate with major launch providers</li>
                        <li>Deploy oracle network for real-time data</li>
                        <li>Release mobile applications for iOS and Android</li>
                      </ul>
                    </div>

                    <div className="bg-gradient-to-r from-green-900/50 to-transparent rounded-lg p-6">
                      <h3 className="text-xl font-semibold text-green-400 mb-2">Phase 3: Scale (2026)</h3>
                      <ul className="list-disc list-inside text-gray-300 space-y-2">
                        <li>Launch decentralized governance system</li>
                        <li>Deploy cross-chain bridges to major blockchains</li>
                        <li>Integrate AI-powered mission optimization</li>
                        <li>Establish space industry partnerships</li>
                      </ul>
                    </div>

                    <div className="bg-gradient-to-r from-orange-900/50 to-transparent rounded-lg p-6">
                      <h3 className="text-xl font-semibold text-orange-400 mb-2">Phase 4: Dominance (2027+)</h3>
                      <ul className="list-disc list-inside text-gray-300 space-y-2">
                        <li>Become primary infrastructure for space commerce</li>
                        <li>Launch physical space assets managed by DAO</li>
                        <li>Enable interplanetary commerce and settlements</li>
                        <li>Support trillion-dollar space economy</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>

              {/* Team */}
              <section id="team">
                <h2 className="text-3xl font-bold text-white mb-6">8. Team</h2>
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 leading-relaxed">
                    Lunargistics is built by a team of space industry veterans, blockchain experts, and seasoned
                    entrepreneurs with a shared vision of democratizing access to space.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div className="bg-gray-900/50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-white mb-2">Core Team</h3>
                      <ul className="space-y-2 text-gray-300">
                        <li>20+ years combined space industry experience</li>
                        <li>Former SpaceX, NASA, and ESA engineers</li>
                        <li>Blockchain developers from leading DeFi protocols</li>
                        <li>Business leaders from Fortune 500 companies</li>
                      </ul>
                    </div>

                    <div className="bg-gray-900/50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-white mb-2">Advisory Board</h3>
                      <ul className="space-y-2 text-gray-300">
                        <li>Former NASA administrators</li>
                        <li>Commercial space pioneers</li>
                        <li>Blockchain protocol founders</li>
                        <li>Regulatory and compliance experts</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-purple-900/20 rounded-lg p-6 mt-6">
                    <h3 className="text-lg font-semibold text-purple-400 mb-3">Key Partnerships</h3>
                    <p className="text-gray-300">
                      We're working with leading organizations including launch providers, satellite manufacturers,
                      space agencies, research institutions, and blockchain infrastructure providers to build the future
                      of space commerce.
                    </p>
                  </div>
                </div>
              </section>

              {/* Conclusion */}
              <section id="conclusion">
                <h2 className="text-3xl font-bold text-white mb-6">9. Conclusion</h2>
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 leading-relaxed">
                    Lunargistics represents more than just a platform; it's a movement to democratize space and unlock
                    the vast potential of the space economy for everyone. By combining blockchain technology with space
                    industry expertise, we're creating the infrastructure needed for humanity's expansion beyond Earth.
                  </p>

                  <p className="text-gray-300 leading-relaxed mt-4">
                    The convergence of reduced launch costs, advanced satellite technology, and blockchain innovation
                    creates an unprecedented opportunity to revolutionize how we access and utilize space resources.
                    Lunargistics is positioned at the forefront of this revolution, providing the tools and
                    infrastructure needed to build a thriving space economy.
                  </p>

                  <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-lg p-6 mt-6">
                    <h3 className="text-xl font-semibold text-white mb-3">Join the Mission</h3>
                    <p className="text-gray-300">
                      Whether you're a space enthusiast, blockchain developer, investor, or organization looking to
                      leverage space technology, Lunargistics provides the platform to turn your space ambitions into
                      reality.
                    </p>
                    <div className="flex flex-wrap gap-4 mt-6">
                      <Link
                        href="/login"
                        className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-all duration-200"
                      >
                        Get Started
                      </Link>
                      <Link
                        href="https://discord.gg/lunargistics"
                        className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-all duration-200"
                      >
                        Join Community
                      </Link>
                    </div>
                  </div>

                  <div className="mt-8 p-6 bg-gray-900/50 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-3">Legal Disclaimer</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      This whitepaper is for informational purposes only and does not constitute financial, investment,
                      legal, or tax advice. The LUNAR token has not been registered under the securities laws of any
                      jurisdiction. Potential participants should conduct their own due diligence and consult with
                      qualified advisors before making any decisions.
                    </p>
                  </div>

                  <div className="mt-6 text-center">
                    <p className="text-gray-400">© 2025 Lunargistics. All rights reserved.</p>
                    <p className="text-gray-500 text-sm mt-2">Version 1.0 | Last Updated: January 2025</p>
                  </div>
                </div>
              </section>
            </div>
          </main>
        </div>
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg transition-all duration-200 z-50"
          aria-label="Scroll to top"
        >
          <ChevronUpIcon className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
