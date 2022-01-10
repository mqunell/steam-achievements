import { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import { GetStaticPaths, GetStaticProps } from 'next';
import classNames from 'classnames';
import { BadgeCheckIcon } from '@heroicons/react/solid';
import { getGames } from '../../lib/games';
import { Achievement, getAchievements } from '../../lib/achievements';

export const getStaticPaths: GetStaticPaths = async () => {
	const games = await getGames();
	const paths = games.map(({ gameId }) => ({
		params: { gameId },
	}));

	return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
	const gameId = params.gameId as string;
	const achievements = await getAchievements(gameId);

	return { props: { achievements }, revalidate: 60 };
};

export default function Game({ achievements }) {
	return (
		<div className="flex flex-col items-center gap-4 p-8">
			<Head>
				<title>Next.js App</title>
				<meta name="description" content="Next.js App" />
				<link rel="icon" href="/favicon.ico" />
			</Head>

			<h1 className="text-2xl">Achievements</h1>
			<div className="flex flex-col gap-8 w-80">
				{achievements ? (
					achievements.map((ach: Achievement) => (
						<AchievementCard key={ach.apiName} achievement={ach} />
					))
				) : (
					<p>None</p>
				)}
			</div>
		</div>
	);
}

function AchievementCard({ achievement }) {
	const { name, description, completed, completedTime, globalCompleted } = achievement;

	const [isVisible, setVisible] = useState(false);
	const domRef = useRef<HTMLDivElement>();

	useEffect(() => {
		const observer = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					setVisible(entry.isIntersecting);
				}
			});
		});

		observer.observe(domRef.current);

		return () => observer.unobserve(domRef.current);
	}, []);

	return (
		/* Container - Card and Checkmark sit in the same grid cell */
		<div
			className={classNames(
				'grid grid-cols-[1fr]',
				'opacity-0 translate-y-4 transition-[opacity_translate] duration-500',
				{ 'opacity-100 translate-y-0': isVisible }
			)}
			ref={domRef}
		>
			{/* Checkmark overlay */}
			{completed && (
				<div className={classNames('row-start-1 col-start-1 relative')}>
					<div
						className={classNames(
							'absolute -top-3 -right-4 w-max h-max p-1.5 bg-green-500 rounded-full z-10',
							'scale-0 transition-transform duration-500 delay-500',
							{ 'scale-100': isVisible }
						)}
					>
						<BadgeCheckIcon className="w-8 h-8 text-white" />
					</div>
				</div>
			)}

			{/* Card text and bar */}
			<div className="row-start-1 col-start-1 relative flex flex-col text-black text-center bg-white rounded overflow-hidden">
				{/* Text */}
				<div className="flex flex-col items-center gap-1 p-4">
					<h2 className="text-lg font-semibold">{name}</h2>
					{description ? (
						<p>{description}</p>
					) : (
						<p className="italic">Description not provided</p>
					)}
					{completed && (
						<>
							<hr className="w-1/6 my-2 border-black" />
							<p className="text-sm">
								{new Date(completedTime * 1000).toLocaleString('en-US')}
							</p>
						</>
					)}
				</div>

				{/* Completion bar */}
				<div className="w-full bg-blue-200">
					<div
						className={classNames(
							'p-1.5 bg-blue-600',
							'scale-x-0 transition-transform origin-left duration-500 delay-500',
							{ 'scale-x-100': isVisible }
						)}
						style={{ width: globalCompleted + '%' }}
					>
						<p className="w-max px-1.5 py-0.5 text-xs bg-white border border-black rounded">
							{globalCompleted.toFixed(1)}%
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
