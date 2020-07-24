const path = require("path")
const fsp = require("fs").promises

const tools = require("./tools")

const json_folder = path.resolve("./chats/parsed/")

exports.generate = async (chat_id) => {

  const buffer = await fsp.readFile(`${json_folder}/${chat_id}.json`)
  const parsed = JSON.parse(buffer)

  const author_split = {
    author1: parsed.filter(d => d.author === "Author 1"),
    author2: parsed.filter(d => d.author === "Author 2")
  }

  const generated_stats = tools.getStats(author_split)

  const top_words = tools.getTopWords(author_split, 500)

  const response_times = {
    author1: tools.getResponseTimeArray(parsed, "Author 1"),
    author2: tools.getResponseTimeArray(parsed, "Author 2")
  }

  const response_time_stats = {
    author1: tools.getResponseTimeStats(response_times.author1),
    author2: tools.getResponseTimeStats(response_times.author2)
  }

  const binned_times = {
    author1: tools.getBinnedResponseTimes(response_times.author1),
    author2: tools.getBinnedResponseTimes(response_times.author2)
  }

  return {
    stats: generated_stats,
    top_words: top_words,
    response_time_stats: response_time_stats,
    response_times: binned_times
  }

}
