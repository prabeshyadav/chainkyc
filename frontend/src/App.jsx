import { AuthProvider } from './context/AuthContext'
import HomePage from './pages/HomePage'
import './index.css'

export default function App() {
  return (
    <AuthProvider>
      <HomePage />
    </AuthProvider>
  )
}
