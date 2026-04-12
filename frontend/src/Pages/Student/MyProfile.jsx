import '../../App.css';
import { useState, useEffect, useCallback } from "react";
import Sidebar from "../../Components/Student/Sidebar.jsx";
import Swal from 'sweetalert2';
import { 
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  Award,
  Lock,
  Edit2,
  Save,
  X,
  Camera,
  CheckCircle,
  AlertCircle,
  Clock,
  Loader2
} from 'lucide-react';
import authService from '../../service/authService';
import studentService from '../../service/studentService';

// Fallback data for development/demo
const getFallbackAcademicData = () => ({
    studentNumber: "2024-CS-001",
    fullName: "Juan Dela Cruz",
    program: "Bachelor of Science in Computer Science",
    yearLevel: "3rd Year",
    section: "A",
    academicStatus: "Active",
    enrollmentStatus: "Enrolled",
    dateEnrolled: "August 15, 2022",
    expectedGraduation: "April 2026"
});

const getFallbackContactInfo = () => ({
    email: "juan.delacruz@educore.edu",
    personalEmail: "juan.cruz@gmail.com",
    phone: "+63 912 345 6789",
    address: "123 Main Street, Barangay San Juan, Manila City",
    emergencyContact: "Maria Dela Cruz",
    emergencyPhone: "+63 917 654 3210"
});

