import React from "react";
import styles from "./footer.module.css";
import { useLocation } from "react-router-dom";

export default function Footer() {
    const location = useLocation();
    
    return (
        <div id="footer-container" className={`${styles["app-footer"]} ${location.pathname === "/" ? `${styles["main"]}` : ""}`}>
            <p>이 페이지는 게임 '스타 세이비어'의 비영리 팬 프로젝트입니다.</p>
            <p>프로젝트에 사용된 모든 자산, 데이터, 이미지 및 텍스트의 소유권은 STUDIOBSIDE 에 있습니다.</p>
            <p>© STUDIOBSIDE Co. Ltd All Rights Reserved.</p>
            <p>제보/문의 kanohban@gmail.com</p>
            <div className="hits-counter" style={{ marginTop: "10px"}}>
                <a href="https://myhits.vercel.app">
                    <img src="https://myhits.vercel.app/api/hit/https%3A%2F%2Fkanohban.github.io%2FStarSaviorArcanaDB%2F?color=blue&amp;label=hits&amp;size=small" alt="hits" />
                </a>
            </div>
        </div>
    );
}