import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import RequireRole from "./components/RequireRole";
import { useAuthStore } from "./store/authStore";
import Landing from "./pages/Landing";
import SubmitKyc from "./pages/SubmitKyc";
import Confirmation from "./pages/Confirmation";
import CustomerDashboard from "./pages/CustomerDashboard";
import InstitutionConsole from "./pages/InstitutionConsole";
import AdminConsole from "./pages/AdminConsole";
import VerifierConsole from "./pages/VerifierConsole";
import ReviewSubmission from "./pages/ReviewSubmission";

const App = () => {
  const restoreSession = useAuthStore((s) => s.restoreSession);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route
        path="/kyc"
        element={
          <RequireRole roles={["USER"]}>
            <SubmitKyc />
          </RequireRole>
        }
      />
      <Route
        path="/kyc/submitted"
        element={
          <RequireRole roles={["USER"]}>
            <Confirmation />
          </RequireRole>
        }
      />
      <Route
        path="/dashboard"
        element={
          <RequireRole roles={["USER"]}>
            <CustomerDashboard />
          </RequireRole>
        }
      />
      <Route
        path="/verifier"
        element={
          <RequireRole roles={["VERIFIER"]}>
            <VerifierConsole />
          </RequireRole>
        }
      />
      <Route
        path="/verifier/submissions/:id"
        element={
          <RequireRole roles={["VERIFIER"]}>
            <ReviewSubmission />
          </RequireRole>
        }
      />
      <Route
        path="/institution"
        element={
          <RequireRole roles={["BANK"]}>
            <InstitutionConsole />
          </RequireRole>
        }
      />
      <Route
        path="/admin"
        element={
          <RequireRole roles={["ADMIN"]}>
            <AdminConsole />
          </RequireRole>
        }
      />
    </Routes>
  );
};

export default App;
