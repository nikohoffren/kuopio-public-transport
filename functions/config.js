exports.handler = async (event, context) => {
    return {
        statusCode: 200,
        body: JSON.stringify({
            GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
            GOOGLE_MAPS_MAP_ID: process.env.GOOGLE_MAPS_MAP_ID,
        }),
    };
};
