import React, { useState } from 'react';
import {
  CheckCircle,
  Download,
  FileText,
  Upload,
  X,
} from 'lucide-react';

interface StudentUploadRow {
  name: string;
  rollNumber: string;
  email: string;
  phone: string;
  branch: string;
  cgpa: number;
  skills: string[];
  batch?: number;
}

interface StudentBulkUploadProps {
  onClose: () => void;
  onUpload: (students: StudentUploadRow[]) => Promise<{ addedCount: number; skippedCount: number }> | { addedCount: number; skippedCount: number };
}

const StudentBulkUpload: React.FC<StudentBulkUploadProps> = ({
  onClose,
  onUpload,
}) => {
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<StudentUploadRow[]>([]);
  const [status, setStatus] = useState<'template' | 'preview' | 'uploading' | 'success'>('template');
  const [result, setResult] = useState<{ addedCount: number; skippedCount: number } | null>(null);
  const [error, setError] = useState('');

  const downloadTemplate = () => {
    const csvContent = `Name,Roll Number,Email,Phone,Branch,CGPA,Skills,Batch
John Doe,21BCE001,john.doe@college.edu,+91 98765 43210,Computer Science,8.5,"React,Node.js,Python",2025
Jane Smith,21BCE002,jane.smith@college.edu,+91 98765 43211,Information Technology,9.2,"Java,Spring Boot,MySQL",2025`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'student_template.csv';
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  const parseLine = (line: string) => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];

      if (char === '"') {
        inQuotes = !inQuotes;
        continue;
      }

      if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
        continue;
      }

      current += char;
    }

    values.push(current.trim());
    return values;
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0];
    if (!nextFile) {
      return;
    }

    try {
      const content = await nextFile.text();
      const lines = content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
      const [, ...dataLines] = lines;
      const parsedRows = dataLines
        .map(parseLine)
        .filter((columns) => columns.length >= 7)
        .map((columns) => ({
          name: columns[0],
          rollNumber: columns[1],
          email: columns[2],
          phone: columns[3],
          branch: columns[4],
          cgpa: Number(columns[5]),
          skills: columns[6]
            .split(',')
            .map((skill) => skill.trim())
            .filter(Boolean),
          batch: columns[7] ? Number(columns[7]) : undefined,
        }));

      if (parsedRows.length === 0) {
        throw new Error('No student rows were found in the CSV file');
      }

      setRows(parsedRows);
      setFileName(nextFile.name);
      setStatus('preview');
      setError('');
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : 'Unable to parse the selected file'
      );
    }
  };

  const handleUpload = async () => {
    setStatus('uploading');
    const uploadResult = await onUpload(rows);
    setResult(uploadResult);
    setStatus('success');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm">
      <div className="flex items-center justify-between p-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-green-100 text-green-700 flex items-center justify-center">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Bulk upload students</h2>
            <p className="text-sm text-slate-500">
              Import CSV data directly into the locally persisted student list.
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-6">
        {status === 'template' && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center">
              <FileText className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900">Start from the template</h3>
              <p className="text-sm text-slate-600 mt-2">
                Use the sample CSV columns so student fields are mapped correctly.
              </p>
              <button
                onClick={downloadTemplate}
                className="inline-flex items-center gap-2 mt-4 rounded-2xl bg-blue-600 text-white px-5 py-3 font-medium"
              >
                <Download className="w-4 h-4" />
                Download template
              </button>
            </div>

            <label className="block rounded-3xl border-2 border-dashed border-slate-300 p-8 text-center cursor-pointer hover:border-slate-500 transition-colors">
              <Upload className="w-10 h-10 text-slate-400 mx-auto mb-4" />
              <div className="font-medium text-slate-900">Upload CSV file</div>
              <p className="text-sm text-slate-500 mt-2">Only `.csv` files are supported.</p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        )}

        {status === 'preview' && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="font-medium text-slate-900">{fileName}</div>
              <div className="text-sm text-slate-600 mt-1">{rows.length} students detected</div>
            </div>

            <div className="overflow-x-auto rounded-3xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    {['Name', 'Roll No.', 'Email', 'Branch', 'CGPA'].map((heading) => (
                      <th
                        key={heading}
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {rows.slice(0, 6).map((row) => (
                    <tr key={`${row.email}-${row.rollNumber}`}>
                      <td className="px-4 py-3 text-sm text-slate-900">{row.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{row.rollNumber}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{row.email}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{row.branch}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{row.cgpa}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setStatus('template')}
                className="px-5 py-3 rounded-2xl border border-slate-200 text-slate-700"
              >
                Back
              </button>
              <button
                onClick={handleUpload}
                className="px-5 py-3 rounded-2xl bg-green-600 text-white font-semibold"
              >
                Import students
              </button>
            </div>
          </div>
        )}

        {status === 'uploading' && (
          <div className="rounded-3xl border border-blue-200 bg-blue-50 p-8 text-center">
            <Upload className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-pulse" />
            <div className="text-lg font-semibold text-blue-900">Importing students...</div>
          </div>
        )}

        {status === 'success' && result && (
          <div className="rounded-3xl border border-green-200 bg-green-50 p-8 text-center">
            <CheckCircle className="w-14 h-14 text-green-600 mx-auto mb-4" />
            <div className="text-lg font-semibold text-green-900">Import complete</div>
            <p className="text-sm text-green-700 mt-2">
              Added {result.addedCount} students and skipped {result.skippedCount} duplicates.
            </p>
            <button
              onClick={onClose}
              className="mt-6 px-5 py-3 rounded-2xl bg-green-600 text-white font-semibold"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentBulkUpload;
