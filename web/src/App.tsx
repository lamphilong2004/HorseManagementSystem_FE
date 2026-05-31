import type { ReactNode } from 'react'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { SessionProvider, useSession } from './auth/SessionContext'
import { AppLayout } from './components/AppLayout'
import { LoginPage } from './pages/LoginPage.tsx'
import { RegisterPage } from './pages/RegisterPage.tsx'
import { DashboardPage } from './pages/spectator/DashboardPage.tsx'
import { ProfilePage } from './pages/ProfilePage.tsx'
import { TournamentsPage } from './pages/spectator/TournamentsPage.tsx'
import { TournamentDetailPage } from './pages/spectator/TournamentDetailPage.tsx'
import { RacesPage } from './pages/spectator/RacesPage.tsx'
import { RaceDetailPage } from './pages/spectator/RaceDetailPage.tsx'
import { HorsesPage } from './pages/HorsesPage.tsx'
import { InvitesPage } from './pages/InvitesPage.tsx'
import { PredictionsPage } from './pages/spectator/PredictionsPage.tsx'
import { NotificationsPage } from './pages/spectator/NotificationsPage.tsx'
import { AdminUsersPage } from './pages/AdminUsersPage.tsx'
import { AdminSchedulingPage } from './pages/AdminSchedulingPage.tsx'
import { RefereeRacesPage } from './pages/race_referee/RefereeRacesPage.tsx'
import { RefereeRaceDetailPage } from './pages/race_referee/RefereeRaceDetailPage.tsx'
import { RefereeReportPage } from './pages/race_referee/RefereeReportPage.tsx'
import { NotFoundPage } from './pages/NotFoundPage.tsx'
import { AnimatedToastProvider } from './components/ui/animated-toast'

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
      { path: 'profile', element: <ProfilePage /> },
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
      <AnimatedToastProvider>
        <RouterProvider router={router} />
      </AnimatedToastProvider>
    </SessionProvider>
  )
}
