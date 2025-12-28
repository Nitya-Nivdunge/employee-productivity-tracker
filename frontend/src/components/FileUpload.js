import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadAttendance, deleteMonthData } from '../services/api';
import { toast } from 'react-hot-toast';

const FileUpload = ({ selectedYear, selectedMonth, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [override, setOverride] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    onDrop: (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        if (rejectedFiles[0].errors[0].code === 'file-too-large') {
          toast.error('File size exceeds 10MB limit');
        } else {
          toast.error('Please upload only Excel files (.xlsx, .xls)');
        }
        return;
      }
      
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0]);
      }
    },
  });

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    if (!selectedYear || !selectedMonth) {
      toast.error('Please select a month and year first');
      return;
    }

    setUploading(true);
    try {
      // Show confirmation for override
      if (override) {
        const confirmed = window.confirm(
          `This will delete all existing attendance data for ${selectedMonth}/${selectedYear} and replace it with new data. Are you sure?`
        );
        if (!confirmed) {
          setUploading(false);
          return;
        }
      }

      const result = await uploadAttendance(file, selectedMonth, selectedYear, override);
      toast.success('File uploaded successfully!', {duration: 4000});      
      setFile(null);
      if (onUploadSuccess) {
        onUploadSuccess(result);
      }
    } catch (error) {
      if (error.status === 409) {
        toast.error(
          <div>
            <p>Data already exists for {selectedMonth}/{selectedYear}.</p>
            <p>Check "Override" to delete existing data and upload new.</p>
          </div>,
          { duration: 5000 }
        );
      } else {
        toast.error(error.message || 'Upload failed');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-700">Upload Attendance File</h3>
        <div className="relative">
          <button
            type="button"
            className="text-gray-400 hover:text-gray-600"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          
          {showTooltip && (
            <div className="absolute z-10 w-64 p-3 bg-gray-900 text-white text-xs rounded-md shadow-lg right-0">
              <h4 className="font-semibold mb-2">File Requirements</h4>
              <ul className="space-y-1">
                <li>• Supported format: .xlsx, .xls</li>
                <li>• Required columns: Employee Name, Date, In-Time, Out-Time</li>
                <li>• Maximum file size: 10MB</li>
              </ul>
            </div>
          )}
        </div>
      </div>
      
      <div className="space-y-3">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-md p-4 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
          }`}
        >
          <input {...getInputProps()} />
          <div className="space-y-2">
            <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            {file ? (
              <div>
                <p className="text-sm text-gray-600">Selected file:</p>
                <p className="font-medium text-gray-900 truncate">{file.name}</p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600">
                  {isDragActive ? 'Drop the file here' : 'Drag & drop or click to select'}
                </p>
              </div>
            )}
          </div>
        </div>

        {file && (
          <div className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
            <div className="flex items-center space-x-2">
              <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="truncate max-w-xs">
                <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            <button
              onClick={handleRemoveFile}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Remove
            </button>
          </div>
        )}

        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-2">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="override"
              checked={override}
              onChange={(e) => setOverride(e.target.checked)}
              className="h-4 w-4 text-red-600 rounded"
            />
            <label htmlFor="override" className="text-sm text-yellow-800">
              <span className="font-medium">Override existing data</span> - This will delete all existing data for {selectedMonth}/{selectedYear} before uploading new data.
            </label>
          </div>
        </div>

        <button
          onClick={handleUpload}
          disabled={!file || uploading || !selectedYear || !selectedMonth}
          className={`w-full py-2 px-4 rounded-md font-medium text-sm transition-colors ${
            !file || uploading || !selectedYear || !selectedMonth
              ? 'bg-gray-300 cursor-not-allowed'
              : override
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {uploading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Uploading...
            </span>
          ) : override ? (
            'Override & Upload'
          ) : (
            'Upload & Analyze'
          )}
        </button>
      </div>
    </div>
  );
};

export default FileUpload;