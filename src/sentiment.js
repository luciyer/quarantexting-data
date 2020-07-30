const {
  SentimentAnalyzer,
  PorterStemmer,
  PorterStemmerEs
} = require("natural")

const analyzerEn = new SentimentAnalyzer("English", PorterStemmer, "senticon")
const analyzerEs = new SentimentAnalyzer("Spanish", PorterStemmerEs, "senticon")

const eng = analyzerEn.getSentiment(["I", "like", "cherries"])
const esp = analyzerEs.getSentiment(["A", "mi", "me", "gustan", "las", "cerezas"])

console.log(eng, esp)

console.log(
  analyzerEn.getSentiment(["like"]),
  analyzerEn.getSentiment(["love"]),
  analyzerEs.getSentiment(["gustar"]),
  analyzerEs.getSentiment(["encantar"]),
  analyzerEs.getSentiment(["querer"]),
  analyzerEs.getSentiment(["amar"]),
  analyzerEs.getSentiment(["enamorar"])
)

console.log(
  analyzerEn.getSentiment(["I", "fell", "in", "love", "with", "the", "city"]),
  analyzerEs.getSentiment(["Me", "enamore", "de", "la", "ciudad"])
)

console.log(
  analyzerEn.getSentiment(["She", "is", "beautiful"]),
  analyzerEs.getSentiment(["Ella", "es", "hermosa"])
)

console.log(
  analyzerEn.getSentiment(["She", "is", "beautiful"]),
  analyzerEs.getSentiment(["Ella", "es", "muy", "hermosa"])
)
