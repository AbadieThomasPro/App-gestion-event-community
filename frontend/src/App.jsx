import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import RequireAuth from './components/RequireAuth'
import ListEventPage from './pages/events/ListEventPage'
import EventDetailPage from './pages/events/EventDetailPage'
import EventFormPage from './pages/events/EventFormPage'
import MyRegistrationsPage from './pages/events/MyRegistrationsPage'
import LoginPage from './pages/login/LoginPage'
import RegisterPage from './pages/register/RegisterPage'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
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