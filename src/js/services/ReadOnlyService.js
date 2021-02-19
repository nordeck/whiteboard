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
        if (ConfigService.isAdmin) return false;
        return this.#readOnlyActive;
    }
    setReadOnlyActive(value) {
        this.#readOnlyActive = value;
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
    disableToolbar() {
        this.#readOnlyActive = true;
        $("#whiteboardUnlockBtn").hide();
        $("#whiteboardLockBtn").hide();
        $(".whiteboard-tool[tool=pen]").removeClass("active");
        $(".whiteboard-tool[tool=mouse]").addClass("active");
        this.#previousToolHtmlElem = $(".whiteboard-tool.active");

        // switch to mouse tool to prevent the use of the
        // other tools
        $(".whiteboard-tool[tool=mouse]").click();
        $(".whiteboard-tool").prop("disabled", true);
        $(".whiteboard-edit-group > button").prop("disabled", true);
        $(".whiteboard-edit-group").addClass("group-disabled");
    }

    activateReadOnlyMode() {
        if (ConfigService.isAdmin) {
            $("#whiteboardUnlockBtn").hide();
            $("#whiteboardLockBtn").show();
            return;
        }
        this.disableToolbar();
    }

    /**
     * Deactivate read-only mode
     */
    deactivateReadOnlyMode() {
        this.#readOnlyActive = false;
        if (ConfigService.isAdmin) {
            if (ConfigService.isReadOnly) {
                $("#whiteboardUnlockBtn").hide();
                $("#whiteboardLockBtn").show();
            } else {
                $("#whiteboardUnlockBtn").show();
                $("#whiteboardLockBtn").hide();
            }
        } else {
            $("#whiteboardUnlockBtn").hide();
            $("#whiteboardLockBtn").hide();
        }

        // restore previously selected tool
        const { previousToolHtmlElem } = this;
        if (previousToolHtmlElem) previousToolHtmlElem.click();

        $(".whiteboard-tool").prop("disabled", false);
        $(".whiteboard-edit-group > button").prop("disabled", false);
        $(".whiteboard-edit-group").removeClass("group-disabled");
    }
}

export default new ReadOnlyService();
