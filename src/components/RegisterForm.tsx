import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { UserPlus } from 'lucide-react';
import { register, getStates, getCenters, getAllCenters } from '../services/api';
import { State, Center } from '../types/auth';
import { Eye, EyeOff } from 'lucide-react';

interface RegisterFormProps {
  onBack?: () => void;
  embedded?: boolean;
}

const RegisterForm = (props: RegisterFormProps = {}) => {
  const { onBack, embedded = false } = props;
  const navigate = useNavigate();
  const [states, setStates] = useState<State[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [allCenters, setAllCenters] = useState<Center[]>([]);
  // const [batches, setBatches] = useState<Batch[]>([]);
  // const [selectedBatch, setSelectedBatch] = useState<string>('');
  // const [studentId, setStudentId] = useState<string>('');
  // const [showBatchPopup, setShowBatchPopup] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    name: '',
    state: '',
    center: '',
    email: '',
    password: '',
    phone: '',
    is_referred: false,
    referred_by_center: '',
    affiliated_link: '',
  });
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isCenterDisabled, setIsCenterDisabled] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const selectedStateObj = states.find((s) => s.state_id === formData.state);
  const isOnlineModeSelection = selectedStateObj?.state_name.toLowerCase() === 'online';


  useEffect(() => {
    const fetchStates = async () => {
      try {
        const data = await getStates();
        setStates(data);
      } catch (error) {
        console.error('Error fetching states:', error);
      }
    };
    
    const fetchAllCenters = async () => {
      try {
        const data = await getAllCenters();
        setAllCenters(data);
      } catch (error) {
        console.error('Error fetching all centers:', error);
      }
    };
    
    fetchStates();
    fetchAllCenters();
  }, []);

  const handleStateChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedStateId = e.target.value;

    // Clear existing center and disable flag
    setFormData({ ...formData, state: selectedStateId, center: '', referred_by_center: '' });
    setIsCenterDisabled(false); // reset to false initially

    if (selectedStateId) {
      try {
        const data = await getCenters(selectedStateId);

        const selectedState = states.find((s) => s.state_id === selectedStateId);
        const isOnlineMode = selectedState?.state_name.toLowerCase() === 'online';
        const isOfflineMode = selectedState?.state_name.toLowerCase() === 'offline';

        if (isOfflineMode) {
          setCenters([]); // Hide/filter Offline centres from the registration form
        } else {
          setCenters(data);
        }

        // If mode is Online and only one center is available → auto-select and disable
        if (isOnlineMode && data.length === 1) {
          setFormData((prev) => ({
            ...prev,
            center: data[0].center_id,
          }));
          setIsCenterDisabled(true); // 💥 make center dropdown disabled
        }
      } catch (error) {
        console.error('Error fetching centers:', error);
      }
    } else {
      setCenters([]);
    }
  };



  // const fetchBatches = async (centerId: string) => {
  //   try {
  //     const data = await getBatches(centerId);
  //     setBatches(data.batches);
  //   } catch (error) {
  //     console.error('Error fetching batches:', error);
  //     setBatches([]);
  //   }
  // };

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: ''
    };

    // Name validation
    if (formData.name.length < 3) {
      newErrors.name = 'Name must be at least 3 characters long';
      isValid = false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    // Password validation
    if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
      isValid = false;
    }

    // Confirm password validation
    if (formData.password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    // Phone validation: exactly 10 digits starting with 6-9
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid 10-digit Indian mobile number';
      isValid = false;
    }

    // Referral Centre is mandatory when Online mode is selected
    if (isOnlineModeSelection && !formData.referred_by_center) {
      toast.error('Referral Centre is required for Online mode');
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    try {
      await register(formData);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Registration failed. Please try again.');
    }
  };


  const formContent: React.ReactElement = (
    <div className={`${embedded ? 'w-full h-full flex flex-col' : 'max-w-xl w-full'}`}>
      <div className={`${embedded ? 'bg-transparent flex-1 flex flex-col justify-start overflow-y-auto py-4' : 'bg-white shadow-2xl rounded-2xl'} ${embedded ? 'p-0' : 'p-8 sm:p-10'}`}>
            {!embedded && (
              <div>
                <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
                  <UserPlus className="h-6 w-6 text-blue-600" />
                </div>
                <h2 className="mt-6 text-center text-3xl font-bold text-gray-900 tracking-tight">
                  Register your account
                </h2>
              </div>
            )}
            {embedded && (
              <div className="mb-2 sm:mb-3 flex-shrink-0" style={{ marginBottom: 'clamp(0.5rem, 2vh, 1rem)' }}>
                <h1 
                  className="font-bold text-gray-900 leading-tight break-words text-center"
                  style={{ fontSize: 'clamp(1.25rem, 4vw, 2.5rem)', marginBottom: 'clamp(0.25rem, 1vh, 0.5rem)' }}
                >
                  Register your account
                </h1>
                <p 
                  className="text-gray-600 leading-tight text-center"
                  style={{ fontSize: 'clamp(0.75rem, 1.5vw, 1rem)' }}
                >
                  Fill in your details to get started
                </p>
              </div>
            )}
            <form className={embedded ? "flex-shrink-0 space-y-4" : "mt-8 space-y-6"} onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className={`block font-medium text-gray-700 ${embedded ? 'font-semibold' : 'text-sm'}`} style={embedded ? { fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)', marginBottom: 'clamp(0.25rem, 1vh, 0.5rem)' } : { marginBottom: '0.25rem' }}>
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className={`appearance-none block w-full border ${errors.name ? 'border-red-300' : 'border-gray-300'
                      } rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${embedded ? 'px-4 py-2.5' : 'px-4 py-3 rounded-md shadow-sm'} ${embedded ? '' : 'sm:text-sm'}`}
                    style={embedded ? { 
                      paddingTop: 'clamp(0.5rem, 1.5vh, 0.75rem)',
                      paddingBottom: 'clamp(0.5rem, 1.5vh, 0.75rem)',
                      fontSize: 'clamp(0.875rem, 1.5vw, 1rem)'
                    } : {}}
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                  {errors.name && <p className={`mt-1 text-red-600 ${embedded ? 'text-xs' : 'text-sm'}`}>{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                    Mode
                  </label>
                  <select
                    id="state"
                    name="state"
                    required
                    className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 sm:text-sm"
                    value={formData.state}
                    onChange={handleStateChange}
                  >
                    <option value="">Select Mode</option>
                    {states.map((state) => (
                      <option key={state.state_id} value={state.state_id}>
                        {state.state_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="center" className="block text-sm font-medium text-gray-700 mb-1">
                    Center
                  </label>
                  <select
                    id="center"
                    name="center"
                    required
                    disabled={!formData.state || isCenterDisabled} // ✅ updated here
                    className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 sm:text-sm"
                    value={formData.center}
                    onChange={(e) => setFormData({ ...formData, center: e.target.value })}
                  >
                    <option value="">Select Center</option>
                    {centers.map((center) => (
                      <option key={center.center_id} value={center.center_id}>
                        {center.center_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className={`appearance-none block w-full px-4 py-3 border ${errors.email ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 sm:text-sm`}
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>

                {/* Password Field */}
                <div className="relative">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className={`appearance-none block w-full px-4 py-3 border ${errors.password ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 sm:text-sm`}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  {/* Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-[38px] text-gray-500"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                </div>

                {/* Confirm Password Field */}
                <div className="relative mt-4">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    className={`appearance-none block w-full px-4 py-3 border ${errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 sm:text-sm`}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  {/* Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-[38px] text-gray-500"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none select-none z-10">
                      <svg width="20" height="14" viewBox="0 0 3 2" className="mr-2 inline-block align-middle rounded-sm shadow-sm border border-gray-200">
                        <rect width="3" height="2" fill="#0038A8" />
                        <rect width="3" height="0.66" fill="#FF9933" />
                        <rect y="0.66" width="3" height="0.66" fill="#FFFFFF" />
                        <rect y="1.33" width="3" height="0.66" fill="#138808" />
                        <circle cx="1.5" cy="1" r="0.18" fill="#000080" />
                        <circle cx="1.5" cy="1" r="0.12" fill="#FFFFFF" />
                        <circle cx="1.5" cy="1" r="0.06" fill="#000080" />
                      </svg>
                      <span className="text-sm font-semibold text-gray-600">+91</span>
                      <span className="h-4 w-px bg-gray-300 mx-2"></span>
                    </div>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      className={`appearance-none block w-full px-4 py-3 border ${errors.phone ? 'border-red-300' : 'border-gray-300'
                        } rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 sm:text-sm`}
                      style={{ paddingLeft: '78px' }}
                      placeholder="10-digit mobile number"
                      value={formData.phone}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/\D/g, '');
                        setFormData({ ...formData, phone: cleaned.slice(0, 10) });
                      }}
                    />
                  </div>
                  {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                </div>

                {/* Referral Section */}
                <div className="border-t pt-6 mt-6">
                  {isOnlineModeSelection ? (
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="referred_by_center" className="block text-sm font-semibold text-gray-700 mb-1">
                          Referral Centre <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="referred_by_center"
                          name="referred_by_center"
                          required
                          className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 sm:text-sm"
                          value={formData.referred_by_center}
                          onChange={(e) => setFormData({ ...formData, referred_by_center: e.target.value })}
                        >
                          <option value="">Select Referral Centre</option>
                          {allCenters.map((center) => (
                            <option key={center.center_id} value={center.center_id}>
                              {center.center_name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="affiliated_link" className="block text-sm font-medium text-gray-700 mb-1">
                          Affiliated Link (Optional)
                        </label>
                        <input
                          id="affiliated_link"
                          name="affiliated_link"
                          type="text"
                          className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 sm:text-sm"
                          placeholder="Paste affiliated link or code if any"
                          value={formData.affiliated_link}
                          onChange={(e) => setFormData({ ...formData, affiliated_link: e.target.value })}
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center mb-4">
                        <input
                          id="is_referred"
                          name="is_referred"
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          checked={formData.is_referred}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            is_referred: e.target.checked,
                            referred_by_center: e.target.checked ? formData.referred_by_center : ''
                          })}
                        />
                        <label htmlFor="is_referred" className="ml-2 block text-sm font-medium text-gray-700">
                          Were you referred by any ISML center?
                        </label>
                      </div>
                      
                      {formData.is_referred && (
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="referred_by_center" className="block text-sm font-medium text-gray-700 mb-1">
                              Referring Center
                            </label>
                            <select
                              id="referred_by_center"
                              name="referred_by_center"
                              required={formData.is_referred}
                              className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 sm:text-sm"
                              value={formData.referred_by_center}
                              onChange={(e) => setFormData({ ...formData, referred_by_center: e.target.value })}
                            >
                              <option value="">Select referring center</option>
                              {allCenters.map((center) => (
                                <option key={center.center_id} value={center.center_id}>
                                  {center.center_name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label htmlFor="affiliated_link" className="block text-sm font-medium text-gray-700 mb-1">
                              Affiliated Link (Optional)
                            </label>
                            <input
                              id="affiliated_link"
                              name="affiliated_link"
                              type="text"
                              className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 sm:text-sm"
                              placeholder="Paste affiliated link or code if any"
                              value={formData.affiliated_link}
                              onChange={(e) => setFormData({ ...formData, affiliated_link: e.target.value })}
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

              </div>

              <div className="flex gap-3" style={{ marginTop: embedded ? 'clamp(0.75rem, 2vh, 1rem)' : '0' }}>
                {embedded && onBack && (
                  <button
                    type="button"
                    onClick={onBack}
                    className="flex-1 border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 font-semibold rounded-lg transition-all duration-200 bg-white hover:bg-gray-50 active:scale-[0.98]"
                    style={{ 
                      paddingTop: 'clamp(0.625rem, 2vh, 0.75rem)',
                      paddingBottom: 'clamp(0.625rem, 2vh, 0.75rem)',
                      fontSize: 'clamp(0.875rem, 1.5vw, 1rem)'
                    }}
                  >
                    Back to Login
                  </button>
                )}
                <button
                  type="submit"
                  className={`${embedded ? 'flex-1' : 'w-full'} group relative flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98]`}
                  style={embedded ? { 
                    paddingTop: 'clamp(0.625rem, 2vh, 0.75rem)',
                    paddingBottom: 'clamp(0.625rem, 2vh, 0.75rem)',
                    fontSize: 'clamp(0.875rem, 1.5vw, 1rem)'
                  } : {}}
                >
                  Register
                </button>
              </div>
            </form>
            {showSuccessModal && (
              <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl max-w-md w-full space-y-6 text-center transform transition-all animate-in fade-in zoom-in-95 duration-200">
                  <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-green-100 shadow-inner">
                    <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l8-5.333a2 2 0 012.22 0l8 5.333A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                    </svg>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">Registration Request Received!</h3>
                    
                    <div className="bg-blue-50/70 rounded-xl p-3 border border-blue-100/50 text-center">
                      <p className="text-[10px] text-blue-800 font-bold uppercase tracking-wider mb-1">Registered Email</p>
                      <p className="text-sm font-bold text-gray-800 break-all">{formData.email}</p>
                    </div>

                    <p className="text-sm text-gray-600 leading-relaxed">
                      Your application has been successfully submitted. Our team will review the details and send your <span className="font-semibold text-gray-900">Register Number</span> and approval status directly to your email.
                    </p>

                    <p className="text-xs font-semibold text-blue-600 bg-blue-50 py-1.5 px-3 rounded-lg inline-block">
                      Kindly check your email (Inbox & Spam folders)
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowSuccessModal(false);
                      if (embedded && onBack) {
                        onBack();
                      } else if (!embedded) {
                        navigate("/login");
                      }
                    }}
                    className="w-full py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98]"
                  >
                    Go to Login
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
  );

  if (embedded) {
    return formContent;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-blue-50"
      style={{
        backgroundImage: 'url("/solid-blue-background.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}>
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 bg-white shadow-sm py-2 z-50">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <img
            src="/logo.png"
            alt="ISML Logo"
            className="h-12 md:h-16"
          />
          <button
            onClick={() => {
              if (embedded && onBack) {
                onBack();
              } else {
                navigate('/login');
              }
            }}
            className="inline-flex items-center px-4 py-2 border border-blue-600 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors duration-200"
          >
            Already have an account?
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 mt-24 mb-16">
        {formContent}
      </div>

      {/* Batch Selection Popup
      {showBatchPopup && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 tracking-tight">
              Select a Batch
            </h3>
            <select
              className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 sm:text-sm"
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
            >
              <option value="">Select Batch</option>
              {batches.map((batch) => (
                <option key={batch.batch_id} value={batch.batch_id}>
                  {batch.batch_name}
                  {batch.courses ? ` (${batch.courses.language}, ${batch.courses.type}, ${batch.duration})` : ''}
                </option>
              ))}
            </select>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowBatchPopup(false)}
                className="py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleBatchEnroll}
                className="py-2 px-4 border border-transparent text-sm font-semibold rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                Enroll
              </button>
            </div>
          </div>
        </div>
      )} */}
      {/* Fixed Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t z-40">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} Indian School for Modern Languages. All rights reserved.
          </p>
          <p className="text-center text-sm text-gray-500">
            Version 1.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;