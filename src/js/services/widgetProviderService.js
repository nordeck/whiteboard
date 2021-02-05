/* import { IOpenIDCredentials, WidgetApi } from 'matrix-widget-api';
import * as qs from 'querystring'; */

WidgetContextProps = {
    /**
     * The instance of the widget API.
     */
    widgetApi,
    /**
     * The ID of the widget.
     */
    widgetId,
    /**
     * The room of the widget.
     */
    roomId,
    /**
     * The creator of the widget.
     */
    creator,
    /**
     * The origin of the matrix client.
     */
    parentOrigin,
    /**
     * Indicates if the widget API is initializing.
     */
    isInitializing,
    /**
     * Indicates if the widget API is ready to be used.
     */
    isReady,
    /**
     * Gets the current OpenID Connect token that can be used server side with the Federation API.
     */
    //getOpenIdToken: () => Promise<IOpenIDCredentials>;
};

/*
function widgetProviderService() {


    widgetQuery = qs.parse(window.location.hash.substring(1));
    query = Object.assign({}, qs.parse(window.location.search.substring(1)), widgetQuery);
    qsParam = (name)=> {
         return query[name]};

    parentUrl = qsParam('parentUrl');
    parentOrigin = parentUrl && new URL(parentUrl).origin;
    widgetId = qsParam('widgetId');
    widgetApi = new WidgetApi(widgetId, parentOrigin);

    mainWidgetId = widgetId && decodeURIComponent(widgetId).replace(/^modal_/, '');
    roomId = mainWidgetId && mainWidgetId.indexOf('_') ? mainWidgetId.split('_')[0] : undefined;
    creator = mainWidgetId && (mainWidgetId.match(/_/g) || []).length > 1 ? mainWidgetId.split('_')[1] : undefined;

   openIdToken = undefined;
     getOpenIdToken = async () => {
  widgetApi.on('ready', onReady);
  try {
    const timeoutDate = new Date();
    timeoutDate.setSeconds(timeoutDate.getSeconds() - 30);
    if (!IOpenIDCredentials || IOpenIDCredentials.expirationDate < timeoutDate) {
      const token = await widgetApi.requestOpenIDConnectToken();
      token.expirationDate = new Date();
      token.expirationDate.setSeconds(token.expirationDate.getSeconds() + (token.expires_in || 0));
      openIdToken = token;
    }
  } catch (err) {
    console.warn('Unable to retrieve OpenId Connect token from Matrix Widget API.', err);
    openIdToken = undefined;
  }
  return openIdToken;
    };

    function onReady(){
        console.log('READY');
        WidgetContextProps.isInitializing = false;
        WidgetContextProps.isReady = true;
    }

    widgetApi.on('ready', onReady);

    if (widgetId) {
        WidgetContextProps.isInitializing = true;
        try {
          widgetApi.start();
        } catch (err) {
          console.error('Unable to initialize Matrix Widget API', err);
        }
    } else {
        console.info('Widget is used outside of Matrix. Matrix Widget API is not available.');
        WidgetContextProps.isInitializing = false;
        }
}

 */
