'use client';

import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function ChatPage() {
	const [message, setMessage] = useState('');
	const [history, setHistory] = useState<Array<{ role: string; parts: string[] }>>([]);
	const historyRef = useRef<Array<{ role: string; parts: string[] }>>([]);
	const [isLoading, setIsLoading] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	};

	useEffect(() => {
		scrollToBottom();
	}, [history]);

	const handleSendMessage = async () => {
		if (!message.trim() || isLoading) return;
		setIsLoading(true);

		const text = message;
		setMessage('');

		const newHistory = [...historyRef.current, { role: 'user', parts: [text] }];
		setHistory(newHistory);
		historyRef.current = newHistory;

		try {
			const res = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message: text, history: historyRef.current }),
			});

			if (!res.ok) throw new Error('API request failed');
			const { reply } = await res.json();

			const finalHistory = [...historyRef.current, { role: 'model', parts: [reply] }];
			setHistory(finalHistory);
			historyRef.current = finalHistory;
		} catch (error) {
			console.error('Error sending message:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSendMessage();
		}
	};

	const canSendMessage = (): boolean => {
		const isEmpty = !Boolean(message.trim());
		const lastMessage = history.at(-1);
		return !isLoading && !isEmpty && (!history.length || lastMessage?.role == 'model');
	};

	return (
		<>
			<div className="h-screen w-screen bg-center bg-cover bg-no-repeat fixed background bg-[url('/0.png')]" />
			<div className="absolute z-50 w-screen flex py-4 top-0 blur-to-t">
				<div className="mx-auto glass">
					<h1 className="text-sm font-semibold">Chatea con EcoBot Lawrence</h1>
				</div>
			</div>
			<div className="flex flex-col h-screen w-screen ">
				<div className="flex-1 overflow-y-auto px-4 space-y-4 py-16">
					<AnimatePresence>
						{history.map((msg, index) => (
							<motion.div
								key={index}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -20 }}
								transition={{ duration: 0.3 }}
								className={clsx('flex', { 'justify-end': msg.role === 'user' })}>
								<div
									className={clsx('max-w-[70%] glass', {
										'bg-blue-500': msg.role === 'user',
									})}>
									<p className="text-sm">{msg.parts[0]}</p>
								</div>
							</motion.div>
						))}
					</AnimatePresence>
					<div ref={messagesEndRef} />
				</div>
			</div>
			<div className="flex items-center p-4 space-x-2 absolute z-50 w-screen bottom-0 blur-to-b">
				<textarea
					value={message}
					onChange={(e) => setMessage(e.target.value)}
					onKeyPress={handleKeyPress}
					placeholder="Escribe un mensaje..."
					className="flex-1 text-sm glass placeholder-gray-300 focus:outline-none resize-none"
					rows={1}
				/>
				<button
					onClick={handleSendMessage}
					disabled={!canSendMessage()}
					className={clsx('glass flex items-center justify-center h-full', {
						'bg-blue-500 text-white': canSendMessage(),
					})}>
					<Send
						size={16}
						className={clsx({
							'text-white': canSendMessage(),
							'text-gray-300': !canSendMessage(),
						})}
					/>
				</button>
			</div>
		</>
	);
}
