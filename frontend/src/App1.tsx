import { AuthProvider } from "./context/AuthContext";
import HomePage from "./pages/HomePage1";
import "./index.css";

export default function App1() {
  return (
    <AuthProvider>
      <HomePage />
    </AuthProvider>
  );
}
