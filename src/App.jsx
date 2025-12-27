import { BrowserRouter, Routes, Route } from "react-router-dom";
import EventPage from "./pages/EventPage";
import Expired from "./pages/Expired";
import Success from "./pages/Success";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/event/:id" element={<EventPage />} />
        <Route path="/expired" element={<Expired />} />
        <Route path="/success" element={<Success />} />
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
