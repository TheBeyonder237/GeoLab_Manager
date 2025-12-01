import { Outlet } from 'react-router-dom'
import DashboardLayout from './layout/DashboardLayout'

function Layout() {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  )
}

export default Layout

