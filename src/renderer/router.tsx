import { HashRouter as Router, Route, Routes } from 'react-router-dom';
import SplashPage from './ui/splash';
import InstallerPage from './ui/installer';
import MainEditorPage from './ui/editor';

export const AppRouter = () => {
  console.log(window.location);
  return (
    <Router>
      <Routes>
        <Route path='/trainer/splash' element={<SplashPage/>} />
        <Route path='/trainer/install' element={<InstallerPage/>} />
        <Route path='/trainer/editor' element={<MainEditorPage/>} />
      </Routes>
    </Router>
  );
};
