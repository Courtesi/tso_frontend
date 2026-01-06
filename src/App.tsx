import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { StripeProvider } from './contexts/StripeContext';
import { ParticlesProvider } from './contexts/ParticlesContext';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Terminal from './pages/Terminal';
import Subscription from './pages/Subscription';
import NotFound from './pages/NotFound';
import VerificationBanner from './components/VerificationBanner';

function App() {
	return (
		<Router>
			<AuthProvider>
				<StripeProvider>
					<ParticlesProvider>
						<VerificationBanner />
						<Routes>
							<Route path="/" element={<Home />} />
							<Route path="/dashboard" element={<Dashboard />} />
							<Route path="/terminal" element={<Terminal />} />
							<Route path="/pricing" element={<Subscription />} />
							<Route path="/subscription" element={<Subscription />} />
							<Route path="*" element={<NotFound />} />
						</Routes>
					</ParticlesProvider>
				</StripeProvider>
			</AuthProvider>
		</Router>
	);
}

export default App;
