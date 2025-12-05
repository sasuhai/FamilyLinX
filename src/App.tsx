import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { FamilyApp } from './FamilyApp';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/:familyId" element={<FamilyApp />} />
        <Route path="/" element={<Navigate to="/demo-family" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
