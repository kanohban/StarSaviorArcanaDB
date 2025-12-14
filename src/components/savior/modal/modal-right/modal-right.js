import React, { useState } from "react";
import styles from "./modal-right.module.css";
import Portrait from "../../portrait/portrait";
import ProfileDescTab from "./profile-desc-tab";
import StatusTab from "./status-tab";
import SkillTab from "./skill-tab";

export default function ModalRight({ savior }) {
    const [activeTab, setActiveTab] = useState("status");

    let eng = "";
    switch(savior.attr) {
        case "태양":
            eng = "sun";
            break;
        case "달":
            eng = "moon";
            break;
        case "별":
            eng = "star";
            break;
        case "질서":
            eng = "order";
            break;
        case "혼돈":
            eng = "chaos";
            break;
    }

    return (
        <div className={styles["modal-desc-right"]}>
            <div className={styles["savior-summary"]}>
                <div className={styles["savior-infos"]}>
                    <Portrait savior={savior} />
                    <div className={styles["savior-info"]}>
                        <h2>{savior.name}</h2>
                        <div className={styles["badges"]}>
                            <span className={`${styles["badge"]} ${styles[eng]} `}>{savior.attr}</span>
                            <span className={styles["badge"]}>{savior.class}</span>
                            <span className={styles["badge"]}>{savior.atk_type}</span>
                        </div>
                    </div>
                </div>
                <p className={styles["savior-desc"]}>{savior.inst.desc}</p>
            </div>
            <div className={styles["tabs"]}>
                <button className={`${styles["tab-button"]} ${activeTab === "status" ? `${styles["active"]}` : ""}`} onClick={() => setActiveTab("status")}>스테이터스</button>
                <button className={`${styles["tab-button"]} ${activeTab === "skills" ? `${styles["active"]}` : ""}`} onClick={() => setActiveTab("skills")}>스킬 정보</button>
                <button className={`${styles["tab-button"]} ${activeTab === "profile" ? `${styles["active"]}` : ""}`} onClick={() => setActiveTab("profile")}>상세 프로필</button>
            </div>
            {/* status tab */}
            <StatusTab savior={savior} isTabActive={activeTab === "status" ? "active" : ""} />

            {/* skill tab */}
            <SkillTab savior={savior} isTabActive={activeTab === "skills" ? "active" : ""} />

            {/* profile tab */}
            <ProfileDescTab savior={savior} isTabActive={activeTab === "profile" ? "active" : ""} />
        </div>
    );
}