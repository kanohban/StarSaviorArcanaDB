import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Provider } from "react-redux";
import Main from "./pages/main/main";
import Savior from "./pages/savior/savior";
import Arcana from "./pages/arcana/arcana";
import Deck from "./pages/deck/deck";
import Journey from "./pages/journey/journey";
import Schedule from "./pages/schedule/schedule";
import Gacha from "./pages/gacha/gacha";
import store from "./store/store";

export default function App() {
    return (
        <Provider store={store}>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Main />} />
                    <Route path="/savior" element={<Savior />} />
                    <Route path="/arcana" element={<Arcana />} />
                    <Route path="/deck" element={<Deck />} />
                    <Route path="/journey" element={<Journey />} />
                    <Route path="/schedule" element={<Schedule />} />
                    <Route path="/gacha" element={<Gacha />} />
                </Routes>
            </BrowserRouter>
        </Provider>
    );
}
