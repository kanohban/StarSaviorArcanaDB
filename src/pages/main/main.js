import React from "react";
import styles from "./main.module.css";
import Footer from "../../components/footer/footer";
import Menu from "../../components/main/menu";
import StarContainer from "../../components/star-container/star-container";

export default function Main() {
    return(
        <div id="container">
            <StarContainer />
            <a href="https://starsavior.com/kr" className={styles["logo-container"]} target="_blank" >
                <img className={styles["logo"]} src="/images/index/logo.png" />
            </a>
            <div className={styles["main"]}>
                <div className={styles["splash-container"]}>
                    <img src="/images/index/title.png" className={styles["splash-image"]} />
                    <div className={styles["title"]}>스타 세이비어 DB</div>
                </div>
                <div className={styles["menus"]}>
                    <Menu to={"arcana"} />
                    <Menu to={"savior"} />
                    <Menu to={"journey"} />
                    <Menu to={"deck"} />
                    <Menu to={"schedule"} />
                    <Menu to={"gacha"} />
                </div>
                <Footer />
            </div>
        </div>
    );
}