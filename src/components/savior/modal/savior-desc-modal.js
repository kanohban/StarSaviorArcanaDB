import React from "react";
import styles from "./savior-desc-modal.module.css";
import ModalLeft from "./modal-left/modal-left";
import ModalRight from "./modal-right/modal-right";

export default function SaviorDescModal({ isActive, setIsActive, selected, next, prev }) {
    return (
        <div className={`${styles["modal"]} ${isActive ? `${styles["active"]}` : ""}`}>
            <div className={styles["window"]}>
            <button className={styles["close-button"]} onClick={() => setIsActive(false)}>
                <i className="fa-solid fa-x" />
            </button>
            <button className={`${styles["nav-btn"]} ${styles["prev"]}`}></button>
            <button className={`${styles["nav-btn"]} ${styles["next"]}`}></button>

                {/* <!-- Left Column: Illust & Arc Point --> */}
                {selected && <ModalLeft savior={selected} />}

                {/* <!-- Right Column: Profile, Stats, Skills --> */}
                {selected && <ModalRight savior={selected} />}
            </div>
        </div>
    );
}