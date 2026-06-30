import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import HomePage from './pages/home/HomePage'
import LoginPage from './pages/login/LoginPage'
import RegisterPage from './pages/register/RegisterPage'
import AdminPage from './pages/admin/AdminPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
