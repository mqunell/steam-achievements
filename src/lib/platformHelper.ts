import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import dbConnect from '@/data/dbConnect';
import Game from '@/models/Game';
import { getGame } from '@/data/dbHelper';

/**
 * -- Move this to pages/api/ for usage --
 *
 * This file helps with managing Xbox games since Microsoft doesn't provide APIs. Most of a game's data can be retrieved from Steam and
 * formatted automatically, so that only total playtime and achievements' completed status need to be manually entered.
 *
 * Steam's API doesn't support querying games directly for their basic data and achievements, so a user with a public profile and the
 * game in their library must be found to initially gather the data.
 *
 * After a game (either fresh from Steam or with values from the database) is updated, it gets sent back to be upserted into the database.
 */

const API_KEY = process.env.STEAM_API_KEY;

const userAchsUrl = (userId: string, gameId: string) =>
	`http://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?key=${API_KEY}&steamid=${userId}&appid=${gameId}&l=english`;

const globalAchsUrl = (userId: string, gameId: string) =>
	`http://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v0002/?gameid=${gameId}&l=english`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	const { task, userId, gameId, game } = req.body;
	console.log(req.body);

	let response;

	if (task === 'fetchSteamGame') {
		response = await fetchSteamGame({ userId, gameId });
	} else if (task === 'fetchDatabaseGame') {
		response = await fetchDatabaseGame({ gameId });
	} else if (task === 'upsertDatabaseGame') {
		response = await upsertDatabaseGame(game);
	} else {
		res.status(400).json('Invalid task');
	}

	res.status(200).json(response);
}

async function fetchSteamGame({ userId, gameId }): Promise<Game> {
	let userAchievementsRes;
	let globalAchievementsRes;

	try {
		userAchievementsRes = await axios.get(userAchsUrl(userId, gameId));
		globalAchievementsRes = await axios.get(globalAchsUrl(userId, gameId));
	} catch (e) {
		console.log('api error');
	}

	const apiUserAchievements: ApiUserAchievement[] =
		userAchievementsRes.data.playerstats.achievements;

	const apiGlobalAchievements: ApiGlobalAchievement[] =
		globalAchievementsRes.data.achievementpercentages.achievements;

	return {
		id: gameId,
		name: userAchievementsRes.data.playerstats.gameName,
		platform: 'Xbox',
		playtimeRecent: 0,
		playtimeTotal: 0,
		achievements: apiUserAchievements.map((apiAch) => ({
			id: apiAch.apiname,
			name: apiAch.name,
			description: apiAch.description,
			completed: false,
			completedTime: 0,
			globalCompleted: apiGlobalAchievements.find(
				(globalAch) => globalAch.name === apiAch.apiname
			).percent,
		})),
	};
}

async function fetchDatabaseGame({ gameId }): Promise<Game> {
	const game: Game = await getGame(gameId);
	return game;
}

async function upsertDatabaseGame(game: Game) {
	await dbConnect();

	// @ts-ignore
	const result = await Game.findOneAndUpdate({ id: game.id }, game, {
		upsert: true,
	})
		.then(() => `${game.name} upserted`)
		.catch((err) => err);

	return result;
}
