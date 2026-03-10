import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  BookOpen,
  Users,
  Calendar,
  Award,
  Menu,
  X,
  ClipboardList,
  Bell,
  BarChart3,
  Shield,
  Clock,
  Smartphone,
} from 'lucide-react';
import LoginModal from '../../Components/Auth/LoginModal';
import schoolLogo from '../../assets/ACLC_LOGO.jpg';

function Features() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const mainFeatures = [
    {
      icon: BookOpen,
      title: 'Course Management',
      description: 'Access your enrolled subjects, view syllabi, and track your academic progress all in one place.',
    },
    {
      icon: Calendar,
      title: 'Schedule & Attendance',
      description: 'View your class schedules, track attendance records, and never miss an important class.',
    },
    {
      icon: Award,
      title: 'Grades & Reports',
      description: 'Check your grades in real-time, view academic reports, and monitor your performance.',
    },
    {
      icon: Users,
      title: 'Announcements',
      description: 'Stay updated with the latest announcements from your teachers and school administration.',
    },
  ];

  const additionalFeatures = [
    {
      icon: ClipboardList,
      title: 'Easy Enrollment',
      description: 'Streamlined enrollment process with real-time class availability and prerequisites checking.',
    },
    {
      icon: Bell,
      title: 'Notifications',
      description: 'Get instant notifications for grades, announcements, and important deadlines.',
    },
    {
      icon: BarChart3,
      title: 'Progress Tracking',
      description: 'Visual dashboards to track your academic progress throughout the semester.',
    },
    {
      icon: Shield,
      title: 'Secure Platform',
      description: 'Your data is protected with industry-standard security measures and encryption.',
    },
    {
      icon: Clock,
      title: 'Real-time Updates',
      description: 'All information is updated in real-time, ensuring you always have the latest data.',
    },
    {
      icon: Smartphone,
      title: 'Mobile Friendly',
      description: 'Access your portal from any device - desktop, tablet, or mobile phone.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0b1c4a] text-white">
      {/* Navigation */}
      <nav className="bg-[#0b1c4a]/90 backdrop-blur sticky top-0 z-50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 bg-white">
                <img src={schoolLogo} alt="ACLC College" className="w-full h-full object-cover" />
              </div>
              <span className="text-xl font-bold text-white">ACLC College</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link to="/" className="text-white/70 hover:text-white transition-colors font-medium">
                Home
              </Link>
              <Link to="/features" className="text-white font-semibold">
                Features
              </Link>
              <Link to="/about" className="text-white/70 hover:text-white transition-colors font-medium">
                About
              </Link>
              <Link to="/contact" className="text-white/70 hover:text-white transition-colors font-medium">
                Contact
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="px-6 py-2.5 bg-[#e31b23] hover:bg-[#c3161d] text-white font-semibold rounded-full transition-colors"
              >
                Login
              </button>
            </div>

            <button
              className="md:hidden p-2 rounded-lg hover:bg-white/10"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0b1c4a] border-t border-white/10 py-4">
            <div className="px-4 space-y-3">
              <Link to="/" className="block text-white/70 hover:text-white font-medium py-2">
                Home
              </Link>
              <Link to="/features" className="block text-white font-semibold py-2">
                Features
              </Link>
              <Link to="/about" className="block text-white/70 hover:text-white font-medium py-2">
                About
              </Link>
              <Link to="/contact" className="block text-white/70 hover:text-white font-medium py-2">
                Contact
              </Link>
              <button
                onClick={() => { setIsLoginModalOpen(true); setMobileMenuOpen(false); }}
                className="block w-full text-center px-6 py-2.5 bg-[#e31b23] hover:bg-[#c3161d] text-white font-semibold rounded-full transition-colors mt-4"
              >
                Login
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="bg-linear-to-br from-[#0b1c4a] to-[#0f235f] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-5xl font-semibold text-white mb-6 font-display">
            Powerful Features for Academic Success
          </h1>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            Discover all the tools and features designed to make your academic journey smoother and more productive.
          </p>
        </div>
      </section>

      {/* Main Features Section */}
      <section className="py-20 bg-[#0f235f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-semibold text-white mb-4 font-display">
              Core Features
            </h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              Essential tools that every student needs for a successful academic experience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {mainFeatures.map((feature, index) => (
              <div
                key={index}
                className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-white/30 hover:bg-white/10 transition-all group"
              >
                <div className="w-14 h-14 bg-white/10 group-hover:bg-white rounded-xl flex items-center justify-center mb-5 transition-colors">
                  <feature.icon className="w-7 h-7 text-white group-hover:text-[#0b1c4a] transition-colors" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-white/70 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Features Section */}
      <section className="py-20 bg-[#0b1c4a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-semibold text-white mb-4 font-display">
              More Features You'll Love
            </h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              Additional capabilities that enhance your learning experience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {additionalFeatures.map((feature, index) => (
              <div
                key={index}
                className="flex gap-4 p-6 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
              >
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shrink-0">
                  <feature.icon className="w-6 h-6 text-[#0b1c4a]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-white/70 text-sm leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-linear-to-br from-white via-white to-[#f1f3f9]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-semibold text-[#0b1c4a] mb-6 font-display">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-slate-900/80 mb-8">
            Log in now and experience all these features firsthand.
          </p>
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="px-8 py-4 bg-[#e31b23] text-white font-semibold rounded-full hover:bg-[#c3161d] transition-colors shadow-lg"
          >
            Login to Your Account
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0b1c4a] text-white/60 py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 bg-white">
                <img src={schoolLogo} alt="ACLC College" className="w-full h-full object-cover" />
              </div>
              <span className="text-xl font-bold text-white">ACLC College</span>
            </Link>
            <div className="flex items-center gap-8">
              <Link to="/features" className="hover:text-white transition-colors">Features</Link>
              <Link to="/about" className="hover:text-white transition-colors">About</Link>
              <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
            </div>
            <p className="text-sm">© 2026 ACLC College. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </div>
  );
}

export default Features;
