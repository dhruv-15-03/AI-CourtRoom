import React, { Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import LawyerLayout from '../components/LawyerLayout'
import { FullScreenLoader } from '../components/common/UIComponents'

const Dashboard = React.lazy(() => import('../pages/lawyer/Dashboard'))
const Profile = React.lazy(() => import('../pages/lawyer/Profile'))
const CaseRequests = React.lazy(() => import('../pages/lawyer/CaseRequests'))
const MyCases = React.lazy(() => import('../pages/lawyer/MyCases'))
const Chats = React.lazy(() => import('../pages/lawyer/Chats'))

const LawyerRoutes = ({mode, setMode}) => {
  return (
    <Routes>
      <Route element={<LawyerLayout mode={mode} setMode={setMode} /> }>
        <Route path="" element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={
          <Suspense fallback={<FullScreenLoader message="Loading dashboard..." />}>
            <Dashboard mode={mode} setMode={setMode} />
          </Suspense>
        } />
        <Route path="profile" element={
          <Suspense fallback={<FullScreenLoader message="Loading profile..." />}>
            <Profile />
          </Suspense>
        } />
        <Route path="case-requests" element={
          <Suspense fallback={<FullScreenLoader message="Loading requests..." />}>
            <CaseRequests />
          </Suspense>
        } />
        <Route path="cases" element={
          <Suspense fallback={<FullScreenLoader message="Loading cases..." />}>
            <MyCases />
          </Suspense>
        } />
        <Route path="chats" element={
          <Suspense fallback={<FullScreenLoader message="Loading chats..." />}>
            <Chats />
          </Suspense>
        } />
      </Route>
    </Routes>
  )
}

export default LawyerRoutes