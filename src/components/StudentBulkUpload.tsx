import React, { useState } from 'react';
import { X, Upload, Download, FileText, AlertCircle, CheckCircle } from 'lucide-react';

interface StudentBulkUploadProps {
  onClose: () => void;
}

const StudentBulkUpload: React.FC<StudentBulkUploadProps> = ({ onClose }) => {
  const [uploadStep, setUploadStep] = useState<'template' | 'upload' | 'preview' | 'success'>('template');
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadStep('preview');
    }
  };

  const handleUpload = () => {
    setUploadStep('upload');
    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => setUploadStep('success'), 500);
      }
    }, 200);
  };

  const downloadTemplate = () => {
    // Create CSV template
    const csvContent = `Name,Roll Number,Email,Phone,Branch,CGPA,Skills
John Doe,21BCE001,john.doe@college.edu,+91 98765 43210,Computer Science,8.5,"React,Node.js,Python"
Jane Smith,21BCE002,jane.smith@college.edu,+91 98765 43211,Information Technology,9.2,"Java,Spring Boot,MySQL"`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <Upload className="h-6 w-6 text-green-600" />
          <h2 className="text-xl font-semibold text-gray-900">Bulk Upload Students</h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="p-6">
        {uploadStep === 'template' && (
          <div className="text-center space-y-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <FileText className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Download Template</h3>
              <p className="text-blue-700 mb-4">
                Start by downloading our CSV template with the required format for student data.
              </p>
              <button
                onClick={downloadTemplate}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg transition-colors flex items-center space-x-2 mx-auto"
              >
                <Download className="h-4 w-4" />
                <span>Download Template</span>
              </button>
            </div>

            <div className="text-left bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Required Fields:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Name (Full name of the student)</li>
                <li>• Roll Number (Unique identifier)</li>
                <li>• Email (College email address)</li>
                <li>• Phone (Contact number with country code)</li>
                <li>• Branch (Department/Branch of study)</li>
                <li>• CGPA (Current CGPA out of 10)</li>
                <li>• Skills (Comma-separated list of technical skills)</li>
              </ul>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="text-center">
                <label className="cursor-pointer">
                  <span className="text-blue-600 hover:text-blue-800 font-medium">Click to upload your CSV file</span>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <p className="text-gray-500 text-sm mt-2">or drag and drop</p>
                <p className="text-gray-400 text-xs mt-1">CSV, XLSX files up to 10MB</p>
              </div>
            </div>
          </div>
        )}

        {uploadStep === 'preview' && file && (
          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <h3 className="font-medium text-yellow-800">File Preview</h3>
              </div>
              <p className="text-yellow-700 text-sm mt-1">
                Please review the file details before uploading.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">File Name:</span>
                  <span className="ml-2 font-medium">{file.name}</span>
                </div>
                <div>
                  <span className="text-gray-600">File Size:</span>
                  <span className="ml-2 font-medium">{(file.size / 1024).toFixed(2)} KB</span>
                </div>
                <div>
                  <span className="text-gray-600">File Type:</span>
                  <span className="ml-2 font-medium">{file.type || 'CSV'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Estimated Records:</span>
                  <span className="ml-2 font-medium">~45 students</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Validation Results:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>All required fields present</span>
                </div>
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>No duplicate roll numbers found</span>
                </div>
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>Email format validation passed</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setUploadStep('template')}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-6 rounded-lg font-medium transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleUpload}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
              >
                Upload Students
              </button>
            </div>
          </div>
        )}

        {uploadStep === 'upload' && (
          <div className="text-center space-y-6">
            <div className="bg-blue-50 p-8 rounded-lg">
              <Upload className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Uploading Students...</h3>
              <p className="text-blue-700 mb-4">Please wait while we process your file.</p>
              
              <div className="w-full bg-blue-200 rounded-full h-3 mb-2">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-blue-600 text-sm">{uploadProgress}% complete</p>
            </div>
          </div>
        )}

        {uploadStep === 'success' && (
          <div className="text-center space-y-6">
            <div className="bg-green-50 p-8 rounded-lg">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-900 mb-2">Upload Successful!</h3>
              <p className="text-green-700 mb-4">45 students have been successfully added to the system.</p>
              
              <div className="bg-white border border-green-200 rounded-lg p-4 text-left">
                <h4 className="font-medium text-green-900 mb-2">Summary:</h4>
                <div className="text-sm text-green-700 space-y-1">
                  <div>• 45 students added</div>
                  <div>• 0 duplicates skipped</div>
                  <div>• 0 validation errors</div>
                  <div>• All students are now eligible for applications</div>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="bg-green-600 hover:bg-green-700 text-white py-3 px-8 rounded-lg font-medium transition-colors"
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