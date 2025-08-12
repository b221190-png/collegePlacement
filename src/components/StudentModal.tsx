import React from 'react';
import { X, User, Mail, GraduationCap, Award } from 'lucide-react';
import { Student, Round } from '../types';

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  round: Round;
  companyName: string;
}

export const StudentModal: React.FC<StudentModalProps> = ({
  isOpen,
  onClose,
  round,
  companyName
}) => {
  if (!isOpen) return null;

  const totalApplied = round.totalApplied || round.selectedStudents.length * 2;
  const selectionRate = Math.round((round.selectedStudents.length / totalApplied) * 100);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{round.name}</h2>
              <p className="text-gray-600 mt-1">{companyName} • {round.date}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{round.selectedStudents.length}</div>
              <div className="text-sm text-blue-700">Students Selected</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">{totalApplied}</div>
              <div className="text-sm text-gray-700">Total Applied</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{selectionRate}%</div>
              <div className="text-sm text-green-700">Selection Rate</div>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Selected Students</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {round.selectedStudents.map((student, index) => (
              <div key={student.id} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {student.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900 truncate">{student.name}</h4>
                      <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                    </div>
                    <div className="mt-1 space-y-1">
                      <div className="flex items-center text-sm text-gray-600">
                        <GraduationCap className="w-4 h-4 mr-1" />
                        {student.rollNumber} • {student.branch}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="w-4 h-4 mr-1" />
                        {student.email}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Award className="w-4 h-4 mr-1" />
                        CGPA: {student.cgpa}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};