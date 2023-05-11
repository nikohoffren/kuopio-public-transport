const axios = require("axios");

exports.handler = async (event, context) => {
    try {
        const bikeStatusResponse = await axios.get(
            "https://tkhskuopiostrg.blob.core.windows.net/gbfs/free_bike_status.json"
        );
        const stationStatusResponse = await axios.get(
            "https://tkhskuopiostrg.blob.core.windows.net/gbfs/station_status.json"
        );
        const stationInformationResponse = await axios.get(
            "https://tkhskuopiostrg.blob.core.windows.net/gbfs/station_information.json"
        );

        const jsonData = {
            bikeData: bikeStatusResponse.data,
            stationStatusData: stationStatusResponse.data,
            stationInformationData: stationInformationResponse.data,
        };

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
