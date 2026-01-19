import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Users, BookOpen, User, MapPin, CheckCircle, XCircle, Sparkles, Loader2, Globe } from 'lucide-react';
import { Batch } from '../types/auth';
import toast from 'react-hot-toast';
import { enrollInBatch } from '../services/api';

interface BatchDetailsModalProps {
  batch: Batch | null;
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  onEnrollSuccess: () => void;
  isAlreadyEnrolled: boolean;
}

const BatchDetailsModal: React.FC<BatchDetailsModalProps> = ({
  batch,
  isOpen,
  onClose,
  studentId,
  onEnrollSuccess,
  isAlreadyEnrolled,
}) => {
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Handle visibility animation
  useEffect(() => {
    if (isOpen && batch) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [isOpen, batch]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300); // Wait for animation to complete
  };

  if (!isOpen || !batch) return null;

  const maxStudents = batch.max_students || 10;
  const enrolledStudents = batch.enrolled_students || 0;
  const availableSeats = maxStudents - enrolledStudents;
  const fillPercentage = (enrolledStudents / maxStudents) * 100;
  const isFull = availableSeats <= 0;
  const isAlmostFull = availableSeats > 0 && availableSeats <= 5;

  // Get status color
  const getStatusColor = () => {
    if (isFull) return 'red';
    if (isAlmostFull) return 'yellow';
    return 'green';
  };

  const statusColor = getStatusColor();

  const colorClasses = {
    green: {
      bg: 'bg-green-50',
      border: 'border-green-500',
      text: 'text-green-700',
      progress: 'bg-green-500',
      badge: 'bg-green-100 text-green-800',
    },
    yellow: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-500',
      text: 'text-yellow-700',
      progress: 'bg-yellow-500',
      badge: 'bg-yellow-100 text-yellow-800',
    },
    red: {
      bg: 'bg-red-50',
      border: 'border-red-500',
      text: 'text-red-700',
      progress: 'bg-red-500',
      badge: 'bg-red-100 text-red-800',
    },
  };

  const colors = colorClasses[statusColor];

  const handleEnroll = async () => {
    if (isFull || isAlreadyEnrolled || isEnrolling) return;

    setIsEnrolling(true);

    try {
      await enrollInBatch(batch.batch_id, studentId);
      
      toast.success(
        <div>
          <p className="font-semibold">Enrollment Successful! 🎉</p>
          <p className="text-sm">You've been enrolled in {batch.batch_name}</p>
          <p className="text-xs text-gray-600 mt-1">Pending approval from admin</p>
        </div>,
        {
          duration: 4000,
          position: 'top-center',
          style: {
            background: '#10B981',
            color: '#fff',
            padding: '16px',
            borderRadius: '12px',
          },
        }
      );

      onEnrollSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Enrollment error:', error);
      
      const errorMessage = error.response?.data?.error || 'Failed to enroll. Please try again.';
      
      toast.error(
        <div>
          <p className="font-semibold">Enrollment Failed</p>
          <p className="text-sm">{errorMessage}</p>
        </div>,
        {
          duration: 4000,
          position: 'top-center',
          style: {
            background: '#EF4444',
            color: '#fff',
            padding: '16px',
            borderRadius: '12px',
          },
        }
      );
    } finally {
      setIsEnrolling(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-50 backdrop-blur-sm transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* Right Side Slide Modal */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-2xl z-50 transition-transform duration-300 ease-out ${
          isVisible ? 'translate-x-0' : 'translate-x-full'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-full bg-white shadow-2xl flex flex-col overflow-hidden">
          {/* Header - BERRY Style */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-5 flex-shrink-0">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="bg-white/20 backdrop-blur-sm p-2.5 rounded-xl flex-shrink-0 shadow-md">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-bold mb-1 truncate">{batch.batch_name}</h2>
                  <p className="text-blue-100 text-sm truncate">
                    {batch.courses?.course_name || batch.course_name || 'Course Details'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-all duration-200 flex-shrink-0 ml-2"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Status Badge */}
            <div className="mt-4 flex flex-wrap gap-2">
              {isFull && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white rounded-full text-xs font-bold shadow-md">
                  <XCircle className="w-4 h-4" />
                  BATCH FULL
                </span>
              )}
              {isAlreadyEnrolled && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-500 text-white rounded-full text-xs font-bold shadow-md">
                  <CheckCircle className="w-4 h-4" />
                  ALREADY ENROLLED
                </span>
              )}
              {!isFull && !isAlreadyEnrolled && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-blue-600 rounded-full text-xs font-bold shadow-md">
                  <Sparkles className="w-4 h-4" />
                  AVAILABLE
                </span>
              )}
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {/* Batch Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Course Type */}
              {batch.courses?.type && (
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <BookOpen className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Course Type</p>
                    <p className="text-sm font-semibold text-gray-900">{batch.courses.type}</p>
                  </div>
                </div>
              )}

              {/* Mode */}
              {batch.courses?.mode && (
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Globe className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Mode</p>
                    <p className="text-sm font-semibold text-gray-900">{batch.courses.mode}</p>
                  </div>
                </div>
              )}

              {/* Duration */}
              {batch.duration && (
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="bg-orange-100 p-2 rounded-lg">
                    <Calendar className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Duration</p>
                    <p className="text-sm font-semibold text-gray-900">{batch.duration} months</p>
                  </div>
                </div>
              )}

              {/* Timing */}
              {batch.time_from && batch.time_to && (
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="bg-indigo-100 p-2 rounded-lg">
                    <Clock className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Class Timing</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {batch.time_from} - {batch.time_to}
                    </p>
                  </div>
                </div>
              )}

              {/* Teacher */}
              {(batch.teachers?.users?.full_name || batch.teachers?.users?.name) && (
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <User className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Tutor</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {batch.teachers.users.full_name || batch.teachers.users.name}
                    </p>
                  </div>
                </div>
              )}

              {/* Center */}
              {(batch.centers?.center_name || batch.center_name) && (
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="bg-pink-100 p-2 rounded-lg">
                    <MapPin className="w-5 h-5 text-pink-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Center</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {batch.centers?.center_name || batch.center_name}
                    </p>
                  </div>
                </div>
              )}

              {/* Language */}
              {batch.courses?.language && (
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="bg-teal-100 p-2 rounded-lg">
                    <BookOpen className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Language</p>
                    <p className="text-sm font-semibold text-gray-900">{batch.courses.language}</p>
                  </div>
                </div>
              )}

              {/* Program */}
              {batch.courses?.program && (
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="bg-yellow-100 p-2 rounded-lg">
                    <BookOpen className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Program</p>
                    <p className="text-sm font-semibold text-gray-900">{batch.courses.program}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Seat Availability - BERRY Style */}
            <div className={`${colors.bg} border-2 ${colors.border} rounded-xl p-6 shadow-lg`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-white p-2.5 rounded-xl shadow-md">
                  <Users className={`w-6 h-6 ${colors.text}`} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Seat Availability</h3>
                  <p className="text-sm text-gray-600">Current enrollment status</p>
                </div>
              </div>

              {/* Seat Count */}
              <div className="flex justify-between items-center mb-3">
                <span className="text-2xl font-bold text-gray-900">
                  {enrolledStudents} / {maxStudents}
                </span>
                <span className={`text-lg font-bold ${colors.text} ${colors.badge} px-4 py-2 rounded-full`}>
                  {isFull ? 'FULL' : `${availableSeats} left`}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`absolute left-0 top-0 h-full ${colors.progress} transition-all duration-500 ease-out rounded-full`}
                  style={{ width: `${Math.min(fillPercentage, 100)}%` }}
                />
              </div>

              {/* Warning for almost full */}
              {isAlmostFull && !isFull && (
                <div className="mt-4 flex items-center gap-2 text-yellow-700">
                  <span className="animate-ping inline-block w-2 h-2 bg-yellow-500 rounded-full"></span>
                  <p className="text-sm font-medium">
                    Hurry! Only {availableSeats} seat{availableSeats > 1 ? 's' : ''} remaining
                  </p>
                </div>
              )}
            </div>

            {/* Created Date */}
            {batch.created_at && (
              <div className="text-sm text-gray-500 text-center">
                Batch created on {new Date(batch.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            )}
          </div>

          {/* Footer - Actions - BERRY Style */}
          <div className="bg-gray-50 px-6 py-5 border-t border-gray-200 flex-shrink-0">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleClose}
                className="flex-1 px-6 py-3 bg-white text-gray-700 font-semibold rounded-xl border-2 border-gray-300 hover:bg-gray-50 transition-all duration-200"
              >
                Close
              </button>
              <button
                onClick={handleEnroll}
                disabled={isFull || isAlreadyEnrolled || isEnrolling}
                className={`flex-1 px-6 py-3 font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                  isFull || isAlreadyEnrolled || isEnrolling
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
                }`}
              >
                {isEnrolling ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Enrolling...
                  </>
                ) : isFull ? (
                  <>
                    <XCircle className="w-5 h-5" />
                    Batch Full
                  </>
                ) : isAlreadyEnrolled ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Already Enrolled
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Enroll Now
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BatchDetailsModal;




























