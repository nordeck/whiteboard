import pdfjsLib from "pdfjs-dist/webpack";
import ConfigService from "./ConfigService";

/**
 * Class the handle the information about the whiteboard
 */
class PresentationService {
    #isInitialized = false;
    #signaling_socket = null;
    #areBtnsInititialized = false;

    /**
     * @type {boolean}
     */
    #presentationIsDisplayed = false;
    get isPresentationDisplayed() {
        return this.#presentationIsDisplayed;
    }

    /**
     * @type {object}
     */
    #presentation = null;
    get presentation() {
        return this.#presentation;
    }

    /**
     * @type {object}
     */
    #pdf = null;
    get pdf() {
        return this.#pdf;
    }

    showPDFPageAsImage(pageNumber, rescale) {
        const _this = this;
        // Fetch the page
        this.#pdf.getPage(pageNumber).then(function (page) {
            const nextButton = $("#presentationContainer .nextButton");
            const previousButton = $("#presentationContainer .previousButton");

            previousButton.prop("disabled", page.pageIndex < 1);
            nextButton.prop("disabled", page.pageIndex == _this.#pdf.numPages - 1);

            var viewport = page.getViewport({ scale: 1.5 });

            // Prepare canvas using PDF page dimensions
            var canvas = $("<canvas></canvas>")[0];
            var context = canvas.getContext("2d");
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            // Render PDF page into canvas context
            var renderContext = {
                canvasContext: context,
                viewport: viewport,
            };
            var renderTask = page.render(renderContext);
            renderTask.promise.then(() => {
                var dataUrl = canvas.toDataURL("application/pdf", 1.0);
                $("#presentationContainer").find("img").attr("src", dataUrl);

                if (rescale) {
                    const scale = Math.min(1, (window.innerHeight - 110) / canvas.height);
                    $("#presentationContainer .dragMe").height(canvas.height * scale);
                    $("#presentationContainer .dragMe").width(canvas.width * scale);
                    $("#presentationContainer .dragMe").offset({ top: 70, left: 15 });
                }
            });
        });
    }

    /**
     * @param {number} nbConnectedUsers
     * @param {{w: number, h: number}} smallestScreenResolution
     */
    updateInfoFromServer({ presentation }, signaling_socket) {
        this.#signaling_socket = signaling_socket;
        if (
            presentation &&
            presentation.url &&
            (!this.#presentation || this.#presentation.url !== presentation.url)
        ) {
            $("#presentationContainer").find("img").attr("src", "");
            pdfjsLib.getDocument({ url: presentation.url }).promise.then((pdf) => {
                this.#pdf = pdf;
                this.showPDFPageAsImage(presentation.page || 1, true);
                this.displayPresentation();
            });
        } else if (
            presentation &&
            this.#presentation &&
            this.#presentation.page !== presentation.page
        ) {
            this.showPDFPageAsImage(presentation.page || 1);
            this.displayPresentation();
        } else if (!presentation) {
            this.hidePresentation();
        }
        if (!this.#isInitialized) {
            this.initializePresentationContainer();
        }
        this.#presentation = presentation;
    }

    /**
     * Show the info div
     */
    displayPresentation() {
        this.initializePresentationContainer();
        $("#presentationContainer").toggleClass("displayNone", false);
        $("#presentationContainer .dragMe").toggleClass("displayNone", false);
        this.#presentationIsDisplayed = true;
    }

    initializePresentationContainer() {
        const imgDiv = $("#presentationContainer .dragMe");
        const closeButton = imgDiv.find(".xCanvasBtn");
        const fullscreenButton = imgDiv.find(".fullscreenButton");
        const nextButton = imgDiv.find(".nextButton");
        const previousButton = imgDiv.find(".previousButton");
        if (ConfigService.isAdmin) {
            closeButton.show();
            previousButton.show();
            nextButton.show();
        } else {
            closeButton.hide();
            previousButton.hide();
            nextButton.hide();
        }
        if (this.#isInitialized && this.#areBtnsInititialized) return;
        const _this = this;
        if (ConfigService.isAdmin) {
            nextButton.off("click").click(function () {
                if (_this.#pdf.numPages > _this.#presentation.page - 1) {
                    _this.#signaling_socket.emit("setPresentation", {
                        ..._this.#presentation,
                        page: _this.#presentation.page + 1,
                    });
                    $(this).prop("disabled", true);
                }
            });
            previousButton.off("click").click(function () {
                if (_this.#presentation.page > 1) {
                    _this.#signaling_socket.emit("setPresentation", {
                        ..._this.#presentation,
                        page: _this.#presentation.page - 1,
                    });
                    $(this).prop("disabled", true);
                }
            });
        }
        if (ConfigService.isAdmin !== undefined) {
            this.#areBtnsInititialized = true;
        }
        closeButton.off("click").click(() => {
            if (imgDiv.hasClass("fullscreen")) {
                _this.exitFullscreen().then(() => {
                    imgDiv.toggleClass("fullscreen", false);
                });
            } else {
                _this.hidePresentation();
                if (_this.#presentation) {
                    _this.#signaling_socket.emit("setPresentation", null);
                }
            }
        });
        fullscreenButton.off("click").click(() => {
            _this.enterFullscreen(imgDiv.get(0)).then(() => {
                imgDiv.toggleClass("fullscreen", true);
            });
        });
        var recoupLeft = 0;
        var recoupTop = 0;
        var left = parseInt(imgDiv.css("left"), 10) || 0;
        var top = parseInt(imgDiv.css("top"), 10) || 0;

        imgDiv.draggable({
            start: function (event, ui) {
                recoupLeft = left - ui.position.left;
                recoupTop = top - ui.position.top;
            },
            drag: function (event, ui) {
                ui.position.left += recoupLeft;
                ui.position.top += recoupTop;
            },
            stop: function (event, ui) {
                left = ui.position.left;
                top = ui.position.top;
            },
        });
        imgDiv.resizable({
            aspectRatio: true,
        });
        var params = {
            // Callback fired on rotation start.
            start: function (event, ui) {},
            // Callback fired during rotation.
            rotate: function (event, ui) {
                //console.log(ui)
            },
            // Callback fired on rotation end.
            stop: function (event, ui) {
                rotationAngle = ui.angle.current;
            },
            handle: imgDiv.find(".rotationHandle"),
        };
        imgDiv.rotatable(params);
        this.#isInitialized = true;
    }

    /**
     * Hide the info div
     */
    hidePresentation() {
        $("#presentationContainer").toggleClass("displayNone", true);
        this.#presentationIsDisplayed = false;
    }

    enterFullscreen(element) {
        if (element.requestFullscreen) {
            return element.requestFullscreen();
        } else if (element.msRequestFullscreen) {
            return element.msRequestFullscreen();
        } else if (element.webkitRequestFullscreen) {
            return element.webkitRequestFullscreen();
        }
    }

    exitFullscreen() {
        if (document.exitFullscreen) {
            return document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            return document.webkitExitFullscreen();
        }
    }
}

export default new PresentationService();
