const path = require("path")
const fsp = require("fs").promises

const stats = require("./stats")

const public = path.resolve("./chats/public/")

exports.getChatList = async (req, res) => {

  const chat_list = []

  for (const file of await fsp.readdir(json_folder)) {
    const file_loc = `${json_folder}/${file}`
    chat_list.push({ chat_id: path.basename(file_loc, ".json") })
  }

  res.status(200).json(chat_list)

}

exports.getChatData = async (req, res) => {

  const file_loc = `${public}/${req.params.id}.json`

  const data = await fsp.readFile(file_loc)
  const parsed = JSON.parse(data)

  res.status(200).json(parsed)

}
