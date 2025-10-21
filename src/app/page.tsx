'use client';
import clsx from 'clsx';
import { Maximize } from 'lucide-react';
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
		utterance.rate = 1.2;

		// change image
		let currentImage = 1;
		let ascending = true;
		const animationId = setInterval(() => {
			if (ascending) {
				currentImage += 1;
				if (currentImage >= 9) ascending = false;
			} else {
				currentImage -= 1;
				if (currentImage <= 1) ascending = true;
			}
			setImage(currentImage);
		}, 25);

		utterance.onend = () => {
			clearTimeout(animationId);
			setState('Esperando');
		};

		utterance.onerror = (e) => {
			console.error('Speech synthesis error:', e);
			clearTimeout(animationId);
			setState('Esperando');
		};

		window.speechSynthesis.speak(utterance);
	};

	const handleClick = () => {
		if (state !== 'Esperando' || !recognitionRef.current) return;
		setState('Escuchando');
		recognitionRef.current.start();
	};

	const fullscreen = () => {
		const elem = document.documentElement;
		if (elem.requestFullscreen) {
			elem.requestFullscreen();
		} else if ((elem as any).mozRequestFullScreen) {
			(elem as any).mozRequestFullScreen();
		} else if ((elem as any).webkitRequestFullscreen) {
			(elem as any).webkitRequestFullscreen();
		} else if ((elem as any).msRequestFullscreen) {
			(elem as any).msRequestFullscreen();
		}
	};

	const getButtonColour = (state: string) => {
		switch (state) {
			case 'Escuchando':
				return 'bg-red-500 animate-pulse';
			case 'Hablando':
				return 'bg-green-500 animate-pulse';
			default:
				return '';
		}
	};

	return (
		<>
			<div
				className="h-svh w-svw bg-center bg-cover bg-no-repeat fixed background"
				style={{ backgroundImage: `url(/${state === 'Hablando' ? image : 0}.png)` }}
				onClick={handleClick}
			/>
			<div className="fixed bottom-4 right-4 space-x-2 flex">
				<div className={clsx('glass', getButtonColour(state))}>
					<span className="text-sm font-semibold">
						{state === 'Esperando' ? 'Presiona la pantalla' : state}
					</span>
				</div>
				<button onClick={fullscreen} className={clsx('glass', getButtonColour(state))}>
					<Maximize size={16} />
				</button>
			</div>
		</>
	);
}
