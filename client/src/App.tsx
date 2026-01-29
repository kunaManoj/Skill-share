import { BrowserRouter } from 'react-router-dom';
import Navbar from './components/Navbar';
import AnimatedRoutes from './components/AnimatedRoutes';
import { Toaster } from 'sonner';
import SEO from './components/SEO';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen text-gray-900 font-sans">
        <SEO title="Home" />
        <Toaster position="top-center" richColors />
        <Navbar />
        <main className="relative pt-16">
          <AnimatedRoutes />
        </main>
      </div>
    </BrowserRouter>
  );
}
export default App;
