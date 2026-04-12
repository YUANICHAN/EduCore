import '../../App.css';
import { useState, useEffect, useCallback } from 'react';
import Sidebar from '../../Components/Student/Sidebar.jsx';
import announcementService from '../../service/announcementService';
import { Inbox, Paperclip, EyeOff, Eye, ArrowLeft, BookOpen, Megaphone, Loader2, AlertCircle } from 'lucide-react';

function truncateText(text, maxLength = 120) {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
}

function mapAnnouncement(item) {
  const publishedAt = item.published_at || item.created_at || item.updated_at;

  return {
    id: item.id,
    scope: item.class_id || item.target_audience === 'class' ? 'class' : 'school',
    title: item.title || 'Untitled Announcement',
    body: item.content || item.body || item.message || '',
    seen: Boolean(item.is_read || item.seen),
    attachments: Array.isArray(item.attachments) ? item.attachments : [],
    date: publishedAt
      ? new Date(publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : 'N/A',
  };
}

function Announcements() {
  const [activeItem, setActiveItem] = useState('Announcements');
  const [classAnnouncements, setClassAnnouncements] = useState([]);
  const [schoolAnnouncements, setSchoolAnnouncements] = useState([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await announcementService.getAll({ active: true, per_page: 200, sort_by: 'published_at', sort_order: 'desc' });
      const rows = response?.data || response || [];
      const announcements = Array.isArray(rows) ? rows : [];

      const mapped = announcements.map(mapAnnouncement);
      const classItems = mapped.filter((a) => a.scope === 'class');
      const schoolItems = mapped.filter((a) => a.scope === 'school');

      setClassAnnouncements(classItems);
      setSchoolAnnouncements(schoolItems);

      if (selectedAnnouncement && !mapped.some((item) => item.id === selectedAnnouncement.id)) {
        setSelectedAnnouncement(null);
      }
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
      setError('Failed to load announcements from the database.');
      setClassAnnouncements([]);
      setSchoolAnnouncements([]);
      setSelectedAnnouncement(null);
    } finally {
      setLoading(false);
    }
  }, [selectedAnnouncement]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const renderCard = (item) => (
    <div key={item.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {item.seen ? <Eye className="w-4 h-4 text-gray-400" /> : <EyeOff className="w-4 h-4 text-blue-600" />}
          <p className="text-sm font-semibold text-gray-900 truncate">{item.title}</p>
        </div>
        <span className="text-xs text-gray-500 whitespace-nowrap">{item.date}</span>
      </div>

      <p className="text-sm text-gray-700 mt-2">{truncateText(item.body)}</p>

      <div className="flex items-center justify-between gap-3 mt-3">
        <div className="flex items-center gap-2 text-xs text-gray-600">
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

        <button
          onClick={() => setSelectedAnnouncement(item)}
          className="text-xs font-semibold px-3 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
        >
          Read more
        </button>
      </div>
    </div>
  );

  const safeNote = (text) => (
    <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
      {text}
    </div>
  );

  return (
    <div className="flex h-screen">
      <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
      <div className="h-screen bg-gray-50 p-8 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Announcements</h1>
            <p className="text-gray-600 mt-1">Official updates for your classes and school notices.</p>
          </div>
        </div>

        {loading ? (
          <div className="h-56 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                {error}
              </div>
            )}

            {selectedAnnouncement ? (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between gap-4 mb-5">
                  <div className="flex items-center gap-2 text-sm text-blue-900">
                    <Megaphone className="w-4 h-4" />
                    <span>Announcements</span>
                    <span>/</span>
                    <span className="font-semibold">{selectedAnnouncement.scope === 'class' ? 'Class' : 'School-wide'}</span>
                  </div>
                  <button
                    onClick={() => setSelectedAnnouncement(null)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-100"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back
                  </button>
                </div>

                <div className="border border-gray-200 rounded-lg p-5 bg-gray-50">
                  <p className="text-xs text-gray-500">{selectedAnnouncement.date}</p>
                  <h2 className="text-2xl font-bold text-gray-900 mt-1">{selectedAnnouncement.title}</h2>
                  <p className="text-sm text-gray-700 mt-4 leading-relaxed">{selectedAnnouncement.body || 'No details provided.'}</p>

                  {selectedAnnouncement.attachments.length > 0 && (
                    <div className="mt-5">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Attachments</p>
                      <div className="space-y-2">
                        {selectedAnnouncement.attachments.map((file) => (
                          <div key={String(file)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700">
                            <Paperclip className="w-4 h-4" />
                            {String(file)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Class Announcements</h2>
                  </div>
                  {classAnnouncements.length === 0
                    ? safeNote('No announcements yet for your classes.')
                    : classAnnouncements.map(renderCard)}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Inbox className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">School-wide Announcements</h2>
                  </div>
                  {schoolAnnouncements.length === 0
                    ? safeNote('No school-wide announcements yet.')
                    : schoolAnnouncements.map(renderCard)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Announcements;
