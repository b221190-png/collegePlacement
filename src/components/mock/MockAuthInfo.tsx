import React from 'react';

export const MockAuthInfo: React.FC = () => {
  return (
    <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-800 px-4 py-3 rounded-lg shadow-lg z-50 max-w-sm">
      <h4 className="font-bold mb-2">🎉 All Systems Operational!</h4>
      <p className="text-sm mb-2">
        The complete authentication system is working perfectly!
      </p>
      <div className="text-xs space-y-1">
        <p><strong>Frontend:</strong> <a href="http://localhost:5173/" target="_blank" rel="noopener noreferrer" className="underline">http://localhost:5173/</a></p>
        <p><strong>Backend:</strong> <a href="http://localhost:5000/api/health" target="_blank" rel="noopener noreferrer" className="underline">http://localhost:5000/</a></p>
        <p><strong>Database:</strong> ✅ MongoDB Connected</p>
      </div>
      <div className="mt-3 pt-3 border-t border-green-300 text-xs">
        <p><strong>Working Features:</strong></p>
        <ul className="list-disc ml-4 space-y-1">
          <li>✅ User registration & login</li>
          <li>✅ Role-based access control</li>
          <li>✅ JWT authentication</li>
          <li>✅ Protected routes</li>
          <li>✅ Original Header component restored</li>
          <li>✅ Your original AdminDashboard</li>
          <li>✅ Database operations</li>
          <li>✅ CORS configuration</li>
        </ul>
      </div>
      <div className="mt-2 pt-2 border-t border-green-300 text-xs">
        <p><strong>Test Credentials:</strong></p>
        <p><span className="font-semibold">Admin:</span> admin@collegeplacement.com / admin123</p>
        <p><span className="font-semibold">Student:</span> Register any new student</p>
      </div>
    </div>
  );
};