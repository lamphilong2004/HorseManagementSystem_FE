import type { ReactNode } from 'react'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { SessionProvider, useSession } from './auth/SessionContext'
import { AppLayout } from './components/AppLayout'
import { LoginPage } from './pages/LoginPage.tsx'
import { RegisterPage } from './pages/RegisterPage.tsx'
import { DashboardPage } from './pages/DashboardPage.tsx'
import { TournamentsPage } from './pages/TournamentsPage.tsx'
import { TournamentDetailPage } from './pages/TournamentDetailPage.tsx'
import { RacesPage } from './pages/RacesPage.tsx'
import { RaceDetailPage } from './pages/RaceDetailPage.tsx'
import { HorsesPage } from './pages/HorsesPage.tsx'
import { InvitesPage } from './pages/InvitesPage.tsx'
import { PredictionsPage } from './pages/PredictionsPage.tsx'
import { NotificationsPage } from './pages/NotificationsPage.tsx'
import { AdminUsersPage } from './pages/AdminUsersPage.tsx'
import { AdminSchedulingPage } from './pages/AdminSchedulingPage.tsx'
import { RefereeRacesPage } from './pages/RefereeRacesPage.tsx'
import { RefereeRaceDetailPage } from './pages/RefereeRaceDetailPage.tsx'
import { RefereeReportPage } from './pages/RefereeReportPage.tsx'
import { NotFoundPage } from './pages/NotFoundPage.tsx'

function RequireAuth(props: { children: ReactNode }) {
  const { session } = useSession()
  if (!session) return <Navigate to="/login" replace />
  return <>{props.children}</>
}

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'tournaments', element: <TournamentsPage /> },
      { path: 'tournaments/:id', element: <TournamentDetailPage /> },
      { path: 'races', element: <RacesPage /> },
      { path: 'races/:id', element: <RaceDetailPage /> },
      { path: 'horses', element: <HorsesPage /> },
      { path: 'invites', element: <InvitesPage /> },
      { path: 'predictions', element: <PredictionsPage /> },
      { path: 'notifications', element: <NotificationsPage /> },
      { path: 'admin/users', element: <AdminUsersPage /> },
      { path: 'admin/scheduling', element: <AdminSchedulingPage /> },
      { path: 'referee/races', element: <RefereeRacesPage /> },
      { path: 'referee/races/:raceId', element: <RefereeRaceDetailPage /> },
      { path: 'referee/report/:raceId', element: <RefereeReportPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

export function App() {
  return (
    <SessionProvider>
      <RouterProvider router={router} />
    </SessionProvider>
  )
}
