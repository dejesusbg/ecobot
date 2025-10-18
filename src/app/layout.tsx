import { Inter } from 'next/font/google';
import './global.css';

const inter = Inter({});

export const metadata = {
	title: 'EcoBot',
	description: 'Asistente virtual ecológico para un robot hecho con materiales reciclados.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="es">
			<body className={inter.className}>{children}</body>
		</html>
	);
}
