import { IOpenIDCredentials, WidgetApi } from "matrix-widget-api";
import * as qs from "querystring";

let WidgetContextProps = {
    /**
     * The instance of the widget API.
     */
    widgetApi: {},
    /**
     * The ID of the widget.
     */
    widgetId: "",
    /**
     * The room of the widget.
     */
    roomId: "",
    /**
     * The creator of the widget.
     */
    creator: "",
    /**
     * The origin of the matrix client.
     */
    parentOrigin: "",
    /**
     * Indicates if the widget API is initializing.
     */
    isInitializing: true,
    /**
     * Indicates if the widget API is ready to be used.
     */
    isReady: false,
    /**
     * Gets the current OpenID Connect token that can be used server side with the Federation API.
     */
    //getOpenIdToken: () => Promise<IOpenIDCredentials>;
};

function widgetProviderService() {
    const widgetQuery = qs.parse(window.location.hash.substring(1));
    const query = Object.assign({}, qs.parse(window.location.search.substring(1)), widgetQuery);
    const qsParam = (name) => {
        return query[name];
    };

    const parentUrl = qsParam("parentUrl");
    const parentOrigin = parentUrl && new URL(parentUrl).origin;
    const widgetId = qsParam("widgetId");
    const widgetApi = new WidgetApi(widgetId, parentOrigin);

    const mainWidgetId = widgetId && decodeURIComponent(widgetId).replace(/^modal_/, "");
    const roomId =
        mainWidgetId && mainWidgetId.indexOf("_") ? mainWidgetId.split("_")[0] : undefined;
    const creator =
        mainWidgetId && (mainWidgetId.match(/_/g) || []).length > 1
            ? mainWidgetId.split("_")[1]
            : undefined;

    const openIdToken = undefined;
    const getOpenIdToken = async () => {
        widgetApi.on("ready", onReady);
        try {
            const timeoutDate = new Date();
            timeoutDate.setSeconds(timeoutDate.getSeconds() - 30);
            if (!IOpenIDCredentials || IOpenIDCredentials.expirationDate < timeoutDate) {
                const token = await widgetApi.requestOpenIDConnectToken();
                token.expirationDate = new Date();
                token.expirationDate.setSeconds(
                    token.expirationDate.getSeconds() + (token.expires_in || 0)
                );
                let openIdToken = token;
            }
        } catch (err) {
            console.warn("Unable to retrieve OpenId Connect token from Matrix Widget API.", err);
            let openIdToken = undefined;
        }
        return openIdToken;
    };

    function onReady() {
        console.log("READY");
        WidgetContextProps.isInitializing = false;
        WidgetContextProps.isReady = true;
    }

    widgetApi.on("ready", onReady);

    if (widgetId) {
        WidgetContextProps.isInitializing = true;
        try {
            widgetApi.start();
        } catch (err) {
            console.error("Unable to initialize Matrix Widget API", err);
        }
    } else {
        console.info("Widget is used outside of Matrix. Matrix Widget API is not available.");
        WidgetContextProps.isInitializing = false;
    }
}
