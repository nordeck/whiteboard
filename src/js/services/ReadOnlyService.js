import ConfigService from "./ConfigService";

/**
 * Class the handle the read-only logic
 */
class ReadOnlyService {
    /**
     * @type {boolean}
     */
    #readOnlyActive = true;
    get readOnlyActive() {
        return this.#readOnlyActive;
    }

    /**
     * @type {object}
     */
    #previousToolHtmlElem = null;
    get previousToolHtmlElem() {
        return this.#previousToolHtmlElem;
    }

    /**
     * Activate read-only mode
     */
    activateReadOnlyMode() {
        if (ConfigService.isAdmin) {
            this.#readOnlyActive = false;
        } else {
            return;
        }

        $("#whiteboardUnlockBtn").hide();
        $("#whiteboardLockBtn").show();
        this.#previousToolHtmlElem = $(".whiteboard-tool.active");

        // switch to mouse tool to prevent the use of the
        // other tools
        /*  $(".whiteboard-tool[tool=mouse]").click();
        $(".whiteboard-tool").prop("disabled", true);
        $(".whiteboard-edit-group > button").prop("disabled", true);
        $(".whiteboard-edit-group").addClass("group-disabled"); */
    }

    /**
     * Deactivate read-only mode
     */
    deactivateReadOnlyMode() {
        if (ConfigService.isReadOnly || !ConfigService.isAdmin) {
            return;
        } else {
            this.#readOnlyActive = false;
        }
        $("#whiteboardUnlockBtn").show();
        $("#whiteboardLockBtn").hide();

        // restore previously selected tool
        const { previousToolHtmlElem } = this;
        if (previousToolHtmlElem) previousToolHtmlElem.click();

        /* $(".whiteboard-tool").prop("disabled", false);
        $(".whiteboard-edit-group > button").prop("disabled", false);
        $(".whiteboard-edit-group").removeClass("group-disabled"); */
    }
}

export default new ReadOnlyService();
