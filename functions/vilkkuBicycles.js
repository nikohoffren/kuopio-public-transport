const fetch = require("node-fetch");

exports.handler = async function (event, context) {
    const apiUrl =
        "https://kaupunkipyorat.kuopio.fi/tkhs-export-map.html?format=xml";

    try {
        const response = await fetch(apiUrl);
        const data = await response.text();

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/xml",
            },
            body: data,
        };
    } catch (error) {
        console.error("Error fetching VILKKU bicycle data:", error);
        return {
            statusCode: 500,
            body: "An error occurred while fetching VILKKU bicycle data.",
        };
    }
};
