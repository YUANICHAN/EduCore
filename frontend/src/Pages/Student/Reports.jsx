import '../../App.css';
import { useState, useEffect, useCallback } from 'react';
import Sidebar from '../../Components/Student/Sidebar.jsx';
import { FileText, Download, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import reportService from '../../service/reportService';

// Fallback data
const getFallbackReports = () => [
  { id: 1, title: 'Grade Report', desc: 'Official grade report for the current term.', status: 'Ready' },
  { id: 2, title: 'Enrollment Certificate', desc: 'Proof of enrollment for AY 2025-2026.', status: 'Ready' },
  { id: 3, title: 'Attendance Summary', desc: 'Attendance summary across enrolled subjects.', status: 'Ready' },
];

function Reports() {
  const [activeItem, setActiveItem] = useState('Reports');
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await reportService.getAll();
      const reportsData = response.data || response || [];
      
      const mapped = reportsData.map(report => ({
        id: report.id,
        title: report.title || report.name || 'Report',
        desc: report.description || report.desc || 'Generated report document.',
        status: report.status || 'Ready',
        url: report.download_url || report.url || null,
      }));
      
      setReports(mapped.length > 0 ? mapped : getFallbackReports());
    } catch (err) {
      console.error('Failed to fetch reports:', err);
      setError('Failed to load reports');
      setReports(getFallbackReports());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleDownload = async (report) => {
    if (report.url) {
      window.open(report.url, '_blank');
    } else {
      try {
        const response = await reportService.download(report.id);
        // Handle blob download
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${report.title}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      } catch (err) {
        console.error('Failed to download report:', err);
        alert('Download not available in demo mode.');
      }
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
      <div className="h-screen bg-gray-50 p-8 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
            <p className="text-gray-600 mt-1">Official academic documents. Read-only; generated on demand.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <span className="ml-2 text-gray-600">Loading reports...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64 text-red-500">
            <AlertCircle className="w-6 h-6 mr-2" />
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map((report) => (
              <div key={report.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <p className="text-sm font-semibold text-gray-900">{report.title}</p>
                </div>
                <p className="text-sm text-gray-700 flex-1">{report.desc}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-50 text-gray-700 border border-gray-200">{report.status}</span>
                  <button 
                    onClick={() => handleDownload(report)}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Reports;
