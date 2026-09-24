import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { NoAccess, Shell, Toasts } from './components/Layout';
import Attendance from './pages/Attendance';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Login from './pages/Login';
import MemberProfile from './pages/MemberProfile';
import Members from './pages/Members';
import Payments from './pages/Payments';
import Plans from './pages/Plans';
import Reports from './pages/Reports';
import Trainers from './pages/Trainers';
import Workouts from './pages/Workouts';
import { HOME, canSee, type Screen } from './store/auth';
import { StoreProvider, useStore } from './store/store';

function Guard({ screen, name, children }: { screen: Screen; name: string; children: ReactNode }) {
  const { user } = useStore();
  if (!user) return <Navigate to="/login" replace />;
  return <Shell>{canSee(user.role, screen) ? children : <NoAccess screen={name} />}</Shell>;
}

function Home() {
  const { user } = useStore();
  return <Navigate to={user ? HOME[user.role] : '/login'} replace />;
}

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Guard screen="dashboard" name="the dashboard"><Dashboard /></Guard>} />
          <Route path="/members" element={<Guard screen="members" name="members"><Members /></Guard>} />
          <Route path="/members/:id" element={<Guard screen="profile" name="member profiles"><MemberProfile /></Guard>} />
          <Route path="/memberships" element={<Guard screen="plans" name="memberships"><Plans /></Guard>} />
          <Route path="/payments" element={<Guard screen="payments" name="payments"><Payments /></Guard>} />
          <Route path="/attendance" element={<Guard screen="attendance" name="attendance"><Attendance /></Guard>} />
          <Route path="/trainers" element={<Guard screen="trainers" name="trainers"><Trainers /></Guard>} />
          <Route path="/workouts" element={<Guard screen="workouts" name="workouts"><Workouts /></Guard>} />
          <Route path="/leads" element={<Guard screen="leads" name="leads"><Leads /></Guard>} />
          <Route path="/reports" element={<Guard screen="reports" name="reports"><Reports /></Guard>} />
          <Route path="*" element={<Home />} />
        </Routes>
        <Toasts />
      </BrowserRouter>
    </StoreProvider>
  );
}
