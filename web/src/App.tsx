import type { ReactNode } from 'react'
import { createBrowserRouter, Navigate, RouterProvider, useParams } from 'react-router-dom'
import { SessionProvider, useSession } from './auth/SessionContext'
import { AppLayout } from './components/AppLayout'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage.tsx'
import { RegisterPage } from './pages/RegisterPage.tsx'
import { DashboardPage } from './pages/DashboardPage.tsx'
import { TournamentsPage } from './pages/TournamentsPage.tsx'
import { TournamentDetailPage } from './pages/TournamentDetailPage.tsx'
import { RacesPage } from './pages/RacesPage.tsx'
import { RaceDetailPage } from './pages/RaceDetailPage.tsx'
import { HorsesPage } from './pages/HorsesPage.tsx'
import { InvitesPage } from './pages/InvitesPage.tsx'
import { PredictionsPage } from './pages/spectator/PredictionsPage.tsx'
import { AdminUsersPage } from './pages/admin/AdminUsersPage.tsx'
import { AdminSchedulingPage } from './pages/admin/AdminSchedulingPage.tsx'
import { RefereeRacesPage } from './pages/race_referee/RefereeRacesPage.tsx'
import { RefereeRaceDetailPage } from './pages/race_referee/RefereeRaceDetailPage.tsx'
import { RefereeReportPage } from './pages/race_referee/RefereeReportPage.tsx'
import { NotFoundPage } from './pages/NotFoundPage.tsx'

function RequireAuth(props: { children: ReactNode }) {
  const { session } = useSession()
  if (!session) return <Navigate to="/login" replace />
  return <>{props.children}</>
}

/** After login, redirect admin to /admin/scheduling, everyone else to /tournaments */
function DefaultRedirect() {
  const { session } = useSession()
  if (session?.user.role === 'ADMIN') return <Navigate to="/admin/scheduling" replace />
  return <Navigate to="/tournaments" replace />
}

// Redirect helpers for absolute paths used in subpages
function TournamentRedirect() {
  const { id } = useParams()
  return <Navigate to={`/app/tournaments/${id}`} replace />
}

function RaceRedirect() {
  const { id } = useParams()
  return <Navigate to={`/app/races/${id}`} replace />
}

function RefereeRaceRedirect() {
  const { id } = useParams()
  return <Navigate to={`/app/referee/races/${id}`} replace />
}

function RefereeReportRedirect() {
  const { raceId } = useParams()
  return <Navigate to={`/app/referee/races/${raceId}/report`} replace />
}

const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    path: '/app',
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <DefaultRedirect /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'tournaments', element: <TournamentsPage /> },
      { path: 'tournaments/:id', element: <TournamentDetailPage /> },
      { path: 'races', element: <RacesPage /> },
      { path: 'races/:id', element: <RaceDetailPage /> },
      { path: 'horses', element: <HorsesPage /> },
      { path: 'invites', element: <InvitesPage /> },
      { path: 'predictions', element: <PredictionsPage /> },
      { path: 'admin/users', element: <AdminUsersPage /> },
      { path: 'admin/scheduling', element: <AdminSchedulingPage /> },
      { path: 'referee/races', element: <RefereeRacesPage /> },
      { path: 'referee/races/:raceId', element: <RefereeRaceDetailPage /> },
      { path: 'referee/races/:raceId/report', element: <RefereeReportPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  // Legacy & Absolute Path Redirects
  { path: '/dashboard', element: <RequireAuth><Navigate to="/app/dashboard" replace /></RequireAuth> },
  { path: '/tournaments', element: <RequireAuth><Navigate to="/app/tournaments" replace /></RequireAuth> },
  { path: '/tournaments/:id', element: <RequireAuth><TournamentRedirect /></RequireAuth> },
  { path: '/races', element: <RequireAuth><Navigate to="/app/races" replace /></RequireAuth> },
  { path: '/races/:id', element: <RequireAuth><RaceRedirect /></RequireAuth> },
  { path: '/horses', element: <RequireAuth><Navigate to="/app/horses" replace /></RequireAuth> },
  { path: '/invites', element: <RequireAuth><Navigate to="/app/invites" replace /></RequireAuth> },
  { path: '/predictions', element: <RequireAuth><Navigate to="/app/predictions" replace /></RequireAuth> },
  { path: '/admin/users', element: <RequireAuth><Navigate to="/app/admin/users" replace /></RequireAuth> },
  { path: '/admin/scheduling', element: <RequireAuth><Navigate to="/app/admin/scheduling" replace /></RequireAuth> },
  { path: '/referee/races', element: <RequireAuth><Navigate to="/app/referee/races" replace /></RequireAuth> },
  { path: '/referee/races/:id', element: <RequireAuth><RefereeRaceRedirect /></RequireAuth> },
  { path: '/referee/report/:raceId', element: <RequireAuth><RefereeReportRedirect /></RequireAuth> },
  { path: '*', element: <NotFoundPage /> },
])

export function App() {
  return (
    <SessionProvider>
      <RouterProvider router={router} />
    </SessionProvider>
  )
}
