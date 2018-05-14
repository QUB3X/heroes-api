// server.js
// where your node app starts

// init project
const express = require('express')
const request = require('request')
const cheerio = require('cheerio')
const db = require('./database')
const path = require('path')
const app = express();

const URL = process.env.URL1

// TODO: Add sanitizer
//app.use(require('sanitize').middleware);

app.listen(process.env.PORT, () => console.log('Server live 👌'))

app.use(express.static('public'))

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, '/index.html'))
})

// API FUNCTIONS
app.get("/api/v1/heroes", async (req, res) => {
  
  let lastData = await db.fetchFromDB("heroes", "");
  
  // If the last update is more than 24h old, update the file
  if(lastData == null || Date.now() - lastData.lastUpdate > 1000*60*60*24) {

    // Ask Hotslogs for the page
    request(URL + "Default", (err, resp, html) => {
      // If everything is ok
      if(!err && resp.statusCode == 200) {

        // Create the return object
        let resObj = {
          lastUpdate: Date.now(),
          heroes: []
        }
        // Parse HTML in readable object
        let $ = cheerio.load(html)
        $('tr', 'tbody').each((i, elem) => {
          let hero = {}
          hero.name = $('td:nth-child(2)', elem).text()
          hero.gamesPlayed = parseInt($('td:nth-child(3)', elem).text())
          hero.gamesBanned = parseInt($('td:nth-child(4)', elem).text())
          hero.popularity = parseFloat($('td:nth-child(5)', elem).text())
          hero.winrate = parseFloat($('td:nth-child(6)', elem).text().replace("%",""))
          hero.deltaWinrate = parseFloat($('td:nth-child(7)', elem).text().replace("%", ""))

          // Save stats in object
          resObj.heroes.push(hero)
        })


        // Return the data in plain JSON
        res.send(JSON.stringify(resObj))
        // and save a copy to db
        db.saveToDB("heroes", "", resObj)
      }
    })
  } else {
    //console.log("Showing cached data")
    res.send(lastData)
  }
})

app.get("/api/v1/heroes/:name", async (req, res) => {
  
  const heroName = req.params.name
  
  let lastData = await db.fetchFromDB(heroName, "heroes/")
  // If the last update is more than 24h old, update the file
  if(lastData == null || Date.now() - lastData.lastUpdate > 1000*60*60*24) {
    // Ask Hotslogs for the page
    // Hero name is exactly as in-game, example: Gul'dan or Gul%27dan
    // If the heroes isnt found, HotsLogs returns ABATHUR profile

    request(URL + process.env.URL_HERO + heroName, (err, resp, html) => {
      // If everything is ok
      if(!err && resp.statusCode == 200) {

        // Create the return object
        let resObj = {
          lastUpdate: Date.now(),
          talents: [],
          matchups: [],
          mapWinrate: []
        }

        // Parse HTML in readable object
        let $ = cheerio.load(html)

        /// TALENTS
        let tier = -1
        let tierArr = []
        $('#talentDetails #ctl00_MainContent_RadGridHeroTalentStatistics_ctl00 tr').each(function(i, elem) {
          // If Row isnt a talent but it's a tier, update tier

          if($(elem).hasClass("rgGroupHeader")) {
            // Avoid null talent tier
            if(tier > -1) {
              resObj.talents.push(tierArr)
            }
            // Pass to next tier
            tier++
            // Reset it too
            tierArr = []
          } else {
            // Create new talent
            let talent = {}

            // Get data for talent
            talent.name = $('td:nth-child(4)', elem).text()
            talent.description = $('td:nth-child(5)', elem).text()
            talent.gamesPlayed = parseInt($('td:nth-child(6)', elem).text())
            talent.popularity = parseFloat($('td:nth-child(7)', elem).text())
            talent.winrate = parseFloat($('td:nth-child(7)', elem).text().replace("%", ""))


            // Add talent to Tier
            tierArr.push(talent)
          }

        })
        // Push the last Talent Tier
        resObj.talents.push(tierArr)

        /// MATCHUPS
        $('#winRateVsOtherHeroes tbody tr').each((i, elem) => {
          let hero = {}
            hero.name = $('td:nth-child(2)', elem).text()
            hero.gamesPlayed = parseInt($('td:nth-child(3)', elem).text())
            hero.winrate = parseFloat($('td:nth-child(4)', elem).text().replace("%", ""))

          resObj.matchups.push(hero)
        })

        /// MAP WINRATE
        $('#winRateByMap tbody tr').each((i, elem) => {
          let map = {}
            map.name = $('td:nth-child(2)', elem).text()
            map.gamesPlayed = parseInt($('td:nth-child(3)', elem).text())
            map.winrate = parseFloat($('td:nth-child(4)', elem).text().replace("%", ""))

          resObj.mapWinrate.push(map)
        })


        // Return the data in plain JSON
        res.send(JSON.stringify(resObj))
        // and save a copy to db
        db.saveToDB(heroName, "heroes/", resObj)
      } else {
        // If there's a error
        res.status(404).send("We couldn'find the hero stats you requested, double check the name!")
      }
    })
  } else {
    //console.log("Showing cached data")
    res.send(lastData)
  }
})

