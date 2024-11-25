type ApiGame = {
	appid: number
	name: string
	playtime_2weeks?: number // Minutes; not included by API if 0
	playtime_forever: number // Minutes
	// Others are irrelevant
}

type ApiUserAchievement = {
	apiname: string // ID
	achieved: number
	unlocktime: number
	name: string
	description: string
}

type ApiGlobalAchievement = {
	name: string // ID
	percent: number
}
