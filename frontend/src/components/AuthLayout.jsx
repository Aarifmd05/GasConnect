
import './AuthLayout.css';
import TechnicianAnimation from './TechnicianAnimation';

function AuthLayout({ logo, children }) {
    return (
        <div className="auth-page">

            <header className="auth-header">
                <div className="auth-header-inner">
                    <img
                        src={logo}
                        alt="GasConnect Logo"
                        className="auth-logo"
                    />
                </div>
            </header>

            <main className="auth-container">

                <section className="auth-illustration">
                    <TechnicianAnimation />
                </section>

                <section className="auth-card">
                    {children}
                </section>

            </main>
        </div>
    );
}

export default AuthLayout;
