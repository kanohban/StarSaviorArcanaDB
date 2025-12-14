import React from "react";
import styles from "./savior-desc-modal.module.css";
import ModalLeft from "./modal-left/modal-left";
import ModalRight from "./modal-right/modal-right";
import ModalCloseButton from "../../buttons/modal-close-button/modal-close-button";

export default function SaviorDescModal({ isActive, setIsActive, selected, next, prev }) {
    return (
        <div className={`${styles["modal"]} ${isActive ? `${styles["active"]}` : ""}`}>
            <div className={styles["window"]}>
                <ModalCloseButton onClick={() => setIsActive(false)} />
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