import React from "react";
import {
  Clock,
  Users,
  BookOpen,
  Globe,
  MapPin,
  User,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface BatchCardProps {
  batch: {
    batch_id: string;
    batch_name: string;
    course_name?: string;
    duration?: number;
    time_from?: string;
    time_to?: string;
    status?: string;
    courses?: {
      course_name: string;
      type: string;
      language: string;
      mode: string;
      program: string;
    };
    teachers?: {
      users: {
        name: string;
        full_name?: string;
      };
    };
    centers?: {
      center_name: string;
    };
    center_name?: string;
    max_students?: number;
    enrolled_students?: number;
  };
  isSelected: boolean;
  isEnrolled: boolean;
  onSelect: (batchId: string) => void;
  onClick?: () => void;
  showDetails?: boolean;
}

const BatchCard: React.FC<BatchCardProps> = ({
  batch,
  isSelected,
  isEnrolled,
  onSelect,
  onClick,
  showDetails = false,
}) => {
  const maxStudents = batch.max_students || 20;
  const enrolledStudents = batch.enrolled_students || 0;
  const availableSeats = maxStudents - enrolledStudents;
  const fillPercentage = (enrolledStudents / maxStudents) * 100;
  const isFull = availableSeats <= 0;
  const isAlmostFull = availableSeats > 0 && availableSeats <= 5;

  const getStatusColor = () => {
    if (isFull) return "red";
    if (isAlmostFull) return "yellow";
    return "green";
  };

  const statusColor = getStatusColor();

  const colorClasses = {
    green: {
      bg: "bg-green-50",
      border: "border-green-500",
      text: "text-green-700",
      progress: "bg-green-500",
      badge: "bg-green-100 text-green-800",
      glow: "shadow-green-200",
    },
    yellow: {
      bg: "bg-yellow-50",
      border: "border-yellow-500",
      text: "text-yellow-700",
      progress: "bg-yellow-500",
      badge: "bg-yellow-100 text-yellow-800",
      glow: "shadow-yellow-200",
    },
    red: {
      bg: "bg-red-50",
      border: "border-red-500",
      text: "text-red-700",
      progress: "bg-red-500",
      badge: "bg-red-100 text-red-800",
      glow: "shadow-red-200",
    },
  };

  const colors = colorClasses[statusColor];

  const handleClick = () => {
    if (!isFull && !isEnrolled) {
      if (onClick) onClick();
      else onSelect(batch.batch_id);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`
        relative rounded-2xl overflow-hidden transition-all duration-300 transform
        ${
          isFull || isEnrolled
            ? "cursor-not-allowed opacity-60"
            : "cursor-pointer sm:hover:scale-[1.02] sm:hover:shadow-xl"
        }
        ${
          isSelected
            ? `ring-4 ring-blue-500 ${colors.glow} shadow-2xl scale-[1.01]`
            : "shadow-md sm:hover:shadow-lg"
        }
        ${isEnrolled ? "ring-2 ring-gray-400" : ""}
        bg-white border-2 ${
          isSelected
            ? "border-blue-500"
            : "border-gray-200 sm:hover:border-blue-300"
        }
        group w-full max-w-full sm:max-w-[420px] mx-auto
        overflow-hidden
      `}
    >
      {/* Status Badges */}
      {isSelected && (
        <div className="absolute top-3 right-3 z-10 animate-bounce">
          <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7 text-blue-500 fill-blue-100" />
        </div>
      )}

      {isFull && (
        <div className="absolute top-3 right-3 z-10 bg-red-500 text-white px-2 py-1 rounded-full text-[10px] sm:text-xs font-bold flex items-center gap-1 shadow-lg">
          <XCircle className="w-3 h-3 sm:w-4 sm:h-4" /> FULL
        </div>
      )}

      {isEnrolled && (
        <div className="absolute top-3 right-3 z-10 bg-gray-600 text-white px-2 py-1 rounded-full text-[10px] sm:text-xs font-bold flex items-center gap-1 shadow-lg">
          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" /> ENROLLED
        </div>
      )}

      {/* Content */}
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="mb-3 sm:mb-4">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 pr-8 group-hover:text-blue-600 transition">
            {batch.batch_name}
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 font-medium mb-1">
            {batch.courses?.course_name || batch.course_name || "Course Name"}
          </p>

          {batch.status && (
            <span
              className={`inline-flex items-center px-2 py-0.5 text-[10px] sm:text-xs font-semibold rounded-full ${
                batch.status === "Approved"
                  ? "bg-blue-100 text-blue-700"
                  : batch.status === "Started"
                  ? "bg-green-100 text-green-700"
                  : batch.status === "Completed"
                  ? "bg-purple-100 text-purple-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {batch.status === "Approved"
                ? "Ready to Start"
                : batch.status === "Started"
                ? "In Progress"
                : batch.status === "Completed"
                ? "Completed"
                : batch.status}
            </span>
          )}
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
          {batch.time_from && batch.time_to && (
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-700">
              <Clock className="w-4 h-4 text-blue-500" />
              <span>
                {batch.time_from} - {batch.time_to}
              </span>
            </div>
          )}

          {batch.courses?.mode && (
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-700">
              <Globe className="w-4 h-4 text-purple-500" />
              <span>{batch.courses.mode}</span>
            </div>
          )}

          {batch.courses?.language && (
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-700">
              <BookOpen className="w-4 h-4 text-green-500" />
              <span>{batch.courses.language}</span>
            </div>
          )}

          {batch.duration && (
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-700">
              <Clock className="w-4 h-4 text-orange-500" />
              <span>{batch.duration} months</span>
            </div>
          )}
        </div>

        {/* Seats Section */}
        <div
          className={`${colors.bg} rounded-lg sm:rounded-xl p-3 sm:p-4 border ${colors.border} border-opacity-40`}
        >
          <div className="flex flex-wrap justify-between items-center mb-2">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Users className={`w-4 h-4 sm:w-5 sm:h-5 ${colors.text}`} />
              <span className="text-xs sm:text-sm font-semibold text-gray-700">
                Seats: {enrolledStudents} / {maxStudents}
              </span>
            </div>
            <span
              className={`text-[10px] sm:text-xs font-bold ${colors.text} ${colors.badge} px-2 py-0.5 rounded-full`}
            >
              {isFull ? "FULL" : `${availableSeats} left`}
            </span>
          </div>

          <div className="relative h-2 sm:h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`absolute left-0 top-0 h-full ${colors.progress} rounded-full transition-all duration-500`}
              style={{ width: `${Math.min(fillPercentage, 100)}%` }}
            />
          </div>

          {isAlmostFull && !isFull && (
            <p className="mt-1 text-[10px] sm:text-xs text-yellow-700 font-medium flex items-center gap-1 animate-pulse">
              <span className="animate-ping inline-block w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
              Hurry! Only {availableSeats} seat
              {availableSeats > 1 ? "s" : ""} remaining
            </p>
          )}
        </div>

        {/* Expanded Details */}
        {showDetails && isSelected && (
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 space-y-2 sm:space-y-3">
            {(batch.teachers?.users?.full_name || batch.teachers?.users?.name) && (
              <div className="flex items-start gap-2 sm:gap-3">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-[10px] sm:text-xs text-gray-500 font-medium">
                    Full Name
                  </p>
                  <p className="text-xs sm:text-sm font-semibold text-gray-900">
                    {batch.teachers.users.full_name || batch.teachers.users.name}
                  </p>
                </div>
              </div>
            )}

            {(batch.centers?.center_name || batch.center_name) && (
              <div className="flex items-start gap-2 sm:gap-3">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-[10px] sm:text-xs text-gray-500 font-medium">
                    Center
                  </p>
                  <p className="text-xs sm:text-sm font-semibold text-gray-900">
                    {batch.centers?.center_name || batch.center_name}
                  </p>
                </div>
              </div>
            )}

            {batch.courses?.program && (
              <div className="flex items-start gap-2 sm:gap-3">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-[10px] sm:text-xs text-gray-500 font-medium">
                    Program
                  </p>
                  <p className="text-xs sm:text-sm font-semibold text-gray-900">
                    {batch.courses.program}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchCard;
