Heroes of the Storm (Unofficial) API
====================================

What
----
This project is an unofficial release of Blizzard's [Heroes of the Storm](https://heroesofthestorm.com), since the game doesn't provide one. This isn't [HotsApi.net](https://hotsapi.net).

Endpoints
---------
All datas are in JSON format.
Winrates are percentual.

The first property of any object is `lastUpdate`, which is the time in milliseconds at which the requested datas were last updated.

- **/api/v1/heroes**

    Provides an JSON object containing an `array` of hero objects, with the following properties:
    - `name` (`String`): obvious.
    - `gamesPlayed` (`Int`): the number of games the hero has been played.
    - `gamesBanned` (`Int`): the number of games the hero has been banned.
    - `popularity` (`Float`): indicates the frequence of the hero presence in recent matches.
    - `winrate` (`Float`): the ratio between games won and games played by this hero.
    - `deltaWinrate` (`Float`): the increment/decrement of the hero winrate compared to the immediate past.
   
- **/api/v1/heroes/{hero_name}**
    
    Replace `{hero_name}` with the name of the hero, as it appears in-game/on Hotslogs.
    Provides an JSON object containing three arrays,

    - `talents` (`Array`): array of arrays containing talent objects, with the following properties:
         - `name` (`String`): The name of the talent.
         - `description` (`String`): The description of the talent.
         - `gamesPlayed` (`Int`): How many times this talent has been picked.
         - `popularity` (`Float`): How frequently this talent is picked.
         - `winrate` (`Float`): How many won games this talent has been picked.
    - `matchups` (`Array`): array of hero objects, with the following properties:
         - `name` (`String`)
         - `gamesPlayed` (`Int`)
         - `winrate` (`Float`)
    - `mapWinrate` (`Array`): array of map objects, with the following properties:
         - `name` (`String`)
         - `gamesPlayed` (`Int`)
         - `winrate` (`Float`)
         
- **/api/v1/players/{player_id}**
    
    Replace `{player_id}` with the ID of the player, as it appears in Hotslogs profile URL.
    Provides an JSON object containing infos about the player's ranking, hero pool and performance.

    - `playerName` (`String`): The player's BattleTag, without the #1234 part.
    - `teamLeague` (`String`): The player's MMR in team league.
    - `heroLeague` (`String`): The player's MMR in hero league.
    - `unrankedDraft` (`String`): The player's MMR in unranked draft.
    - `quickMatch` (`String`): The player's MMR in quickmatch.
    - `MVPrate` (`Float`): How many times the played was MVP at the end of the match.
    - `winrate` (`Float`): How many games the player won.
    - `heroLevel` (`Int`): Total hero level.
    - `gamesPlayed` (`Int`): Total games played.
    - `timePlayed` (`Int`): Total time played.

    
    - `heroes` (`Array`): array of hero objects, with the following properties:
         - `name` (`String`)
         - `gamesPlayed` (`Int`)
         - `averageGameLength` (`String`): Time in `hh:mm:ss` format.
         - `winrate` (`Float`)
    - `maps` (`Array`): array of map objects, with the following properties:
         - `name` (`String`): The name of the map.
         - `gamesPlayed` (`Int`)
         - `averageGameLength` (`String`): Time in `hh:mm:ss` format.
         - `winrate` (`Float`)
         
- **/api/v1/players/search/{name}** [OFFLINE] ❌
    
    Replace `{name}` with the BattleTag of the player, as it appears in BattleNet, without the `#1234`.
    Provides a JSON array containing objects of all the players found with that name:
    
    - `playerName` (`String`): The player's BattleTag, without the #1234 part.
    - `id` (`String`): The player's hotslogs.com id.
    - `region` (`String`): The player's region codename (EU, NA, KR, CN).
    - `MMR` (`Int`): The player's MMR (can be `null`).
    - `gamesPlayed` (`Int`): The player's MMR in unranked draft (can be `null`).
    
- **/api/v1/players/idFromTag/{region}/{BattleTag}** 
    
    On [hotslogs](https://hotslogs.com) public API, which we use to find the MMR, a player is uniquely identified with a BattleTag and a region. A player who played on multiple regions will have multiple indipendent profiles.
    
    Replace `{region}` with the player's region codename (US, EU, KR, CN) or id (1,2,3,5)
    Replace `{BattleTag}` with the BattleTag of the player as it appears in BattleNet (`BattleTag#1234`) **being careful to replace `#` with `_`**.
    
    It returns a JSON object containing the property:
    
    - `id` (`String`): The player's hotslogs.com id.