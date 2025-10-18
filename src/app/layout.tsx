import { Inter } from 'next/font/google';
import './global.css';
import ServiceWorkerRegister from './ServiceWorkerRegister';

const inter = Inter({});

export const metadata = {
	title: 'EcoBot',
	description: 'Asistente virtual ecológico para un robot hecho con materiales reciclados.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="es">
			<head>
				{/* PWA metadata */}
				<link rel="manifest" href="/manifest.json" />
				<meta name="theme-color" content="#0f172a" />
				<meta name="mobile-web-app-capable" content="yes" />
				<meta name="apple-mobile-web-app-capable" content="yes" />
				<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
				<link rel="apple-touch-icon" href="/icons/icon-192.svg" />
			</head>
			<body className={inter.className}>
				{children}
				<ServiceWorkerRegister />
			</body>
		</html>
	);
}
