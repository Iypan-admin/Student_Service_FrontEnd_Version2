import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Key, Lock, UserPlus, Mail, Phone, Globe, Instagram, X, Linkedin, Youtube } from 'lucide-react';
import { login, forgotPassword, resetPassword, register, getStates, getCenters, getAllCenters } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, User } from 'lucide-react';
import { State, Center } from '../types/auth';

const LoginForm = () => {
  const navigate = useNavigate();
  const { setToken } = useAuth();
  const [formData, setFormData] = useState({
    registration_number: '',
    password: '',
  });
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [states, setStates] = useState<State[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [allCenters, setAllCenters] = useState<Center[]>([]);
  const [isCenterDisabled, setIsCenterDisabled] = useState(false);
  const [signUpFormData, setSignUpFormData] = useState({
    name: '',
    state: '',
    center: '',
    email: '',
    password: '',
    phone: '',
    is_referred: false,
    referred_by_center: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [signUpErrors, setSignUpErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });

  // Reviews carousel state
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);
  const carouselRef = React.useRef<HTMLDivElement>(null);

  // Reviews data
  const reviews = [
    {
      name: "Sharath Kumar",
      review:
        "My journey with ISML has been a humongous boost for my self-improvement, both academically and career-wise! Their coaching and career guidance have been the strong instruments that jazz up my life!",
    },
    {
      name: "Senthilnathan K",
      review:
        "It was very informative to learn and was very useful to understand french. We learnt many new topics in french and the session was very nice. Thanks to the sir 🙏👏👏👌👌",
    },
    {
      name: "Chitransha Tanwar",
      review:
        "Best teachers who understands you and works with you patiently so do the person with I'm in touch. I have been taking french classes and till now I have clear A1 and that is really fantastic route which I walked with them. Thank you so much ISML!",
    },
    {
      name: "swetha venkat",
      review:
        "I have joined isml trust me This is the best institute to learn foreign language my trainer was Mr Claude sir he is the best teacher because he has lot of patience. Even if we don't know the topic well he will reteach the topic again. The best part of this institution is whatever doubts we have they will clarify regarding anything. I am happy to join here",
    },
    {
      name: "Anugayathiri",
      review:
        "I had an excellent experience learning German at this language school. The teaching was exceptional, with knowledgeable and patient instructors who made the lessons engaging and enjoyable. I gained a lot of knowledge and confidence in my language skills. The supportive and interactive learning environment really helped me to progress quickly. If you looking to learn a new language effectively give it a try.",
    },
    {
      name: "Arpita Banerjee",
      review:
        "Salut tout le monde, Best place to learn French. They provide one of the best classes I had experienced. Only for six months I took preparation for my DELF B1 and I made it . Thanks to Pavithra Madame. Being a working professional flexibly of the classes makes it more easy to learn. I would really thank ISML for helping me prepare my exam and would suggest to join the classes for learning French.",
    },
    {
      name: "Sumitha Magesh",
      review:
        "Thoroughly enjoyed my French conversation classes with ISML. She always had lots of interesting topics prepared in advance to keep us going for the 2 hours. He is very patient and is a fluent English speaker also which helps when you do not understand something. Would certainly recommend his classes as I learned a lot there.",
    },
    {
      name: "Farzis Fathima",
      review:
        "My feedback It's a wonderful Institution Indian School for Modern Languages, the way of teaching it's understandable and clear demonstration about the lessons it's a great learning institution, so I proudly say trustable and valuable for money definitely you can join this ISML Language school they provide online classes it's too good to learn easily keep learning and practicing everyday it's my favourite french language 😍😍😍 guys Anybody can join this course and definitely I say I stand for ISML I give my best to learning 👍",
    },
    {
      name: "Himanshu Wakade",
      review:
        "Bonjour Je m'appelle Himanshu. ISML is the best online platform for learning foreign languages. For my batch, Pavithra Ma'am is teaching us French. Once you take her session, you will definitely learn French easily. They also provide reading and writing materials. I personally suggest joining and learning your favorite foreign language. You can ask any number of doubts during the session or after the session, they are open to helping you.",
    },
    {
      name: "sudha ramani",
      review:
        "I, G.Sudha Ramani, am glad to get admission in the Indian school of modern languages. I opted for French language basic level [A1] batch timings 10 am to 11.30 am Tuesdays and Thursdays. My trainer Claude Sir is very nice and energetic.He has lot of patience and his teaching is unique. I understand the pronunciation of the language perfectly. Thank you ISML gor giving me this opportunity. My appreciation to the staff of ISML . Thank you.",
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await login(formData);
      setToken(response.token);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Login failed. Please check your credentials.');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.registration_number) {
      toast.error('Please enter your registration number');
      return;
    }

    try {
      await forgotPassword(formData.registration_number);
      toast.success('Password reset instructions sent to your email');
      setShowForgotPassword(false);
      setShowResetPassword(true);
    } catch (error) {
      toast.error('Failed to process forgot password request');
    }
  };


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

  // Auto-scroll carousel effect
  useEffect(() => {
    if (!carouselRef.current || isCarouselPaused) return;

    const carousel = carouselRef.current;
    const scrollSpeed = 1; // pixels per frame
    let animationFrameId: number;

    const scroll = () => {
      if (carousel.scrollLeft >= carousel.scrollWidth - carousel.clientWidth) {
        carousel.scrollLeft = 0;
      } else {
        carousel.scrollLeft += scrollSpeed;
      }
      animationFrameId = requestAnimationFrame(scroll);
    };

    animationFrameId = requestAnimationFrame(scroll);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isCarouselPaused]);

  const handleStateChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedStateId = e.target.value;
    setSignUpFormData({ ...signUpFormData, state: selectedStateId, center: '' });
    setIsCenterDisabled(false);

    if (selectedStateId) {
      try {
        const data = await getCenters(selectedStateId);
        setCenters(data);

        const selectedState = states.find((s) => s.state_id === selectedStateId);
        const isOnlineMode = selectedState?.state_name.toLowerCase() === 'online';

        if (isOnlineMode && data.length === 1) {
          setSignUpFormData((prev) => ({
            ...prev,
            center: data[0].center_id,
          }));
          setIsCenterDisabled(true);
        }
      } catch (error) {
        console.error('Error fetching centers:', error);
        setCenters([]);
      }
    } else {
      setCenters([]);
    }
  };

  const validateSignUpForm = () => {
    let isValid = true;
    const newErrors = {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: ''
    };

    if (signUpFormData.name.length < 3) {
      newErrors.name = 'Name must be at least 3 characters long';
      isValid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signUpFormData.email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    if (signUpFormData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
      isValid = false;
    }

    if (signUpFormData.password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    const phoneRegex = /^\+?\d{7,15}$/;
    if (!phoneRegex.test(signUpFormData.phone)) {
      newErrors.phone = 'Please enter a valid phone number (7–15 digits)';
      isValid = false;
    }

    setSignUpErrors(newErrors);
    return isValid;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSignUpForm()) {
      return;
    }
    try {
      await register(signUpFormData);
      toast.success(
        "“Your registration request has been sent for approval. You’ll receive your Register Number by email once approved."
      );
      setShowSignUp(false);
      setSignUpFormData({
        name: '',
        state: '',
        center: '',
        email: '',
        password: '',
        phone: '',
        is_referred: false,
        referred_by_center: '',
      });
      setConfirmPassword('');
      setSignUpErrors({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: ''
      });
    } catch (error) {
      toast.error('Registration failed. Please try again.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken || !newPassword) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      await resetPassword(resetToken, newPassword);
      toast.success('Password reset successful! Please login with your new password');
      setShowResetPassword(false);
      setResetToken('');
      setNewPassword('');
    } catch (error) {
      toast.error('Failed to reset password');
    }
  };


  if (showResetPassword) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
        style={{
          backgroundImage: 'url("/loginpage.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* Enhanced Overlay with Multiple Layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-indigo-900/30 to-purple-900/40"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
        
        <div className="relative max-w-md w-full z-10">
          {/* Logo and Header - Enhanced Design */}
          <div className="text-center mb-8">
            {/* Logo with Glow Effect */}
            <div className="mb-8 relative inline-block">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 rounded-full blur-2xl opacity-50 animate-pulse"></div>
              <div className="relative p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl">
              <img
                src="/logo.png"
                alt="ISML Logo"
                className="h-16 sm:h-20 mx-auto drop-shadow-lg"
              />
              </div>
            </div>
            
            {/* Header Text with Gradient */}
            <h2 className="text-4xl sm:text-5xl font-black mb-4 bg-gradient-to-r from-white via-blue-100 to-indigo-100 bg-clip-text text-transparent drop-shadow-2xl tracking-tight">
              Reset Password
            </h2>
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="h-1 w-16 bg-gradient-to-r from-transparent to-blue-400 rounded-full"></div>
              <div className="h-1 w-2 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full"></div>
              <div className="h-1 w-16 bg-gradient-to-l from-transparent to-indigo-400 rounded-full"></div>
            </div>
            <p className="text-blue-50 text-base sm:text-lg font-semibold drop-shadow-lg">
              Enter the reset token from your email and create a new password
            </p>
          </div>

          {/* Form - Enhanced Glassmorphism Design */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8 space-y-6">
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="reset-token" className="block text-sm font-bold text-white mb-3 drop-shadow-lg">
                  Reset Token
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-lg flex items-center justify-center border border-yellow-300/30">
                      <Key className="h-5 w-5 text-yellow-200 group-focus-within:text-white transition-colors" />
                    </div>
                  </div>
                  <input
                    id="reset-token"
                    type="text"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    className="appearance-none block w-full pl-16 pr-4 py-4 border-2 border-white/30 rounded-xl shadow-xl placeholder-white/60 text-white bg-white/15 backdrop-blur-md focus:outline-none focus:ring-4 focus:ring-blue-400/40 focus:border-blue-300 focus:bg-white/25 transition-all duration-300 font-semibold"
                    placeholder="Enter reset token from email"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="new-password" className="block text-sm font-bold text-white mb-3 drop-shadow-lg">
                  New Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-lg flex items-center justify-center border border-indigo-300/30">
                      <Lock className="h-5 w-5 text-indigo-200 group-focus-within:text-white transition-colors" />
                    </div>
                  </div>
                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="appearance-none block w-full pl-16 pr-4 py-4 border-2 border-white/30 rounded-xl shadow-xl placeholder-white/60 text-white bg-white/15 backdrop-blur-md focus:outline-none focus:ring-4 focus:ring-blue-400/40 focus:border-blue-300 focus:bg-white/25 transition-all duration-300 font-semibold"
                    placeholder="Enter your new password"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowResetPassword(false)}
                  className="flex-1 py-4 px-6 border-2 border-white/30 rounded-xl text-sm font-bold text-white hover:bg-white/15 hover:border-white/50 focus:outline-none focus:ring-4 focus:ring-white/20 transition-all duration-300 backdrop-blur-sm bg-white/10"
                >
                  Back to Login
                </button>
                <button
                  type="submit"
                  className="flex-1 relative group overflow-hidden py-4 px-6 border border-transparent text-sm font-bold rounded-xl text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-xl hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-blue-400/40 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {/* Animated Shine Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <span className="relative z-10">Reset Password</span>
                </button>
              </div>
            </form>
          </div>

          {/* Security Badge - Enhanced */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-3 px-5 py-3 bg-white/15 backdrop-blur-md rounded-full shadow-xl border border-white/30 hover:bg-white/20 transition-all duration-300">
              <div className="w-8 h-8 bg-gradient-to-br from-green-400/30 to-emerald-400/30 rounded-full flex items-center justify-center border border-green-300/30">
                <Lock className="w-4 h-4 text-green-200" />
              </div>
              <p className="text-sm font-semibold text-white drop-shadow-md">
                Your password will be securely updated
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen flex flex-col md:flex-row md:h-screen md:overflow-hidden md:fixed md:inset-0">
      {/* Left Side - Login Form Section - Fixed 50% Width */}
      <div className="w-full md:w-1/2 md:flex-shrink-0 bg-white flex flex-col items-center justify-center px-4 sm:px-6 md:px-6 lg:px-8 py-4 sm:py-6 md:py-4 overflow-y-auto min-h-screen md:min-h-0 md:h-full md:overflow-hidden">
        <div className="w-full max-w-md flex flex-col justify-start md:justify-center md:h-full overflow-visible md:overflow-hidden relative py-4 md:py-0">
          {/* Logo - Centered - Always Visible */}
          <div className="mb-2 sm:mb-3 flex-shrink-0 flex justify-center" style={{ marginBottom: 'clamp(0.5rem, 1.5vh, 0.75rem)' }}>
              <img
                src="/logo.png"
                alt="ISML Logo"
              className="flex-shrink-0"
              style={{ height: 'clamp(3rem, 8vh, 4rem)', width: 'clamp(3rem, 8vh, 4rem)' }}
              />
            </div>
            
          {/* Login Form - With Flip Animation */}
          <div className="relative flex flex-col justify-start md:justify-center flex-1 min-h-[400px] md:min-h-0 w-full" style={{ perspective: '1000px' }}>
            {/* Login Form */}
            <div
              className={`w-full transition-all duration-500 ease-in-out overflow-y-auto ${
                (showForgotPassword || showSignUp)
                  ? 'opacity-0 pointer-events-none z-0 absolute' 
                  : 'opacity-100 pointer-events-auto z-10 relative'
              }`}
              style={{
                backfaceVisibility: 'hidden',
                transformStyle: 'preserve-3d',
                transform: (showForgotPassword || showSignUp) ? 'rotateY(180deg)' : 'rotateY(0deg)'
              }}
            >
              <div className="w-full flex flex-col py-2 md:py-0">
              {/* Title and Subtitle */}
              <div className="mb-2 sm:mb-3 flex-shrink-0" style={{ marginBottom: 'clamp(0.5rem, 1.5vh, 0.75rem)' }}>
                <h1 
                  className="font-bold text-gray-900 leading-tight break-words text-center"
                  style={{ fontSize: 'clamp(1.25rem, 4vw, 1.75rem)', marginBottom: 'clamp(0.25rem, 0.75vh, 0.375rem)' }}
                >
                  Log in to your account
                </h1>
                <p 
                  className="text-gray-600 leading-tight text-center"
                  style={{ fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)' }}
                >
                  Please enter your details
            </p>
          </div>

          {/* Login Form */}
              <form className="flex-shrink-0" onSubmit={handleSubmit} style={{ gap: 'clamp(0.5rem, 2vh, 1rem)' }}>
              {/* Registration Number Field */}
                <div style={{ marginBottom: 'clamp(0.5rem, 1.5vh, 0.75rem)' }}>
                  <label 
                    htmlFor="registration_number" 
                    className="block font-semibold text-gray-700"
                    style={{ fontSize: 'clamp(0.75rem, 1.5vw, 0.8125rem)', marginBottom: 'clamp(0.25rem, 0.75vh, 0.375rem)' }}
                  >
                  Registration Number
                </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="text-gray-400" style={{ height: 'clamp(1rem, 2vh, 1.125rem)', width: 'clamp(1rem, 2vh, 1.125rem)' }} />
                  </div>
                  <input
                    id="registration_number"
                    name="registration_number"
                    type="text"
                    required
                      className="block w-full pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      style={{ 
                        paddingTop: 'clamp(0.5rem, 1.25vh, 0.625rem)',
                        paddingBottom: 'clamp(0.5rem, 1.25vh, 0.625rem)',
                        fontSize: 'clamp(0.875rem, 1.5vw, 0.9375rem)'
                      }}
                    placeholder="Enter your registration number"
                    value={formData.registration_number}
                    onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                  />
                </div>
              </div>

              {/* Password Field */}
                <div style={{ marginBottom: 'clamp(0.5rem, 1.5vh, 0.75rem)' }}>
                  <label 
                    htmlFor="password" 
                    className="block font-semibold text-gray-700"
                    style={{ fontSize: 'clamp(0.75rem, 1.5vw, 0.8125rem)', marginBottom: 'clamp(0.25rem, 0.75vh, 0.375rem)' }}
                  >
                  Password
                </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="text-gray-400" style={{ height: 'clamp(1rem, 2vh, 1.125rem)', width: 'clamp(1rem, 2vh, 1.125rem)' }} />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                      className="block w-full pl-10 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      style={{ 
                        paddingTop: 'clamp(0.5rem, 1.25vh, 0.625rem)',
                        paddingBottom: 'clamp(0.5rem, 1.25vh, 0.625rem)',
                        fontSize: 'clamp(0.875rem, 1.5vw, 0.9375rem)'
                      }}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff style={{ height: 'clamp(1rem, 2vh, 1.125rem)', width: 'clamp(1rem, 2vh, 1.125rem)' }} />
                      ) : (
                        <Eye style={{ height: 'clamp(1rem, 2vh, 1.125rem)', width: 'clamp(1rem, 2vh, 1.125rem)' }} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Forgot Password Link */}
                <div className="flex items-center justify-end" style={{ marginTop: '-0.25rem', marginBottom: 'clamp(0.5rem, 1.5vh, 0.75rem)' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(true);
                      setShowSignUp(false);
                    }}
                    className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    style={{ fontSize: 'clamp(0.75rem, 1.5vw, 0.8125rem)' }}
                  >
                    Forgot password?
                  </button>
              </div>

                {/* Login Button */}
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98]"
                  style={{ 
                    paddingTop: 'clamp(0.625rem, 1.5vh, 0.6875rem)',
                    paddingBottom: 'clamp(0.625rem, 1.5vh, 0.6875rem)',
                    fontSize: 'clamp(0.875rem, 1.5vw, 0.9375rem)'
                  }}
                >
                  Log in
                </button>
              </form>

              {/* OR Separator */}
              <div className="flex items-center flex-shrink-0" style={{ marginTop: 'clamp(0.75rem, 1.5vh, 0.875rem)', marginBottom: 'clamp(0.75rem, 1.5vh, 0.875rem)' }}>
                <div className="flex-1 border-t border-gray-300"></div>
                <span 
                  className="px-4 text-gray-500 font-medium"
                  style={{ fontSize: 'clamp(0.75rem, 1.5vw, 0.8125rem)' }}
                >
                  OR
                </span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>

              {/* Sign Up Button */}
              <button
                type="button"
                onClick={() => {
                  setShowSignUp(true);
                  setShowForgotPassword(false);
                }}
                className="w-full border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 font-semibold rounded-lg transition-all duration-200 bg-white hover:bg-gray-50 flex items-center justify-center gap-2 active:scale-[0.98] flex-shrink-0"
                style={{ 
                  paddingTop: 'clamp(0.625rem, 1.5vh, 0.6875rem)',
                  paddingBottom: 'clamp(0.625rem, 1.5vh, 0.6875rem)',
                  fontSize: 'clamp(0.875rem, 1.5vw, 0.9375rem)'
                }}
              >
                <UserPlus style={{ height: 'clamp(1rem, 2vh, 1.125rem)', width: 'clamp(1rem, 2vh, 1.125rem)' }} />
                Sign Up
              </button>
              </div>
            </div>

            {/* Forgot Password Form - With Flip Animation */}
            <div
              className={`w-full transition-all duration-500 ease-in-out overflow-y-auto ${
                (showForgotPassword && !showSignUp)
                  ? 'opacity-100 pointer-events-auto z-10 relative' 
                  : 'opacity-0 pointer-events-none z-0 absolute'
              }`}
              style={{
                backfaceVisibility: 'hidden',
                transformStyle: 'preserve-3d',
                transform: (showForgotPassword && !showSignUp) ? 'rotateY(0deg)' : 'rotateY(-180deg)'
              }}
            >
              <div className="w-full flex flex-col py-2 md:py-0">
              {/* Title and Subtitle */}
              <div className="mb-2 sm:mb-3 flex-shrink-0" style={{ marginBottom: 'clamp(0.5rem, 1.5vh, 0.75rem)' }}>
                <h1 
                  className="font-bold text-gray-900 leading-tight break-words text-center"
                  style={{ fontSize: 'clamp(1.25rem, 4vw, 1.75rem)', marginBottom: 'clamp(0.25rem, 0.75vh, 0.375rem)' }}
                >
                  Forgot Password
                </h1>
                <p 
                  className="text-gray-600 leading-tight text-center"
                  style={{ fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)' }}
                >
                  Enter your registration number to receive reset instructions
                </p>
              </div>

              {/* Forgot Password Form */}
              <form className="flex-shrink-0" onSubmit={handleForgotPassword} style={{ gap: 'clamp(0.5rem, 1.5vh, 0.75rem)' }}>
                {/* Registration Number Field */}
                <div style={{ marginBottom: 'clamp(0.5rem, 1.5vh, 0.75rem)' }}>
                  <label 
                    htmlFor="forgot-reg" 
                    className="block font-semibold text-gray-700"
                    style={{ fontSize: 'clamp(0.75rem, 1.5vw, 0.8125rem)', marginBottom: 'clamp(0.25rem, 0.75vh, 0.375rem)' }}
                  >
                    Registration Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="text-gray-400" style={{ height: 'clamp(1rem, 2vh, 1.125rem)', width: 'clamp(1rem, 2vh, 1.125rem)' }} />
                    </div>
                    <input
                      id="forgot-reg"
                      type="text"
                      value={formData.registration_number}
                      onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                      className="block w-full pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      style={{ 
                        paddingTop: 'clamp(0.5rem, 1.25vh, 0.625rem)',
                        paddingBottom: 'clamp(0.5rem, 1.25vh, 0.625rem)',
                        fontSize: 'clamp(0.875rem, 1.5vw, 0.9375rem)'
                      }}
                      placeholder="Enter your registration number"
                      required
                    />
            </div>
          </div>

                {/* Buttons */}
                <div className="flex gap-3" style={{ marginTop: 'clamp(0.75rem, 1.5vh, 0.875rem)' }}>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="flex-1 border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 font-semibold rounded-lg transition-all duration-200 bg-white hover:bg-gray-50 active:scale-[0.98]"
                    style={{ 
                      paddingTop: 'clamp(0.625rem, 1.5vh, 0.6875rem)',
                      paddingBottom: 'clamp(0.625rem, 1.5vh, 0.6875rem)',
                      fontSize: 'clamp(0.875rem, 1.5vw, 0.9375rem)'
                    }}
                  >
                    Back to Login
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98]"
                    style={{ 
                      paddingTop: 'clamp(0.625rem, 1.5vh, 0.6875rem)',
                      paddingBottom: 'clamp(0.625rem, 1.5vh, 0.6875rem)',
                      fontSize: 'clamp(0.875rem, 1.5vw, 0.9375rem)'
                    }}
                  >
                    Send Instructions
                  </button>
                </div>
              </form>

          {/* Security Badge */}
              <div 
                className="text-center flex-shrink-0 mt-4"
                style={{ 
                  marginTop: 'clamp(0.75rem, 2vh, 1rem)',
                  fontSize: 'clamp(0.625rem, 1.2vw, 0.75rem)'
                }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full">
                  <Key className="text-blue-600" style={{ height: 'clamp(0.875rem, 2vh, 1rem)', width: 'clamp(0.875rem, 2vh, 1rem)' }} />
                  <p className="text-blue-700 font-medium">
                    Reset instructions will be sent to your registered email
              </p>
            </div>
          </div>
        </div>
      </div>

            {/* Sign Up Form - With Flip Animation */}
            <div
              className={`w-full transition-all duration-500 ease-in-out overflow-y-auto ${
                showSignUp
                  ? 'opacity-100 pointer-events-auto z-10 relative' 
                  : 'opacity-0 pointer-events-none z-0 absolute'
              }`}
              style={{
                backfaceVisibility: 'hidden',
                transformStyle: 'preserve-3d',
                transform: showSignUp ? 'rotateY(0deg)' : 'rotateY(-180deg)'
              }}
            >
              <div className="w-full flex flex-col py-2 md:py-0">
              {/* Title and Subtitle */}
              <div className="mb-2 sm:mb-3 flex-shrink-0" style={{ marginBottom: 'clamp(0.5rem, 1.5vh, 0.75rem)' }}>
                <h1 
                  className="font-bold text-gray-900 leading-tight break-words text-center"
                  style={{ fontSize: 'clamp(1.25rem, 4vw, 1.75rem)', marginBottom: 'clamp(0.25rem, 0.75vh, 0.375rem)' }}
                >
                  Register your account
                </h1>
                <p 
                  className="text-gray-600 leading-tight text-center"
                  style={{ fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)' }}
                >
                  Fill in your details to get started
                </p>
              </div>

              {/* Sign Up Form */}
              <form className="flex-shrink-0" onSubmit={handleSignUp} style={{ gap: 'clamp(0.5rem, 1.5vh, 0.75rem)' }}>
                {/* Name Field */}
                <div style={{ marginBottom: 'clamp(0.5rem, 1.5vh, 0.75rem)' }}>
                  <label 
                    htmlFor="signup-name" 
                    className="block font-semibold text-gray-700"
                    style={{ fontSize: 'clamp(0.75rem, 1.5vw, 0.8125rem)', marginBottom: 'clamp(0.25rem, 0.75vh, 0.375rem)' }}
                  >
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="text-gray-400" style={{ height: 'clamp(1rem, 2vh, 1.125rem)', width: 'clamp(1rem, 2vh, 1.125rem)' }} />
                    </div>
                    <input
                      id="signup-name"
                      type="text"
                      value={signUpFormData.name}
                      onChange={(e) => setSignUpFormData({ ...signUpFormData, name: e.target.value })}
                      className={`block w-full pl-10 pr-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${signUpErrors.name ? 'border-red-300' : 'border-gray-300'}`}
                      style={{ 
                        paddingTop: 'clamp(0.5rem, 1.25vh, 0.625rem)',
                        paddingBottom: 'clamp(0.5rem, 1.25vh, 0.625rem)',
                        fontSize: 'clamp(0.875rem, 1.5vw, 0.9375rem)'
                      }}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  {signUpErrors.name && <p className="mt-1 text-xs text-red-600">{signUpErrors.name}</p>}
                </div>

                {/* Email Field */}
                <div style={{ marginBottom: 'clamp(0.5rem, 1.5vh, 0.75rem)' }}>
                  <label 
                    htmlFor="signup-email" 
                    className="block font-semibold text-gray-700"
                    style={{ fontSize: 'clamp(0.75rem, 1.5vw, 0.8125rem)', marginBottom: 'clamp(0.25rem, 0.75vh, 0.375rem)' }}
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="text-gray-400" style={{ height: 'clamp(1rem, 2vh, 1.125rem)', width: 'clamp(1rem, 2vh, 1.125rem)' }} />
                    </div>
                    <input
                      id="signup-email"
                      type="email"
                      value={signUpFormData.email}
                      onChange={(e) => setSignUpFormData({ ...signUpFormData, email: e.target.value })}
                      className={`block w-full pl-10 pr-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${signUpErrors.email ? 'border-red-300' : 'border-gray-300'}`}
                      style={{ 
                        paddingTop: 'clamp(0.5rem, 1.25vh, 0.625rem)',
                        paddingBottom: 'clamp(0.5rem, 1.25vh, 0.625rem)',
                        fontSize: 'clamp(0.875rem, 1.5vw, 0.9375rem)'
                      }}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  {signUpErrors.email && <p className="mt-1 text-xs text-red-600">{signUpErrors.email}</p>}
                </div>

                {/* Phone Field */}
                <div style={{ marginBottom: 'clamp(0.5rem, 1.5vh, 0.75rem)' }}>
                  <label 
                    htmlFor="signup-phone" 
                    className="block font-semibold text-gray-700"
                    style={{ fontSize: 'clamp(0.75rem, 1.5vw, 0.8125rem)', marginBottom: 'clamp(0.25rem, 0.75vh, 0.375rem)' }}
                  >
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="text-gray-400" style={{ height: 'clamp(1rem, 2vh, 1.125rem)', width: 'clamp(1rem, 2vh, 1.125rem)' }} />
                    </div>
                    <input
                      id="signup-phone"
                      type="tel"
                      value={signUpFormData.phone}
                      onChange={(e) => setSignUpFormData({ ...signUpFormData, phone: e.target.value })}
                      className={`block w-full pl-10 pr-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${signUpErrors.phone ? 'border-red-300' : 'border-gray-300'}`}
                      style={{ 
                        paddingTop: 'clamp(0.5rem, 1.25vh, 0.625rem)',
                        paddingBottom: 'clamp(0.5rem, 1.25vh, 0.625rem)',
                        fontSize: 'clamp(0.875rem, 1.5vw, 0.9375rem)'
                      }}
                      placeholder="Enter your phone number"
                      required
                    />
                  </div>
                  {signUpErrors.phone && <p className="mt-1 text-xs text-red-600">{signUpErrors.phone}</p>}
                </div>

                {/* State/Mode Field */}
                <div style={{ marginBottom: 'clamp(0.5rem, 1.5vh, 0.75rem)' }}>
                  <label 
                    htmlFor="signup-state" 
                    className="block font-semibold text-gray-700"
                    style={{ fontSize: 'clamp(0.75rem, 1.5vw, 0.8125rem)', marginBottom: 'clamp(0.25rem, 0.75vh, 0.375rem)' }}
                  >
                    Mode
                  </label>
                  <select
                    id="signup-state"
                    value={signUpFormData.state}
                    onChange={handleStateChange}
                    className="block w-full pl-4 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    style={{ 
                      fontSize: 'clamp(0.875rem, 1.5vw, 0.9375rem)'
                    }}
                    required
                  >
                    <option value="">Select Mode</option>
                    {states.map((state) => (
                      <option key={state.state_id} value={state.state_id}>
                        {state.state_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Center Field */}
                <div style={{ marginBottom: 'clamp(0.5rem, 1.5vh, 0.75rem)' }}>
                  <label 
                    htmlFor="signup-center" 
                    className="block font-semibold text-gray-700"
                    style={{ fontSize: 'clamp(0.75rem, 1.5vw, 0.8125rem)', marginBottom: 'clamp(0.25rem, 0.75vh, 0.375rem)' }}
                  >
                    Center
                  </label>
                  <select
                    id="signup-center"
                    value={signUpFormData.center}
                    onChange={(e) => setSignUpFormData({ ...signUpFormData, center: e.target.value })}
                    disabled={!signUpFormData.state || isCenterDisabled}
                    className="block w-full pl-4 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                    style={{ 
                      fontSize: 'clamp(0.875rem, 1.5vw, 0.9375rem)'
                    }}
                    required
                  >
                    <option value="">Select Center</option>
                    {centers.map((center) => (
                      <option key={center.center_id} value={center.center_id}>
                        {center.center_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Password Field */}
                <div style={{ marginBottom: 'clamp(0.5rem, 1.5vh, 0.75rem)' }}>
                  <label 
                    htmlFor="signup-password" 
                    className="block font-semibold text-gray-700"
                    style={{ fontSize: 'clamp(0.75rem, 1.5vw, 0.8125rem)', marginBottom: 'clamp(0.25rem, 0.75vh, 0.375rem)' }}
                  >
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="text-gray-400" style={{ height: 'clamp(1rem, 2vh, 1.125rem)', width: 'clamp(1rem, 2vh, 1.125rem)' }} />
                    </div>
                    <input
                      id="signup-password"
                      type={showSignUpPassword ? 'text' : 'password'}
                      value={signUpFormData.password}
                      onChange={(e) => setSignUpFormData({ ...signUpFormData, password: e.target.value })}
                      className={`block w-full pl-10 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${signUpErrors.password ? 'border-red-300' : 'border-gray-300'}`}
                      style={{ 
                        paddingTop: 'clamp(0.5rem, 1.25vh, 0.625rem)',
                        paddingBottom: 'clamp(0.5rem, 1.25vh, 0.625rem)',
                        fontSize: 'clamp(0.875rem, 1.5vw, 0.9375rem)'
                      }}
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showSignUpPassword ? (
                        <EyeOff style={{ height: 'clamp(1rem, 2vh, 1.125rem)', width: 'clamp(1rem, 2vh, 1.125rem)' }} />
                      ) : (
                        <Eye style={{ height: 'clamp(1rem, 2vh, 1.125rem)', width: 'clamp(1rem, 2vh, 1.125rem)' }} />
                      )}
                    </button>
                  </div>
                  {signUpErrors.password && <p className="mt-1 text-xs text-red-600">{signUpErrors.password}</p>}
                </div>

                {/* Confirm Password Field */}
                <div style={{ marginBottom: 'clamp(0.5rem, 1.5vh, 0.75rem)' }}>
                  <label 
                    htmlFor="signup-confirm-password" 
                    className="block font-semibold text-gray-700"
                    style={{ fontSize: 'clamp(0.75rem, 1.5vw, 0.8125rem)', marginBottom: 'clamp(0.25rem, 0.75vh, 0.375rem)' }}
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="text-gray-400" style={{ height: 'clamp(1rem, 2vh, 1.125rem)', width: 'clamp(1rem, 2vh, 1.125rem)' }} />
                    </div>
                    <input
                      id="signup-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`block w-full pl-10 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${signUpErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'}`}
                      style={{ 
                        paddingTop: 'clamp(0.5rem, 1.25vh, 0.625rem)',
                        paddingBottom: 'clamp(0.5rem, 1.25vh, 0.625rem)',
                        fontSize: 'clamp(0.875rem, 1.5vw, 0.9375rem)'
                      }}
                      placeholder="Confirm your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff style={{ height: 'clamp(1rem, 2vh, 1.125rem)', width: 'clamp(1rem, 2vh, 1.125rem)' }} />
                      ) : (
                        <Eye style={{ height: 'clamp(1rem, 2vh, 1.125rem)', width: 'clamp(1rem, 2vh, 1.125rem)' }} />
                      )}
                    </button>
                  </div>
                  {signUpErrors.confirmPassword && <p className="mt-1 text-xs text-red-600">{signUpErrors.confirmPassword}</p>}
                </div>

                {/* Referral Section */}
                <div style={{ marginBottom: 'clamp(0.5rem, 1.5vh, 0.75rem)' }}>
                  <div className="flex items-center mb-2">
                    <input
                      id="is_referred"
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={signUpFormData.is_referred}
                      onChange={(e) => setSignUpFormData({ 
                        ...signUpFormData, 
                        is_referred: e.target.checked,
                        referred_by_center: e.target.checked ? signUpFormData.referred_by_center : ''
                      })}
                    />
                    <label htmlFor="is_referred" className="ml-2 block text-xs font-medium text-gray-700" style={{ fontSize: 'clamp(0.75rem, 1.5vw, 0.8125rem)' }}>
                      Were you referred by any ISML center?
                    </label>
                  </div>
                  
                  {signUpFormData.is_referred && (
                    <div style={{ marginTop: 'clamp(0.5rem, 1.25vh, 0.625rem)' }}>
                      <label 
                        htmlFor="referred_by_center" 
                        className="block font-semibold text-gray-700"
                        style={{ fontSize: 'clamp(0.75rem, 1.5vw, 0.8125rem)', marginBottom: 'clamp(0.25rem, 0.75vh, 0.375rem)' }}
                      >
                        Referring Center
                      </label>
                      <select
                        id="referred_by_center"
                        required={signUpFormData.is_referred}
                        className="block w-full pl-4 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        style={{ 
                          fontSize: 'clamp(0.875rem, 1.5vw, 0.9375rem)'
                        }}
                        value={signUpFormData.referred_by_center}
                        onChange={(e) => setSignUpFormData({ ...signUpFormData, referred_by_center: e.target.value })}
                      >
                        <option value="">Select referring center</option>
                        {allCenters.map((center) => (
                          <option key={center.center_id} value={center.center_id}>
                            {center.center_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex gap-3" style={{ marginTop: 'clamp(0.75rem, 1.5vh, 0.875rem)' }}>
                  <button
                    type="button"
                    onClick={() => setShowSignUp(false)}
                    className="flex-1 border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 font-semibold rounded-lg transition-all duration-200 bg-white hover:bg-gray-50 active:scale-[0.98]"
                    style={{ 
                      paddingTop: 'clamp(0.625rem, 1.5vh, 0.6875rem)',
                      paddingBottom: 'clamp(0.625rem, 1.5vh, 0.6875rem)',
                      fontSize: 'clamp(0.875rem, 1.5vw, 0.9375rem)'
                    }}
                  >
                    Back to Login
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98]"
                    style={{ 
                      paddingTop: 'clamp(0.625rem, 1.5vh, 0.6875rem)',
                      paddingBottom: 'clamp(0.625rem, 1.5vh, 0.6875rem)',
                      fontSize: 'clamp(0.875rem, 1.5vw, 0.9375rem)'
                    }}
                  >
                    Register
                  </button>
                </div>
              </form>
              </div>
            </div>
          </div>

          {/* Policy Links - Above Copyright */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 flex-shrink-0 mt-2 md:mt-2">
            <a
              href="/terms-and-conditions"
              className="text-gray-600 hover:text-blue-600 transition-colors duration-200 underline"
              style={{ fontSize: 'clamp(0.625rem, 1.2vw, 0.6875rem)' }}
            >
              Terms & Conditions
            </a>
            <span className="text-gray-400" style={{ fontSize: 'clamp(0.625rem, 1.2vw, 0.6875rem)' }}>|</span>
            <a
              href="/privacy-policy"
              className="text-gray-600 hover:text-blue-600 transition-colors duration-200 underline"
              style={{ fontSize: 'clamp(0.625rem, 1.2vw, 0.6875rem)' }}
            >
              Privacy Policy
            </a>
            <span className="text-gray-400" style={{ fontSize: 'clamp(0.625rem, 1.2vw, 0.6875rem)' }}>|</span>
            <a
              href="/shipping-policy"
              className="text-gray-600 hover:text-blue-600 transition-colors duration-200 underline"
              style={{ fontSize: 'clamp(0.625rem, 1.2vw, 0.6875rem)' }}
            >
              Shipping Policy
            </a>
            <span className="text-gray-400" style={{ fontSize: 'clamp(0.625rem, 1.2vw, 0.6875rem)' }}>|</span>
            <a
              href="/refund-cancellation-policy"
              className="text-gray-600 hover:text-blue-600 transition-colors duration-200 underline"
              style={{ fontSize: 'clamp(0.625rem, 1.2vw, 0.6875rem)' }}
            >
              Refund & Cancellation Policy
            </a>
            <span className="text-gray-400" style={{ fontSize: 'clamp(0.625rem, 1.2vw, 0.6875rem)' }}>|</span>
            <a
              href="/contact-us"
              className="text-gray-600 hover:text-blue-600 transition-colors duration-200 underline"
              style={{ fontSize: 'clamp(0.625rem, 1.2vw, 0.6875rem)' }}
            >
              Contact Us
            </a>
          </div>

          {/* Copyright Footer - Common for All Forms */}
          <div 
            className="text-center text-gray-500 leading-tight flex-shrink-0 mt-2 md:mt-2"
            style={{ 
              fontSize: 'clamp(0.625rem, 1.2vw, 0.6875rem)'
            }}
          >
            <p className="mb-0.5 md:mb-0">
              © {new Date().getFullYear()} Indian School for Modern Languages. All rights reserved.
            </p>
            <p className="md:inline md:ml-2">
            Version 2.0
            </p>
            
            {/* Social Media Icons */}
            <div className="flex items-center justify-center gap-2 sm:gap-2.5 mt-2 md:mt-2.5">
              <a
                href="https://www.instagram.com/learnwithisml"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-pink-600 transition-colors duration-200"
                aria-label="Instagram"
              >
                <Instagram className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </a>
              <a
                href="https://x.com/learnwithisml"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-black transition-colors duration-200"
                aria-label="X (formerly Twitter)"
              >
                <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </a>
              <a
                href="https://www.linkedin.com/company/learnwithisml"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-blue-600 transition-colors duration-200"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </a>
              <a
                href="https://www.youtube.com/@learnwithisml"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-red-600 transition-colors duration-200"
                aria-label="YouTube"
              >
                <Youtube className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Promotional Banner Section - Fixed 50% Width */}
      <div 
        className="w-full md:w-1/2 md:flex-shrink-0 flex flex-col items-center justify-center px-4 sm:px-6 md:px-6 lg:px-8 py-8 sm:py-10 md:py-4 relative overflow-y-auto min-h-screen md:min-h-0 md:h-full md:overflow-hidden"
        style={{
          backgroundImage: 'url("/loginpage.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="relative z-10 w-full flex flex-col items-center justify-center md:justify-center max-w-2xl py-4 md:py-0 md:h-full">
          {/* School Name - Moved from Left Side */}
          <div className="mb-3 sm:mb-4 md:mb-3 flex-shrink-0">
            <h2 
              className="font-bold text-white drop-shadow-2xl break-words text-center px-2"
              style={{ fontSize: 'clamp(1rem, 2.5vw, 1.5rem)' }}
            >
              Indian School for Modern Languages
            </h2>
          </div>
          
          {/* Sub-heading - Auto-scaling */}
          <p className="text-sm sm:text-base md:text-sm lg:text-base text-white mb-4 sm:mb-6 md:mb-4 drop-shadow-lg text-center px-2 break-words">
            Our platform is used by students and educators worldwide
          </p>

          {/* Device Mockup Placeholder - Responsive */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl border border-white/20 p-3 sm:p-4 md:p-6 shadow-2xl w-full max-w-md md:mt-0" style={{ marginTop: 'clamp(2rem, 8vh, 5rem)' }}>
            <div className="bg-white/5 rounded-lg p-2 sm:p-3 md:p-4 border border-white/10">
              {/* Logo and School Name - Centered */}
              <div className="flex items-center justify-center gap-1 sm:gap-2 mb-2 sm:mb-3">
                <img
                  src="/logo.png"
                  alt="ISML Logo"
                  className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0 object-contain"
                />
                <span className="text-gray-900 font-semibold text-[10px] sm:text-xs md:text-sm drop-shadow-lg" style={{ textShadow: '0 1px 2px rgba(255, 255, 255, 0.8)' }}>Indian School for Modern Languages</span>
              </div>
              {/* Heading */}
              <div className="mb-2 sm:mb-3">
                <h3 className="text-gray-900 font-bold text-xs sm:text-sm md:text-base mb-1 sm:mb-2 text-center drop-shadow-lg" style={{ textShadow: '0 1px 3px rgba(255, 255, 255, 0.9)' }}>
                  Our Learner's Reviews
                </h3>
              </div>

              {/* Reviews Carousel */}
              <div 
                ref={carouselRef}
                className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide"
                onMouseEnter={() => setIsCarouselPaused(true)}
                onMouseLeave={() => setIsCarouselPaused(false)}
              >
                {/* Duplicate reviews for seamless loop */}
                {[...reviews, ...reviews].map((review, index) => (
                  <div
                    key={index}
                    className="flex-shrink-0 bg-white/10 rounded-lg p-2 sm:p-3 w-48 sm:w-56 md:w-64 border border-white/10"
                  >
                    <div className="mb-1 sm:mb-2 flex items-center gap-2">
                      <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-md">
                        <span className="text-white font-bold text-[10px] sm:text-xs md:text-sm">
                          {review.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <p className="text-gray-900 font-semibold text-[10px] sm:text-xs md:text-sm drop-shadow-md" style={{ textShadow: '0 1px 2px rgba(255, 255, 255, 0.8)' }}>
                        {review.name}
                      </p>
                    </div>
                    <p className="text-gray-800 text-[9px] sm:text-[10px] md:text-xs leading-tight line-clamp-4 drop-shadow-sm" style={{ textShadow: '0 1px 2px rgba(255, 255, 255, 0.7)' }}>
                      {review.review}
                    </p>
                  </div>
                ))}
              </div>

              {/* Website Link - Bottom Center */}
              <div className="flex items-center justify-center gap-1 sm:gap-2 mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-white/10">
                <Globe className="w-3 h-3 sm:w-4 sm:h-4 text-gray-900 flex-shrink-0" style={{ filter: 'drop-shadow(0 1px 2px rgba(255, 255, 255, 0.8))' }} />
                <a 
                  href="https://www.indianschoolformodernlanguages.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-900 font-medium text-[9px] sm:text-[10px] md:text-xs hover:underline drop-shadow-sm"
                  style={{ textShadow: '0 1px 2px rgba(255, 255, 255, 0.8)' }}
                >
                  www.indianschoolformodernlanguages.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;