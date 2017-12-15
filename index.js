Promise = require('bluebird')
const { execAsync } = Promise.promisifyAll(require('child_process'))
const axios = require('axios')
const fs = Promise.promisifyAll(require('fs'))

let lastWeather

function logData() {
  //free api key wouldn't allow every minute
  const minuteOfHour = (new Date()).getMinutes()
  const shouldGetWeather = !lastWeather || (minuteOfHour > 0 && minuteOfHour % 10 === 0)

  Promise.join(
    execAsync('raspistill -t 500 -w 400 -h 250 -cfx 128:128 -sh 100 -co 100 -rot 90 -q 80 -o - | ssocr -d -1 invert -'),
    shouldGetWeather ?
      axios.get(`http://api.wunderground.com/api/${process.env.WUNDERGROUND_API_KEY}/conditions/q/55410.json`).then(resp => resp.data) :
      lastWeather
  ).spread((boilerLcd, weather) => {``
    lastWeather = weather

    fs.writeFileAsync(
      'data.json',
      JSON.stringify({
        date: new Date(),
        boilerLcd: boilerLcd.trim(),
        outdoorTempF: weather.current_observation.temp_f,
      })
    )
  })
}

setInterval(() => logData(), 1000 * 60)

logData()