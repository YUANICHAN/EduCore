import '../../App.css';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../Components/Teacher/Sidebar.jsx';
import {
  BarChart3,
  Download,
  FileText,
  TrendingUp,
  AlertTriangle,
  Users,
  Calendar,
  PieChart,
  LineChart,
  ChevronRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import classService from '../../service/classService';
import reportService from '../../service/reportService';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler, Title, Tooltip, Legend);

// Fallback data for development/demo
const getFallbackClassesData = () => [
  {
    id: 'math101',
    title: 'Mathematics 101',
    code: 'MATH101',
    section: 'Section A',
    schedule: 'MWF · 9:00 - 10:30 AM · Room 201',
    academicYear: 'AY 2024-2025',
    semester: '1st Semester',
    gradeDistribution: { A: 8, B: 12, C: 10, D: 5, F: 2 },
    classAverage: 82.5,
    highestScore: 98,
    lowestScore: 58,
    passRate: 87,
    attendanceMetrics: {
      average: 94,
      trend: [92, 93, 94, 93, 95, 94, 94],
      lateCount: 8,
      absentCount: 7,
    },
    performanceTrend: [
      { week: 'W1', average: 76 },
      { week: 'W2', average: 79 },
      { week: 'W3', average: 81 },
      { week: 'W4', average: 82 },
      { week: 'W5', average: 84 },
      { week: 'W6', average: 83 },
      { week: 'W7', average: 82.5 },
    ],
    keyInsights: [
      'Class average improved by 8.5% over the past 7 weeks',
      'Attendance rate above 90% indicates strong engagement',
      '37% students performing at A-B level',
      'Early intervention recommended for 5 D-F performers',
    ],
  },
  {
    id: 'phys102',
    title: 'Physics Laboratory',
    code: 'PHYS102',
    section: 'Section B',
    schedule: 'TTH · 11:00 AM - 1:00 PM · Lab 3',
    academicYear: 'AY 2024-2025',
    semester: '1st Semester',
    gradeDistribution: { A: 7, B: 10, C: 8, D: 4, F: 1 },
    classAverage: 80.2,
    highestScore: 96,
    lowestScore: 62,
    passRate: 88,
    attendanceMetrics: {
      average: 92,
      trend: [90, 91, 92, 91, 92, 92, 92],
      lateCount: 6,
      absentCount: 5,
    },
    performanceTrend: [
      { week: 'W1', average: 75 },
      { week: 'W2', average: 77 },
      { week: 'W3', average: 79 },
      { week: 'W4', average: 80 },
      { week: 'W5', average: 81 },
      { week: 'W6', average: 80.5 },
      { week: 'W7', average: 80.2 },
    ],
    keyInsights: [
      'Lab performance steady with consistent attendance',
      'Practical exams show strong grasp of concepts',
      '42% of class scoring in A-B range',
      'Late submissions trending downward',
    ],
  },
  {
    id: 'chem101',
    title: 'Chemistry Lecture',
    code: 'CHEM101',
    section: 'Section A',
    schedule: 'MWF · 1:00 - 2:30 PM · Room 305',
    academicYear: 'AY 2024-2025',
    semester: '1st Semester',
    gradeDistribution: { A: 9, B: 14, C: 12, D: 4, F: 2 },
    classAverage: 83.1,
    highestScore: 99,
    lowestScore: 55,
    passRate: 89,
    attendanceMetrics: {
      average: 95,
      trend: [93, 94, 95, 95, 96, 95, 95],
      lateCount: 4,
      absentCount: 3,
    },
    performanceTrend: [
      { week: 'W1', average: 78 },
      { week: 'W2', average: 80 },
      { week: 'W3', average: 82 },
      { week: 'W4', average: 83 },
      { week: 'W5', average: 84 },
      { week: 'W6', average: 83.5 },
      { week: 'W7', average: 83.1 },
    ],
    keyInsights: [
      'Highest class average among managed sections',
      'Exceptional attendance with minimal absences',
      '50% of students achieving A-B grades',
      'Consistent upward trend in weekly performance',
    ],
  },
];

