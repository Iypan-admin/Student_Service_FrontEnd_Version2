import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Hash, MapPin, Calendar, CheckCircle, XCircle, Sparkles, CreditCard, Building, GraduationCap, Edit3, Save, RotateCcw, Trash2, ExternalLink } from 'lucide-react';
import { StudentDetails } from '../types/auth';
import { fetchEliteCard, updateStudentProfile, getStudentDetails, uploadStudentProfilePicture, deleteStudentProfilePicture } from '../services/api';
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
  const [isVisible, setIsVisible] = useState(false);
  
  // Profile picture upload states
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [deletingPicture, setDeletingPicture] = useState(false);
  
  // Edit mode states
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    date_of_birth: '',
  });
  const [originalForm, setOriginalForm] = useState({
    name: '',
    email: '',
    phone: '',
    date_of_birth: '',
  });

  // Initialize form data when studentDetails changes
  useEffect(() => {
    if (studentDetails) {
      const formData = {
        name: studentDetails.name || '',
        email: studentDetails.email || '',
        phone: studentDetails.phone?.toString() || '',
        date_of_birth: studentDetails.date_of_birth || '',
      };
      setEditForm(formData);
      setOriginalForm(formData);
    }
  }, [studentDetails]);

  // Handle visibility animation
  useEffect(() => {
    if (isOpen && studentDetails) {
      setIsVisible(true);
      // Reset profile picture preview when modal opens
      setProfilePicturePreview(studentDetails.profile_picture || null);
    } else {
      setIsVisible(false);
    }
  }, [isOpen, studentDetails]);

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

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300); // Wait for animation to complete
  };

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
        date_of_birth: editForm.date_of_birth || null,
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

  // Profile picture upload handlers
  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      setProfilePicture(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadProfilePicture = async () => {
    if (!profilePicture || !token) {
      toast.error('Please select an image file');
      return;
    }

    setUploadingPicture(true);
    try {
      const imageUrl = await uploadStudentProfilePicture(token, profilePicture);
      
      // Update preview immediately with the uploaded URL
      setProfilePicturePreview(imageUrl);
      
      // Update student details with new profile picture
      if (studentDetails?.student_id) {
        const updatedDetails = await getStudentDetails(studentDetails.student_id);
        
        // Update studentDetails state to reflect the new profile picture
        if (onProfileUpdate) {
          // Ensure profile_picture is included in the updated details
          const detailsWithPicture = {
            ...updatedDetails,
            profile_picture: imageUrl
          };
          onProfileUpdate(detailsWithPicture);
        }
      }
      
      // Clear the file input
      setProfilePicture(null);
      
      // Reset file input element
      const fileInput = document.getElementById('profile-picture-input') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      
      toast.success('Profile picture uploaded successfully!');
    } catch (error: any) {
      console.error('Error uploading profile picture:', error);
      toast.error(error.message || 'Failed to upload profile picture');
    } finally {
      setUploadingPicture(false);
    }
  };

  // Delete profile picture handler
  const handleDeleteProfilePicture = async () => {
    if (!token || !studentDetails?.profile_picture) {
      toast.error('No profile picture to delete');
      return;
    }

    // Confirm deletion
    if (!window.confirm('Are you sure you want to delete your profile picture?')) {
      return;
    }

    setDeletingPicture(true);
    try {
      await deleteStudentProfilePicture(token);
      
      // Update student details
      if (studentDetails?.student_id) {
        const updatedDetails = await getStudentDetails(studentDetails.student_id);
        
        // Clear preview
        setProfilePicturePreview(null);
        
        // Update studentDetails state
        if (onProfileUpdate) {
          onProfileUpdate({
            ...updatedDetails,
            profile_picture: undefined
          });
        }
      }
      
      toast.success('Profile picture deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting profile picture:', error);
      toast.error(error.message || 'Failed to delete profile picture');
    } finally {
      setDeletingPicture(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black z-50 overflow-y-auto transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        onClick={handleClose}
      />

      {/* Right Side Slide-in Panel */}
      <div className="fixed inset-0 z-50 flex justify-end">
        <div
          className={`fixed right-0 top-0 h-full w-full sm:w-96 md:w-[28rem] bg-white shadow-2xl transform transition-transform duration-300 ease-out overflow-y-auto ${
            isVisible ? 'translate-x-0' : 'translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - BERRY Style */}
          <div className="sticky top-0 bg-white border-b border-gray-200 z-10 px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-md" style={{ background: 'linear-gradient(to bottom right, #2196f3, #1976d2)' }}>
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{studentDetails.name}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {studentDetails.registration_number}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Edit/Save/Cancel Buttons */}
                {!isEditing ? (
                  <button
                    onClick={handleEdit}
                    className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg px-3 py-2 transition-all duration-200"
                    title="Edit Profile"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span className="text-sm font-medium">Edit</span>
                  </button>
                ) : (
                  <div className="flex gap-1">
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg p-2 transition-all duration-200 disabled:opacity-50"
                      title="Save Changes"
                    >
                      {isSaving ? (
                        <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={isSaving}
                      className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg p-2 transition-all duration-200 disabled:opacity-50"
                      title="Cancel"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-2 transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Status Badge */}
            <div className="mt-3 flex gap-2">
              <span
                className={`px-2.5 py-1 text-xs font-semibold rounded-full flex items-center gap-1 ${
                  studentDetails.status
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {studentDetails.status ? (
                  <>
                    <CheckCircle className="w-3 h-3" />
                    Active
                  </>
                ) : (
                  <>
                    <XCircle className="w-3 h-3" />
                    Inactive
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Profile Picture Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-blue-50 p-1.5 rounded-lg">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Profile Picture</h3>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="flex flex-col items-center gap-3">
                  {/* Profile Picture Display */}
                  <div className="relative">
                    {profilePicturePreview ? (
                      <img
                        src={profilePicturePreview}
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover border-2 border-gray-300"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                        {studentDetails.name?.charAt(0).toUpperCase() || 'S'}
                      </div>
                    )}
                  </div>
                  
                  {/* Upload Controls - Only visible in edit mode */}
                  {isEditing && (
                    <div className="w-full space-y-2">
                      <label className="block">
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png"
                          onChange={handleProfilePictureChange}
                          className="hidden"
                          id="profile-picture-input"
                        />
                        <span className="block w-full text-center px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
                          {profilePicture ? 'Change Image' : 'Choose Image'}
                        </span>
                      </label>
                      
                      {profilePicture && (
                        <button
                          onClick={handleUploadProfilePicture}
                          disabled={uploadingPicture}
                          className="w-full px-3 py-2 text-xs font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {uploadingPicture ? 'Uploading...' : 'Upload Picture'}
                        </button>
                      )}
                      
                      {/* Delete Button - Only show if profile picture exists and no new image selected */}
                      {profilePicturePreview && !profilePicture && (
                        <button
                          onClick={handleDeleteProfilePicture}
                          disabled={deletingPicture}
                          className="w-full px-3 py-2 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          {deletingPicture ? 'Deleting...' : 'Delete Picture'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Personal Information Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-blue-50 p-1.5 rounded-lg">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Personal Information</h3>
              </div>
              
              <div className="space-y-3">
                {/* Name */}
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-1.5">
                    <User className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-xs font-medium text-gray-500">Full Name</span>
                  </div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full text-sm font-semibold text-gray-900 bg-white border border-gray-300 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <p className="text-sm font-semibold text-gray-900">{studentDetails.name}</p>
                  )}
                </div>

                {/* Email */}
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Mail className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-xs font-medium text-gray-500">Email Address</span>
                  </div>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full text-sm font-semibold text-gray-900 bg-white border border-gray-300 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your email address"
                    />
                  ) : (
                    <p className="text-sm font-semibold text-gray-900 break-all">{studentDetails.email}</p>
                  )}
                </div>

                {/* Phone */}
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Phone className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-xs font-medium text-gray-500">Phone Number</span>
                  </div>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full text-sm font-semibold text-gray-900 bg-white border border-gray-300 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your phone number"
                      maxLength={10}
                    />
                  ) : (
                    <p className="text-sm font-semibold text-gray-900">{formatPhone(studentDetails.phone)}</p>
                  )}
                </div>

                {/* Date of Birth */}
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-xs font-medium text-gray-500">Date of Birth</span>
                  </div>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editForm.date_of_birth}
                      onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                      className="w-full text-sm font-semibold text-gray-900 bg-white border border-gray-300 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Select your date of birth"
                      max={new Date().toISOString().split('T')[0]} // Prevent future dates
                    />
                  ) : (
                    <p className="text-sm font-semibold text-gray-900">
                      {studentDetails.date_of_birth ? new Date(studentDetails.date_of_birth).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'Not specified'}
                    </p>
                  )}
                </div>

                {/* Registration Number */}
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Hash className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-xs font-medium text-gray-500">Registration Number</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{studentDetails.registration_number}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Cannot be changed</p>
                </div>
              </div>
            </div>

            {/* Academic Information Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-purple-50 p-1.5 rounded-lg">
                  <GraduationCap className="w-4 h-4 text-purple-600" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Academic Information</h3>
              </div>
              
              <div className="space-y-3">
                {/* State */}
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-xs font-medium text-gray-500">State</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{studentDetails.state.state_name}</p>
                </div>

                {/* Center */}
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Building className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-xs font-medium text-gray-500">Center</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{studentDetails.center.center_name}</p>
                </div>
              </div>
            </div>

            {/* Elite Card Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-1.5 rounded-lg">
                  <CreditCard className="w-4 h-4 text-yellow-600" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Elite Card Details</h3>
              </div>
              
              {loadingEliteCard ? (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                  <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mb-2"></div>
                  <p className="text-xs text-gray-600">Loading elite card details...</p>
                </div>
              ) : eliteCard ? (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 p-4 rounded-lg">
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-yellow-600" />
                        <span className="text-xs font-medium text-yellow-700">Card Type</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{eliteCard.card_type || 'N/A'}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <Hash className="w-3.5 h-3.5 text-yellow-600" />
                        <span className="text-xs font-medium text-yellow-700">Card Number</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{eliteCard.card_number || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                  <CreditCard className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-600 mb-3">You don't have an Elite Card yet. Purchase one to get started!</p>
                  <a
                    href="https://www.indianschoolformodernlanguages.com/elite-card"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all shadow-sm hover:shadow-md"
                  >
                    <span>Purchase Elite Card</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            {/* Account Information Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-green-50 p-1.5 rounded-lg">
                  <Calendar className="w-4 h-4 text-green-600" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Account Information</h3>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-xs font-medium text-gray-500">Account Created</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">{formatDate(studentDetails.created_at)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StudentProfileModal;
