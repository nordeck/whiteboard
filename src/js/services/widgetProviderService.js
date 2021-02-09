import { WidgetApi } from "matrix-widget-api";
import * as qs from "querystring";

class widgetProviderService {
    constructor() {
        const widgetQuery = qs.parse(window.location.hash.substring(1));
        const query = Object.assign({}, qs.parse(window.location.search.substring(1)), widgetQuery);
        const qsParam = (name) => {
            return query[name];
        };
        const parentUrl = qsParam("parentUrl");
        const parentOrigin = parentUrl && new URL(parentUrl).origin;
        const widgetId = qsParam("widgetId");
        this.widgetApi = new WidgetApi(widgetId, parentOrigin);

        const mainWidgetId = widgetId && decodeURIComponent(widgetId).replace(/^modal_/, "");
        this.isInitializing = true;
        this.isReady = false;
        this.roomId =
            mainWidgetId && mainWidgetId.indexOf("_") ? mainWidgetId.split("_")[0] : undefined;
        this.creator =
            mainWidgetId && (mainWidgetId.match(/_/g) || []).length > 1
                ? mainWidgetId.split("_")[1]
                : undefined;
        this.widgetApi.on("ready", this.onReady);
        if (widgetId) {
            try {
                this.widgetApi.start();
            } catch (err) {
                this.isInitializing = false;
                console.error("Unable to initialize Matrix Widget API", err);
            }
        } else {
            console.info("Widget is used outside of Matrix. Matrix Widget API is not available.");
            this.isInitializing = false;
        }
    }
    getOpenIdToken = async () => {
        try {
            const timeoutDate = new Date();
            timeoutDate.setSeconds(timeoutDate.getSeconds() - 30);
            if (!this.openIdToken || this.openIdToken.expirationDate < timeoutDate) {
                const token = await this.widgetApi.requestOpenIDConnectToken();
                token.expirationDate = new Date();
                token.expirationDate.setSeconds(
                    token.expirationDate.getSeconds() + (token.expires_in || 0)
                );
                this.openIdToken = token;
            }
        } catch (err) {
            console.warn("Unable to retrieve OpenId Connect token from Matrix Widget API.", err);
            this.openIdToken = undefined;
        }
        return this.openIdToken;
    };

    onReady() {
        console.log("READY");
        this.isInitializing = false;
        this.isReady = true;
    }
}
export default new widgetProviderService();