function TeacherReports() {
  const [activeItem, setActiveItem] = useState('Reports');
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [classesData, setClassesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await classService.getAll();
      const classes = response.data || response || [];
      
      // Map API response to report format with mock metrics
      // In production, this would come from a proper reports endpoint
      const mappedData = classes.map((cls, idx) => ({
        id: cls.id?.toString() || `class-${idx}`,
        title: cls.subject?.name || cls.subject_name || `Class ${idx + 1}`,
        code: cls.subject?.code || cls.subject_code || `CODE${idx + 1}`,
        section: cls.section?.name || cls.section_name || `Section ${String.fromCharCode(65 + idx)}`,
        schedule: cls.schedule || cls.time_slot || 'MWF · 9:00 - 10:30 AM · TBA',
        academicYear: cls.academic_year?.name || 'AY 2024-2025',
        semester: cls.semester || '1st Semester',
        // These would come from a proper reports API
        gradeDistribution: cls.grade_distribution || { A: 8, B: 12, C: 10, D: 5, F: 2 },
        classAverage: cls.class_average || 82.5,
        highestScore: cls.highest_score || 98,
        lowestScore: cls.lowest_score || 58,
        passRate: cls.pass_rate || 87,
        attendanceMetrics: cls.attendance_metrics || {
          average: 94,
          trend: [92, 93, 94, 93, 95, 94, 94],
          lateCount: 8,
          absentCount: 7,
        },
        performanceTrend: cls.performance_trend || [
          { week: 'W1', average: 76 },
          { week: 'W2', average: 79 },
          { week: 'W3', average: 81 },
          { week: 'W4', average: 82 },
          { week: 'W5', average: 84 },
          { week: 'W6', average: 83 },
          { week: 'W7', average: 82.5 },
        ],
        keyInsights: cls.key_insights || [
          'Class average maintained at healthy level',
          'Attendance rate indicates good engagement',
          'Consider intervention for lower performers',
          'Performance trending upward',
        ],
      }));
      
      setClassesData(mappedData.length > 0 ? mappedData : getFallbackClassesData());
    } catch (err) {
      console.error('Failed to fetch classes:', err);
      setError('Failed to load report data');
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

  const exportPDF = () => {
    if (!selectedClass) return;

    const printContent = document.getElementById('report-print-area');
    const win = window.open('', 'PRINT', 'height=900,width=1200');
    if (!win || !printContent) return;

    win.document.write(`<!doctype html><html><head><title>${selectedClass.code} Report</title>`);
    win.document.write(`<style>
      body{font-family:system-ui,Segoe UI,Arial;margin:20px}
      table{width:100%;border-collapse:collapse;margin:20px 0}
      th,td{border:1px solid #ddd;padding:12px;text-align:left}
      th{background:#f3f4f6;font-weight:600}
      h1,h2{margin:20px 0 10px}
      .meta{color:#666;font-size:14px;margin-bottom:30px}
      .metric{display:inline-block;margin-right:40px}
      .metric-value{font-size:24px;font-weight:bold;color:#1f2937}
      .metric-label{font-size:12px;color:#666;text-transform:uppercase}
    </style>`);
    win.document.write(`</head><body>`);
    win.document.write(`<h1>${selectedClass.title}</h1>`);
    win.document.write(`<div class="meta">${selectedClass.code} • ${selectedClass.section} • AY ${selectedClass.academicYear}</div>`);
    win.document.write(printContent.innerHTML);
    win.document.write(`</body></html>`);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  const gradeStats = useMemo(() => {
    if (!selectedClass) return [];
    const dist = selectedClass.gradeDistribution;
    return [
      { grade: 'A', count: dist.A, color: 'bg-emerald-500' },
      { grade: 'B', count: dist.B, color: 'bg-blue-500' },
      { grade: 'C', count: dist.C, color: 'bg-amber-500' },
      { grade: 'D', count: dist.D, color: 'bg-orange-500' },
      { grade: 'F', count: dist.F, color: 'bg-rose-500' },
    ];
  }, [selectedClass]);

  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
        <main className="flex-1 h-full flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
      <main className="flex-1 h-full overflow-y-auto p-8">
        <div className="flex flex-col gap-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

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
                onClick={() => { setSelectedClassId(null); }}
                className="hover:text-blue-600 transition-colors"
              >
                Reports
              </button>
              <ChevronRight className="w-4 h-4" />
              <span className="text-gray-800 font-medium">{selectedClass.code} • {selectedClass.section}</span>
            </nav>
          )}

          <header className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
                <p className="text-sm text-gray-600">
                  {selectedClass
                    ? 'Comprehensive analytics on class grades, attendance, and performance trends.'
                    : 'Pick a class to view detailed reports, performance analytics, and export options.'}
                </p>
              </div>
              {selectedClass && (
                <button
                  onClick={exportPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export PDF
                </button>
              )}
            </div>
          </header>

          {!selectedClass && (
            <>
              <section className="bg-white border border-blue-100 rounded-xl p-6 shadow-sm flex items-start gap-4 text-sm text-gray-700">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-semibold text-gray-900">Select a class to view its report</p>
                  <p>Choose a section to access grade distributions, attendance metrics, performance trends, and exportable insights.</p>
                </div>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {classesData.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedClassId(item.id)}
                    className="bg-white text-left rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-50 text-blue-700">{item.academicYear}</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{item.code}</h3>
                    <p className="text-sm text-gray-600 mb-3">{item.title}</p>
                    <div className="space-y-1 text-xs text-gray-600 mb-4">
                      <p>{item.section}</p>
                      <p>{item.schedule}</p>
                      <p>{item.semester}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Class Avg</p>
                        <p className="text-lg font-semibold text-gray-900">{item.classAverage}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Pass Rate</p>
                        <p className="text-lg font-semibold text-emerald-600">{item.passRate}%</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {selectedClass && (
            <>
              <div className="grid gap-3 md:grid-cols-[minmax(0,320px)_1fr]">
                <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
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
                  <div className="text-xs text-gray-600 space-y-1">
                    <p>{selectedClass.schedule}</p>
                    <p>{selectedClass.semester} • {selectedClass.academicYear}</p>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 mt-1" />
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-gray-800">Report scope</p>
                      <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                        <li>Data limited to this class only.</li>
                        <li>Metrics reflect current AY and semester.</li>
                        <li>PDFs are printer-friendly and shareable.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* KPI Summary */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Class Average</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{selectedClass.classAverage}%</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                    </div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Pass Rate</p>
                  </div>
                  <p className="text-2xl font-bold text-emerald-600">{selectedClass.passRate}%</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-amber-600" />
                    </div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Attendance Avg</p>
                  </div>
                  <p className="text-2xl font-bold text-amber-600">{selectedClass.attendanceMetrics.average}%</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-purple-600" />
                    </div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Score Range</p>
                  </div>
                  <p className="text-sm text-gray-900">
                    <span className="font-bold text-green-600">{selectedClass.highestScore}</span>
                    {' - '}
                    <span className="font-bold text-red-600">{selectedClass.lowestScore}</span>
                  </p>
                </div>
              </div>

              {/* Main Report Content */}
              <div id="report-print-area" className="space-y-6">
                {/* Grade Distribution */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <PieChart className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Grade Distribution</h2>
                  </div>
                  <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,300px)]">
                    <div style={{ height: '300px' }}>
                      <Bar
                        data={{
                          labels: gradeStats.map(s => `Grade ${s.grade}`),
                          datasets: [
                            {
                              label: 'Student Count',
                              data: gradeStats.map(s => s.count),
                              backgroundColor: [
                                '#10b981', // A - emerald
                                '#3b82f6', // B - blue
                                '#f59e0b', // C - amber
                                '#f97316', // D - orange
                                '#ef4444', // F - rose
                              ],
                              borderRadius: 6,
                              borderSkipped: false,
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          indexAxis: 'y',
                          plugins: {
                            legend: {
                              display: true,
                              position: 'top',
                            },
                          },
                          scales: {
                            x: {
                              beginAtZero: true,
                              ticks: {
                                stepSize: 1,
                              },
                            },
                          },
                        }}
                      />
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="border-b border-gray-200 pb-3">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Highest Score</p>
                        <p className="text-2xl font-bold text-emerald-600">{selectedClass.highestScore}%</p>
                      </div>
                      <div className="border-b border-gray-200 pb-3">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Lowest Score</p>
                        <p className="text-2xl font-bold text-rose-600">{selectedClass.lowestScore}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Class Average</p>
                        <p className="text-2xl font-bold text-blue-600">{selectedClass.classAverage}%</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Trend */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <LineChart className="w-5 h-5 text-green-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Performance Trend (7 Weeks)</h2>
                  </div>
                  <div style={{ height: '300px' }}>
                    <Line
                      data={{
                        labels: selectedClass.performanceTrend.map(w => w.week),
                        datasets: [
                          {
                            label: 'Class Average %',
                            data: selectedClass.performanceTrend.map(w => w.average),
                            borderColor: '#3b82f6',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4,
                            pointRadius: 5,
                            pointBackgroundColor: '#3b82f6',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: true,
                            position: 'top',
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                              callback: (value) => value + '%',
                            },
                          },
                        },
                      }}
                    />
                  </div>
                </div>

                {/* Attendance Analytics */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Users className="w-5 h-5 text-purple-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Attendance Analytics</h2>
                  </div>
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="space-y-4">
                      <div className="border-b border-gray-200 pb-4">
                        <p className="text-sm text-gray-600 mb-3">Weekly Attendance Trend</p>
                        <div style={{ height: '250px' }}>
                          <Bar
                            data={{
                              labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7'],
                              datasets: [
                                {
                                  label: 'Attendance %',
                                  data: selectedClass.attendanceMetrics.trend,
                                  backgroundColor: '#6366f1',
                                  borderRadius: 6,
                                  borderSkipped: false,
                                },
                              ],
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: {
                                  display: true,
                                  position: 'top',
                                },
                              },
                              scales: {
                                y: {
                                  beginAtZero: true,
                                  max: 100,
                                  ticks: {
                                    callback: (value) => value + '%',
                                  },
                                },
                              },
                            }}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                          <p className="text-xs text-amber-600 uppercase tracking-wide">Late Count</p>
                          <p className="text-2xl font-bold text-amber-700">{selectedClass.attendanceMetrics.lateCount}</p>
                        </div>
                        <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
                          <p className="text-xs text-rose-600 uppercase tracking-wide">Absent Count</p>
                          <p className="text-2xl font-bold text-rose-700">{selectedClass.attendanceMetrics.absentCount}</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-3">Key Insights</p>
                      <ul className="space-y-2 text-sm text-gray-700">
                        {selectedClass.keyInsights.map((insight, idx) => (
                          <li key={idx} className="flex gap-2 p-2 bg-blue-50 rounded-lg border border-blue-100">
                            <span className="text-blue-600 font-bold">•</span>
                            <span>{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Report Footer */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-600">
                  <p>Report generated for {selectedClass.code} • {selectedClass.section} • {new Date().toLocaleDateString()}</p>
                  <p>Academic Year: {selectedClass.academicYear} • Semester: {selectedClass.semester}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default TeacherReports;
