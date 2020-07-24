const path = require("path")
const fsp = require("fs").promises
const wp = require("whatsapp-chat-parser")

const tools = require("../src/tools")

const input_dir = path.resolve("./chats/raw/")
const output_dir = path.resolve("./chats/parsed/")
const stats_dir = path.resolve("./chats/public/")

const parseAttachments = (m) => {
  return m
    .message
    .replace("\r", "")
    .replace("\n", "")
    .replace("audio omitted", "__audio__")
    .replace("image omitted", "__image__")
    .replace("video omitted", "__video__")
    .replace("sticker omitted", "__sticker__")
    .replace("Contact card omitted", "__contact__")
    .replace("GIF omitted", "__gif__")
}

const obfuscateAuthors = (m, authors) => {
  return m
    .author
    .replace(authors[0], "Author 1")
    .replace(authors[1], "Author 2")
}

const generateParsedFiles = async () => {

  const files = await fsp.readdir(input_dir)

  for (const file of files) {

    console.log(`Parsing ${file}...`)

    const file_loc = `${input_dir}/${file}`

    const initials = path.basename(file_loc, ".txt")
    const contents = await fsp.readFile(file_loc, "utf8")
    const extracted = await wp.parseString(contents, false)

    const authors = extracted
      .map(d => d.author)
      .filter((item, i, ar) => ar.indexOf(item) === i)

    console.log("Authors", authors)

    const parsed = extracted.map(m => {
      m.author = obfuscateAuthors(m, authors)
      m.message = parseAttachments(m)
      return m
    })

    const message_json = JSON.stringify(parsed)

    console.log(`${parsed.length} messages parsed and serialized.`)

    const output_file = `${initials}.json`

    console.log(`Writing ${output_file}...`)

    await fsp.writeFile(
      `${output_dir}/${output_file}`,
      message_json,
      "utf8"
    )

    console.log("Finished.")

  }

}

const generateStats = async (chat_id) => {

  const buffer = await fsp.readFile(`${output_dir}/${chat_id}.json`)
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

const generateStatsFiles = async () => {

  const files = await fsp.readdir(output_dir)

  for (const file of files) {

    console.log(`Getting stats for ${file}...`)

    const file_loc = `${output_dir}/${file}`
    const initials = path.basename(file_loc, ".json")
    const stats = await generateStats(initials)
    const stats_json = JSON.stringify(stats)

    console.log(`Stats generated and serialized.`)

    const output_file = `${initials}.json`

    console.log(`Writing ${output_file}...`)

    await fsp.writeFile(
      `${stats_dir}/${output_file}`,
      stats_json,
      "utf8"
    )

    console.log("Finished.")

  }

}

const parse = async () => {
  await generateParsedFiles()
  await generateStatsFiles()
}

parse()
