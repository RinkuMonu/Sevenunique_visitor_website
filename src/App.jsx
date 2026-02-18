import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Users from './components/Users';
import UserManagement from './components/UserManagement';
import Visitors from './components/Visitors';
import CreateVisitor from './components/CreateVisitor';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/users" element={<PrivateRoute><UserManagement /></PrivateRoute>} />
          <Route path="/visitors" element={<PrivateRoute><Visitors /></PrivateRoute>} />
          <Route path="/create-visitor" element={<CreateVisitor />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;
