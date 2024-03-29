# Kuopion Julkinen Liikenne (Kuopio Public Transport)

This project is designed to facilitate access to information about public transportation around Kuopio and Siilinjärvi region. Users can find all the busses, speed and route of each individual bus, bus/walking routes, Vilkku-bicycle stations, how many bikes are there per station and the battery life of each bike and also Biketaxi information.

## Table of Contents

- Installation
- Setting Up Netlify CLI and Functions
- Handling CORS
- Acquiring Google Maps API Key and MapId
- Setting Up GTFS Data
- Usage
- Contribution

## Installation

Clone this repository and then use npm to install dependencies.

```bash
git clone https://github.com/nikohoffren/kuopio-public-transport.git
cd /kuopio-public-transport
npm i
```

To install CORS:

```bash
npm install cors
```

To install the Netlify CLI:

```bash
npm install netlify-cli -g
```

To run the project locally:

```bash
netlify dev
```

## Setting Up Netlify CLI and Functions

Netlify Functions provide a way to run server-side code without needing to run a dedicated server. They are used in this project to securely handle sensitive data and operations. Netlify CLI allows you to run your build and Netlify Functions locally for testing before deployment.

After installing the Netlify CLI with npm install netlify-cli -g, use the netlify dev command to start the local development server and Netlify Functions.

### To set up Netlify Functions:

1. Navigate to your site's settings on Netlify and find the "Functions" section.

2. Set the "Functions Directory" to netlify/functions.

3. Deploy your site to Netlify.

## Acquiring Google Maps API Key and MapId

In order to use Google Maps in your application, you will need to get an API key and a MapId.

1. Go to the Google Cloud Platform Console [here](https://console.cloud.google.com).

2. Click the project drop-down and select or create the project for which you want to add an API key.

3. Click the menu button and select "APIs & Services" > "Credentials".

4. On the "Credentials" page, click "Create credentials" > "API key".

5. After the API key is created, you will see your new API key on the "API key" page.

6. To find your MapId, navigate to the "Map Styles" page in the Google Cloud Console.

7. Your MapId is listed on this page.

Remember to store your Google Maps API Key and MapId in the .env file:

```bash
GOOGLE_MAPS_API_KEY = "your_api_key"
GOOGLE_MAPS_MAP_ID = "your_map_id"
```

## Setting Up GTFS Data

You need a MATTERSOFT username and password to use GTFS. Contact MATTERSOFT at info@mattersoft.fi to obtain these.

Then store the MATTERSOFT username and password in the .env file:

```bash
MATTERSOFT_USERNAME = "your_username"
MATTERSOFT_PASSWORD = "your_password"
```

## Usage

Run the following command in your terminal to start the application:

```bash
netlify dev
```

## Contribution

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
