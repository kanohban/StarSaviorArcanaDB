import React, { useState } from "react";
import "./schedule.css";
import StarContainer from "../../components/star-container/star-container";
import Header from "../../components/header/header";

export default function Schedule() {
    const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
    const [mode, setMode] = useState(localStorage.getItem("mode") || "pc");

    return (
        <div className="contaier">
            <StarContainer />
            <Header theme={theme} setTheme={setTheme} 
                    mode={mode} setMode={setMode} 
                    title={"스케줄러"} />
            asdf
        </div>
    );
}