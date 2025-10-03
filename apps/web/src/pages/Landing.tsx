import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  const features = [
    {
      icon: '👥',
      title: 'Recruitment Management',
      description: 'Streamline your hiring process from job posting to onboarding with automated workflows and scoring systems.'
    },
    {
      icon: '📅',
      title: 'Leave Management',
      description: 'Request, approve, and track leave applications with real-time balance updates and approval workflows.'
    },
    {
      icon: '💰',
      title: 'Claims & Expenses',
      description: 'Submit and manage expense claims with document uploads and multi-level approval processes.'
    },
    {
      icon: '🏦',
      title: 'Staff Loans',
      description: 'Apply for 14th and 15th salary loans with automated eligibility checks and repayment tracking.'
    },
    {
      icon: '📊',
      title: 'Performance KPIs',
      description: 'Track and manage employee performance metrics with comprehensive analytics and reporting.'
    },
    {
      icon: '📄',
      title: 'Document Management',
      description: 'Securely store, manage, and access employee documents with version control and audit trails.'
    },
    {
      icon: '📱',
      title: 'Mobile Access',
      description: 'Access the portal on-the-go with our mobile app featuring push notifications and offline support.'
    },
    {
      icon: '🔒',
      title: 'Secure & Compliant',
      description: 'Enterprise-grade security with role-based access control, audit logging, and data encryption.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img 
                src="/src/assets/LogoHeader.svg" 
                alt="Kechita Capital" 
                className="h-10 w-10"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Kechita Capital</h1>
                <p className="text-xs text-gray-500">Staff Portal</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Compact & Colorful with Kechita Brand Colors */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #018ede 0%, #84b02c 50%, #99cc33 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="text-center relative z-10">
            <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm font-medium mb-6 border border-white/30">
              <span className="animate-pulse mr-2 text-[#ed1c24]">●</span>
              Enterprise HR Management System
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-5 leading-tight">
              Your Complete
              <span className="block" style={{ color: '#99cc33' }}>
                HR Portal
              </span>
            </h1>
            
            <p className="text-lg text-blue-50 max-w-2xl mx-auto mb-8 leading-relaxed">
              Welcome to Kechita Capital's comprehensive staff portal. Access all your HR needs in one place - 
              from leave applications to performance tracking, everything you need is right here.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <button
                onClick={() => navigate('/login')}
                className="px-8 py-4 bg-white hover:bg-[#99cc33] text-[#018ede] hover:text-white text-lg font-semibold rounded-xl transition-all shadow-2xl hover:shadow-3xl hover:-translate-y-1"
              >
                Access Portal →
              </button>
              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white text-lg font-semibold rounded-xl hover:bg-white/20 transition-all border-2 border-white/30"
              >
                Learn More
              </button>
            </div>

            {/* Stats - Colorful Cards with Brand Colors */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all">
                <div className="text-3xl font-bold mb-1" style={{ color: '#99cc33' }}>140+</div>
                <div className="text-sm text-blue-100">API Endpoints</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all">
                <div className="text-3xl font-bold mb-1" style={{ color: '#84b02c' }}>10</div>
                <div className="text-sm text-blue-100">HR Modules</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all">
                <div className="text-3xl font-bold mb-1" style={{ color: '#99cc33' }}>24/7</div>
                <div className="text-sm text-blue-100">Availability</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all">
                <div className="text-3xl font-bold text-white mb-1">100%</div>
                <div className="text-sm text-blue-100">Secure</div>
              </div>
            </div>
          </div>
        </div>

        {/* Animated Background Elements with Brand Colors */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ backgroundColor: '#99cc33' }}></div>
          <div className="absolute top-20 right-10 w-72 h-72 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000" style={{ backgroundColor: '#84b02c' }}></div>
          <div className="absolute bottom-10 left-1/2 w-80 h-80 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-500" style={{ backgroundColor: '#018ede' }}></div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need as a Kechita Capital Team Member
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Your all-in-one platform for HR services, designed specifically for our team
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 border border-gray-100"
              >
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">
                Why Our Staff Portal Stands Out
              </h2>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mr-4">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
                    <p className="text-blue-100">
                      Built with modern technologies for blazing-fast performance and smooth user experience.
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mr-4">
                    <span className="text-2xl">🔐</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Enterprise Security</h3>
                    <p className="text-blue-100">
                      Role-based access control, JWT authentication, and comprehensive audit trails.
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mr-4">
                    <span className="text-2xl">📱</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Mobile First</h3>
                    <p className="text-blue-100">
                      Access on any device with our responsive web app and native mobile applications.
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mr-4">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Automated Workflows</h3>
                    <p className="text-blue-100">
                      Reduce manual work with intelligent automation and real-time notifications.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
                <div className="space-y-4">
                  <div className="h-4 bg-white/30 rounded w-3/4"></div>
                  <div className="h-4 bg-white/30 rounded w-full"></div>
                  <div className="h-4 bg-white/30 rounded w-5/6"></div>
                  <div className="space-y-2 pt-4">
                    <div className="h-16 bg-white/20 rounded-xl"></div>
                    <div className="h-16 bg-white/20 rounded-xl"></div>
                    <div className="h-16 bg-white/20 rounded-xl"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-600 mb-10">
            Access your personalized dashboard and manage all your HR needs in one place.
          </p>
            <button
                onClick={() => navigate('/login')}
                className="px-10 py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-2xl shadow-blue-500/30 hover:shadow-3xl hover:-translate-y-1"
              >
                Access Your Portal →
              </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <img 
                  src="/src/assets/LogoHeader.svg" 
                  alt="Kechita Capital" 
                  className="h-8 w-8"
                />
                <div>
                  <h3 className="text-lg font-bold text-white">Kechita Capital</h3>
                  <p className="text-xs text-gray-400">Staff Portal</p>
                </div>
              </div>
              <p className="text-sm text-gray-400 max-w-md">
                Kechita Capital's internal HR management system - streamlining operations 
                and empowering our team members with self-service capabilities.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/login" className="hover:text-white transition-colors">Sign In</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Contact HR</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <span className="mr-2">📧</span>
                  <a href="mailto:hr@kechitacapital.com" className="hover:text-white transition-colors">
                    hr@kechitacapital.com
                  </a>
                </li>
                <li className="flex items-center">
                  <span className="mr-2">📞</span>
                  <span>+254 709 123 456</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-2">📍</span>
                  <span>Westlands, Nairobi</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; {new Date().getFullYear()} Kechita Capital. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
