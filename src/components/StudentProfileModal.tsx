import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Hash, MapPin, Calendar, CheckCircle, XCircle, Sparkles, CreditCard, Building, GraduationCap, Edit3, Save, RotateCcw } from 'lucide-react';
import { StudentDetails } from '../types/auth';
import { fetchEliteCard, updateStudentProfile, getStudentDetails } from '../services/api';
import toast from 'react-hot-toast';

interface StudentProfileModalProps {
  studentDetails: StudentDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdate?: (updatedDetails: StudentDetails) => void;
  token?: string;
}

const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  studentDetails,
  isOpen,
  onClose,
  onProfileUpdate,
  token,
}) => {
  const [eliteCard, setEliteCard] = useState<any>(null);
  const [loadingEliteCard, setLoadingEliteCard] = useState(false);
  
  // Edit mode states
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [originalForm, setOriginalForm] = useState({
    name: '',
    email: '',
    phone: '',
  });

  // Initialize form data when studentDetails changes
  useEffect(() => {
    if (studentDetails) {
      const formData = {
        name: studentDetails.name || '',
        email: studentDetails.email || '',
        phone: studentDetails.phone?.toString() || '',
      };
      setEditForm(formData);
      setOriginalForm(formData);
    }
  }, [studentDetails]);

  // Fetch elite card data
  useEffect(() => {
    const getEliteCard = async () => {
      if (studentDetails?.registration_number && isOpen) {
        try {
          setLoadingEliteCard(true);
          const data = await fetchEliteCard(studentDetails.registration_number);
          if (data.success) {
            setEliteCard(data.data);
          }
        } catch (err) {
          console.error("Elite Card Fetch Error:", err);
        } finally {
          setLoadingEliteCard(false);
        }
      }
    };

    getEliteCard();
  }, [studentDetails?.registration_number, isOpen]);

  if (!isOpen || !studentDetails) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPhone = (phone: number) => {
    const phoneStr = phone.toString();
    if (phoneStr.length === 10) {
      return `+91 ${phoneStr.slice(0, 5)} ${phoneStr.slice(5)}`;
    }
    return phoneStr;
  };

  // Edit functions
  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditForm(originalForm);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!token) {
      toast.error('Authentication token is required');
      return;
    }

    // Basic validation
    if (!editForm.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!editForm.email.trim()) {
      toast.error('Email is required');
      return;
    }
    if (!editForm.phone.trim()) {
      toast.error('Phone number is required');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editForm.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Phone validation (10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(editForm.phone)) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    try {
      setIsSaving(true);
      
      const updateData = {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        phone: parseInt(editForm.phone),
      };

      await updateStudentProfile(token, updateData);
      
      // Refresh student details to get updated data
      if (studentDetails?.student_id) {
        const updatedDetails = await getStudentDetails(studentDetails.student_id);
        
        // Update the original form data
        setOriginalForm(editForm);
        
        // Notify parent component
        if (onProfileUpdate) {
          onProfileUpdate(updatedDetails);
        }
      }
      
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 backdrop-blur-sm transition-opacity duration-300 animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto animate-scaleIn"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-1">{studentDetails.name}</h2>
                  <p className="text-blue-100 text-sm">
                    Registration: {studentDetails.registration_number}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Edit/Save/Cancel Buttons */}
                {!isEditing ? (
                  <button
                    onClick={handleEdit}
                    className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all duration-200"
                    title="Edit Profile"
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>
                ) : (
                  <div className="flex gap-1">
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all duration-200 disabled:opacity-50"
                      title="Save Changes"
                    >
                      {isSaving ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Save className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={isSaving}
                      className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all duration-200 disabled:opacity-50"
                      title="Cancel"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </button>
                  </div>
                )}
                <button
                  onClick={onClose}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all duration-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Status Badge */}
            <div className="mt-4 flex gap-2">
              <span
                className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1 ${
                  studentDetails.status
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {studentDetails.status ? (
                  <>
                    <CheckCircle className="w-3 h-3" />
                    Active Account
                  </>
                ) : (
                  <>
                    <XCircle className="w-3 h-3" />
                    Inactive Account
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Personal Information Section */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-50 p-2 rounded-lg">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Personal Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-500">Full Name</span>
                  </div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full text-lg font-semibold text-gray-900 bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <p className="text-lg font-semibold text-gray-900">{studentDetails.name}</p>
                  )}
                </div>

                {/* Email */}
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-500">Email Address</span>
                  </div>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full text-lg font-semibold text-gray-900 bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your email address"
                    />
                  ) : (
                    <p className="text-lg font-semibold text-gray-900">{studentDetails.email}</p>
                  )}
                </div>

                {/* Phone */}
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-500">Phone Number</span>
                  </div>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full text-lg font-semibold text-gray-900 bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your phone number"
                      maxLength={10}
                    />
                  ) : (
                    <p className="text-lg font-semibold text-gray-900">{formatPhone(studentDetails.phone)}</p>
                  )}
                </div>

                {/* Registration Number */}
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <Hash className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-500">Registration Number</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{studentDetails.registration_number}</p>
                  <p className="text-xs text-gray-500 mt-1">Cannot be changed</p>
                </div>
              </div>
            </div>

            {/* Academic Information Section */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-purple-50 p-2 rounded-lg">
                  <GraduationCap className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Academic Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* State */}
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-500">State</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{studentDetails.state.state_name}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Admin: {studentDetails.state.state_admin}
                  </p>
                </div>

                {/* Center */}
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <Building className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-500">Center</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{studentDetails.center.center_name}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Admin: {studentDetails.center.center_admin}
                  </p>
                </div>
              </div>
            </div>

            {/* Elite Card Section */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-2 rounded-lg">
                  <CreditCard className="w-5 h-5 text-yellow-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Elite Card Details</h3>
              </div>
              
              {loadingEliteCard ? (
                <div className="bg-gray-50 p-6 rounded-xl text-center">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-2"></div>
                  <p className="text-gray-600">Loading elite card details...</p>
                </div>
              ) : eliteCard ? (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 p-6 rounded-xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <Sparkles className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-700">Card Type</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">{eliteCard.card_type || 'N/A'}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <Hash className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-700">Card Number</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">{eliteCard.card_number || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 p-6 rounded-xl text-center">
                  <CreditCard className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">No elite card information available</p>
                </div>
              )}
            </div>

            {/* Account Information Section */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-green-50 p-2 rounded-lg">
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Account Information</h3>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-500">Account Created</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">{formatDate(studentDetails.created_at)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StudentProfileModal;
