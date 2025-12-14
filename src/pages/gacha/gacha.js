import React, { useState } from "react";
import "./gacha.css";
import StarContainer from "../../components/star-container/star-container";
import Header from "../../components/header/header";

export default function Gacha() {
    const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
    const [mode, setMode] = useState(localStorage.getItem("mode") || "pc");

    return (
        <div className="contaier">
            <StarContainer />
            <Header theme={theme} setTheme={setTheme} 
                    mode={mode} setMode={setMode} 
                    title={"가챠 시뮬레이터"} />
            asdf
        </div>
    );
}