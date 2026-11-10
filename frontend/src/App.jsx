
import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from 'react-router-dom';

import CustomerSignup from './pages/auth/CustomerSignup.jsx';
import CustomerLogin from './pages/auth/CustomerLogin.jsx';
import TechnicianSignup from './pages/auth/TechnicianSignup.jsx';
import TechnicianLogin from './pages/auth/TechnicianLogin.jsx';
import AdminLogin from './pages/auth/AdminLogin.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminForgotPassword from './pages/auth/AdminForgotPassword.jsx';
import TechnicianForgotPassword from './pages/auth/TechnicianForgotPassword.jsx';
import CustomerForgotPassword from './pages/auth/CustomerForgotPassword.jsx';
import CustomerDashboard from './pages/customer/CustomerDashboard.jsx';
import TechnicianDashboard from './pages/technician/TechnicianDashboard';


import { ThemeProvider } from './context/ThemeContext.jsx';

function App() {
    return (
        <ThemeProvider>
            <BrowserRouter>
                <Routes>
                    <Route
                        path="/customer/signup"
                        element={<CustomerSignup />}
                    />

                    <Route
                        path="/customer/login"
                        element={<CustomerLogin />}
                    />

                    <Route
                        path="/technician/signup"
                        element={<TechnicianSignup />}
                    />

                    <Route
                        path="/technician/login"
                        element={<TechnicianLogin />}
                    />

                    <Route
                        path="/admin/login"
                        element={<AdminLogin />}
                    />

                    <Route
                        path="/admin/dashboard"
                        element={<AdminDashboard />}
                    />

                    <Route
                        path="/admin/forgot-password"
                        element={<AdminForgotPassword />}
                    />

                    <Route
    path="/technician/forgot-password"
    element={<TechnicianForgotPassword />}
/>

<Route
    path="/customer/forgot-password"
    element={<CustomerForgotPassword />}
/>

                    <Route
    path="/customer/dashboard"
    element={<CustomerDashboard />}
/>
<Route
  path="/technician/dashboard"
  element={<TechnicianDashboard />}
/>

                    <Route
                        path="/"
                        element={
                            <Navigate
                                to="/customer/signup"
                                replace
                            />
                        }
                    />
                </Routes>
            </BrowserRouter>
        </ThemeProvider>
    );
}

export default App;
