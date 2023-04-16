const fetch = require("node-fetch");
const transit_realtime = require("./gtfs-realtime").transit_realtime;
require("dotenv").config();

exports.handler = async (event, context) => {
  const apiUrl =
    "https://opendatavilkku.mattersoft.fi/rtapi/gtfsrealtime/v1.0/feed/servicealert";
  const username = process.env.OPENDATAVILKKU_MATTERSOFT_USERNAME;
  const password = process.env.OPENDATAVILKKU_MATTERSOFT_PASSWORD;

  try {
    const response = await fetch(apiUrl, {
      headers: {
        Authorization:
          "Basic " + Buffer.from(username + ":" + password).toString("base64"),
      },
    });

    if (response.ok) {
      const buffer = await response.arrayBuffer();
      const feedMessage = transit_realtime.FeedMessage.decode(
        new Uint8Array(buffer)
      );
      const data = JSON.parse(JSON.stringify(feedMessage));
      return {
        statusCode: 200,
        body: JSON.stringify(data),
      };
    } else {
      return {
        statusCode: response.status,
        body: response.statusText,
      };
    }
  } catch (error) {
    console.error("Error fetching service alerts:", error);
    return {
      statusCode: 500,
      body: "Error fetching service alerts.",
    };
  }
};
