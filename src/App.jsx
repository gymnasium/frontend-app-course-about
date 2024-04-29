import React from "react";
import { Route, Routes } from "react-router-dom";
import CourseAbout from './course-about/CourseAbout';

function App() {
  return (
    <Routes>
      <Route path="*" element={<CourseAbout />} />
    </Routes>
  );
}

export default App;