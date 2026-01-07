import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getBatchDetails } from '../services/api';
import { Clock, MessageCircle, Users, LogOut } from 'lucide-react';

interface ChatMessage {
  id: number;
  text: string;
  batch_id: string;
  sender: string;
  created_at: string;
  sender_name?: string;
}

const Chat: React.FC = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teacherName, setTeacherName] = useState<string>('Teacher');

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  // Fetch batch details to get teacher name
  const fetchBatchDetails = async () => {
    if (!batchId || !token) return;
    
    try {
      const batchDetails = await getBatchDetails(batchId, token);
      if (batchDetails?.teachers?.users?.name) {
        setTeacherName(batchDetails.teachers.users.name);
      }
    } catch (error) {
      console.error('Error fetching batch details:', error);
    }
  };

  // Fetch messages for the batch
  const fetchMessages = async () => {
    if (!batchId) {
      setError("Invalid batch ID");
      setLoading(false);
      return;
    }

    const CHAT_API_URL =
      import.meta.env.VITE_CHAT_API_URL || "http://localhost:3030";

    const url = `${CHAT_API_URL}/chats/${batchId}`;
    console.log("Fetching messages from:", url);

    try {
      setError(null);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data: ChatMessage[] = await response.json();
      setMessages(data);
    } catch (error: any) {
      console.error("Error fetching messages:", error.message);
      setError("Cannot connect to chat server. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages on mount and when batchId changes
  useEffect(() => {
    fetchBatchDetails();
    fetchMessages();
    
    // Set up polling for real-time updates every 5 seconds
    const interval = setInterval(() => {
      fetchMessages();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [batchId, token]);

  if (!batchId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex">
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-white p-8 rounded-xl shadow-md">
            <h1 className="text-2xl font-semibold text-gray-900">Error</h1>
            <p className="mt-2 text-gray-600">No batch ID provided.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="flex-1 flex flex-col w-full lg:ml-[calc(68rem/4)]">
        {/* Navigation Bar */}
        <nav className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-10">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="p-2 bg-blue-600 rounded-lg flex-shrink-0">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                    Class Chat
                  </h1>
                  <p className="text-sm text-gray-500 hidden sm:block">Connect with your batch</p>
                </div>
              </div>
              <div className="flex items-center ml-4 gap-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm text-gray-600">Live</span>
                </div>
                <button
                  onClick={handleBackToDashboard}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium 
                    text-gray-700 hover:text-blue-800 hover:bg-blue-50 rounded-lg 
                    min-h-[40px] sm:min-h-auto"
                >
                  <LogOut className="h-4 w-4 rotate-180" />
                  <span className="hidden sm:inline">Back to Dashboard</span>
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 w-full mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded-r-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Error:</span>
                <span className="ml-1 break-words">{error}</span>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
            <div className="px-6 py-4 bg-blue-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg flex-shrink-0">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-bold text-white">Messages</h2>
                    <p className="text-blue-100 text-sm">Batch communication hub</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-white/80 text-sm">Auto-refresh</div>
                  <div className="text-white text-xs">Every 5s</div>
                </div>
              </div>
            </div>

            <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="rounded-full h-12 w-12 border-4 border-blue-200"></div>
                  <p className="mt-4 text-gray-600 font-medium">Loading messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                    <MessageCircle className="w-12 h-12 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No messages yet</h3>
                  <p className="text-gray-500 max-w-sm mx-auto px-4">Be the first to start a conversation in this batch. Teachers can send messages that will appear here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`rounded-xl p-5 shadow-sm ${
                        message.sender === 'teacher' 
                          ? 'bg-blue-50 border-l-4 border-blue-400' 
                          : 'bg-gray-50 border-l-4 border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          <div className={`p-2 rounded-full flex-shrink-0 ${
                            message.sender === 'teacher' 
                              ? 'bg-blue-100' 
                              : 'bg-gray-100'
                          }`}>
                            <Users className={`w-4 h-4 ${
                              message.sender === 'teacher' 
                                ? 'text-blue-600' 
                                : 'text-gray-600'
                            }`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                              message.sender === 'teacher' 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {message.sender === 'teacher' 
                                ? `👨‍🏫 ${message.sender_name || teacherName} (Teacher)` 
                                : '👨‍🎓 Student'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="ml-11">
                        <p className="text-gray-800 text-base leading-relaxed mb-3 break-words">{message.text}</p>
                        
                        <div className="flex items-center text-xs text-gray-500 space-x-2">
                          <Clock className="h-3 w-3 flex-shrink-0" />
                          <span>
                            {new Date(message.created_at).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          <span className="text-gray-300">•</span>
                          <span className="text-gray-400">
                            {new Date(message.created_at).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Chat;