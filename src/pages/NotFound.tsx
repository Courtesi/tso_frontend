import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

function NotFound() {
	const navigate = useNavigate();

	return (
		<div className="min-h-screen bg-gray-900 flex flex-col">
			<Navbar />

			<div className="flex-grow flex items-center justify-center px-4">
				<div className="text-center">
					<h1 className="text-9xl font-bold text-white mb-4">404</h1>
					<h2 className="text-3xl font-semibold text-gray-300 mb-4">Page Not Found</h2>
					<p className="text-gray-200 mb-8 max-w-md mx-auto">
						Oops! The page you're looking for doesn't exist. It might have been moved or deleted.
					</p>
					<button
						onClick={() => navigate('/')}
						className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl cursor-pointer"
					>
						Go Home
					</button>
				</div>
			</div>

			<Footer />
		</div>
	);
}

export default NotFound;
