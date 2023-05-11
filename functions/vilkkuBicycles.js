const axios = require("axios");

exports.handler = async (event, context) => {
  try {
    const response = await axios.get('https://tkhskuopiostrg.blob.core.windows.net/gbfs/free_bike_status.json');

    const jsonData = response.data;

    console.log("Fetched JSON data:", jsonData);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(jsonData),
    };
  } catch (error) {
    console.error("Error fetching JSON data:", error);

    return {
      statusCode: 500,
      body: "Error fetching JSON data!",
    };
  }
};
