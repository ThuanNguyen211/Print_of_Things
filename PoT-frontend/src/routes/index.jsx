import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import UploadPage from "@/pages/UploadPage";
import ModelPage from "@/pages/ModelPage";

export default function AppRoutes() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 text-gray-800">
        {/* 🌐 Navbar */}
        <nav className="bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-50">
          <h1 className="text-xl font-semibold text-blue-600">PoT Dashboard</h1>
          <div className="space-x-4">
            <Link to="/" className="hover:text-blue-600">Upload</Link>
            <Link to="/model" className="hover:text-blue-600">Model</Link>
          </div>
        </nav>

        {/* 📄 Nội dung chính */}
        <div className="p-6">
          <Routes>
            <Route path="/" element={<UploadPage />} />
            <Route path="/model" element={<ModelPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}
