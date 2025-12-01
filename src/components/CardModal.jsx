import React from 'react';
import './CardModal.css';

function CardModal({ card, onClose }) {
    if (!card) return null;

    const renderEvents = (events) => {
        if (!events) return null;

        // Check if events is in the new structure (Object with 선택지A/B arrays)
        const isNewStructure = !Array.isArray(events) && (events['선택지A'] || events['선택지B']);

        if (isNewStructure) {
            // Derive unique event numbers from both A and B arrays
            const eventNumbers = new Set();
            if (events['선택지A']) events['선택지A'].forEach(e => eventNumbers.add(e.번호));
            if (events['선택지B']) events['선택지B'].forEach(e => eventNumbers.add(e.번호));

            const sortedNumbers = Array.from(eventNumbers).sort((a, b) => a - b);

            return (
                <div className="events-list">
                    {sortedNumbers.map(num => {
                        const choiceA = events['선택지A']?.find(e => e.번호 === num);
                        const choiceB = events['선택지B']?.find(e => e.번호 === num);

                        return (
                            <div key={num} className="event-item">
                                <span className="event-num">{num}</span>
                                <div className="choices-wrapper">
                                    {/* Choice A */}
                                    {choiceA ? (
                                        <div className="choice-box choice-a">
                                            <span className="choice-label">A</span>
                                            {choiceA.효과 ? (
                                                <div className="multi-effect-box">
                                                    {choiceA.효과.map((effect, idx) => (
                                                        <div key={idx} className="effect-row">
                                                            <span className="choice-type">{effect.타입}</span>
                                                            <span className="choice-value">{effect.수치}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="choice-content-single">
                                                    <span className="choice-type">{choiceA.타입}</span>
                                                    <span className="choice-value">{choiceA.수치}</span>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="choice-placeholder"></div>
                                    )}

                                    {/* Choice B */}
                                    {choiceB ? (
                                        <div className="choice-box choice-b">
                                            <span className="choice-label">B</span>
                                            {choiceB.효과 ? (
                                                <div className="multi-effect-box">
                                                    {choiceB.효과.map((effect, idx) => (
                                                        <div key={idx} className="effect-row">
                                                            <span className="choice-type">{effect.타입}</span>
                                                            <span className="choice-value">{effect.수치}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="choice-content-single">
                                                    <span className="choice-type">{choiceB.타입}</span>
                                                    <span className="choice-value">{choiceB.수치}</span>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="choice-placeholder"></div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            );
        }

        // Fallback for old structure (Array of objects)
        if (Array.isArray(events)) {
            return (
                <div className="events-list">
                    {events.map((event) => (
                        <div key={event.번호} className="event-item">
                            <span className="event-num">{event.번호}</span>
                            <div className="choices-wrapper">
                                {event.선택지A ? (
                                    <div className="choice-box choice-a">
                                        <span className="choice-label">A</span>
                                        {Array.isArray(event.선택지A) ? (
                                            <div className="multi-effect-box">
                                                {event.선택지A.map((effect, idx) => (
                                                    <div key={idx} className="effect-row">
                                                        <span className="choice-type">{effect.타입}</span>
                                                        <span className="choice-value">{effect.수치}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="choice-content-single">
                                                <span className="choice-type">{event.선택지A.타입}</span>
                                                <span className="choice-value">{event.선택지A.수치}</span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="choice-placeholder"></div>
                                )}
                                {event.선택지B ? (
                                    <div className="choice-box choice-b">
                                        <span className="choice-label">B</span>
                                        {Array.isArray(event.선택지B) ? (
                                            <div className="multi-effect-box">
                                                {event.선택지B.map((effect, idx) => (
                                                    <div key={idx} className="effect-row">
                                                        <span className="choice-type">{effect.타입}</span>
                                                        <span className="choice-value">{effect.수치}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="choice-content-single">
                                                <span className="choice-type">{event.선택지B.타입}</span>
                                                <span className="choice-value">{event.선택지B.수치}</span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="choice-placeholder"></div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        return null;
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="close-button" onClick={onClose}>&times;</button>

                <div className="modal-body">
                    {/* Left Side: Image */}
                    <div className="modal-image-section">
                        {card['이미지'] ? (
                            <img src={card['이미지']} alt={card['이름']} />
                        ) : (
                            <div className="no-image-placeholder">No Image</div>
                        )}
                    </div>

                    {/* Right Side: Info */}
                    <div className="modal-info-section">
                        <div className="modal-header">
                            <span className={`rarity-badge ${card['레어도']}`}>{card['레어도']}</span>
                            <h2>{card['이름']}</h2>
                            <p className="character-name">{card['캐릭터']}</p>
                        </div>

                        <div className="info-group">
                            <h3>타입</h3>
                            <div className="tags">
                                {card['타입']['훈련'] && <span className="tag training">{card['타입']['훈련']}</span>}
                                {card['타입']['보조1'] && <span className="tag support">{card['타입']['보조1']}</span>}
                                {card['타입']['보조2'] && <span className="tag support">{card['타입']['보조2']}</span>}
                            </div>
                        </div>

                        {(card['고유잠재']['이름'] || card['고유효과']['이름']) && (
                            <div className="info-group">
                                <h3>고유 능력</h3>
                                {card['고유잠재']['이름'] && (
                                    <div className="ability-box">
                                        <strong>잠재: {card['고유잠재']['이름']}</strong>
                                        <p>{card['고유잠재']['설명']}</p>
                                    </div>
                                )}
                                {card['고유효과']['이름'] && (
                                    <div className="ability-box">
                                        <strong>효과: {card['고유효과']['이름']}</strong>
                                        <p>{card['고유효과']['설명']}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Events */}
                        <div className="info-group">
                            <h3>이벤트</h3>
                            <div className="journey-list">
                                {Object.entries(card['이벤트']).map(([stage, events], idx) => (
                                    <div key={stage} className="journey-stage-card">
                                        <div className="stage-header">
                                            <h4>{events['이름'] || stage}</h4>
                                        </div>
                                        {renderEvents(events)}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Start Effects */}
                        {card['여정'] && card['여정'].length > 0 && (
                            <div className="info-group">
                                <h3>시작 효과</h3>
                                <div className="bonus-grid">
                                    {card['여정'].map((item, idx) => (
                                        <div key={idx} className="bonus-box">
                                            <div><strong>{item['타입']}</strong> <span className="bonus-value">{item['수치']}</span></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Bonus Effects */}
                        <div className="info-group">
                            <h3>추가 효과</h3>
                            <div className="bonus-grid">
                                {card['훈련'].length > 0 && (
                                    <div className="bonus-box">
                                        <h4>훈련 보너스</h4>
                                        <ul>
                                            {card['훈련'].map((t, idx) => (
                                                <li key={idx}>{t['타입']} <span className="bonus-value">{t['수치']}</span></li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {card['감응'].length > 0 && (
                                    <div className="bonus-box">
                                        <h4>감응 훈련</h4>
                                        <ul>
                                            {card['감응'].map((t, idx) => (
                                                <li key={idx}>{t['타입']} <span className="bonus-value">{t['수치']}</span></li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {card['지원']['타입'] && (
                                    <div className="bonus-box">
                                        <h4>지원 의뢰</h4>
                                        <div>{card['지원']['타입']} <span className="bonus-value">{card['지원']['수치']}</span></div>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

export default CardModal;
