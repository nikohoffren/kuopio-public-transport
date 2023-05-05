export default class DataFetcher {
    constructor(map, LabelOverlay, createBusIconWithNumber, busData) {
        this.map = map;
        this.LabelOverlay = LabelOverlay;
        this.createBusIconWithNumber = createBusIconWithNumber;
        this.busData = busData;
        this.followedBusId = null;
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
                    const infoWindow = new google.maps.InfoWindow({
                        //* converting the bus speed from m/s to km/h
                        content: `
                            <strong>Linja: ${bus.trip.routeId}</strong><br>
                            Reitti: ${bus.vehicle.label}<br>
                            Nopeus: ${(bus.position.speed * 3.6).toFixed(
                                2
                            )} km/h.
                        `,
                    });

                    const routeId = busEntity.vehicle.trip.routeId;
                    //* Pass an onClick callback to the LabelOverlay constructor
                    const labelOverlay = new this.LabelOverlay(
                        position,
                        routeId,
                        this.map,
                        infoWindow,
                        () => {
                            if (this.followedBusId !== null) {
                                this.busData[
                                    this.followedBusId
                                ].labelOverlay.isFollowed = false;
                            }
                            this.followedBusId = busId;
                            this.map.setCenter(position);
                            labelOverlay.isFollowed = true;
                        }
                    );

                    this.busData[busId] = {
                        infoWindow: infoWindow,
                        labelOverlay: labelOverlay,
                    };
                } else {
                    const infoWindow = this.busData[busId].infoWindow;
                    infoWindow.setContent(
                        `
                        <strong>Linja: ${bus.trip.routeId}</strong><br>
                        Reitti: ${bus.vehicle.label}<br>
                        Nopeus: ${(bus.position.speed * 3.6).toFixed(2)} km/h.
                        `
                    );

                    const labelOverlay = this.busData[busId].labelOverlay;
                    labelOverlay.updatePosition(position);

                    //* Update the map center if the current bus is being followed
                    if (labelOverlay.isFollowed) {
                        this.map.setCenter(position);
                    }
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
        const apiUrl = "/api/vilkkuBicycles";

        try {
            const response = await fetch(apiUrl);

            if (!response.ok) {
                throw new Error(
                    `API request failed with status ${response.status}`
                );
            }

            const data = await response.text();
            console.log("Vilkku bicycles data: " + data);

            //* Check if the XML document has a root element
            if (!data || data.trim() === "") {
                console.error("The XML document is empty or not well-formed.");
                return;
            }

            const parser = new DOMParser();
            const xmlData = parser.parseFromString(data, "application/xml");
            const bicycleStations = xmlData.getElementsByTagName("marker");

            console.log("Number of bicycle stations:", bicycleStations.length);

            //* Check if the parsed XML document has a root element
            if (xmlData.documentElement.nodeName === "parsererror") {
                console.error("XML parsing error: no root element found.");
                return;
            }

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
