
import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import {
    Flame,
    House,
    Building2,
    Wrench,
    ShieldCheck,
    ArrowRight,
    UserRound,
    HardHat,
    ChevronLeft,
    ChevronRight,
    Mail,
    ShoppingBag
} from "lucide-react";

import gasconnectLogo from "../assets/logo.png";
import "./home.css";

function Home() {
    const navigate = useNavigate();

    // GasConnect service carousel images.
    const carouselImages = [
        {
            image: "https://shantigasservice.com/assets/images/a6.png",
            title: "Gas Stove Repair",
            description: "Professional gas stove repair services."
        },
        {
            image: "https://5.imimg.com/data5/SELLER/Default/2023/3/AW/RP/IO/7187701/lpg-gas-lot-manifold-system-1000x1000.jpeg",
            title: "Commercial LPG Installation",
            description: "Professional commercial gas installation."
        },
        {
            image: "https://thumbs.wbm.im/pw/medium/f49545b99ab62e4dfdcc1d670853fdda.jpg",
            title: "Gas Burner Services",
            description: "Reliable gas appliance services."
        },
        {
            image: "https://cdn.supergas.com/-/media/sites/india/blog/manifold-safety.jpg?hash=6DBFC3B1899A8CF233160B6D3F020B8B&w=1280",
            title: "LPG Storage Systems",
            description: "Safe and organized LPG storage solutions."
        }
    ];

    const [currentSlide, setCurrentSlide] = useState(0);

    // Automatically change the carousel image.
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((previous) =>
                (previous + 1) % carouselImages.length
            );
        }, 4000);

        return () => clearInterval(interval);
    }, []);

    const previousSlide = () => {
        setCurrentSlide((previous) =>
            (previous - 1 + carouselImages.length) % carouselImages.length
        );
    };

    const nextSlide = () => {
        setCurrentSlide((previous) =>
            (previous + 1) % carouselImages.length
        );
    };

    // Navigate to the existing signup pages.
    const handleCustomerSignup = () => {
        navigate("/customer/signup");
    };

    const handleTechnicianSignup = () => {
        navigate("/technician/signup");
    };

    return (
        <div className="gc-home">

            {/* Header */}
            <header className="gc-home-header">
                <a href="#home" className="gc-home-brand">
                    <img src={gasconnectLogo} alt="GasConnect Logo" />
                </a>

                <nav className="gc-home-nav">
                    <a href="#home">Home</a>
                    <a href="#about">About</a>
                    <a href="#services">Services</a>
                    <a href="#contact">Contact</a>
                </nav>
            </header>

            {/* Hero Section */}
            <section className="gc-home-hero" id="home">

                <div className="gc-home-hero-content">
                    <span className="gc-home-tagline">
                        <Flame size={18} />
                        WELCOME TO GASCONNECT
                    </span>

                    <h1>
                        Reliable Gas Services,
                        <span> Connected to You.</span>
                    </h1>

                    <p>
                        Manage your gas services easily with GasConnect.
                        Book repairs, connect with technicians and get
                        reliable support for your domestic and commercial
                        gas requirements.
                    </p>

                    <div className="gc-home-hero-actions">
                        <button
                            className="gc-home-primary-btn"
                            onClick={() =>
                                document.getElementById("signup")?.scrollIntoView({
                                    behavior: "smooth"
                                })
                            }
                        >
                            Get Started <ArrowRight size={19} />
                        </button>

                        <a
                            href="#services"
                            className="gc-home-secondary-btn"
                        >
                            Explore Services
                        </a>
                    </div>
                </div>

                {/* Service Image Carousel */}
                <div className="gc-home-hero-visual">

                    <div className="gc-home-carousel">
                        <img
                            key={currentSlide}
                            src={carouselImages[currentSlide].image}
                            alt={carouselImages[currentSlide].title}
                            className="gc-home-carousel-image"
                        />

                        <button
                            type="button"
                            className="gc-home-carousel-arrow gc-home-carousel-prev"
                            onClick={previousSlide}
                            aria-label="Previous image"
                        >
                            <ChevronLeft size={25} />
                        </button>

                        <button
                            type="button"
                            className="gc-home-carousel-arrow gc-home-carousel-next"
                            onClick={nextSlide}
                            aria-label="Next image"
                        >
                            <ChevronRight size={25} />
                        </button>

                        <div className="gc-home-carousel-caption">
                            <h3>{carouselImages[currentSlide].title}</h3>
                            <p>{carouselImages[currentSlide].description}</p>
                        </div>
                    </div>

                    <div className="gc-home-carousel-dots">
                        {carouselImages.map((image, index) => (
                            <button
                                key={image.title}
                                type="button"
                                className={
                                    currentSlide === index
                                        ? "gc-home-carousel-dot active"
                                        : "gc-home-carousel-dot"
                                }
                                onClick={() => setCurrentSlide(index)}
                                aria-label={`Show image ${index + 1}`}
                            />
                        ))}
                    </div>

                </div>
            </section>

            {/* About Section */}
            <section className="gc-home-about" id="about">
                <div className="gc-home-section-heading">
                    <span>ABOUT US</span>
                    <h2>Making Gas Services Easier</h2>
                    <p>
                        GasConnect brings customers and skilled technicians
                        together through one convenient platform.
                    </p>
                </div>

                <div className="gc-home-about-grid">
                    <article className="gc-home-info-card">
                        <div className="gc-home-icon">
                            <ShieldCheck size={34} />
                        </div>
                        <h3>Reliable Services</h3>
                        <p>
                            Connect with technicians and manage your
                            service requests conveniently.
                        </p>
                    </article>

                    <article className="gc-home-info-card">
                        <div className="gc-home-icon">
                            <Wrench size={34} />
                        </div>
                        <h3>Easy Booking</h3>
                        <p>
                            Book repair services and follow your
                            service requests in one place.
                        </p>
                    </article>

                    <article className="gc-home-info-card">
                        <div className="gc-home-icon">
                            <UserRound size={34} />
                        </div>
                        <h3>Simple Management</h3>
                        <p>
                            Manage your account, bookings and service
                            information easily.
                        </p>
                    </article>
                </div>
            </section>

            {/* Services Section */}
            <section className="gc-home-services" id="services">
                <div className="gc-home-section-heading">
                    <span>OUR SERVICES</span>
                    <h2>What We Provide</h2>
                    <p>
                        Gas service solutions for homes and businesses.
                    </p>
                </div>

                <div className="gc-home-service-grid">
                    <article className="gc-home-service-card">
                        <div className="gc-home-icon">
                            <House size={34} />
                        </div>
                        <h3>Domestic Gas Services</h3>
                        <p>
                            Gas-related services and repair support
                            for residential customers.
                        </p>
                    </article>

                    <article className="gc-home-service-card">
                        <div className="gc-home-icon">
                            <Building2 size={34} />
                        </div>
                        <h3>Commercial Gas Services</h3>
                        <p>
                            Gas service solutions for commercial
                            establishments and businesses.
                        </p>
                    </article>

                    <article className="gc-home-service-card">
                        <div className="gc-home-icon">
                            <ShoppingBag size={34} />
                        </div>
                        <h3>Gas Repair products</h3>
                        <p>
                            Professional gas repair products and accessories for safe, 
                            reliable and efficient gas system maintenance.
                        </p>
                    </article>
                </div>
            </section>

            {/* Signup Section */}
            <section className="gc-home-signup" id="signup">
                <div className="gc-home-section-heading">
                    <span>JOIN GASCONNECT</span>
                    <h2>Get Started With Us</h2>
                    <p>
                        Choose your account type to create an account.
                    </p>
                </div>

                <div className="gc-home-signup-grid">

                    <article className="gc-home-signup-card">
                        <div className="gc-home-signup-icon">
                            <UserRound size={38} />
                        </div>

                        <h3>Join as Customer</h3>
                        <p>
                            Create a customer account to book services,
                            manage orders and track your bookings.
                        </p>

                        <button
                            className="gc-home-signup-btn"
                            onClick={handleCustomerSignup}
                        >
                            Customer Signup <ArrowRight size={18} />
                        </button>
                    </article>

                    <article className="gc-home-signup-card">
                        <div className="gc-home-signup-icon">
                            <HardHat size={38} />
                        </div>

                        <h3>Join as Technician</h3>
                        <p>
                            Register as a technician to receive service
                            requests and manage assigned jobs.
                        </p>

                        <button
                            className="gc-home-signup-btn"
                            onClick={handleTechnicianSignup}
                        >
                            Technician Signup <ArrowRight size={18} />
                        </button>
                    </article>

                </div>
            </section>

            {/* Footer */}
            <footer className="gc-home-footer" id="contact">
                <div className="gc-home-footer-content">

                    {/* Brand */}
                    <div className="gc-home-footer-brand">
                        <img src={gasconnectLogo} alt="GasConnect Logo" />
                        <p>
                            Connecting customers with reliable gas
                            services and professional technicians.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div className="gc-home-footer-links">
                        <h3>Quick Links</h3>
                        <a href="#home">Home</a>
                        <a href="#about">About</a>
                        <a href="#services">Services</a>
                        <a href="#contact">Contact</a>
                    </div>

                    {/* Account Links */}
                    <div className="gc-home-footer-links">
                        <h3>Account</h3>
                        <button onClick={handleCustomerSignup}>
                            Customer Signup
                        </button>
                        <button onClick={handleTechnicianSignup}>
                            Technician Signup
                        </button>
                        <button onClick={() => navigate("/admin/login")}>
                            Admin Login
                        </button>
                    </div>

                    {/* Support */}
                    <div className="gc-home-footer-support">
                        <h3>Support</h3>

                        <a href="mailto:gasconnect4@gmail.com">
                            <Mail size={17} />
                            <span>gasconnect4@gmail.com</span>
                        </a>

                        <a
                            href="https://www.instagram.com/YOUR_USERNAME/"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <span className="gc-home-instagram-icon">◎</span>
                            <span>Instagram</span>
                        </a>
                    </div>

                </div>

                <div className="gc-home-footer-bottom">
                    © 2026 GasConnect. All rights reserved.
                </div>
            </footer>

        </div>
    );
}

export default Home;
