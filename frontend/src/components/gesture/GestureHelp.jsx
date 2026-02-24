import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { AlertCircle, Hand, CheckCircle, X } from 'lucide-react';

const GestureHelp = () => {
  const [helpRequests, setHelpRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  // Fetch help requests
  const fetchHelpRequests = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/gestures/help-requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHelpRequests(response.data.helpRequests);
    } catch (error) {
      console.error('Error fetching help requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (showPanel) {
      fetchHelpRequests();
      const interval = setInterval(fetchHelpRequests, 10000);
      return () => clearInterval(interval);
    }
  }, [showPanel]);

  // Resolve a help request
  const resolveRequest = async (gestureId, studentName) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `/api/gestures/${gestureId}/resolve`,
        { responseNote: 'Teacher acknowledged' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`Helped ${studentName}!`);
      fetchHelpRequests();
    } catch (error) {
      console.error('Error resolving request:', error);
      toast.error('Could not resolve request');
    }
  };

  const unreadCount = helpRequests.length;

  return (
    <>
      {/* Floating Help Button */}
      <div className="fixed bottom-4 left-4 z-50">
        <button
          onClick={() => setShowPanel(!showPanel)}
          className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full shadow-lg relative transition-all duration-200"
        >
          <AlertCircle size={28} />

          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-yellow-400 text-red-900 font-bold text-xs w-6 h-6 rounded-full flex items-center justify-center animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Help Request Panel */}
      {showPanel && (
        <div className="fixed bottom-20 left-4 w-96 max-h-96 bg-white rounded-lg shadow-2xl border-2 border-red-500 overflow-hidden z-50">
          
          {/* Header */}
          <div className="bg-red-500 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={20} />
              <h3 className="font-bold">Help Requests</h3>
            </div>
            <button
              onClick={() => setShowPanel(false)}
              className="hover:text-gray-200 transition"
            >
              <X size={22} />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-80">
            {isLoading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading...</p>
              </div>
            ) : helpRequests.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <CheckCircle size={40} className="mx-auto text-green-500 mb-2" />
                <p>No pending help requests</p>
                <p className="text-sm mt-1">All students are doing great!</p>
              </div>
            ) : (
              <div className="divide-y">
                {helpRequests.map((request) => (
                  <div key={request._id} className="p-4 hover:bg-gray-50 transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Hand size={20} className="text-red-500" />
                          <p className="font-bold text-gray-800">
                            {request.studentId.firstName} {request.studentId.lastName}
                          </p>
                        </div>

                        <p className="text-xs text-gray-500 mb-1">
                          ID: {request.studentId.enrollmentId}
                        </p>

                        {request.taskId && (
                          <p className="text-sm text-gray-600 mb-2">
                            Task: {request.taskId.title}
                          </p>
                        )}

                        <p className="text-xs text-gray-400">
                          {new Date(request.createdAt).toLocaleTimeString()}
                        </p>
                      </div>

                      <button
                        onClick={() =>
                          resolveRequest(request._id, request.studentId.firstName)
                        }
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm font-medium transition"
                      >
                        Help
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-2 border-t">
            <button
              onClick={fetchHelpRequests}
              className="text-sm text-blue-500 hover:text-blue-600 font-medium"
            >
              Refresh
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default GestureHelp;