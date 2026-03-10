import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Menu,
  X,
  CheckCircle,
  Target,
  Eye,
  Heart,
  Users,
  Award,
  BookOpen,
} from 'lucide-react';
import LoginModal from '../../Components/Auth/LoginModal';
import schoolLogo from '../../assets/ACLC_LOGO.jpg';

function About() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const values = [
    {
      icon: Target,
      title: 'Excellence',
      description: 'We strive for excellence in everything we do, ensuring the highest quality educational tools.',
    },
    {
      icon: Heart,
      title: 'Student-Centered',
      description: 'Every feature is designed with students in mind, making their academic journey easier.',
    },
    {
      icon: Eye,
      title: 'Transparency',
      description: 'We believe in clear communication and transparent access to academic information.',
    },
  ];

  const stats = [
    { value: '5,000+', label: 'Students Enrolled' },
    { value: '200+', label: 'Expert Teachers' },
    { value: '50+', label: 'Programs Offered' },
    { value: '10+', label: 'Years of Excellence' },
  ];

  const team = [
    { name: 'Dr. Maria Santos', role: 'University President', image: 'MS' },
    { name: 'Prof. Juan Reyes', role: 'Academic Director', image: 'JR' },
    { name: 'Engr. Ana Lopez', role: 'IT Director', image: 'AL' },
    { name: 'Dr. Carlos Tan', role: 'Student Affairs Head', image: 'CT' },
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
              <Link to="/features" className="text-white/70 hover:text-white transition-colors font-medium">
                Features
              </Link>
              <Link to="/about" className="text-white font-semibold">
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
              <Link to="/features" className="block text-white/70 hover:text-white font-medium py-2">
                Features
              </Link>
              <Link to="/about" className="block text-white font-semibold py-2">
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
            About ACLC College
          </h1>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            Empowering students and educators with innovative technology for academic excellence.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-[#0b1c4a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-semibold text-white mb-6 font-display">
                Our Mission
              </h2>
              <p className="text-white/70 mb-6 leading-relaxed text-lg">
                ACLC College uses a comprehensive student information system designed to streamline 
                academic management and enhance the educational experience. Our platform connects 
                students, teachers, and administrators in one unified system.
              </p>
              <p className="text-white/70 mb-6 leading-relaxed">
                We believe that technology should make education more accessible, transparent, 
                and efficient. Our mission is to provide tools that empower students to take 
                control of their academic journey while giving educators the resources they 
                need to support student success.
              </p>
              <ul className="space-y-4">
                {[
                  'Real-time grade tracking and academic progress monitoring',
                  'Easy access to schedules, attendance, and course materials',
                  'Direct communication with teachers and classmates',
                  'Secure and reliable platform for all your academic needs',
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-[#2bd576] mt-0.5 shrink-0" />
                    <span className="text-white/80">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-2xl p-6 text-center border border-white/10">
                <Users className="w-10 h-10 text-white mx-auto mb-3" />
                <h3 className="font-semibold text-white">For Students</h3>
                <p className="text-sm text-white/70 mt-2">Track your progress and stay organized</p>
              </div>
              <div className="bg-white/5 rounded-2xl p-6 text-center border border-white/10">
                <BookOpen className="w-10 h-10 text-white mx-auto mb-3" />
                <h3 className="font-semibold text-white">For Teachers</h3>
                <p className="text-sm text-white/70 mt-2">Manage classes and grades efficiently</p>
              </div>
              <div className="bg-white/5 rounded-2xl p-6 text-center border border-white/10">
                <Award className="w-10 h-10 text-white mx-auto mb-3" />
                <h3 className="font-semibold text-white">For Admins</h3>
                <p className="text-sm text-white/70 mt-2">Oversee and manage the entire system</p>
              </div>
              <div className="bg-white/5 rounded-2xl p-6 text-center border border-white/10">
                <GraduationCap className="w-10 h-10 text-white mx-auto mb-3" />
                <h3 className="font-semibold text-white">For Success</h3>
                <p className="text-sm text-white/70 mt-2">Built for academic achievement</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-[#0f235f]">
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

      {/* Values Section */}
      <section className="py-20 bg-[#0b1c4a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-semibold text-white mb-4 font-display">
              Our Core Values
            </h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              The principles that guide everything we do at ACLC College.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <div key={index} className="text-center p-8 bg-white/5 rounded-2xl border border-white/10">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <value.icon className="w-8 h-8 text-[#0b1c4a]" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{value.title}</h3>
                <p className="text-white/70 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-[#0f235f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-semibold text-white mb-4 font-display">
              Leadership Team
            </h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              Meet the dedicated leaders behind ACLC College.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div key={index} className="bg-white/5 rounded-2xl p-6 text-center border border-white/10">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-[#0b1c4a]">{member.image}</span>
                </div>
                <h3 className="text-lg font-semibold text-white">{member.name}</h3>
                <p className="text-white/60 text-sm mt-1">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-linear-to-br from-white via-white to-[#f1f3f9]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-semibold text-[#0b1c4a] mb-6 font-display">
            Ready to Begin Your Journey?
          </h2>
          <p className="text-xl text-slate-900/80 mb-8">
            Join thousands of students who are already using ACLC College.
          </p>
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="px-8 py-4 bg-[#e31b23] text-white font-semibold rounded-full hover:bg-[#c3161d] transition-colors shadow-lg"
          >
            Login Now
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

export default About;
