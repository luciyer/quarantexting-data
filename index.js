require("dotenv").config()

const path = require("path")
const express = require("express")
const bodyParser = require("body-parser")

global.appRoot = path.resolve(__dirname)

const routes = require(appRoot + "/routes"),
      handler = require(appRoot + "/src/handler"),
      util = require(appRoot + "/src/util");

const app = express()

app
  .use(bodyParser.json())
  .listen(process.env.PORT || 8080, util.serverUp)

app.get(routes.chat_list, handler.getChatList)
app.get(routes.single_chat, handler.getChatData)
