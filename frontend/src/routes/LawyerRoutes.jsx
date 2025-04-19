import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Dashboard from '../pages/lawyer/Dashboard'
import Profile from '../pages/lawyer/Profile'
import CaseRequests from '../pages/lawyer/CaseRequests'
import MyCases from '../pages/lawyer/MyCases'
import Chats from '../pages/lawyer/Chats'

const LawyerRoutes = ({mode, setMode}) => {
  return (
    <Routes>
      <Route path="" element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<Dashboard mode={mode} setMode={setMode} />} />
      <Route path="profile" element={<Profile />} />
      <Route path="case-requests" element={<CaseRequests />} />
      <Route path="cases" element={<MyCases />} />
      <Route path="chats" element={<Chats />} />
    </Routes>
  )
}

export default LawyerRoutes