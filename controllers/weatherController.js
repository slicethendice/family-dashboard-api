const axios = require("axios");

const WEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5";

exports.getWeather = async (req, res) => {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ message: "Weather service is not configured" });
  }

  const { city, lat, lon, units = "imperial", view = "today" } = req.query;
  if (!city && (!lat || !lon)) {
    return res.status(400).json({ message: "Provide a city or latitude and longitude" });
  }

  const endpoint = view === "forecast" ? "forecast" : "weather";
  const params = {
    appid: apiKey,
    units,
    ...(lat && lon ? { lat, lon } : { q: city }),
  };

  try {
    const response = await axios.get(`${WEATHER_BASE_URL}/${endpoint}`, { params });
    res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 502;
    res.status(status).json({
      message: "Unable to fetch weather data",
      error: error.response?.data?.message || error.message,
    });
  }
};
