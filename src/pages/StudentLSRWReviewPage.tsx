import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getLSRWReview } from '../services/api';
import { CheckCircle, XCircle, Loader2, Headphones, LogOut, ArrowLeft, Trophy } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ReviewData {
  lsrw_id: string;
  title: string;
  instruction: string;
  audio_url: string;
  questions: Array<{
    questionNumber: string;
    question: string;
    options: Array<{ key: string; text: string }>;
    correctAnswer: string;
  }>;
  max_marks: number;
  studentAnswers: Record<string, string>;
  score: number;
  submitted_at: string;
}

const StudentLSRWReviewPage: React.FC = () => {
  const { batchId, lsrwId } = useParams<{ batchId: string; lsrwId: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (batchId && lsrwId && token) {
      fetchReviewData();
    }
  }, [batchId, lsrwId, token]);

  const fetchReviewData = async () => {
    if (!batchId || !lsrwId || !token) return;

    try {
      setLoading(true);
      setError(null);
      const response = await getLSRWReview(lsrwId, batchId, token);
      if (response.success) {
        setReviewData(response.data);
      } else {
        setError('Failed to load review data');
      }
    } catch (err: any) {
      console.error('Error fetching review:', err);
      setError(err.response?.data?.error || 'Failed to load review data');
      toast.error(err.response?.data?.error || 'Failed to load review data');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(`/class/${batchId}/lsrw`);
  };

  const getAnswerStatus = (questionNumber: string, optionKey: string) => {
    if (!reviewData) return 'neutral';
    
    const correctAnswer = reviewData.questions.find(q => q.questionNumber === questionNumber)?.correctAnswer?.toLowerCase().trim();
    const studentAnswer = reviewData.studentAnswers[questionNumber]?.toLowerCase().trim();
    const optionKeyLower = optionKey.toLowerCase().trim();

    if (optionKeyLower === correctAnswer) {
      return 'correct';
    } else if (optionKeyLower === studentAnswer && optionKeyLower !== correctAnswer) {
      return 'incorrect';
    }
    return 'neutral';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex">
        <div className="flex-1 flex flex-col w-full lg:ml-[calc(68rem/4)]">
          <nav className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20">
            <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12">
              <div className="flex justify-between items-center h-14 sm:h-16 lg:h-20">
                <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                  <div className="p-1.5 sm:p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-md flex-shrink-0">
                    <Headphones className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      Quiz Review
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Review your quiz attempt</p>
                  </div>
                </div>
              </div>
            </div>
          </nav>
          <main className="flex-1 w-full mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700">
                <h2 className="text-lg font-semibold text-white tracking-wide">Loading...</h2>
              </div>
              <div className="p-4 sm:p-6">
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !reviewData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex">
        <div className="flex-1 flex flex-col w-full lg:ml-[calc(68rem/4)]">
          <nav className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20">
            <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12">
              <div className="flex justify-between items-center h-14 sm:h-16 lg:h-20">
                <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                  <div className="p-1.5 sm:p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-md flex-shrink-0">
                    <Headphones className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      Quiz Review
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Review your quiz attempt</p>
                  </div>
                </div>
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 text-xs sm:text-sm font-medium 
                    text-gray-700 hover:text-blue-800 hover:bg-blue-50 rounded-lg 
                    transition-all duration-200 min-h-[40px] sm:min-h-auto"
                >
                  <LogOut className="h-5 w-5 sm:h-4 sm:w-4 rotate-180" />
                  <span className="hidden sm:inline">Back</span>
                </button>
              </div>
            </div>
          </nav>
          <main className="flex-1 w-full mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700">
                <h2 className="text-lg font-semibold text-white tracking-wide">Error</h2>
              </div>
              <div className="p-4 sm:p-6">
                <div className="text-center py-6">
                  <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Review</h2>
                  <p className="text-gray-600 mb-4">{error || 'Review data not found'}</p>
                  <button
                    onClick={handleBack}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex">
      <div className="flex-1 flex flex-col w-full lg:ml-[calc(68rem/4)]">
        {/* Navigation Bar */}
        <nav className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20 sticky top-0 z-10">
          <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12">
            <div className="flex justify-between items-center h-14 sm:h-16 lg:h-20">
              <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                <div className="p-1.5 sm:p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-md flex-shrink-0">
                  <Headphones className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Quiz Review
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">{reviewData.title}</p>
                </div>
              </div>
              <div className="flex items-center ml-2 sm:ml-4 gap-2 sm:gap-3">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 text-xs sm:text-sm font-medium 
                    text-gray-700 hover:text-blue-800 hover:bg-blue-50 rounded-lg 
                    transition-all duration-200 min-h-[40px] sm:min-h-auto"
                >
                  <ArrowLeft className="h-5 w-5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Back to Lessons</span>
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 w-full mx-auto py-3 sm:py-4 md:py-6 px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl overflow-hidden border border-white/20">
            {/* Back Button - Prominent */}
            <div className="px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-4 bg-gray-50 border-b border-gray-200">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 sm:gap-3 px-4 py-2 sm:px-5 sm:py-2.5 bg-white hover:bg-gray-100 text-gray-700 rounded-lg border border-gray-300 hover:border-gray-400 transition-all duration-200 shadow-sm hover:shadow-md font-medium text-sm sm:text-base"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Back to Lessons</span>
              </button>
            </div>

            {/* Header with Score */}
            <div className="px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white tracking-wide mb-2">
                    {reviewData.title}
                  </h2>
                  {reviewData.instruction && (
                    <p className="text-blue-100 text-sm sm:text-base">{reviewData.instruction}</p>
                  )}
                </div>
                {reviewData.score !== null ? (
                  <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-3 sm:px-6 sm:py-4 flex-shrink-0">
                    <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-300" />
                    <div>
                      <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                        {reviewData.score}/{reviewData.max_marks}
                      </div>
                      <div className="text-xs sm:text-sm text-blue-100">Your Score</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 bg-yellow-500/20 backdrop-blur-sm rounded-lg px-4 py-3 sm:px-6 sm:py-4 flex-shrink-0 border border-yellow-400/30">
                    <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-300 animate-spin" />
                    <div>
                      <div className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-200">
                        Pending Verification
                      </div>
                      <div className="text-xs sm:text-sm text-yellow-100">Waiting for tutor to verify</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Audio Player */}
            {reviewData.audio_url && (
              <div className="px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-4 bg-gray-50 border-b border-gray-200">
                <audio
                  src={reviewData.audio_url}
                  controls
                  className="w-full max-w-md"
                />
              </div>
            )}

            {/* Questions Review - Only show if verified */}
            {reviewData.score !== null && reviewData.verified !== false ? (
              <div className="p-3 sm:p-4 md:p-6">
                <div className="space-y-4 sm:space-y-6">
                  {reviewData.questions.map((question, index) => {
                    const studentAnswer = reviewData.studentAnswers[question.questionNumber]?.toLowerCase().trim();
                    const correctAnswer = question.correctAnswer?.toLowerCase().trim();
                    const isCorrect = studentAnswer === correctAnswer;

                  return (
                    <div
                      key={index}
                      className={`border-2 rounded-lg sm:rounded-xl p-4 sm:p-6 ${
                        isCorrect
                          ? 'border-green-300 bg-green-50'
                          : 'border-red-300 bg-red-50'
                      }`}
                    >
                      <div className="mb-4">
                        <div className="flex items-start gap-2 mb-2">
                          {isCorrect ? (
                            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 flex-shrink-0 mt-0.5" />
                          )}
                          <p className="text-base sm:text-lg font-semibold text-gray-900 break-words">
                            {question.questionNumber}. {question.question}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {question.options.map((option) => {
                          const status = getAnswerStatus(question.questionNumber, option.key);
                          const isSelected = studentAnswer === option.key.toLowerCase().trim();
                          const isCorrectOption = correctAnswer === option.key.toLowerCase().trim();

                          let bgColor = 'bg-white';
                          let borderColor = 'border-gray-200';
                          let textColor = 'text-gray-700';

                          if (isCorrectOption) {
                            bgColor = 'bg-green-100';
                            borderColor = 'border-green-500';
                            textColor = 'text-green-900';
                          } else if (isSelected && !isCorrectOption) {
                            bgColor = 'bg-red-100';
                            borderColor = 'border-red-500';
                            textColor = 'text-red-900';
                          }

                          return (
                            <div
                              key={option.key}
                              className={`flex items-center gap-3 p-3 sm:p-4 rounded-lg border-2 ${bgColor} ${borderColor} ${textColor}`}
                            >
                              <input
                                type="radio"
                                name={question.questionNumber}
                                value={option.key}
                                checked={isSelected}
                                disabled
                                className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 cursor-not-allowed flex-shrink-0"
                              />
                              <span className="text-sm sm:text-base break-words flex-1">
                                {option.key.toUpperCase()}) {option.text}
                                {isCorrectOption && (
                                  <span className="ml-2 text-green-700 font-semibold">✓ Correct Answer</span>
                                )}
                                {isSelected && !isCorrectOption && (
                                  <span className="ml-2 text-red-700 font-semibold">✗ Your Answer</span>
                                )}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>
            ) : (
              <div className="p-3 sm:p-4 md:p-6">
                <div className="text-center py-12 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                  <Loader2 className="w-16 h-16 text-yellow-500 mx-auto mb-4 animate-spin" />
                  <h3 className="text-xl font-semibold text-yellow-900 mb-2">Pending Verification</h3>
                  <p className="text-yellow-700 mb-4">Your quiz has been submitted successfully.</p>
                  <p className="text-yellow-600 text-sm">Please wait for your tutor to verify and release your marks.</p>
                  <p className="text-yellow-600 text-sm mt-2">You will be able to view your answers and score once verified.</p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentLSRWReviewPage;

