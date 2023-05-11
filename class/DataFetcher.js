export default class DataFetcher {
    constructor(map, LabelOverlay, createBusIconWithNumber, busData) {
        this.map = map;
        this.LabelOverlay = LabelOverlay;
        this.createBusIconWithNumber = createBusIconWithNumber;
        this.busData = busData;
        this.followedBusId = null;
        this.shouldFollowBus = false;
    }

    setShouldFollowBus(newValue) {
        this.shouldFollowBus = newValue;
        //* If shouldFollowBus is set to false, also unset the followed bus
        if (!newValue && this.followedBusId !== null) {
            this.busData[this.followedBusId].labelOverlay.isFollowed = false;
            this.followedBusId = null;
        }
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
                            if (this.shouldFollowBus) {
                                if (this.followedBusId !== null) {
                                    this.busData[
                                        this.followedBusId
                                    ].labelOverlay.isFollowed = false;
                                }
                                this.followedBusId = busId;
                                labelOverlay.isFollowed = true;
                                this.map.setCenter(position);
                            }
                        }
                    );

                    this.busData[busId] = {
                        infoWindow: infoWindow,
                        labelOverlay: labelOverlay,
                    };

                    if (labelOverlay.isFollowed && this.shouldFollowBus) {
                        this.map.setCenter(position);
                    }
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

    async fetchAndDisplayFreeBikeLocations() {
        const apiUrl =
            window.location.hostname === "localhost"
                ? "http://localhost:3999/.netlify/functions/vilkkuBicycles"
                : "/.netlify/functions/vilkkuBicycles";

        try {
            const response = await fetch(apiUrl);

            if (!response.ok) {
                throw new Error(
                    `API request failed with status ${response.status}`
                );
            }

            const data = await response.json();

            for (const bike of data.bikeData.data.bikes) {
                //* Validate the coordinates
                if (
                    typeof bike.lat !== "number" ||
                    typeof bike.lon !== "number"
                ) {
                    console.error(
                        `Invalid coordinates for bike ${bike.bike_id}: lat = ${bike.lat}, lon = ${bike.lon}`
                    );
                    continue;
                }

                const position = { lat: bike.lat, lng: bike.lon };

                const marker = new google.maps.Marker({
                    position,
                    map: this.map,
                    icon: {
                        url: "img/vilkku-bicycle-icon.png",
                        scaledSize: new google.maps.Size(30, 30),
                    },
                });

                const infoWindow = new google.maps.InfoWindow({
                    content: `ID: ${bike.bike_id}, Akun varaus: ${
                        bike.current_fuel_percent * 100
                    }%`,
                });

                marker.addListener("click", () => {
                    infoWindow.open(this.map, marker);
                });
            }

            const stationStatusById = {};

            for (const station of data.stationStatusData.data.stations) {
                stationStatusById[station.station_id] = station;
            }

            for (const station of data.stationInformationData.data.stations) {
                const stationStatus = stationStatusById[station.station_id];
                if (stationStatus) {
                    const position = { lat: station.lat, lng: station.lon };

                    const marker = new google.maps.Marker({
                        position,
                        map: this.map,
                        icon: {
                            url: "img/vilkku-logo.png",
                            scaledSize: new google.maps.Size(30, 30),
                        },
                    });

                    const infoWindow = new google.maps.InfoWindow({
                        content: `Asema: ${station.name}, Pyöriä vapaana: ${stationStatus.num_bikes_available}`,
                    });

                    marker.addListener("click", () => {
                        infoWindow.open(this.map, marker);
                    });
                } else {
                    console.warn(
                        `No status information found for station ${station.station_id}`
                    );
                }
            }
        } catch (error) {
            console.error("Error fetching VILKKU bicycle data:", error);
        }
    }
}
