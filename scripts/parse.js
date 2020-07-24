const path = require("path")
const fsp = require("fs").promises
const wp = require("whatsapp-chat-parser")

const input_dir = path.resolve("./chats/raw/")
const output_dir = path.resolve("./chats/parsed/")

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

const generateJson = async () => {

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

generateJson()
