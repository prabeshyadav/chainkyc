import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import RequireRole from "./components/RequireRole";
import AdminConsole from "./pages/AdminConsole";
import BankConsole from "./pages/BankConsole";
import BankCustomerDetail from "./pages/BankCustomerDetail";
import Confirmation from "./pages/Confirmation";
import CustomerDashboard from "./pages/CustomerDashboard";
import Landing from "./pages/Landing";
import ReviewSubmission from "./pages/ReviewSubmission";
import SubmitKyc from "./pages/SubmitKyc";
import VerifierConsole from "./pages/VerifierConsole";
import { useAuthStore } from "./store/authStore";

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
        path="/bank"
        element={
          <RequireRole roles={["BANK"]}>
            <BankConsole />
          </RequireRole>
        }
      />
      <Route
        path="/bank/customers/:address"
        element={
          <RequireRole roles={["BANK"]}>
            <BankCustomerDetail />
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
