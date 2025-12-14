import React from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';

const Home = () => {
    return (
        <div className="container">
            {/* Background stars are handled in index.css / index.html structure or we can move them here if needed. 
          Currently they are in index.css and applied globally, but the HTML structure for them was in index.html body.
          We need to add them to App or Main layout or here. Let's add them here for now or assume they are in index.html (which I removed).
          Wait, I removed the stars divs from index.html. I should put them in App.jsx or MainLayout.
      */}

            {/* Top Left Logo Link */}
            <a href="https://starsavior.com/kr" target="_blank" rel="noreferrer" className="logo-link">
                <img src="/images/index/logo.png" alt="Logo" className="logo-icon" />
            </a>

            <div className="hero-section">
                <img src="/images/index/title.png" alt="Star Savior DB" className="main-title-img" />
                <p className="subtitle">스타 세이비어 DB</p>
            </div>

            <nav className="menu-grid">
                <Link to="/arcana" className="menu-card">
                    <img src="/images/index/arcana.png" alt="ARCANA" className="card-icon" />
                    <h3 className="card-title">아르카나</h3>
                </Link>

                <Link to="/savior" className="menu-card">
                    <img src="/images/index/savior.png" alt="SAVIOR" className="card-icon" />
                    <h3 className="card-title">구원자</h3>
                </Link>

                <Link to="/journey" className="menu-card">
                    <img src="/images/index/journey.png" alt="JOURNEY" className="card-icon" />
                    <h3 className="card-title">여정</h3>
                </Link>

                <Link to="/deck" className="menu-card">
                    <img src="/images/index/deck.png" alt="DECK" className="card-icon" />
                    <h3 className="card-title">덱 구성</h3>
                </Link>

                <Link to="/scheduler" className="menu-card">
                    <img src="/images/index/schedule.png" alt="SCHEDULER" className="card-icon" />
                    <h3 className="card-title">스케쥴러</h3>
                </Link>

                <Link to="/gacha" className="menu-card">
                    <img src="/images/index/search.png" alt="SEARCH" className="card-icon" />
                    <h3 className="card-title">가챠</h3>
                </Link>
            </nav>

            <Footer />
        </div>
    );
};

export default Home;
