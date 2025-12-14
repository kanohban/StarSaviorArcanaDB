import React from "react";
import styles from "./scroll-up-button.module.css";

export default function ScrollUpButton() {
    const upToTop = () => {
        window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }

    return (
        <button type="button" className={styles["scroll-up-button"]} onClick={() => upToTop()}>
            <i className="fa-solid fa-arrow-up" />
        </button>
    );
}