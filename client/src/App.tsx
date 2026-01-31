import { BrowserRouter } from 'react-router-dom';
import Navbar from './components/Navbar';
import AnimatedRoutes from './components/AnimatedRoutes';
import { Toaster } from 'sonner';
import SEO from './components/SEO';

import { useTheme } from './context/ThemeContext';

function App() {
  const { theme } = useTheme();

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans">
        <SEO title="Home" />
        <Toaster position="top-center" richColors theme={theme as 'light' | 'dark'} />
        <Navbar />
        <main className="relative pt-16">
          <AnimatedRoutes />
        </main>
      </div>
    </BrowserRouter>
  );
}
export default App;
