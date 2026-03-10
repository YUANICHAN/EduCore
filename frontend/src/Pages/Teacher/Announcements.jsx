import '../../App.css';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../Components/Teacher/Sidebar.jsx';
import {
  Bell,
  ChevronRight,
  Plus,
  X,
  Calendar,
  Clock,
  FileText,
  Eye,
  Send,
  Paperclip,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import classService from '../../service/classService';
import announcementService from '../../service/announcementService';

// Fallback data
const getFallbackClassesData = () => [
  {
    id: 'math101',
    title: 'Mathematics 101',
    code: 'MATH101',
    section: 'Section A',
    schedule: 'MWF · 9:00 - 10:30 AM · Room 201',
    studentCount: 35,
    announcements: [
      {
        id: 1,
        title: 'Midterm Exam Schedule Released',
        content: 'The midterm exam for this course has been scheduled for next week.',
        date: '2024-01-15',
        time: '09:00 AM',
        author: 'Prof. Johnson',
        viewed: 28,
        totalStudents: 35,
        attachments: ['Midterm_Study_Guide.pdf'],
      },
    ],
  },
];

function TeacherAnnouncements() {
  const [activeItem, setActiveItem] = useState('Announcements');
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [classesData, setClassesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    scheduledDate: '',
    scheduledTime: '',
    attachments: [],
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const classResponse = await classService.getAll();
      const classes = classResponse.data || classResponse || [];
      
      // Fetch announcements for each class
      const classesWithAnnouncements = await Promise.all(
        classes.map(async (cls) => {
          let announcements = [];
          try {
            const annResponse = await announcementService.getByClass(cls.id);
            announcements = (annResponse.data || annResponse || []).map(ann => ({
              id: ann.id,
              title: ann.title,
              content: ann.content || ann.body || ann.message || '',
              date: ann.created_at 
                ? new Date(ann.created_at).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
                : 'N/A',
              time: ann.created_at
                ? new Date(ann.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                : 'N/A',
              scheduledFor: ann.scheduled_for || null,
              author: ann.author?.name || ann.author || 'Teacher',
              viewed: ann.views_count || ann.viewed || 0,
              totalStudents: cls.student_count || cls.studentCount || 0,
              attachments: ann.attachments || [],
            }));
          } catch (err) {
            console.error(`Failed to fetch announcements for class ${cls.id}:`, err);
          }
          
          return {
            id: cls.id,
            title: cls.subject?.name || cls.name || cls.title || 'Class',
            code: cls.subject?.code || cls.code || 'N/A',
            section: cls.section?.name || cls.section || 'Section',
            schedule: cls.schedule || `${cls.days || 'TBD'} · ${cls.time || 'TBD'} · ${cls.room || 'TBD'}`,
            studentCount: cls.student_count || cls.studentCount || 0,
            announcements,
          };
        })
      );
      
      setClassesData(classesWithAnnouncements.length > 0 ? classesWithAnnouncements : getFallbackClassesData());
    } catch (err) {
      console.error('Failed to fetch classes:', err);
      setError('Failed to load classes');
      setClassesData(getFallbackClassesData());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selectedClass = useMemo(
    () => classesData.find(item => item.id === selectedClassId) ?? null,
    [selectedClassId, classesData],
  );

  const handleCreateAnnouncement = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Please fill in title and content');
      return;
    }

    setSaving(true);
    try {
      await announcementService.create({
        title: formData.title,
        content: formData.content,
        class_id: selectedClassId,
        scheduled_for: formData.scheduledDate && formData.scheduledTime 
          ? `${formData.scheduledDate} ${formData.scheduledTime}`
          : null,
      });

      // Reset form
      setFormData({
        title: '',
        content: '',
        scheduledDate: '',
        scheduledTime: '',
        attachments: [],
      });
      setShowForm(false);
      alert('Announcement posted successfully!');
      fetchData(); // Refresh data
    } catch (err) {
      console.error('Failed to create announcement:', err);
      alert('Failed to post announcement. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleFileAttach = (e) => {
    const files = Array.from(e.target.files).map(f => f.name);
    setFormData({
      ...formData,
      attachments: [...formData.attachments, ...files],
    });
  };

  const removeAttachment = (index) => {
    setFormData({
      ...formData,
      attachments: formData.attachments.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
      <main className="flex-1 h-full overflow-y-auto p-8">
        <div className="flex flex-col gap-6">
          {selectedClass && (
            <nav className="flex items-center space-x-2 text-sm text-gray-600">
              <button
                onClick={() => navigate('/teacher/dashboard')}
                className="hover:text-blue-600 transition-colors"
              >
                Dashboard
              </button>
              <ChevronRight className="w-4 h-4" />
              <button
                onClick={() => setSelectedClassId(null)}
                className="hover:text-blue-600 transition-colors"
              >
                Announcements
              </button>
              <ChevronRight className="w-4 h-4" />
              <span className="text-gray-800 font-medium">{selectedClass.code} • {selectedClass.section}</span>
            </nav>
          )}

          <header className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Announcements</h1>
                <p className="text-sm text-gray-600">
                  {selectedClass
                    ? 'Manage and communicate with your class through announcements'
                    : 'Select a class to post and manage announcements'}
                </p>
              </div>
              {selectedClass && (
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New Announcement
                </button>
              )}
            </div>
          </header>

          {!selectedClass && (
            <>
              <section className="bg-white border border-blue-100 rounded-xl p-6 shadow-sm flex items-start gap-4 text-sm text-gray-700">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                  <Bell className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-semibold text-gray-900">Select a class to post announcements</p>
                  <p>Choose a section to communicate with your students, schedule announcements, attach files, and track who has viewed them.</p>
                </div>
              </section>

              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  <span className="ml-2 text-gray-600">Loading classes...</span>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-64 text-red-500">
                  <AlertCircle className="w-6 h-6 mr-2" />
                  {error}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {classesData.map(item => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedClassId(item.id)}
                      className="bg-white text-left rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all p-6"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Bell className="w-6 h-6 text-blue-600" />
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">{item.code}</h3>
                      <p className="text-sm text-gray-600 mb-3">{item.title}</p>
                      <div className="space-y-1 text-xs text-gray-600 mb-4">
                        <p>{item.section}</p>
                        <p>{item.schedule}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Students</p>
                          <p className="text-lg font-semibold text-gray-900">{item.studentCount}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Announcements</p>
                          <p className="text-lg font-semibold text-blue-600">{item.announcements.length}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {selectedClass && (
            <>
              {/* Class Info Card */}
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Bell className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{selectedClass.title}</p>
                      <p className="text-xs text-gray-600">{selectedClass.section} • {selectedClass.code}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedClassId(null)}
                    className="text-xs font-semibold text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors"
                  >
                    Change class
                  </button>
                </div>
              </div>

              {/* New Announcement Form */}
              {showForm && (
                <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Create New Announcement</h2>
                    <button
                      onClick={() => setShowForm(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Announcement title"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Write your announcement here..."
                      rows="5"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Schedule Date (Optional)</label>
                      <input
                        type="date"
                        value={formData.scheduledDate}
                        onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Schedule Time (Optional)</label>
                      <input
                        type="time"
                        value={formData.scheduledTime}
                        onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Attach Files</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <Paperclip className="w-5 h-5 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-2">Drag and drop files or click to browse</p>
                      <input
                        type="file"
                        multiple
                        onChange={handleFileAttach}
                        className="hidden"
                        id="file-input"
                      />
                      <label htmlFor="file-input" className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer">
                        Select Files
                      </label>
                    </div>

                    {formData.attachments.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm font-medium text-gray-700">Attached Files:</p>
                        {formData.attachments.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-700">{file}</span>
                            </div>
                            <button
                              onClick={() => removeAttachment(idx)}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleCreateAnnouncement}
                      disabled={saving}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Posting...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Post Announcement
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setShowForm(false)}
                      disabled={saving}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Announcements List */}
              <div className="space-y-4">
                {selectedClass.announcements.length === 0 ? (
                  <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-gray-600">
                    <Bell className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p>No announcements yet. Create one to get started!</p>
                  </div>
                ) : (
                  selectedClass.announcements.map(announcement => (
                    <div
                      key={announcement.id}
                      onClick={() => setSelectedAnnouncement(selectedAnnouncement?.id === announcement.id ? null : announcement)}
                      className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{announcement.title}</h3>
                          <p className="text-sm text-gray-600">by {announcement.author}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">{announcement.date}</p>
                          <p className="text-xs text-gray-500">{announcement.time}</p>
                        </div>
                      </div>

                      {selectedAnnouncement?.id === announcement.id && (
                        <div className="space-y-4 border-t border-gray-200 pt-4">
                          <p className="text-gray-700">{announcement.content}</p>

                          {announcement.scheduledFor && (
                            <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 p-3 rounded-lg">
                              <Calendar className="w-4 h-4" />
                              <span>Scheduled for: {announcement.scheduledFor}</span>
                            </div>
                          )}

                          {announcement.attachments.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Attachments:</p>
                              <div className="space-y-2">
                                {announcement.attachments.map((file, idx) => (
                                  <div key={idx} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
                                    <FileText className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm text-gray-700">{file}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Eye className="w-5 h-5 text-blue-600" />
                              <span className="font-medium text-gray-900">View Status</span>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-700">Viewed by:</span>
                                <span className="font-semibold text-blue-600">{announcement.viewed} / {announcement.totalStudents}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${(announcement.viewed / announcement.totalStudents) * 100}%` }}
                                />
                              </div>
                              <p className="text-xs text-gray-600">
                                {Math.round((announcement.viewed / announcement.totalStudents) * 100)}% of students have viewed this
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default TeacherAnnouncements;
