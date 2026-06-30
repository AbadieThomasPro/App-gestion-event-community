import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import RequireAuth from './components/RequireAuth'
import ListEventPage from './pages/events/list-event/ListEventPage'
import EventDetailPage from './pages/events/event-detail/EventDetailPage'
import EventFormPage from './pages/events/event-form/EventFormPage'
import MyRegistrationsPage from './pages/events/my-registrations/MyRegistrationsPage'
import LoginPage from './pages/login/LoginPage'
import RegisterPage from './pages/register/RegisterPage'
import AdminPage from './pages/admin/AdminPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/admin"
            element={
              <RequireAuth roles={['ADMIN']}>
                <AdminPage />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/users"
            element={
              <RequireAuth roles={['ADMIN']}>
                <AdminUsersPage />
              </RequireAuth>
            }
          />
          <Route
            path="/"
            element={
              <RequireAuth>
                <ListEventPage />
              </RequireAuth>
            }
          />
          <Route
            path="/my-events"
            element={
              <RequireAuth>
                <MyRegistrationsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/events/new"
            element={
              <RequireAuth>
                <EventFormPage />
              </RequireAuth>
            }
          />
          <Route
            path="/events/:id"
            element={
              <RequireAuth>
                <EventDetailPage />
              </RequireAuth>
            }
          />
          <Route
            path="/events/:id/edit"
            element={
              <RequireAuth>
                <EventFormPage />
              </RequireAuth>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
