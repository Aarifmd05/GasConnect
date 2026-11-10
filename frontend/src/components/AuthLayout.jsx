
import './AuthLayout.css';

function AuthLayout({ logo, illustration, children }) {
    return (
        <div className="auth-page">

            {/* Yellow header with GasConnect logo */}
            <header className="auth-header">
                <div className="auth-header-inner">
                    <img
                        src={logo}
                        alt="GasConnect Logo"
                        className="auth-logo"
                    />
                </div>
            </header>

            {/* Main authentication section */}
            <main className="auth-container">

                {/* Left-side illustration */}
                <section className="auth-illustration">
                    <img
                        src={illustration}
                        alt="GasConnect Service Illustration"
                        className="auth-mascot"
                    />
                </section>

                {/* Right-side form */}
                <section className="auth-card">
                    {children}
                </section>

            </main>
        </div>
    );
}

export default AuthLayout;
