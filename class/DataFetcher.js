export default class DataFetcher {
    constructor(map, LabelOverlay, createBusIconWithNumber, busData) {
        this.map = map;
        this.LabelOverlay = LabelOverlay;
        this.createBusIconWithNumber = createBusIconWithNumber;
        this.busData = busData;
    }
    async fetchAndDisplayBusLocations() {
        try {
            const apiUrl =
                window.location.hostname === "localhost"
                    ? "http://localhost:3999/api/vehiclepositions"
                    : "/api/vehiclepositions";

            const response = await fetch(apiUrl);

            if (!response.ok) {
                throw new Error(
                    `API request failed with status ${response.status}`
                );
            }

            //* Process and display the bus locations on the map
            const data = await response.json();
            // console.log("Vilkku bus data:", data);

            for (const busEntity of data.entity) {
                const bus = busEntity.vehicle;
                const position = {
                    lat: bus.position.latitude,
                    lng: bus.position.longitude,
                };
                const busId = bus.vehicle.id;

                if (!this.busData[busId]) {
                    // Access busData using this keyword
                    const infoWindow = new google.maps.InfoWindow({
                        //* converting the bus speed from m/s to km/h
                        content: `Nopeus: ${(bus.position.speed * 3.6).toFixed(
                            2
                        )} km/h.<br>Linja: ${bus.trip.routeId}<br>Reitti: ${
                            bus.vehicle.label
                        }`,
                    });

                    const routeId = busEntity.vehicle.trip.routeId;
                    const labelOverlay = new this.LabelOverlay(
                        position,
                        routeId,
                        this.map,
                        infoWindow
                    );

                    this.busData[busId] = {
                        // Access busData using this keyword
                        infoWindow: infoWindow,
                        labelOverlay: labelOverlay,
                    };
                } else {
                    const infoWindow = this.busData[busId].infoWindow; // Access busData using this keyword
                    infoWindow.setContent(
                        `Nopeus: ${(bus.position.speed * 3.6).toFixed(
                            2
                        )} km/h.<br>Linja: ${bus.trip.routeId}<br>Reitti: ${
                            bus.vehicle.label
                        }`
                    );

                    const labelOverlay = this.busData[busId].labelOverlay; // Access busData using this keyword
                    labelOverlay.updatePosition(position);
                }
            }
        } catch (error) {
            console.error("Error fetching bus locations:", error);
        }
    }

    async fetchAndDisplayServiceAlerts() {
        try {
            const apiUrl =
                window.location.hostname === "localhost"
                    ? "http://localhost:3999/api/servicealerts"
                    : "/api/servicealerts";

            const response = await fetch(apiUrl);

            if (!response.ok) {
                throw new Error(
                    `API request failed with status ${response.status}`
                );
            }

            //* Process and display the service alerts
            const data = await response.json();
            console.log("Service alerts:", data);
        } catch (error) {
            console.error("Error fetching service alerts:", error);
        }
    }

    async fetchAndDisplayTripUpdates() {
        try {
            const apiUrl =
                window.location.hostname === "localhost"
                    ? "http://localhost:3999/api/tripupdates"
                    : "/api/tripupdates";

            const response = await fetch(apiUrl);

            if (!response.ok) {
                throw new Error(
                    `API request failed with status ${response.status}`
                );
            }

            //* Process and display the trip updates
            const data = await response.json();
            // console.log("Trip updates:", data);
        } catch (error) {
            console.error("Error fetching trip updates:", error);
        }
    }

    async fetchAndDisplayVilkkuBicycles() {
        const apiUrl = "/.netlify/functions/vilkkuBicycles";

        try {
            const response = await fetch(apiUrl);

            if (!response.ok) {
                throw new Error(
                    `API request failed with status ${response.status}`
                );
            }

            const data = await response.text();
            console.log("Vilkku bicycles data: " + data);
            const parser = new DOMParser();
            const xmlData = parser.parseFromString(data, "application/xml");
            const bicycleStations = xmlData.getElementsByTagName("marker");

            console.log("Number of bicycle stations:", bicycleStations.length);

            for (const station of bicycleStations) {
                const lat = parseFloat(station.getAttribute("lat"));
                const lng = parseFloat(station.getAttribute("lng"));
                const position = { lat, lng };

                const marker = new google.maps.Marker({
                    position,
                    map,
                    icon: {
                        url: "img/vilkku-bicycle-icon.jpg",
                        scaledSize: new google.maps.Size(30, 30),
                    },
                });

                const infoWindow = new google.maps.InfoWindow({
                    content: `${station.getAttribute(
                        "name"
                    )}: ${station.getAttribute("bikes")} pyörää vapaana`,
                });

                marker.addListener("click", () => {
                    infoWindow.open(map, marker);
                });
            }
        } catch (error) {
            console.error("Error fetching VILKKU bicycle data:", error);
        }
    }
}
