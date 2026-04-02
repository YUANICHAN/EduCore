/**
 * Data Export Utilities
 * Provides functions to export data to CSV, Excel, and PDF formats
 */

/**
 * Export data to CSV
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Output filename
 * @param {Array} columns - Column keys to include
 */
export const exportToCSV = (data = [], filename = 'export.csv', columns = null) => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  // Determine columns
  const cols = columns || Object.keys(data[0]);

  // Create CSV header
  const headers = cols.map((col) => `"${col}"`).join(',');

  // Create CSV rows
  const rows = data.map((item) =>
    cols.map((col) => {
      let value = item[col];
      // Handle nested objects
      if (value && typeof value === 'object') {
        value = JSON.stringify(value);
      }
      // Escape quotes and wrap in quotes if contains comma or quote
      value = String(value || '').replace(/"/g, '""');
      return `"${value}"`;
    }).join(',')
  );

  // Combine header and rows
  const csv = [headers, ...rows].join('\n');

  // Download
  downloadFile(csv, filename, 'text/csv');
};

/**
 * Export data to Excel-like format (CSV with BOM for better Excel support)
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Output filename
 * @param {Array} columns - Column keys to include
 */
export const exportToExcel = (data = [], filename = 'export.xlsx', columns = null) => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  // Determine columns
  const cols = columns || Object.keys(data[0]);

  // Create CSV header
  const headers = cols.join('\t');

  // Create CSV rows (tab-separated for Excel)
  const rows = data.map((item) =>
    cols.map((col) => {
      let value = item[col];
      // Handle nested objects
      if (value && typeof value === 'object') {
        value = JSON.stringify(value);
      }
      value = String(value || '').replace(/"/g, '""');
      return value;
    }).join('\t')
  );

  // Combine header and rows
  const tsv = [headers, ...rows].join('\n');

  // Add BOM for better Excel compatibility
  const bom = '\uFEFF';
  const content = bom + tsv;

  // Download with .xlsx extension (Excel will open TSV files)
  downloadFile(content, filename, 'application/vnd.ms-excel');
};

/**
 * Export to PDF (requires html2pdf or similar library)
 * Simple implementation using basic HTML
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Output filename
 * @param {string} title - PDF title
 * @param {Array} columns - Column keys to include
 */
export const exportToPDF = (data = [], filename = 'export.pdf', title = 'Export', columns = null) => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  // Determine columns
  const cols = columns || Object.keys(data[0]);

  // Create HTML table
  let html = `
    <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #4CAF50; color: white; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          tr:hover { background-color: #f5f5f5; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <table>
          <thead>
            <tr>
              ${cols.map((col) => `<th>${col}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map((item) => `
              <tr>
                ${cols.map((col) => {
                  let value = item[col];
                  if (value && typeof value === 'object') {
                    value = JSON.stringify(value);
                  }
                  return `<td>${escapeHtml(String(value || ''))}</td>`;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">
          <p>Generated on: ${new Date().toLocaleString()}</p>
        </div>
      </body>
    </html>
  `;

  // For true PDF export, you would use a library like jsPDF or html2pdf
  // This is a simplified version that exports as HTML (can be printed to PDF)
  const newWindow = window.open('', '_blank');
  newWindow.document.write(html);
  newWindow.document.close();
  newWindow.print();
};

/**
 * Export to JSON format
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Output filename
 */
export const exportToJSON = (data = [], filename = 'export.json') => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  const json = JSON.stringify(data, null, 2);
  downloadFile(json, filename, 'application/json');
};

/**
 * Generic file download function
 * @param {string} content - File content
 * @param {string} filename - Output filename
 * @param {string} mimeType - MIME type
 */
const downloadFile = (content, filename, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Create formatted data for export
 * @param {Array} items - Raw data items
 * @param {Object} mapping - Field mapping { displayName: dataField }
 * @returns {Array} - Formatted items ready for export
 */
export const formatDataForExport = (items = [], mapping = {}) => {
  if (!items || items.length === 0) return [];

  return items.map((item) => {
    const formatted = {};
    Object.entries(mapping).forEach(([displayName, dataField]) => {
      const value = dataField.split('.').reduce((obj, field) => obj?.[field], item);
      formatted[displayName] = value;
    });
    return formatted;
  });
};

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
const escapeHtml = (text) => {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
};

/**
 * Common export configurations for different entities
 */
export const exportConfigs = {
  student: {
    filename: `students_${new Date().toISOString().split('T')[0]}.csv`,
    columns: ['student_number', 'first_name', 'last_name', 'email', 'program', 'section', 'status'],
    mapping: {
      'Student #': 'student_number',
      'First Name': 'first_name',
      'Last Name': 'last_name',
      'Email': 'email',
      'Program': 'program',
      'Section': 'section',
      'Status': 'status',
    },
  },
  teacher: {
    filename: `teachers_${new Date().toISOString().split('T')[0]}.csv`,
    columns: ['employee_number', 'first_name', 'last_name', 'email', 'department', 'status'],
    mapping: {
      'Employee #': 'employee_number',
      'First Name': 'first_name',
      'Last Name': 'last_name',
      'Email': 'email',
      'Department': 'department',
      'Status': 'status',
    },
  },
  program: {
    filename: `programs_${new Date().toISOString().split('T')[0]}.csv`,
    columns: ['code', 'name', 'department', 'duration_years', 'status'],
    mapping: {
      'Code': 'code',
      'Program Name': 'name',
      'Department': 'department',
      'Duration (Years)': 'duration_years',
      'Status': 'status',
    },
  },
  subject: {
    filename: `subjects_${new Date().toISOString().split('T')[0]}.csv`,
    columns: ['code', 'name', 'units', 'type', 'semester', 'status'],
    mapping: {
      'Code': 'code',
      'Subject': 'name',
      'Units': 'units',
      'Type': 'type',
      'Semester': 'semester',
      'Status': 'status',
    },
  },
  section: {
    filename: `sections_${new Date().toISOString().split('T')[0]}.csv`,
    columns: ['name', 'course', 'year_level', 'capacity', 'students', 'status'],
    mapping: {
      'Section': 'name',
      'Course': 'course',
      'Year': 'year_level',
      'Capacity': 'capacity',
      'Enrolled': 'students',
      'Status': 'status',
    },
  },
};
