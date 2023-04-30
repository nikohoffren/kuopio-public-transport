export default class LocationSetter {
    constructor() {
        this.settingOrigin = true;
    }

    isSettingOrigin() {
        return this.settingOrigin;
    }

    setOrigin() {
        this.settingOrigin = true;
    }

    setDestination() {
        this.settingOrigin = false;
    }
}
