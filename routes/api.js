const express = require("express");
const cors = require('cors');
const fetch = require("node-fetch");
const transit_realtime = require("../functions/gtfs-realtime").transit_realtime;
require("dotenv").config();

const router = express.Router();
router.use(cors());

router.get('/free_bike_status', async (req, res) => {
    try {
      const bikeData = await fetchBikeData();
      res.json(JSON.parse(bikeData.body));
    } catch (error) {
      res.status(500).json({ error: 'Error fetching bike data' });
    }
  });

router.get("/vehiclepositions", async (req, res) => {
    const apiUrl =
        "https://opendatavilkku.mattersoft.fi/rtapi/gtfsrealtime/v1.0/feed/vehicleposition";
    const username = process.env.OPENDATAVILKKU_MATTERSOFT_USERNAME;
    const password = process.env.OPENDATAVILKKU_MATTERSOFT_PASSWORD;

    try {
        const response = await fetch(apiUrl, {
            headers: {
                Authorization:
                    "Basic " +
                    Buffer.from(username + ":" + password).toString("base64"),
            },
        });

        if (response.ok) {
            const buffer = await response.arrayBuffer();
            const feedMessage = transit_realtime.FeedMessage.decode(
                new Uint8Array(buffer)
            );
            const data = JSON.parse(JSON.stringify(feedMessage));
            res.json(data);
        } else {
            res.status(response.status).send(response.statusText);
        }
    } catch (error) {
        console.error("Error fetching vehicle positions:", error);
        res.status(500).send("Error fetching vehicle positions.");
    }
});

module.exports = router;
