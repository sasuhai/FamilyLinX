import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { FamilyApp } from './FamilyApp';
import { AdminPage } from './pages/AdminPage';
import { AboutPage } from './pages/AboutPage';
import { CalendarPage } from './pages/CalendarPage';
import { AlbumPage } from './pages/AlbumPage';
import { LanguageProvider } from './contexts/LanguageContext';
import './index.css';

function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/:rootSlug/calendar" element={<CalendarPage />} />
          <Route path="/:rootSlug/albums" element={<AlbumPage />} />
          <Route path="/:rootSlug/:groupSlug" element={<FamilyApp />} />
          <Route path="/:rootSlug" element={<FamilyApp />} />
          <Route path="/" element={<Navigate to="/about" replace />} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;
