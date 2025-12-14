import React, { useEffect, useState } from "react";
import styles from "./header.module.css";
import NavItem from "./nav-item/nav-item";
import { useDispatch, useSelector } from "react-redux";
import { toggle as toggleTheme } from "../../store/reducers/toggle/themeToggle";
import { toggle as toggleMode } from "../../store/reducers/toggle/modeToggle";

export default function Header({ title }) {
    const dispatch = useDispatch();

    const [isActive, setIsActive] = useState(false);

    const theme = useSelector(state => state.theme.value);
    const mode = useSelector(state => state.mode.value);

    let themeIcon = theme === "dark" ? "🌙" : "☀️";
    let modeIcon = mode === "pc" ? "🖥️" : "📱";
    localStorage.setItem("theme", theme);
    localStorage.setItem("mode", mode);

    const toggleNav = () => {
        setIsActive(!isActive);
    }

    return (
        <header id={styles["header-container"]}>
            <div className={styles["header"]}>
                <div className={styles["header-left"]}>
                    <div className={styles["hamburger-wrapper"]}>
                        <button className={styles["header-btn"]} title="메뉴" onClick={() => toggleNav()}>
                            <i className="fa-solid fa-bars"></i>
                        </button>
                        <div className={`${styles["nav-dropdown"]} ${isActive ? `${styles["active"]}` : ""}`}>
                            <NavItem to={"savior"} />
                            <NavItem to={"arcana"} />
                            <NavItem to={"deck"} />
                            <NavItem to={"journey"} />
                            <NavItem to={"schedule"} />
                            <NavItem to={"gacha"} />
                        </div>
                    </div>
                </div>
                <div className={styles["title"]}>{title}</div>
                <div className={styles["header-right"]}>
                    <div className={styles["toggle-group"]}>
                        <button className={styles["header-btn"]} title="테마 변경" onClick={() => dispatch(toggleTheme())}>
                            <span>{themeIcon}</span>
                        </button>
                        <button className={styles["header-btn"]} title="뷰 전환" onClick={() => dispatch(toggleMode())}>
                            <span>{modeIcon}</span>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}