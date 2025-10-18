'use client';
import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';

type STATE = 'Escuchando' | 'Hablando' | 'Pensando' | 'Esperando';

export default function App() {
	const [state, setState] = useState<STATE>('Esperando');
	const [history, setHistory] = useState<Array<{ role: string; parts: string[] }>>([]);
	const historyRef = useRef<Array<{ role: string; parts: string[] }>>([]);
	const [image, setImage] = useState<number>(0);
	const recognitionRef = useRef<any>(null);

	useEffect(() => {
		const SpeechRecognition =
			(window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
		if (!SpeechRecognition) {
			console.error('SpeechRecognition API not supported in this browser.');
			return;
		}

		const recognition = new SpeechRecognition();
		recognition.lang = 'es-CO';
		recognition.continuous = false;
		recognition.interimResults = false;

		recognition.onresult = (e: any) => {
			const transcript = e.results[0][0].transcript;
			handleUserInput(transcript);
		};

		recognition.onend = () => {
			if (state === 'Escuchando') setState('Esperando');
		};

		recognition.onerror = (e: any) => {
			console.error('Speech recognition error:', e.error);
			setState('Esperando');
		};

		recognitionRef.current = recognition;
		return () => recognition.stop();
	}, []);

	useEffect(() => {
		historyRef.current = history;
	}, [history]);

	// preload images
	useEffect(() => {
		[0, 1, 2, 3, 4, 5, 6].map((i) => {
			const img = new Image();
			img.src = `/${i}.png`;
			return img;
		});
	}, []);

	const handleUserInput = async (text: string) => {
		if (!recognitionRef.current) return;
		recognitionRef.current.stop();
		setState('Pensando');

		try {
			const res = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message: text, history: historyRef.current }),
			});

			if (!res.ok) throw new Error('API request failed');
			const { reply } = await res.json();

			const newHistory = [
				...historyRef.current,
				{ role: 'user', parts: [text] },
				{ role: 'model', parts: [reply] },
			];

			setHistory(newHistory);
			speak(reply);
		} catch (err) {
			console.error('Error in handleUserInput:', err);
			setState('Esperando');
		}
	};

	const speak = (text: string) => {
		if (!window.speechSynthesis) {
			console.error('SpeechSynthesis not supported');
			setState('Esperando');
			return;
		}

		setState('Hablando');
		window.speechSynthesis.cancel();
		const utterance = new SpeechSynthesisUtterance(text);
		utterance.lang = 'es-CO';
		utterance.rate = 1.25;

		// change image on word boundary
		utterance.onboundary = (e) => setImage(Math.floor(Math.random() * 6) + 1);

		utterance.onend = () => setState('Esperando');

		utterance.onerror = (e) => {
			console.error('Speech synthesis error:', e);
			setState('Esperando');
		};

		window.speechSynthesis.speak(utterance);
	};

	const handleClick = () => {
		if (state !== 'Esperando' || !recognitionRef.current) return;
		setState('Escuchando');
		recognitionRef.current.start();
	};

	return (
		<>
			<div
				className="h-screen w-screen bg-center bg-cover bg-no-repeat fixed background"
				style={{
					backgroundImage: `url(/${state == 'Hablando' ? image + '.png' : '0.png'})`,
				}}
				onClick={handleClick}></div>
			<div className="fixed bottom-4 right-4 flex items-center justify-center">
				<div
					className={clsx(
						'px-4 py-2 rounded-full text-white text-lg font-medium shadow-lg transition-all duration-300 ease-in-out opacity-75',
						{
							Escuchando: 'bg-red-500/75 animate-pulse',
							Hablando: 'bg-green-500/75',
							Pensando: 'bg-blue-500/75',
							Esperando: 'bg-gray-600/75',
						}[state]
					)}>
					<span className="capitalize">{state === 'Esperando' ? 'Presiona' : state}</span>
				</div>
			</div>
		</>
	);
}
