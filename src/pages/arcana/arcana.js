import React, { useState, useEffect } from "react";
import "./arcana.css";
import StarContainer from "../../components/star-container/star-container";
import Header from "../../components/header/header";
import SearchBox from "../../components/search-box/search-box";
import FilterSelect from "../../components/filter-select/filter-select";
import ArcanaCard from "./arcana-card";
import ArcanaDetailModal from "./arcana-detail-modal";
import RAW_ARCANAS from "../../data/arcanas.json";
import FILTERS from "../../data/filter_config.json";
import { useSelector } from "react-redux";
import { v4 } from "uuid";

export default function Arcana() {
    // Redux State for Theme/Mode (Global)
    const theme = useSelector(state => state.theme.value);

    // Local State
    const [query, setQuery] = useState("");
    const [filters, setFilters] = useState({
        rarity: { value: "all", name: "전체" },
        type: { value: "all", name: "전체" }
    });
    const [filteredList, setFilteredList] = useState(RAW_ARCANAS);

    // Favorites State
    const [favorites, setFavorites] = useState([]);

    // Modal State
    const [selectedArcana, setSelectedArcana] = useState(null);

    // Load Favorites on Mount
    useEffect(() => {
        const saved = localStorage.getItem("arcana_favorites");
        if (saved) {
            try {
                setFavorites(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse favorites", e);
            }
        }
    }, []);

    // Toggle Favorite
    const toggleFavorite = (id) => {
        let newFavs;
        if (favorites.includes(id)) {
            newFavs = favorites.filter(fid => fid !== id);
        } else {
            newFavs = [...favorites, id];
        }
        setFavorites(newFavs);
        localStorage.setItem("arcana_favorites", JSON.stringify(newFavs));
    };

    // Filtering Logic
    useEffect(() => {
        let result = RAW_ARCANAS;

        if (query) {
            const q = query.toLowerCase();
            result = result.filter(item =>
                item.name.toLowerCase().includes(q) ||
                item.char_name.toLowerCase().includes(q) ||
                (item.unique_effect && item.unique_effect.desc.toLowerCase().includes(q))
            );
        }

        if (filters.rarity.value !== "all") {
            result = result.filter(item => item.rarity === filters.rarity.value);
        }

        if (filters.type.value !== "all") {
            const typeVal = filters.type.name;
            result = result.filter(item =>
                item.main_stat === typeVal ||
                (item.assists && item.assists.includes(typeVal))
            );
        }

        setFilteredList(result);
    }, [query, filters]);

    const handleFilterChange = (id, obj) => {
        setFilters(prev => ({ ...prev, [id]: obj }));
    };

    return (
        <div id="container" data-theme={theme} className="arcana-container">
            <StarContainer />
            <Header title={"아르카나"} />

            <div className="filter-wrapper">
                <SearchBox value={query} customOnChange={setQuery} />
                <FilterSelect
                    id="rarity"
                    list={FILTERS.RARITY}
                    selected={filters.rarity}
                    customOnChange={handleFilterChange}
                />
                <FilterSelect
                    id="type"
                    list={FILTERS.STATUS}
                    selected={filters.type}
                    customOnChange={handleFilterChange}
                />
            </div>

            <div className="arcana-grid">
                {filteredList.map(item => (
                    <ArcanaCard
                        key={`arcana-${item.id}`}
                        data={item}
                        onClick={setSelectedArcana}
                        isFavorite={favorites.includes(item.id)}
                        toggleFavorite={toggleFavorite}
                    />
                ))}
            </div>

            {filteredList.length === 0 && (
                <div className="no-results">검색 결과가 없습니다.</div>
            )}

            {/* Detail Modal */}
            <ArcanaDetailModal
                data={selectedArcana}
                onClose={() => setSelectedArcana(null)}
                isFavorite={selectedArcana ? favorites.includes(selectedArcana.id) : false}
                toggleFavorite={toggleFavorite}
            />
        </div>
    );
}