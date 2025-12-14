import React, { useState } from "react";
import styles from "./skill.module.css";
import { ACTIVE_SKILL_EFFECT_TYPE, PASSIVE_SKILL_EFFECT_TYPE, SKILL_TYPE } from "../../../../constants";
import { v4 } from "uuid";

export default function Skill({ char_name, skill }) {
    const [isActive, setIsActive] = useState(false);
    if(char_name === "릴리" && !skill.break) console.log(skill.name, skill.break)
    return (
        <div className={styles["skill"]}>
            <div className={styles["skill-header"]}>
                <img src={`/images/icon/${char_name}_${SKILL_TYPE[skill.type]}.webp`} 
                    onError={({ currentTarget }) => {
                        currentTarget.onError = null;
                        currentTarget.src = '/images/icon/default.webp';
                    }} />
                <div className={styles["skill-summary"]}>
                    <div className={styles["name-wrapper"]}>
                        <span className={styles["skill-name"]}>{skill.name}</span>
                        <span className={styles["skill-type"]}>{SKILL_TYPE[skill.type]}</span>
                    </div>
                    {(skill.cooltime || skill.target || skill.break || skill.nova) && 
                        <div className={styles["badges"]}>
                            {skill.cooltime && skill.cooltime !== 0 && <span className={`${styles["badge"]} ${styles["cooltime"]}`}>{skill.cooltime}턴</span>}
                            {skill.target && skill.target.includes("적") && <span className={`${styles["badge"]} ${styles["target"]}`}>{skill.target}</span>}
                            {skill.target && (skill.target.includes("아군") || skill.target.includes("자신")) && <span className={`${styles["badge"]} ${styles["target-ally"]}`}>{skill.target}</span>}
                            {skill.break !== 0 && skill.break && <span className={`${styles["badge"]} ${styles["break"]}`}>강인도 피해 {skill.break}</span>}
                            {skill.nova !== 0 && skill.nova && <span className={`${styles["badge"]} ${styles["nova-gain"]}`}>노바 획득 {skill.nova}</span>}
                        </div>
                    }
                </div>
            </div>
            <div className={styles["skill-desc"]}>{skill.desc}</div>
            {skill.nova_desc && <div className={styles["skill-nova"]}>
                <span className={`${styles["badge"]} ${styles["nova"]}`}>노바 버스트</span>
                <span className={styles["desc"]}>{skill.nova_desc}</span>
            </div>}
            <div className={`${styles["level-data-wrapper"]} ${isActive ? `${styles["active"]}` : ""} `}>
                <button className={styles["show-level-button"]} onClick={() => setIsActive(!isActive)}>
                    스킬 레벨 정보 <span className={styles["triangle"]}>▼</span>
                </button>
                <div className={styles["level-data"]}>
                    {skill.levels.map(level_info => {
                        // passive
                        if(Array.isArray(level_info.desc)) {
                            const texts = level_info.desc.map(e => PASSIVE_SKILL_EFFECT_TYPE[e.type].replace("{char}", char_name).replace("{value}", e.value)).join(" ");
                            return (
                                <div className={styles["row"]} key={v4()}>
                                    <span className={styles["level"]}>{level_info.level}</span>
                                    <span className={styles["value"]}>{texts}</span>
                                </div>
                            );
                        } else {
                            // active
                            return (
                                <div className={styles["row"]} key={v4()}>
                                    <span className={styles["level"]}>{level_info.level}</span>
                                    <span className={styles["value"]}>{ACTIVE_SKILL_EFFECT_TYPE[level_info.type].replace("{value}", level_info.value)}</span>
                                </div>
                            );
                        }
                    })}
                </div>
            </div>
        </div>
    );
}