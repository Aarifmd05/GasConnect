import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import './BackToHome.css';

function BackToHome() {
    return (
        <Link to="/" className="gc-back-home">
            <ArrowLeft size={18} />
            <Home size={18} />
            <span>Back to Home</span>
        </Link>
    );
}

export default BackToHome;