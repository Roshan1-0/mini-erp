import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import CustomerDetails from './pages/CustomerDetails';
import Inventory from './pages/Inventory';
import Challans from './pages/Challans';
import CreateChallan from './pages/CreateChallan';
import ChallanDetails from './pages/ChallanDetails';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />

          <Route path="/customers" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'SALES', 'ACCOUNTS']}>
              <Customers />
            </ProtectedRoute>
          } />

          <Route path="/customers/:id" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'SALES', 'ACCOUNTS']}>
              <CustomerDetails />
            </ProtectedRoute>
          } />

          <Route path="/inventory" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'SALES', 'WAREHOUSE']}>
              <Inventory />
            </ProtectedRoute>
          } />

          <Route path="/challans" element={
            <ProtectedRoute><Challans /></ProtectedRoute>
          } />

          <Route path="/challans/create" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'SALES']}>
              <CreateChallan />
            </ProtectedRoute>
          } />

          <Route path="/challans/:id" element={
            <ProtectedRoute><ChallanDetails /></ProtectedRoute>
          } />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
