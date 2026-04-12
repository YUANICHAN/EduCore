import '../../App.css';
import { useState, useEffect, useCallback } from 'react';
import Sidebar from '../../Components/Student/Sidebar.jsx';
import { CheckCircle2, XCircle, AlertCircle, QrCode, BarChart3, Loader2 } from 'lucide-react';
import authService from '../../service/authService';
import studentService from '../../service/studentService';

function Attendance() {
  const [activeItem, setActiveItem] = useState('Attendance');
  const [attendanceData, setAttendanceData] = useState([]);
  const [qrHistory, setQrHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const profileResponse = await authService.getProfile();
      const profileUser = profileResponse?.data || profileResponse || {};
      const student = profileUser.student || profileUser;
      const studentId = student?.id || profileUser.student_id || profileUser.id;

      if (!studentId) {
        throw new Error('Student profile is missing an ID.');
      }

      // Fetch the logged-in student's attendance records
      const response = await studentService.getAttendance(studentId);
      const records = response?.attendance?.data || response?.attendance || response?.data || [];
      
      // Process records to get per-subject summary
      const subjectMap = {};
      const history = [];
      
      records.forEach((record) => {
        const subjectCode = record.class?.subject?.subject_code || record.subject?.code || record.subject_code || 'N/A';
        const subjectName = record.class?.subject?.subject_name || record.subject?.name || record.subject_name || 'Unknown Subject';
        const status = record.status || 'Present';
        const recordTimestamp = record.date || record.created_at || record.updated_at || null;
        const recordDate = recordTimestamp ? new Date(recordTimestamp) : null;
        
        // Build subject summary
        if (!subjectMap[subjectCode]) {
          subjectMap[subjectCode] = {
            code: subjectCode,
            subject: subjectName,
            present: 0,
            absent: 0,
            excused: 0,
            total: 0
          };
        }
        
        subjectMap[subjectCode].total += 1;
        if (status.toLowerCase() === 'present') {
          subjectMap[subjectCode].present += 1;
        } else if (status.toLowerCase() === 'absent') {
          subjectMap[subjectCode].absent += 1;
        } else if (status.toLowerCase() === 'excused' || status.toLowerCase() === 'late') {
          subjectMap[subjectCode].excused += 1;
        }
        
        // Build history (recent entries)
        history.push({
          timestamp: recordDate ? recordDate.getTime() : 0,
          date: recordDate ? recordDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown date',
          time: recordDate ? recordDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'Unknown time',
          subject: subjectCode,
          status: status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
        });
      });
      
      // Calculate percentages
      const summaryData = Object.values(subjectMap).map(item => ({
        ...item,
        percentage: item.total > 0 ? Math.round((item.present / item.total) * 100) : 0
      }));
      
      // Sort history by most recent
      history.sort((a, b) => b.timestamp - a.timestamp);
      
      setAttendanceData(summaryData);
      setQrHistory(history.slice(0, 10));
    } catch (err) {
      console.error('Failed to fetch attendance:', err);
      setError('Failed to load attendance data');
      setAttendanceData([]);
      setQrHistory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
            <p className="text-gray-600 mt-1">Transparency in attendance. Read-only; calculated from official records.</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Attendance per Subject</h2>
            <span className="text-xs text-gray-500">Present / Absent / Excused</span>
          </div>
          {attendanceData.length === 0 && (
            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              No attendance yet. Your attendance records will appear here once they are recorded in the database.
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Subject</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Present</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Absent</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Excused</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Attendance %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {attendanceData.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                      No attendance records found
                    </td>
                  </tr>
                ) : (
                  attendanceData.map((item) => (
                    <tr key={item.code} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">{item.code}</td>
                      <td className="px-4 py-3 text-sm text-gray-800">{item.subject}</td>
                      <td className="px-4 py-3 text-sm text-center text-green-700 font-semibold">{item.present}</td>
                      <td className="px-4 py-3 text-sm text-center text-red-600 font-semibold">{item.absent}</td>
                      <td className="px-4 py-3 text-sm text-center text-amber-600 font-semibold">{item.excused}</td>
                      <td className="px-4 py-3 text-sm text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          item.percentage >= 90 ? 'bg-green-100 border border-green-200 text-green-800' :
                          item.percentage >= 75 ? 'bg-amber-100 border border-amber-200 text-amber-800' :
                          'bg-red-100 border border-red-200 text-red-800'
                        }`}>
                          {item.percentage}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 mt-3">Attendance is calculated from submitted records; read-only.</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <QrCode className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">QR Attendance History</h2>
          </div>
          {qrHistory.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No attendance yet</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {qrHistory.map((entry, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">{entry.subject}</p>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${
                      entry.status === 'Present'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : entry.status === 'Excused' || entry.status === 'Late'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {entry.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{entry.date} • {entry.time}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Attendance;
