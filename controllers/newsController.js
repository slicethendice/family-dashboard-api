const axios = require("axios");

const NEWS_URL = "https://newsapi.org/v2/top-headlines";

exports.getNews = async (req, res) => {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ message: "News service is not configured" });
  }

  const { language = "en", country, category } = req.query;

  try {
    const response = await axios.get(NEWS_URL, {
      params: {
        apiKey,
        language,
        ...(country ? { country } : {}),
        ...(category ? { category } : {}),
      },
    });
    res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 502;
    res.status(status).json({
      message: "Unable to fetch news",
      error: error.response?.data?.message || error.message,
    });
  }
};
