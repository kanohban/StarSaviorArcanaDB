import { useState, useEffect } from 'react'
import CardModal from './components/CardModal'
import './App.css'

function App() {
    const [cards, setCards] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCard, setSelectedCard] = useState(null)
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('theme') || 'dark'
    })

    const [selectedRarity, setSelectedRarity] = useState('All')
    const [selectedType, setSelectedType] = useState('All')

    const [isMobileMode, setIsMobileMode] = useState(false)

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme)
        localStorage.setItem('theme', theme)
    }, [theme])

    useEffect(() => {
        fetch('data/cards.json')
            .then(res => res.json())
            .then(data => setCards(data))
            .catch(err => console.error('Error loading cards:', err))
    }, [])

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light')
    }

    const toggleMobileMode = () => {
        setIsMobileMode(prev => !prev)
    }

    const filteredCards = cards.filter(card => {
        const name = card['이름'] || '';
        const charName = card['캐릭터'] || '';
        const hasImage = card['이미지'] && card['이미지'].trim() !== '';

        // Filter Logic
        const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            charName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRarity = selectedRarity === 'All' || card['레어도'] === selectedRarity;
        const matchesType = selectedType === 'All' || (card['타입'] && card['타입']['훈련'] === selectedType);

        return hasImage && matchesSearch && matchesRarity && matchesType;
    }).sort((a, b) => {
        const typePriority = { '힘': 5, '체력': 4, '인내': 3, '집중': 2, '보호': 1 };
        const rarityPriority = { 'SSR': 2, 'SR': 1 };

        const rarityA = rarityPriority[a['레어도']] || 0;
        const rarityB = rarityPriority[b['레어도']] || 0;

        if (rarityA !== rarityB) {
            return rarityB - rarityA;
        }

        const typeA = a['타입'] && a['타입']['훈련'] ? typePriority[a['타입']['훈련']] || 0 : 0;
        const typeB = b['타입'] && b['타입']['훈련'] ? typePriority[b['타입']['훈련']] || 0 : 0;

        return typeB - typeA;
    })

    return (
        <div className={`app ${isMobileMode ? 'mobile-mode' : ''}`}>
            <header className="app-header">
                <div className="header-top">
                    <h1>스타 세이비어 아르카나 DB</h1>
                    <div className="header-controls">
                        <button className="theme-toggle" onClick={toggleTheme} title="테마 변경">
                            {theme === 'light' ? '🌙' : '☀️'}
                        </button>
                        <button className="mobile-toggle" onClick={toggleMobileMode} title="모바일 뷰 전환">
                            {isMobileMode ? '🖥️' : '📱'}
                        </button>
                    </div>
                </div>

                <div className="header-bottom">
                    <div className="filter-group">
                        <select
                            value={selectedRarity}
                            onChange={(e) => setSelectedRarity(e.target.value)}
                            className="filter-select"
                        >
                            <option value="All">모든 등급</option>
                            <option value="SSR">SSR</option>
                            <option value="SR">SR</option>
                        </select>

                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                            className="filter-select"
                        >
                            <option value="All">모든 타입</option>
                            <option value="힘">힘</option>
                            <option value="체력">체력</option>
                            <option value="인내">인내</option>
                            <option value="집중">집중</option>
                            <option value="보호">보호</option>
                        </select>
                    </div>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="이름 또는 캐릭터로 검색..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </header>

            <div className="card-grid">
                {filteredCards.map((card, index) => (
                    <div key={index} className="card-item" onClick={() => setSelectedCard(card)}>
                        <div className="card-image-wrapper">
                            {card['이미지'] ? (
                                <img src={card['이미지']} alt={card['이름']} loading="lazy" />
                            ) : (
                                <div className="no-image">No Image</div>
                            )}
                        </div>
                        <div className="card-content">
                            <div className="card-header">
                                <span className={`rarity-badge ${card['레어도']}`}>{card['레어도']}</span>
                                {card['타입']['훈련'] && <span className="stat-tag">{card['타입']['훈련']}</span>}
                            </div>
                            <h3>{card['이름']}</h3>
                            <p className="character-name">{card['캐릭터']}</p>
                        </div>
                    </div>
                ))}
            </div>

            <CardModal card={selectedCard} onClose={() => setSelectedCard(null)} />

            <footer className="app-footer">
                <p>이 페이지는 게임 '스타 세이비어'의 비영리 팬 프로젝트입니다.</p>
                <p>프로젝트에 사용된 모든 자산, 데이터, 이미지 및 텍스트의 소유권은 STUDIOBSIDE 에 있습니다.</p>
                <p>© STUDIOBSIDE Co. Ltd All Rights Reserved.</p>
                <div className="visitor-counter" style={{ marginTop: '10px' }}>
                    <a href="https://myhits.vercel.app">
                        <img src="https://myhits.vercel.app/api/hit/https%3A%2F%2Fkanohban.github.io%2FStarSaviorArcanaDB%2F?color=blue&label=hits&size=small" alt="hits" />
                    </a>
                </div>
            </footer>
        </div>
    )
}

export default App
