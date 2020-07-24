const d3 = require("d3")
const d3arr = require("d3-array")

const constants = require("./constants")

const removeDiacritics = (word) => {
 return word.replace(/[^A-Za-z0-9\[\] ]/g, (a) => {
   return constants.latin_character_map[a] || a
 })
}

const wordCounter = (array) => {

  let words = new Map();

  array.forEach(m => {

    let word_array = removeDiacritics(m.message).match(constants.word_regex)

    if (word_array != null) {
      word_array.forEach(w => {
        if (!constants.stop_words.includes(w.toLowerCase())) {
          if (!words.get(w.toLowerCase()))
              words.set(w.toLowerCase(), 1)
          else
            words.set(w.toLowerCase(), words.get(w.toLowerCase()) + 1)
        }
      })
    }

  })

  return words

}

const averageWordLength = (array) => {

  let word_len_arr = array
    .map(d => d.message.match(constants.word_regex))
    .map(dd => {
      let char_count = 0;
      if (dd != null) {
        dd.forEach(w => char_count += w.length)
        return char_count / dd.length
      }
    })

  return d3.mean(word_len_arr)

}

const wordCount = (m) => m.replace(constants.emoji_regex, "").trim().split(" ")

const regexWordCount = (array) => {
  return d3.mean(array.map(d => wordCount(d.message).length))
}

const mediaCount = (array, media_tag) => {
  return array.filter(d => d.message.includes(media_tag)).length
}

const emojiCount = (array) => {
  return d3.sum(array.map(d => (d.message.match(constants.emoji_regex) || []).length))
}

const getResponseTimeArray = (array, author) => {

  let responseSeconds = (date1, date2) => {
    return 1e-3 * (date2.getTime() - date1.getTime())
  }

  // get indexes
  let temp1 = array.map((d,i) => {
    if (d.author !== author)
      return i
  }).filter(d => d !== undefined)

  // get gaps
  let temp2 = temp1.map((d, i) => {
    if (temp1[i+1] !== d + 1 && i != temp1.length - 1)
      return d
  }).filter(d => d !== undefined)

  // get response time
  return temp2.map(d => {
    let d1 = new Date(array[d].date),
        d2 = new Date(array[d+1].date)
    return responseSeconds(d1, d2)
  }).filter(d => d > 0)

}

const getResponseTimeStats = (array) => {

  return {
    mean: d3.mean(array),
    median: d3.median(array),
    max: d3.max(array)
  }

}

const getBinnedResponseTimes = (array) => {

 let split_data = [
   { label: "Under 1m",
     axis_label: "Seconds",
     axis_extent: [0, 60],
     ticks: d3.range(0, 61, 6),
     format: d => d,
     data: array.filter(d => d < 60),
   },
   { label: "1-10m",
     axis_label: "Minutes",
     axis_extent: [60, 600],
     ticks: d3.range(60, 601, 60),
     format: (d) => d / 60,
     data: array.filter(d => d >= 60 && d < 600)
   },
   {
     label: "10m-1h",
     axis_label: "Minutes",
     axis_extent: [600, 3600],
     ticks: d3.range(600, 3601, 300),
     format: (d) => d / 60,
     data: array.filter(d => d >= 600 && d < 3600) },
   {
     label: "Over 1h",
     axis_label: "Hours",
     axis_extent: [3600, 57600],
     ticks: d3.range(3600, 57601, 5400),
     format: (d) => d / (60 * 60),
     data: array.filter(d => d >= 3600)
   }
 ]

 return split_data.map(d => {

    let bins = d3.histogram()
      .domain(d.axis_extent)
      .thresholds(d.ticks)
      (d.data)

   return {
     label: d.label,
     axis_label: d.axis_label,
     axis_extent : d.axis_extent,
     ticks: d.ticks,
     format: d.format,
     data: d.data,
     bins: bins,
     pct: d.data.length / array.length
   }

 })

}

const getTopWords = (array, limit) => {

  let combined = new Map()

  let a1_words = wordCounter(array.author1)
  let a2_words = wordCounter(array.author2)

  a1_words.forEach( (v, k) => {

    let a1_ct = v,
        a2_ct = a2_words.get(k) || 0,
        combined_ct = a1_ct + a2_ct;

    combined.set(k, { author1: a1_ct, author2: a2_ct, combined: combined_ct })

  })

  a2_words.forEach( (v, k) => {

    let a2_ct = v,
        a1_ct = a1_words.get(k) || 0,
        combined_ct = a1_ct + a2_ct;

    if (combined.get(k) !== null)
      combined.set(k, { author1: a1_ct, author2: a2_ct, combined: combined_ct })

  })

  return [...combined]
    .map(d => ({ word: d[0], values: d[1] }))
    .sort((a, b) => d3.descending(a.values.combined, b.values.combined))
    .slice(0, limit)

}

const getWeekMinutes = (data) => {

  let getMinuteOfWeek = (date) => {
    return (date.getDay() * 1440) +
           (date.getHours() * 60) +
           date.getMinutes();
  }

  let temp = d3arr.rollup(data,
    v => v.length,
    d => getMinuteOfWeek(new Date(d.date)))

  return [...temp].map(d => {
    return {
      minute: d[0],
      count: d[1]
    }
  })


}

const getMinutes = (data) => {

  let getDayOfWeek = (date) => {
    return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()]
  }

  let getMinuteOfDay = (date) => {
    return (date.getHours() * 60) + date.getMinutes()
  }

  let temp = d3arr.rollup(data,
    v => v.length,
    d => getDayOfWeek(new Date(d.date)),
    d => getMinuteOfDay(new Date(d.date))
  )

  let parsed = [...temp].map(d => {
    return [...d[1]].map(h => {
      return {
        day: d[0],
        minute: h[0],
        count: h[1]
      }
    })
  })

  let flattened = []

  parsed.map(d => {
    d.forEach(e => flattened.push(e))
  })

  return flattened

}

const getStats = (data) => {

  return {
    total_messages: {
      author1: data.author1.length,
      author2: data.author2.length
    },
    message_length: {
      author1: regexWordCount(data.author1),
      author2: regexWordCount(data.author2)
    },
    average_word_length: {
      author1: averageWordLength(data.author1),
      author2: averageWordLength(data.author2)
    },
    emoji_count: {
      author1: emojiCount(data.author1),
      author2: emojiCount(data.author2)
    },
    audio_count: {
      author1: mediaCount(data.author1, "__audio__"),
      author2: mediaCount(data.author2, "__audio__")
    },
    image_count: {
      author1: mediaCount(data.author1, "__image__"),
      author2: mediaCount(data.author2, "__image__")
    },
    video_count: {
      author1: mediaCount(data.author1, "__video__"),
      author2: mediaCount(data.author2, "__video__")
    },
    sticker_count: {
      author1: mediaCount(data.author1, "__sticker__"),
      author2: mediaCount(data.author2, "__sticker__")
    },
    gif_count: {
      author1: mediaCount(data.author1, "__gif__"),
      author2: mediaCount(data.author2, "__gif__")
    },
    unique_words: {
      author1: [...wordCounter(data.author1)].length,
      author2: [...wordCounter(data.author2)].length
    }
  }

}

module.exports = {
  getStats,
  getMinutes,
  getWeekMinutes,
  getTopWords,
  getResponseTimeStats,
  getResponseTimeArray,
  getBinnedResponseTimes
}