function MyProfile() {
    const [activeItem, setActiveItem] = useState("My Profile");
    const [isEditingContact, setIsEditingContact] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    
    // Read-only academic data - Cannot be changed by student
    const [academicData, setAcademicData] = useState(getFallbackAcademicData());

    // Editable contact information
    const [contactInfo, setContactInfo] = useState(getFallbackContactInfo());

    const [editedContact, setEditedContact] = useState({...contactInfo});

    const fetchProfile = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await authService.getProfile();
            const user = response.data || response || {};
            const student = user.student || user;
            
            // Map API response to academic data
            setAcademicData({
                studentNumber: student.student_number || student.student_id || user.id || getFallbackAcademicData().studentNumber,
                fullName: `${user.first_name || student.first_name || ''} ${user.last_name || student.last_name || ''}`.trim() || getFallbackAcademicData().fullName,
                program: student.program?.name || student.program_name || getFallbackAcademicData().program,
                yearLevel: student.year_level || student.yearLevel || getFallbackAcademicData().yearLevel,
                section: student.section?.name || student.section_name || student.section || getFallbackAcademicData().section,
                academicStatus: student.status || student.academic_status || getFallbackAcademicData().academicStatus,
                enrollmentStatus: student.enrollment_status || getFallbackAcademicData().enrollmentStatus,
                dateEnrolled: student.date_enrolled ? new Date(student.date_enrolled).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : getFallbackAcademicData().dateEnrolled,
                expectedGraduation: student.expected_graduation || getFallbackAcademicData().expectedGraduation
            });
            
            // Map API response to contact info
            const contact = {
                email: user.email || getFallbackContactInfo().email,
                personalEmail: student.personal_email || user.personal_email || getFallbackContactInfo().personalEmail,
                phone: user.phone || student.phone || getFallbackContactInfo().phone,
                address: student.address || user.address || getFallbackContactInfo().address,
                emergencyContact: student.emergency_contact || student.emergency_contact_name || getFallbackContactInfo().emergencyContact,
                emergencyPhone: student.emergency_phone || student.emergency_contact_phone || getFallbackContactInfo().emergencyPhone
            };
            setContactInfo(contact);
            setEditedContact(contact);
        } catch (err) {
            console.error('Failed to fetch profile:', err);
            setError('Failed to load profile data');
            setAcademicData(getFallbackAcademicData());
            setContactInfo(getFallbackContactInfo());
            setEditedContact(getFallbackContactInfo());
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const handleEditContact = () => {
        setIsEditingContact(true);
        setEditedContact({...contactInfo});
    };

    const handleSaveContact = async () => {
        setSaving(true);
        try {
            await authService.updateProfile({
                phone: editedContact.phone,
                personal_email: editedContact.personalEmail,
                address: editedContact.address,
                emergency_contact: editedContact.emergencyContact,
                emergency_phone: editedContact.emergencyPhone
            });
            setContactInfo({...editedContact});
            setIsEditingContact(false);
            await Swal.fire({
                title: 'Contact Information Updated',
                text: 'Your contact information has been saved successfully.',
                icon: 'success',
                confirmButtonText: 'OK',
                confirmButtonColor: '#2563eb',
            });
        } catch (err) {
            console.error('Failed to save contact info:', err);
            setError('Failed to save contact information');
        } finally {
            setSaving(false);
        }
    };

    const handleCancelEdit = () => {
        setIsEditingContact(false);
        setEditedContact({...contactInfo});
    };

    const handleInputChange = (field, value) => {
        setEditedContact(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            'Active': { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
            'Probation': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: AlertCircle },
            'Graduated': { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Award },
            'LOA': { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: Clock }
        };
        
        const config = statusConfig[status] || statusConfig['Active'];
        const Icon = config.icon;
        
        return (
            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold border ${config.color}`}>
                <Icon className="w-4 h-4" />
                {status}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex h-screen">
                <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
                <div className="h-screen bg-gray-50 p-8 flex-1 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen">
            <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
            <div className="h-screen bg-gray-50 p-8 flex-1 overflow-y-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
                    <p className="text-gray-600 mt-1">View and manage your personal and academic information</p>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                        <AlertCircle className="w-5 h-5" />
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Profile Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                            {/* Profile Photo */}
                            <div className="flex flex-col items-center">
                                <div className="relative">
                                    <div className="w-32 h-32 bg-linear-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                        <User className="w-16 h-16 text-white" />
                                    </div>
                                    <button className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center shadow-lg transition-colors">
                                        <Camera className="w-5 h-5 text-white" />
                                    </button>
                                </div>
                                
                                <h2 className="text-xl font-bold text-gray-900 mt-4 text-center">{academicData.fullName}</h2>
                                <p className="text-sm text-gray-600 mt-1">{academicData.studentNumber}</p>
                                
                                <div className="mt-4">
                                    {getStatusBadge(academicData.academicStatus)}
                                </div>

                                <div className="w-full mt-6 pt-6 border-t border-gray-200">
                                    <div className="space-y-3 text-sm">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <GraduationCap className="w-4 h-4" />
                                            <span className="font-medium">Program</span>
                                        </div>
                                        <p className="text-gray-900 text-xs">{academicData.program}</p>
                                        
                                        <div className="flex items-center gap-2 text-gray-600 mt-4">
                                            <Award className="w-4 h-4" />
                                            <span className="font-medium">Year & Section</span>
                                        </div>
                                        <p className="text-gray-900">{academicData.yearLevel} - Section {academicData.section}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Academic Status Card */}
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mt-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Academic Information</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-gray-600 font-medium">Enrollment Status</label>
                                    <p className="text-sm text-gray-900 font-semibold">{academicData.enrollmentStatus}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-600 font-medium">Date Enrolled</label>
                                    <p className="text-sm text-gray-900">{academicData.dateEnrolled}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-600 font-medium">Expected Graduation</label>
                                    <p className="text-sm text-gray-900">{academicData.expectedGraduation}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Detailed Information */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Personal Information (Read-Only) */}
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Lock className="w-4 h-4" />
                                    <span>Read-only</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Student Number
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={academicData.studentNumber}
                                            disabled
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                                        />
                                        <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Full Name
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={academicData.fullName}
                                            disabled
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                                        />
                                        <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Program / Course
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={academicData.program}
                                            disabled
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                                        />
                                        <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Year Level
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={academicData.yearLevel}
                                            disabled
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                                        />
                                        <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Section
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={academicData.section}
                                            disabled
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                                        />
                                        <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm text-blue-800">
                                    <Lock className="w-4 h-4 inline mr-2" />
                                    These fields are managed by the Registrar's Office and cannot be changed by students.
                                </p>
                            </div>
                        </div>

                        {/* Contact Information (Editable) */}
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
                                {!isEditingContact ? (
                                    <button
                                        onClick={handleEditContact}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                        Edit
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleSaveContact}
                                            disabled={saving}
                                            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors text-sm font-medium"
                                        >
                                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                            {saving ? 'Saving...' : 'Save'}
                                        </button>
                                        <button
                                            onClick={handleCancelEdit}
                                            disabled={saving}
                                            className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors text-sm font-medium"
                                        >
                                            <X className="w-4 h-4" />
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 items-center gap-2">
                                        <Mail className="w-4 h-4" />
                                        School Email
                                    </label>
                                    <input
                                        type="email"
                                        value={isEditingContact ? editedContact.email : contactInfo.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        disabled={!isEditingContact}
                                        className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${
                                            isEditingContact ? 'bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500' : 'bg-gray-50 cursor-not-allowed'
                                        }`}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 items-center gap-2">
                                        <Mail className="w-4 h-4" />
                                        Personal Email
                                    </label>
                                    <input
                                        type="email"
                                        value={isEditingContact ? editedContact.personalEmail : contactInfo.personalEmail}
                                        onChange={(e) => handleInputChange('personalEmail', e.target.value)}
                                        disabled={!isEditingContact}
                                        className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${
                                            isEditingContact ? 'bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500' : 'bg-gray-50 cursor-not-allowed'
                                        }`}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 items-center gap-2">
                                        <Phone className="w-4 h-4" />
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        value={isEditingContact ? editedContact.phone : contactInfo.phone}
                                        onChange={(e) => handleInputChange('phone', e.target.value)}
                                        disabled={!isEditingContact}
                                        className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${
                                            isEditingContact ? 'bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500' : 'bg-gray-50 cursor-not-allowed'
                                        }`}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 items-center gap-2">
                                        <MapPin className="w-4 h-4" />
                                        Address
                                    </label>
                                    <input
                                        type="text"
                                        value={isEditingContact ? editedContact.address : contactInfo.address}
                                        onChange={(e) => handleInputChange('address', e.target.value)}
                                        disabled={!isEditingContact}
                                        className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${
                                            isEditingContact ? 'bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500' : 'bg-gray-50 cursor-not-allowed'
                                        }`}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 items-center gap-2">
                                        <User className="w-4 h-4" />
                                        Emergency Contact Name
                                    </label>
                                    <input
                                        type="text"
                                        value={isEditingContact ? editedContact.emergencyContact : contactInfo.emergencyContact}
                                        onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                                        disabled={!isEditingContact}
                                        className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${
                                            isEditingContact ? 'bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500' : 'bg-gray-50 cursor-not-allowed'
                                        }`}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 items-center gap-2">
                                        <Phone className="w-4 h-4" />
                                        Emergency Contact Phone
                                    </label>
                                    <input
                                        type="tel"
                                        value={isEditingContact ? editedContact.emergencyPhone : contactInfo.emergencyPhone}
                                        onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
                                        disabled={!isEditingContact}
                                        className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${
                                            isEditingContact ? 'bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500' : 'bg-gray-50 cursor-not-allowed'
                                        }`}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MyProfile;
