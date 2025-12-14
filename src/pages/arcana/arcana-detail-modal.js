import React, { useState } from "react";
import "./arcana.css";
import { POTENTIAL, FLAVOR_TEXT, EVENT_REWARD_TYPE, EVENT_REWARDS_FLAG } from "../../constants";

export default function ArcanaDetailModal({ data, onClose, isFavorite, toggleFavorite }) {
    if (!data) return null;

    const [level, setLevel] = useState(50); // Default Level 50

    // Resolve Image
    const imgSrc = data.img.startsWith("images/") ? `/${data.img}` : data.img;

    // Resolve SP Potential Description
    const spDesc = POTENTIAL[data.sp_potential] || "설명 없음";
    // Resolve Flavor Text
    const flavor = FLAVOR_TEXT[data.name] || "";

    // Helper: Get value based on level
    const getLevelValue = (obj) => {
        if (!obj) return "";
        return level === 50 ? obj.level_50 : obj.level_35;
    };

    // Helper: Render Value with highlight
    const renderValue = (val) => {
        if (!val && val !== 0) return null;
        const str = String(val);
        const isNegative = str.startsWith("-");
        // Simple check for positive number-like string (not starting with - and is not 0)
        const num = parseFloat(str);
        const isPositive = !isNegative && !isNaN(num) && num > 0;

        // Check if value is a potential name for tooltip
        const potDesc = POTENTIAL[str];

        let displayStr = str;
        if (isPositive && !str.startsWith("+")) {
            displayStr = "+" + str;
        }

        return (
            <span
                className={isNegative ? "highlight-negative" : (isPositive ? "highlight-positive" : "")}
                title={potDesc || ""}
                style={potDesc ? { cursor: "help", textDecoration: "underline", textDecorationStyle: "dotted" } : {}}
            >
                {displayStr}
            </span>
        );
    };

    // Helper: Render Event Reward Group
    const renderRewardGroup = (group, idx) => {
        const flagName = EVENT_REWARDS_FLAG[group.reward_flag];
        const isSuccess = group.reward_flag === 1;
        const isFail = group.reward_flag === 2;

        let boxClass = "choice-box generated-box";
        if (isSuccess) boxClass += " status-success";
        if (isFail) boxClass += " status-fail";

        return (
            <div key={idx} className={boxClass}>
                {(isSuccess || isFail) && (
                    <div className="status-badge">{flagName}</div>
                )}
                {group.descriptions && group.descriptions.map((descList, dIdx) => (
                    <div key={dIdx}>
                        {descList.map((item, iIdx) => {
                            const typeName = EVENT_REWARD_TYPE[item.type] || item.type;
                            return (
                                <div key={iIdx} className="choice-row">
                                    <span className="type">{typeName}</span>
                                    <span className="val">{renderValue(item.value)}</span>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>&times;</button>

                <div className="modal-body">
                    {/* Left: Image Section */}
                    <div className="modal-image-section">
                        <img src={imgSrc} alt={data.name} />
                    </div>

                    {/* Right: Info Section */}
                    <div className="modal-info-section">
                        {/* Header Row */}
                        <div className="modal-header-row">
                            <span className={`rarity-badge ${data.rarity}`}>{data.rarity}</span>
                            <h2 className="modal-title" style={{ flex: 1 }}>{data.name}</h2>

                            {/* Level Toggle Removed from here */}

                        </div>

                        <p className="character-name" style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>
                            {data.char_name}
                        </p>

                        {/* Tags (Types) directly under name */}
                        <div className="tags" style={{ marginBottom: "1.5rem" }}>
                            <span className="tag stat-main" style={{ fontWeight: 'bold' }}>{data.main_stat}</span>
                            {data.assists.map(stat => (
                                <span key={stat} className="tag">{stat}</span>
                            ))}
                        </div>

                        {flavor && <div className="modal-quote">"{flavor}"</div>}

                        {/* Unique Potential & Effect Section */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                            {/* Unique Potential */}
                            <div className="info-group" style={{ marginBottom: 0 }}>
                                <h3>고유 잠재력</h3>
                                <div className="effect-box">
                                    <div style={{ fontWeight: 'bold', marginBottom: '0.4rem' }}>{data.sp_potential}</div>
                                    <div style={{ lineHeight: '1.5' }}>{spDesc}</div>
                                </div>
                            </div>

                            {/* Unique Effect */}
                            {data.unique_effect && (
                                <div className="info-group" style={{ marginBottom: 0 }}>
                                    <h3>고유 효과</h3>
                                    <div className="effect-box">
                                        <div style={{ fontWeight: 'bold', marginBottom: '0.4rem' }}>{data.unique_effect.name}</div>
                                        <div style={{ lineHeight: '1.5' }}>{data.unique_effect.desc}</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Events Section */}
                        {data.events && data.events.length > 0 && (
                            <div className="info-group">
                                <h3>이벤트</h3>
                                <div className="event-section">
                                    {data.events.map((evt, idx) => (
                                        <div key={evt.id} className="event-box">
                                            <div className="event-title">
                                                <span className="event-num-badge">{idx + 1}</span>
                                                {evt.name}
                                            </div>

                                            {/* Render Choices or Flat Rewards */}
                                            {evt.has_choice ? (
                                                <div className="choices-grid two-cols">
                                                    {evt.choices.map((choice, cIdx) => (
                                                        <div key={cIdx} className="choice-column">
                                                            <div className="choice-header">{choice.name}</div>
                                                            {choice.rewards && choice.rewards.map((grp, gIdx) =>
                                                                renderRewardGroup(grp, gIdx)
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                /* No Choice - Consolidated Single Box */
                                                <div className="choice-list-flat">
                                                    {evt.rewards && evt.rewards.length > 0 ? (
                                                        <div className="choice-box generated-box">
                                                            {/* Flatten and merge all reward descriptions into one list */}
                                                            {evt.rewards.map((descList, dIdx) => (
                                                                <div key={dIdx}>
                                                                    {descList.map((item, iIdx) => {
                                                                        const typeName = EVENT_REWARD_TYPE[item.type] || item.type;
                                                                        return (
                                                                            <div key={`${dIdx}-${iIdx}`} className="choice-row">
                                                                                <span className="type">{typeName}</span>
                                                                                <span className="val">{renderValue(item.value)}</span>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div style={{ color: '#888', fontStyle: 'italic' }}>보상 정보 없음</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Stats Section (Bottom) */}
                        <div className="info-group" style={{ marginTop: "2rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                                <h3 style={{ margin: 0, borderBottom: "2px solid var(--primary-color, #646cff)", paddingBottom: "0.5rem" }}>능력치 정보</h3>
                                <div className="level-switch-container" style={{ marginLeft: "auto" }}>
                                    <span className={`switch-label ${level === 35 ? "active" : ""}`} onClick={() => setLevel(35)}>Lv.35</span>
                                    <div className={`switch-track ${level === 50 ? "toggled" : ""}`} onClick={() => setLevel(level === 50 ? 35 : 50)}>
                                        <div className="switch-thumb"></div>
                                    </div>
                                    <span className={`switch-label ${level === 50 ? "active" : ""}`} onClick={() => setLevel(50)}>Lv.50</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {/* Journey Start Stats Box */}
                                <div className="bonus-box">
                                    <h4 style={{ borderBottom: '1px solid currentColor', opacity: 0.8, paddingBottom: '0.3rem' }}>여정 시작 스탯</h4>
                                    <ul>
                                        {data.journey_start_stats && data.journey_start_stats.length > 0 ? (
                                            data.journey_start_stats.map((stat, i) => (
                                                <li key={i}>
                                                    <span>{stat.type}</span>
                                                    <span className="bonus-value">{renderValue(getLevelValue(stat))}</span>
                                                </li>
                                            ))
                                        ) : (
                                            <li style={{ color: '#999', fontStyle: 'italic' }}>없음</li>
                                        )}
                                    </ul>
                                </div>

                                {/* Training Effects Box */}
                                <div className="bonus-box">
                                    <h4 style={{ borderBottom: '1px solid currentColor', opacity: 0.8, paddingBottom: '0.3rem' }}>훈련 효과</h4>
                                    <ul>
                                        {data.training_effects && data.training_effects.length > 0 ? (
                                            data.training_effects.map((eff, i) => (
                                                <li key={i}>
                                                    <span>{eff.type}</span>
                                                    <span className="bonus-value">{renderValue(getLevelValue(eff))}</span>
                                                </li>
                                            ))
                                        ) : (
                                            <li style={{ color: '#999', fontStyle: 'italic' }}>없음</li>
                                        )}
                                    </ul>
                                </div>

                                {/* Telepathy Effects Box */}
                                <div className="bonus-box">
                                    <h4 style={{ borderBottom: '1px solid currentColor', opacity: 0.8, paddingBottom: '0.3rem' }}>감응 효과</h4>
                                    <ul>
                                        {data.telepathy_effects && data.telepathy_effects.length > 0 ? (
                                            data.telepathy_effects.map((eff, i) => (
                                                <li key={i}>
                                                    <span>{eff.type}</span>
                                                    <span className="bonus-value">{renderValue(getLevelValue(eff))}</span>
                                                </li>
                                            ))
                                        ) : (
                                            <li style={{ color: '#999', fontStyle: 'italic' }}>없음</li>
                                        )}
                                    </ul>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
