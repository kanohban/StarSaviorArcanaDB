import React from "react";
import "./arcana.css";

export default function ArcanaCard({ data, onClick, isFavorite, toggleFavorite }) {
    // Image path adjustment for Vite public directory
    const imgSrc = data.img.startsWith("images/") ? `/${data.img}` : data.img;

    const handleFavorite = (e) => {
        e.stopPropagation();
        toggleFavorite(data.id);
    };

    return (
        <div className="card-item" onClick={() => onClick(data)}>
            <div className="card-image-wrapper">
                <img src={imgSrc} alt={data.name} loading="lazy" />

                {/* Badges Overlay */}
                <div className="card-badges-container">
                    <span className={`badge-item ${data.rarity}`}>{data.rarity}</span>
                    <span className="badge-item badge-type">{data.main_stat}</span>
                </div>

                <div className="card-overlay">
                    <div className="card-header-row">
                        <h3 className="card-title-text">{data.name}</h3>
                    </div>
                    <p className="character-name">{data.char_name}</p>
                </div>
            </div>
            {/* Favorite Button (Top Right) */}
            <button
                className={`card-fav-btn ${isFavorite ? "active" : ""}`}
                onClick={handleFavorite}
            >
                <i className={`fa-${isFavorite ? "solid" : "regular"} fa-star`}></i>
            </button>
        </div>
    );
}
