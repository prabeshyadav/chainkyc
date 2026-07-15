import { Route, Routes } from "react-router-dom";
import Landing from "./pages/Landing";
import ConnectWallet from "./pages/ConnectWallet";
import SubmitKyc from "./pages/SubmitKyc";
import Confirmation from "./pages/Confirmation";
import CustomerDashboard from "./pages/CustomerDashboard";
import InstitutionConsole from "./pages/InstitutionConsole";
import AdminConsole from "./pages/AdminConsole";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/connect" element={<ConnectWallet />} />
      <Route path="/kyc" element={<SubmitKyc />} />
      <Route path="/kyc/submitted" element={<Confirmation />} />
      <Route path="/dashboard" element={<CustomerDashboard />} />
      <Route path="/institution" element={<InstitutionConsole />} />
      <Route path="/admin" element={<AdminConsole />} />
    </Routes>
  );
};

export default App;
