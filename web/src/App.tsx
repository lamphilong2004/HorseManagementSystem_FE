import type { ReactNode } from 'react'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
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
import { PredictionsPage } from './pages/PredictionsPage.tsx'
import { AdminUsersPage } from './pages/AdminUsersPage.tsx'
import { AdminSchedulingPage } from './pages/AdminSchedulingPage.tsx'
import { RefereeRacesPage } from './pages/RefereeRacesPage.tsx'
import { RefereeReportPage } from './pages/RefereeReportPage.tsx'
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
      { path: 'referee/report', element: <RefereeReportPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  // Legacy redirects for old /dashboard, /tournaments, etc. paths
  { path: '/dashboard', element: <RequireAuth><Navigate to="/app/dashboard" replace /></RequireAuth> },
  { path: '/tournaments', element: <RequireAuth><Navigate to="/app/tournaments" replace /></RequireAuth> },
  { path: '/races', element: <RequireAuth><Navigate to="/app/races" replace /></RequireAuth> },
  { path: '/horses', element: <RequireAuth><Navigate to="/app/horses" replace /></RequireAuth> },
  { path: '/invites', element: <RequireAuth><Navigate to="/app/invites" replace /></RequireAuth> },
  { path: '/predictions', element: <RequireAuth><Navigate to="/app/predictions" replace /></RequireAuth> },
  { path: '/admin/users', element: <RequireAuth><Navigate to="/app/admin/users" replace /></RequireAuth> },
  { path: '/admin/scheduling', element: <RequireAuth><Navigate to="/app/admin/scheduling" replace /></RequireAuth> },
  { path: '/referee/races', element: <RequireAuth><Navigate to="/app/referee/races" replace /></RequireAuth> },
  { path: '*', element: <NotFoundPage /> },
])

export function App() {
  return (
    <SessionProvider>
      <RouterProvider router={router} />
    </SessionProvider>
  )
}
