const path = require("path")
const fsp = require("fs").promises

const stats = require("./stats")

const json_folder = path.resolve("./chats/parsed/")

exports.getChatList = async (req, res) => {

  const chat_list = []

  for (const file of await fsp.readdir(json_folder)) {
    const file_loc = `${json_folder}/${file}`
    chat_list.push({ chat_id: path.basename(file_loc, ".json") })
  }

  res.status(200).json(chat_list)

}

exports.getChatData = async (req, res) => {

  const data = await stats.generate(req.params.id)

  res.status(200).json(data)
  
}
