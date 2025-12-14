import React from "react";
import styles from "./nav-item.module.css";
import { Link } from "react-router-dom";

export default function NavItem({ to }) {
    let kor = "";
    switch(to) {
        case "arcana":
            kor = "아르카나";
            break;
        case "savior":
            kor = "구원자";
            break;
        case "deck":
            kor = "덱 구성";
            break;
        case "journey":
            kor = "여정";
            break;
        case "schedule":
            kor = "스케줄러";
            break;
        case "gacha":
            kor = "가챠";
            break;
    }

    return (
        <Link className={styles["nav-item"]} to={`/${to}`} >
            <div className={styles["icon"]}>
                <img src={`images/index/${to}.png`} />
            </div>
            <span>{kor}</span>
        </Link>
    );
}