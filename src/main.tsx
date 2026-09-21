import * as React from 'react'
import { createRoot } from 'react-dom/client'
import IndexRoute from './routes/index'
import AdminRoute from './routes/admin'
import LoginRoute from './routes/login'

function App() {
  if (window.location.pathname === '/admin') return <AdminRoute />
  if (window.location.pathname === '/login') return <LoginRoute />
  return <IndexRoute />
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>)
