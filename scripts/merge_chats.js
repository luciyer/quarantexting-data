const path = require("path")
const mergeFiles = require("merge-files")

const mergeChats = async () => {

  const output_file = path.resolve("../chats/raw/merged.txt")

  const merge_files = process.argv.slice(2)

  const status = await mergeFiles(merge_files, output_file);

  console.log(status)

}

mergeChats()