app.get("/api/v1/players/:id", async (req, res) => {
  
  const playerId = req.params.id
  if(isNaN(playerId)){
    res.status(400).send("Input was not numeric")
    return
  }
  
  let lastData = await db.fetchFromDB(playerId, "players/")
  
  // If the last update is more than 24h old, update the file
  if(lastData == null || Date.now() - lastData.lastUpdate > 1000*60*60*24) {
    request(URL + process.env.URL_PLAYER + playerId, (err, resp, html) => {
      // If everything is ok
      if(!err && resp.statusCode == 200) {
        let resObj = {
          lastUpdate: Date.now()
        }

        let $ = cheerio.load(html)
        if($('#body #h1Title > h1').text().split(' ')[2]) {
          // Get general stats - had to hardcode them :(
          resObj.playerName = $('#body #h1Title > h1').text().split(' ')[2].replace(" ", "")
          resObj.teamLeague = $('#ctl00_MainContent_RadGridGeneralInformation_ctl00 tbody tr:nth-child(1) td:nth-child(2)').text()
          resObj.heroLeague = $('#ctl00_MainContent_RadGridGeneralInformation_ctl00 tbody tr:nth-child(2) td:nth-child(2)').text()
          resObj.unrankedDraft = $('#ctl00_MainContent_RadGridGeneralInformation_ctl00 tbody tr:nth-child(3) td:nth-child(2)').text()
          resObj.quickMatch = $('#ctl00_MainContent_RadGridGeneralInformation_ctl00 tbody tr:nth-child(4) td:nth-child(2)').text()
          resObj.MVPrate = parseFloat($('#ctl00_MainContent_RadGridGeneralInformation_ctl00 tbody tr:nth-child(5) td:nth-child(2)').text().replace("%",""))
          resObj.winrate = parseFloat($('#ctl00_MainContent_RadGridGeneralInformation_ctl00 tbody tr:nth-child(6) td:nth-child(2)').text().replace("%",""))
          resObj.heroLevel = parseInt($('#ctl00_MainContent_RadGridGeneralInformation_ctl00 tbody tr:nth-child(7) td:nth-child(2)').text())
          resObj.gamesPlayed = parseInt($('#ctl00_MainContent_RadGridGeneralInformation_ctl00 tbody tr:nth-child(8) td:nth-child(2)').text())
          resObj.timePlayed = $('#ctl00_MainContent_RadGridGeneralInformation_ctl00 tbody tr:nth-child(9) td:nth-child(2)').text()
          // Create empty array for heroes and maps stats
          resObj.heroes = []
          resObj.maps = []

          // Get played heroes stats
          $('#ctl00_MainContent_RadGridCharacterStatistics_ctl00 tbody tr').each((i, elem) => {
            // Create empty object
            let hero = {}

            // Get data from the page
            hero.name = $('td:nth-child(3)', elem).text()
            hero.gamesPlayed = parseInt($('td:nth-child(5)', elem).text())
            hero.averageGameLength = $('td:nth-child(6)', elem).text()
            hero.winrate = parseFloat($('td:nth-child(7)', elem).text().replace("%", ""))
            // Save hero stats into the response object
            resObj.heroes.push(hero)
          })

          $('#ctl00_MainContent_RadGridMapStatistics_ctl00 tbody tr').each((i, elem) => {
            // Create empty object
            let map = {}

            map.name = $('td:nth-child(4)', elem).text()
            map.gamesPlayed = parseInt($('td:nth-child(5)', elem).text())
            map.averageGameLength = $('td:nth-child(6)', elem).text()
            map.winrate = parseFloat($('td:nth-child(7)', elem).text().replace("%", ""))

            resObj.maps.push(map)
          })

          // Send JSON response
          res.send(resObj)
          // and save a copy to db
          db.saveToDB(playerId, "players/", resObj)
        } else {
          // If there's a error
          res.status(404).send("We couldn'find the player you requested.")
        }
      } else {
          res.status(404).send("We couldn'find the page!")
      }
    })
  } else {
    //console.log("Showing cached data")
    res.send(lastData)
  }
})



/*
app.get("/api/v1/players/search/:query", async (req, res) => {
  
  const query = req.params.query
  
  request(URL + "PlayerSearch?Name=" + query, (err, resp, html) => {
    // If everything is ok
    if(!err && resp.statusCode == 200) {
      let resObj = []
            
      let $ = cheerio.load(html)
      
      // For each row...
      $('tbody tr').each((i, elem) => {
        let player = {}
        
        player.id = $('td:nth-child(1)', elem).text()
        player.region = $('td:nth-child(3)', elem).text()
        player.playerName = $('td:nth-child(4) > a', elem).text()
        player.MMR = parseInt($('td:nth-child(5)', elem).text())
        player.gamesPlayed = parseInt($('td:nth-child(6)', elem).text())
        
        resObj.push(player)
      })

      // Send JSON response
      res.send(resObj)      
    } else {
      // If there's a error
      res.status(404).send("We couldn't find that page!")
    }
  })
}) */

// Use if you have the BattleTag#1234 and not the numeric ID 1234567
app.get("/api/v1/players/battletag/:region/:tag", async (req, res) => {
  const tag = req.params.tag
  const region = req.params.region.toUpperCase()
  
  let r;
  switch(region){
    case "NA":  r = 1;
                break;
    case "EU":  r = 2;
                break;
    case "KR":  r = 3;
                break;
    case "CN":  r = 5;
                break;
    default:    r = region;
  }
  
  if(!isNaN(r) && tag.includes("_")){
    request(process.env.API_PLAYERS + r + "/" + tag, (err, resp, html) => {

      let src = JSON.parse(html)
      if(src) {
        let resObj = {}
        resObj.id = src.PlayerID
        res.send(resObj)
      } else{
        res.status(404).send("We couldn't find your profile!")
      }
    })
  } else {
    res.status(400).send("Wrong input")
  }
})
