import '../../App.css';
import { useState, useEffect, useCallback } from 'react';
import Sidebar from '../../Components/Student/Sidebar.jsx';
import { Megaphone, Inbox, Paperclip, EyeOff, Eye, Loader2, AlertCircle } from 'lucide-react';
import announcementService from '../../service/announcementService';

// Fallback data
const getFallbackClassAnnouncements = () => [
  { id: 1, title: 'CS 301: Project Milestone 1', body: 'Submit your repo link by Friday 5 PM.', seen: false, attachments: ['Requirements.pdf'], date: 'Jan 15, 2026' },
  { id: 2, title: 'CS 302: Lab Reschedule', body: 'Lab moved to Thursday 10 AM in Lab 4.', seen: true, attachments: [], date: 'Jan 14, 2026' },
];

const getFallbackSchoolAnnouncements = () => [
  { id: 3, title: 'University Career Fair', body: 'Happening Jan 28 at the Main Hall.', seen: false, attachments: ['Booths.pdf'], date: 'Jan 13, 2026' },
  { id: 4, title: 'Library Extended Hours', body: 'Open until 11 PM during midterms week.', seen: true, attachments: [], date: 'Jan 10, 2026' },
];

function Announcements() {
  const [activeItem, setActiveItem] = useState('Announcements');
  const [classAnnouncements, setClassAnnouncements] = useState([]);
  const [schoolAnnouncements, setSchoolAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await announcementService.getAll();
      const announcements = response.data || response || [];
      
      // Separate class and school announcements
      const classAnn = [];
      const schoolAnn = [];
      
      announcements.forEach(ann => {
        const mapped = {
          id: ann.id,
          title: ann.title,
          body: ann.content || ann.body || ann.message || '',
          seen: ann.is_read || ann.seen || false,
          attachments: ann.attachments || [],
          date: ann.created_at 
            ? new Date(ann.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : 'N/A'
        };
        
        if (ann.type === 'school' || ann.scope === 'school' || !ann.class_id) {
          schoolAnn.push(mapped);
        } else {
          classAnn.push(mapped);
        }
      });
      
      setClassAnnouncements(classAnn.length > 0 ? classAnn : getFallbackClassAnnouncements());
      setSchoolAnnouncements(schoolAnn.length > 0 ? schoolAnn : getFallbackSchoolAnnouncements());
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
      setError('Failed to load announcements');
      setClassAnnouncements(getFallbackClassAnnouncements());
      setSchoolAnnouncements(getFallbackSchoolAnnouncements());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const renderCard = (item) => (
    <div key={item.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {item.seen ? <Eye className="w-4 h-4 text-gray-400" /> : <EyeOff className="w-4 h-4 text-blue-600" />}
          <p className="text-sm font-semibold text-gray-900">{item.title}</p>
        </div>
        <span className="text-xs text-gray-500">{item.date}</span>
      </div>
      <p className="text-sm text-gray-700 mt-2">{item.body}</p>
      <div className="flex items-center gap-2 mt-3 text-xs text-gray-600">
        <span className={`px-2 py-1 rounded-full border ${item.seen ? 'bg-gray-50 text-gray-700 border-gray-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
          {item.seen ? 'Seen' : 'Unseen'}
        </span>
        {item.attachments.length > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
            <Paperclip className="w-3 h-3" />
            {item.attachments.length} attachment{item.attachments.length > 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen">
      <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
      <div className="h-screen bg-gray-50 p-8 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Announcements</h1>
            <p className="text-gray-600 mt-1">Official communication filtered by enrollment, class, and program.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <span className="ml-2 text-gray-600">Loading announcements...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64 text-red-500">
            <AlertCircle className="w-6 h-6 mr-2" />
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Inbox className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Class Announcements</h2>
              </div>
              {classAnnouncements.length === 0 ? (
                <p className="text-gray-500 text-sm">No class announcements.</p>
              ) : (
                classAnnouncements.map(renderCard)
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Inbox className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">School-wide Announcements</h2>
              </div>
              {schoolAnnouncements.length === 0 ? (
                <p className="text-gray-500 text-sm">No school-wide announcements.</p>
              ) : (
                schoolAnnouncements.map(renderCard)
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Announcements;
