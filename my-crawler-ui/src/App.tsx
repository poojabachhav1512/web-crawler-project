import { Provider } from "./components/ui/provider"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Details from './pages/Details'; 
import { Toaster } from "./components/ui/toaster";
const queryClient = new QueryClient();

function App() {
  return (
    <><QueryClientProvider client={queryClient}>
      <Provider>
        <Router>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/details/:id" element={<Details />} />
          </Routes>
        </Router>
        <Toaster />
      </Provider>
    </QueryClientProvider></>
  );
}

export default App;