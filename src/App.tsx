import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { StripeProvider } from './contexts/StripeContext';
import { ParticlesProvider } from './contexts/ParticlesContext';
import { DataProvider } from './contexts/DataContext';
import { SidebarProvider } from './contexts/SidebarContext';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Charts from './pages/Charts';
import EVBets from './pages/EVBets';
import Settings from './pages/Settings';
import Subscription from './pages/Subscription';
import ArbitrageBetting from './pages/ArbitrageBetting';
import EVBetting from './pages/EVBetting';
import Lines from './pages/Lines';
import FAQ from './pages/FAQ';
import NotFound from './pages/NotFound';
import VerificationBanner from './components/VerificationBanner';

function App() {
	return (
		<HelmetProvider>
		<Router>
			<AuthProvider>
				<SettingsProvider>
					<StripeProvider>
						<DataProvider>
							<SidebarProvider>
								<ParticlesProvider>
									<VerificationBanner />
									<Routes>
										<Route path="/" element={<Home />} />
										<Route path="/dashboard" element={<Dashboard />} />
										<Route path="/charts" element={<Charts />} />
										<Route path="/ev-bets" element={<EVBets />} />
										<Route path="/settings" element={<Settings />} />
										<Route path="/pricing" element={<Subscription />} />
										<Route path="/lines" element={<Lines />} />
										<Route path="/arbitrage-betting" element={<ArbitrageBetting />} />
										<Route path="/ev-betting" element={<EVBetting />} />
										<Route path="/faq" element={<FAQ />} />
										<Route path="*" element={<NotFound />} />
									</Routes>
								</ParticlesProvider>
							</SidebarProvider>
						</DataProvider>
					</StripeProvider>
				</SettingsProvider>
			</AuthProvider>
		</Router>
		</HelmetProvider>
	);
}

export default App;
