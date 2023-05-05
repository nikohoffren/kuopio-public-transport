const fetch = require("node-fetch");
const axios = require("axios");

exports.handler = async (event, context) => {
  try {
    const response = await axios.get("https://kaupunkipyorat.kuopio.fi/tkhs-export-map.html?format=xml", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0",
      },
    });

    const xmlData = response.data;

    console.log("Fetched XML data:", xmlData);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/xml",
      },
      body: xmlData,
    };
  } catch (error) {
    console.error("Error fetching XML data:", error);

    return {
      statusCode: 500,
      body: "Error fetching XML data!",
    };
  }
};
