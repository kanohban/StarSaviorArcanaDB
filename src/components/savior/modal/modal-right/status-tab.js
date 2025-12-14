import React from "react";
import styles from "./status-tab.module.css";
import CONFIG from "../../../../data/modal_savior_status_config.json";
import getSaviorStatRanks from "../../../../functions/getSaviorStatRanks";
import getSaviorStatProgress from "../../../../functions/getSaviorStatProgress";
import Potential from "./potential";
import { v4 } from "uuid";

export default function StatusTab({ savior, isTabActive }) {
    const getStatValue = (type, value) => {
        if(type === "number") return value.toLocaleString("ko-KR");
        if(type === "percent") return `${parseInt(value * 100)}%`;
    }

    const getStatRank = (statName) => {
        const ranks = getSaviorStatRanks();
        const rank = ranks.find(e => e.name === savior.name).ranks;

        return `${rank[statName]}위`;
    }

    return (
        <div className={`${styles["status-tab"]} ${styles[isTabActive]}`}>
            <div className={styles["group"]}>
                <h3>기본 스테이터스 (Lv.<span id="stat-max-level">{savior.rank === "SSR" ? 200 : 160}</span>)</h3>
                <div className={styles["stats"]}>
                    {CONFIG.STATUS.map(config => {
                        return (
                            <div className={styles["stat-row"]} key={v4()}>
                                <div className={styles["stat-name"]}>{config.name}</div>
                                <div className={styles["stat-bar-container"]}>
                                    <div className={styles["stat-bar"]} style={{ width: `${getSaviorStatProgress(savior, config.value)}%`}}></div>
                                </div>
                                <div className={styles["stat-value"]}>{getStatValue(config.type, savior.status[config.value])}</div>
                                <div className={styles["stat-rank"]}>{getStatRank(config.value)}</div>
                            </div>
                        );
                    })}
                    
                </div>
                <div className={styles["stat-grids"]}>
                    <div className={styles["stat-item"]}>
                        <span>효과 적중</span>
                        <span>{parseInt(savior.status.eff_rate * 100)}%</span>
                    </div>
                    <div className={styles["stat-item"]}>
                        <span>효과 저항</span>
                        <span>{parseInt(savior.status.eff_resist * 100)}%</span>
                    </div>
                    <div className={styles["stat-item"]}>
                        <span>명중률</span>
                        <span>{parseInt(savior.status.acc * 100)}%</span>
                    </div>
                </div>
            </div>
            <div className={styles["journey-wrapper"]}>
                <div className={styles["group"]}>
                    <h3>여정 스테이터스</h3>
                    <div className={`${styles["stat-grids"]} ${styles["journey"]}`}>
                        {CONFIG.JOURNEY_STATUS.map(config => {
                            return (
                                <div className={styles["stat-item"]} key={v4()} >
                                    <span className={styles["stat-label"]}>{config.name}</span>
                                    <span className={styles["stat-value"]}>{savior.journey_status[config.value]}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className={styles["group"]}>
                    <h3>공명 잠재력</h3>
                    <div className={styles["potentials"]}>
                        {savior.potentials.map(potential => {
                            return <Potential potential={potential} key={v4()} />;
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}