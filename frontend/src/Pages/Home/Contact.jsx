import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Menu,
  X,
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  MessageSquare,
  HelpCircle,
  FileText,
} from 'lucide-react';
import LoginModal from '../../Components/Auth/LoginModal';
import schoolLogo from '../../assets/ACLC_LOGO.jpg';

function Contact() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email Us',
      details: 'support@educore.edu',
      subtext: 'We reply within 24 hours',
    },
    {
      icon: Phone,
      title: 'Call Us',
      details: '+1 (555) 123-4567',
      subtext: 'Mon-Fri, 8am-5pm',
    },
    {
      icon: MapPin,
      title: 'Visit Us',
      details: '123 Education Street',
      subtext: 'Metro City, MC 12345',
    },
    {
      icon: Clock,
      title: 'Office Hours',
      details: 'Monday - Friday',
      subtext: '8:00 AM - 5:00 PM',
    },
  ];

  const quickLinks = [
    { icon: HelpCircle, title: 'FAQs', description: 'Find answers to common questions' },
    { icon: FileText, title: 'Documentation', description: 'User guides and tutorials' },
    { icon: MessageSquare, title: 'Live Chat', description: 'Chat with our support team' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setSubmitSuccess(true);
    setFormData({ name: '', email: '', subject: '', message: '' });
    
    setTimeout(() => setSubmitSuccess(false), 5000);
  };

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
              <Link to="/about" className="text-white/70 hover:text-white transition-colors font-medium">
                About
              </Link>
              <Link to="/contact" className="text-white font-semibold">
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
              <Link to="/about" className="block text-white/70 hover:text-white font-medium py-2">
                About
              </Link>
              <Link to="/contact" className="block text-white font-semibold py-2">
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
            Get in Touch
          </h1>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            Have questions or need assistance? We're here to help you succeed.
          </p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-16 bg-[#0f235f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map((info, index) => (
              <div key={index} className="bg-white/5 rounded-xl p-6 text-center border border-white/10">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-4">
                  <info.icon className="w-6 h-6 text-[#0b1c4a]" />
                </div>
                <h3 className="font-semibold text-white mb-1">{info.title}</h3>
                <p className="text-white font-medium">{info.details}</p>
                <p className="text-white/60 text-sm mt-1">{info.subtext}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & Map Section */}
      <section className="py-20 bg-[#0b1c4a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <h2 className="text-3xl font-semibold text-white mb-6 font-display">Send Us a Message</h2>
              <p className="text-white/70 mb-8">
                Fill out the form below and we'll get back to you as soon as possible.
              </p>

              {submitSuccess && (
                <div className="mb-6 p-4 bg-emerald-400/10 border border-emerald-400/30 rounded-xl text-emerald-200">
                  Thank you for your message! We'll get back to you soon.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-white/80 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-white/20 bg-white/5 text-white rounded-xl focus:ring-2 focus:ring-[#e31b23] focus:border-[#e31b23] transition-colors placeholder:text-white/50"
                      placeholder="Juan Dela Cruz"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-white/20 bg-white/5 text-white rounded-xl focus:ring-2 focus:ring-[#e31b23] focus:border-[#e31b23] transition-colors placeholder:text-white/50"
                      placeholder="juan@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-white/80 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-white/20 bg-white/5 text-white rounded-xl focus:ring-2 focus:ring-[#e31b23] focus:border-[#e31b23] transition-colors placeholder:text-white/50"
                    placeholder="How can we help you?"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-white/80 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="w-full px-4 py-3 border border-white/20 bg-white/5 text-white rounded-xl focus:ring-2 focus:ring-[#e31b23] focus:border-[#e31b23] transition-colors resize-none placeholder:text-white/50"
                    placeholder="Tell us more about your inquiry..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full md:w-auto px-8 py-3 bg-[#e31b23] hover:bg-[#c3161d] disabled:bg-[#e31b23]/60 text-white font-semibold rounded-full transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#e31b23]/30"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Send Message</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Map & Quick Links */}
            <div>
              {/* Map */}
              <div className="bg-white/5 rounded-2xl h-64 mb-8 overflow-hidden border border-white/10">
                <iframe
                  title="ACLC College - Ormoc City"
                  src="https://www.google.com/maps?q=Brgy,%20Lilia%20Ave,%20Ormoc%20City,%20Leyte&output=embed"
                  className="w-full h-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <p className="text-white/60 text-sm mb-8">
                Brgy, Lilia Ave, Ormoc City, Leyte
              </p>

              {/* Quick Links */}
              <h3 className="text-xl font-semibold text-white mb-4 font-display">Quick Support</h3>
              <div className="space-y-4">
                {quickLinks.map((link, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                      <link.icon className="w-5 h-5 text-[#0b1c4a]" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{link.title}</h4>
                      <p className="text-white/70 text-sm">{link.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
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

export default Contact;
