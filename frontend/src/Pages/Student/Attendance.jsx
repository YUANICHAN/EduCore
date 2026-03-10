import '../../App.css';
import { useState, useEffect, useCallback } from 'react';
import Sidebar from '../../Components/Student/Sidebar.jsx';
import { CheckCircle2, XCircle, AlertCircle, QrCode, BarChart3, Loader2 } from 'lucide-react';
import attendanceService from '../../service/attendanceService';

// Fallback data for development/demo
const getFallbackAttendanceData = () => [
  { code: 'CS 301', subject: 'Data Structures & Algorithms', present: 22, absent: 1, excused: 1, percentage: 91 },
  { code: 'CS 302', subject: 'Database Management Systems', present: 21, absent: 2, excused: 1, percentage: 88 },
  { code: 'CS 303', subject: 'Software Engineering', present: 23, absent: 0, excused: 1, percentage: 95 },
  { code: 'CS 305', subject: 'Computer Networks', present: 20, absent: 3, excused: 1, percentage: 85 },
];

const getFallbackQrHistory = () => [
  { date: 'Jan 12, 2026', time: '08:05 AM', subject: 'CS 301', status: 'Present' },
  { date: 'Jan 11, 2026', time: '10:01 AM', subject: 'CS 302', status: 'Present' },
  { date: 'Jan 10, 2026', time: '01:04 PM', subject: 'CS 303', status: 'Present' },
  { date: 'Jan 09, 2026', time: '03:02 PM', subject: 'CS 305', status: 'Excused' },
];

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
      // Fetch student's attendance records
      const response = await attendanceService.getAll();
      const records = response.data || response || [];
      
      // Process records to get per-subject summary
      const subjectMap = {};
      const history = [];
      
      records.forEach(record => {
        const subjectCode = record.subject?.code || record.subject_code || 'N/A';
        const subjectName = record.subject?.name || record.subject_name || 'Unknown Subject';
        const status = record.status || 'Present';
        
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
        const recordDate = new Date(record.date || record.created_at);
        history.push({
          date: recordDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          time: recordDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
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
      history.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      setAttendanceData(summaryData.length > 0 ? summaryData : getFallbackAttendanceData());
      setQrHistory(history.length > 0 ? history.slice(0, 10) : getFallbackQrHistory());
    } catch (err) {
      console.error('Failed to fetch attendance:', err);
      setError('Failed to load attendance data');
      setAttendanceData(getFallbackAttendanceData());
      setQrHistory(getFallbackQrHistory());
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
            <p className="text-gray-500 text-center py-8">No attendance history found</p>
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
