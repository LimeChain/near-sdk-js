import { near } from "near-sdk-js";
export class NearEvent {
    internal_to_json_string() {
        return JSON.stringify(this);
    }
    internal_to_json_event_string() {
        return `EVENT_JSON: ${this.internal_to_json_string()}`;
    }
    /**
     * Logs the event to the host. This is required to ensure that the event is triggered
     * and to consume the event.
     */
    emit() {
        near.log(this.internal_to_json_event_string());
    }
}
