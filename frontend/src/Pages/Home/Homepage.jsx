import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Award,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle,
  ChevronRight,
  GraduationCap,
  LayoutGrid,
  Menu,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  X,
} from 'lucide-react';
import LoginModal from '../../Components/Auth/LoginModal';

function Homepage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [initialLoginError, setInitialLoginError] = useState('');
  const [returnUrl, setReturnUrl] = useState('');
  const schoolLogo = new URL('../../assets/ACLC_LOGO.jpg', import.meta.url).href;

  // Check if we were redirected from a protected route
  useEffect(() => {
    if (location.state?.showLoginModal) {
      setIsLoginModalOpen(true);
      setInitialLoginError(location.state.loginError || '');
      setReturnUrl(location.state.from || '');
      // Clear the state so it doesn't persist on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  // Clear initial error when modal is closed
  const handleCloseModal = () => {
    setIsLoginModalOpen(false);
    setInitialLoginError('');
  };

  const features = [
    {
      icon: LayoutGrid,
      title: 'Unified Dashboard',
      description: 'A clean, focused overview of schedules, grades, and announcements in one place.',
    },
    {
      icon: Calendar,
      title: 'Smart Scheduling',
      description: 'See classes, labs, and events with reminders that keep you on track.',
    },
    {
      icon: BookOpen,
      title: 'Course Hub',
      description: 'Syllabi, resources, and submissions organized per subject, no clutter.',
    },
    {
      icon: ShieldCheck,
      title: 'Secure Access',
      description: 'Role-based access and audit-ready activity logs for peace of mind.',
    },
  ];

  const stats = [
    { value: '5,000+', label: 'Students Enrolled' },
    { value: '200+', label: 'Expert Teachers' },
    { value: '50+', label: 'Programs Offered' },
    { value: '98%', label: 'Parent Satisfaction' },
  ];

  const programs = [
    { title: 'Junior High', detail: 'STEM-focused curriculum with project-based learning.' },
    { title: 'Senior High', detail: 'Tracks for STEM, ABM, HUMSS, and GAS.' },
    { title: 'Arts & Design', detail: 'Creative studio modules with portfolio reviews.' },
    { title: 'Sports Academy', detail: 'Athlete-centered schedules and performance analytics.' },
  ];

  const testimonials = [
    {
      name: 'Alyssa R.',
      role: 'Parent',
      quote: 'The portal is clear and fast. I can track attendance and announcements easily.',
    },
    {
      name: 'Miguel S.',
      role: 'Student',
      quote: 'Everything I need is in one dashboard. The schedule view is a game changer.',
    },
    {
      name: 'Prof. Reyes',
      role: 'Teacher',
      quote: 'Grades, attendance, and reports sync smoothly. It saves us hours every week.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0b1c4a] text-white">
      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-[#0b1c4a]/80 backdrop-blur border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 bg-white">
                <img src={schoolLogo} alt="ACLC College" className="w-full h-full object-cover" />
              </div>
              <span className="text-xl font-bold tracking-tight">ACLC College</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link to="/" className="text-white font-semibold">
                Home
              </Link>
              <Link to="/features" className="text-white/70 hover:text-white transition-colors font-medium">
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
                className="px-6 py-2.5 bg-[#e31b23] text-white font-semibold rounded-full hover:bg-[#c3161d] transition-colors"
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
              <Link to="/" className="block text-white font-semibold py-2">
                Home
              </Link>
              <Link to="/features" className="block text-white/70 hover:text-white font-medium py-2">
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
                className="block w-full text-center px-6 py-2.5 bg-[#e31b23] text-white font-semibold rounded-full transition-colors mt-4"
              >
                Login
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] pt-28 pb-20 overflow-hidden">
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1800&q=80')",
            }}
          />
          <div className="absolute inset-0 bg-linear-to-r from-[#0b1c4a] via-[#0b1c4a]/85 to-[#0b1c4a]/10" />
          <div className="absolute inset-0 bg-linear-to-t from-[#0b1c4a]/80 via-transparent to-[#0b1c4a]/40" />
        </div>

        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#1c4ad0]/30 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-[#e31b23]/25 blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-full text-sm font-medium mb-6 border border-white/15">
                <Sparkles className="w-4 h-4 text-[#e31b23]" />
                <span>Back to school enrollment now open</span>
              </div>
              <h1 className="text-4xl sm:text-5xl xl:text-6xl font-semibold leading-tight mb-6 font-display">
                Your Kids Deserve The{' '}
                <span className="text-[#e31b23]">Best Education</span>
              </h1>
              <p className="text-lg text-white/75 mb-8 leading-relaxed max-w-xl">
                Active learning, expert teachers, and a safe environment. ACLC College keeps families, students,
                and teachers connected with clarity and confidence.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#e31b23] hover:bg-[#c3161d] text-white font-semibold rounded-full transition-colors"
                >
                  Admission Now
                  <ArrowRight className="w-5 h-5" />
                </button>
                <Link
                  to="/features"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-full border border-white/20 transition-colors"
                >
                  Explore Programs
                </Link>
              </div>
              <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-white/70">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#2bd576]" />
                  <span>Modern campus facilities</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#2bd576]" />
                  <span>Scholarships available</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#2bd576]" />
                  <span>Parent portal included</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -top-10 right-8 bg-white text-[#0b1c4a] px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                Back to School
                <span className="absolute -bottom-2 left-6 h-0 w-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-white" />
              </div>
              <div className="relative rounded-4xl bg-white/10 border border-white/20 p-6 backdrop-blur">
                <div className="absolute -right-6 -bottom-6 h-36 w-36 rounded-full bg-[#e31b23]/50 blur-2xl" />
                <div className="relative rounded-3xl bg-[#0b1c4a]/80 p-6 border border-white/10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                      <GraduationCap className="w-6 h-6 text-[#0b1c4a]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Student Snapshot</h3>
                      <p className="text-sm text-white/60">Live academic summary</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-white" />
                        <span className="text-white/80 font-medium">Attendance</span>
                      </div>
                      <span className="text-[#2bd576] font-semibold">96%</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                      <div className="flex items-center gap-3">
                        <BookOpen className="w-5 h-5 text-[#e31b23]" />
                        <span className="text-white/80 font-medium">Active Subjects</span>
                      </div>
                      <span className="text-white font-semibold">8 Courses</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                      <div className="flex items-center gap-3">
                        <Award className="w-5 h-5 text-white" />
                        <span className="text-white/80 font-medium">Performance</span>
                      </div>
                      <span className="text-white font-semibold">Top 10%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-[#0b1c4a] border-y border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl lg:text-4xl font-semibold text-white mb-2">{stat.value}</div>
                <div className="text-white/70 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-[#0f235f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 text-white rounded-full text-xs font-semibold uppercase tracking-wide mb-4">
              <Star className="w-3.5 h-3.5 text-white" />
              Built for clarity
            </div>
            <h2 className="text-3xl lg:text-4xl font-semibold text-white mb-4 font-display">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              A modern student information system with a friendly, shadcn-inspired layout and
              thoughtful micro-interactions.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
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

          <div className="text-center mt-12">
            <Link
              to="/features"
              className="inline-flex items-center gap-2 text-white hover:text-white/80 font-semibold"
            >
              View All Features
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section className="py-20 bg-[#0b1c4a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-12 items-start">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 text-white rounded-full text-xs font-semibold uppercase tracking-wide mb-4">
                <GraduationCap className="w-3.5 h-3.5 text-white" />
                Programs
              </div>
              <h2 className="text-3xl lg:text-4xl font-semibold text-white mb-4 font-display">
                Designed for Every Learner
              </h2>
              <p className="text-white/70 mb-8 leading-relaxed">
                From junior high to specialized academies, each program is structured for
                engagement, safety, and measurable progress.
              </p>
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#e31b23] text-white font-semibold rounded-full hover:bg-[#c3161d] transition-colors"
              >
                Apply Today
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-6">
              {programs.map((program, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-white/30 hover:bg-white/10 transition-all"
                >
                  <h3 className="text-lg font-semibold text-white mb-2">{program.title}</h3>
                  <p className="text-white/70 text-sm leading-relaxed">{program.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-20 bg-[#0f235f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 text-white rounded-full text-xs font-semibold uppercase tracking-wide mb-3">
                <MessageCircle className="w-3.5 h-3.5 text-white" />
                Trusted voices
              </div>
              <h2 className="text-3xl lg:text-4xl font-semibold text-white font-display">What our community says</h2>
            </div>
            <div className="hidden md:flex items-center gap-2 text-white/60">
              <span className="text-sm">Rated 4.9/5</span>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, index) => (
                  <Star key={index} className="w-4 h-4 text-white" />
                ))}
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition-colors"
              >
                <p className="text-white/80 mb-6 leading-relaxed">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white text-[#0b1c4a] flex items-center justify-center font-semibold">
                    {testimonial.name.split(' ')[0].slice(0, 1)}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{testimonial.name}</p>
                    <p className="text-white/60 text-sm">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-linear-to-br from-white via-white to-[#f1f3f9]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#0b1c4a] text-white rounded-full text-xs font-semibold uppercase tracking-wide mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Enrollment open
          </div>
          <h2 className="text-3xl lg:text-4xl font-semibold text-[#0b1c4a] mb-6 font-display">
            Ready to Begin a Better School Year?
          </h2>
          <p className="text-lg text-slate-900/80 mb-8">
            Secure a slot, explore the portal, and experience a smoother academic journey.
          </p>
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#e31b23] text-white font-semibold rounded-full hover:bg-[#c3161d] transition-colors shadow-lg"
          >
            Login Now
            <ChevronRight className="w-5 h-5" />
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

      {/* Login Modal */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={handleCloseModal} 
        initialError={initialLoginError}
        returnUrl={returnUrl}
      />
    </div>
  );
}

export default Homepage;
