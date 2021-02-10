const path = require("path");
const fetch = require("node-fetch");
const config = require("./config/config");
const ReadOnlyBackendService = require("./services/ReadOnlyBackendService");
const WhiteboardInfoBackendService = require("./services/WhiteboardInfoBackendService");

function startBackendServer(port) {
    var fs = require("fs-extra");
    var express = require("express");
    var bodyParser = require("body-parser");
    var formidable = require("formidable"); //form upload processing

    const createDOMPurify = require("dompurify"); //Prevent xss
    const { JSDOM } = require("jsdom");
    const window = new JSDOM("").window;
    const DOMPurify = createDOMPurify(window);

    const { createClient } = require("webdav");

    var s_whiteboard = require("./s_whiteboard.js");

    var app = express();
    app.use(bodyParser.json());
    app.use(express.static(path.join(__dirname, "..", "dist")));
    app.use("/uploads", express.static(path.join(__dirname, "..", "public", "uploads")));
    var server = require("http").Server(app);
    server.listen(port);
    var io = require("socket.io")(server, { path: "/ws-api" });
    WhiteboardInfoBackendService.start(io);

    console.log("Webserver & socketserver running on port:" + port);

    const { accessToken, enableWebdav, userVarificationService } = config.backend;

    app.post("/api/verifyMatrixUser", function (req, res) {
        fetch(`${userVarificationService}/verify/user_in_room`, {
            method: "POST",
            body: JSON.stringify(req.body),
            headers: { "Content-Type": "application/json" },
        })
            .then((response) => {
                if (!response.ok) {
                    console.log("invalid response from matrix user verification service", response);
                    res.status(500);
                    res.end();
                    return;
                }
                return response.json();
            })
            .then((response) => {
                res.send(response);
                res.end();
            })
            .catch((err) => {
                console.log("failed to call matrix user verification service", err);
                res.status(500);
                res.end();
            });
    });

    app.get("/api/loadwhiteboard", function (req, res) {
        const wid = req["query"]["wid"];
        const at = req["query"]["at"]; //accesstoken
        if (accessToken === "" || accessToken == at) {
            const widForData = ReadOnlyBackendService.isReadOnly(wid)
                ? ReadOnlyBackendService.getIdFromReadOnlyId(wid)
                : wid;
            const ret = s_whiteboard.loadStoredData(widForData);
            res.send(ret);
            res.end();
        } else {
            res.status(401); //Unauthorized
            res.end();
        }
    });

    app.post("/api/upload", function (req, res) {
        //File upload
        var form = new formidable.IncomingForm(); //Receive form
        var formData = {
            files: {},
            fields: {},
        };

        form.on("file", function (name, file) {
            formData["files"][file.name] = file;
        });

        form.on("field", function (name, value) {
            formData["fields"][name] = value;
        });

        form.on("error", function (err) {
            console.log("File uplaod Error!");
        });

        form.on("end", function () {
            if (accessToken === "" || accessToken == formData["fields"]["at"]) {
                progressUploadFormData(formData, function (err) {
                    if (err) {
                        if (err == "403") {
                            res.status(403);
                        } else {
                            res.status(500);
                        }
                        res.end();
                    } else {
                        res.send("done");
                    }
                });
            } else {
                res.status(401); //Unauthorized
                res.end();
            }
            //End file upload
        });
        form.parse(req);
    });

    function progressUploadFormData(formData, callback) {
        console.log("Progress new Form Data");
        const fields = escapeAllContentStrings(formData.fields);
        const wid = fields["whiteboardId"];
        if (ReadOnlyBackendService.isReadOnly(wid)) return;

        const readOnlyWid = ReadOnlyBackendService.getReadOnlyId(wid);

        const name = fields["name"] || "";
        const date = fields["date"] || +new Date();
        const filename = name || `${readOnlyWid}_${date}.png`;
        if (
            !["png", "jpg", "jpeg", "gif", "tiff", "bmp", "webp", "pdf"].some((ext) =>
                filename.match("." + ext + "$")
            )
        ) {
            console.log("invalid file upload! filetype not allowed!", name);
            return;
        }
        let webdavaccess = fields["webdavaccess"] || false;
        try {
            webdavaccess = JSON.parse(webdavaccess);
        } catch (e) {
            webdavaccess = false;
        }

        const savingDir = path.join("./public/uploads", readOnlyWid);
        fs.ensureDir(savingDir, function (err) {
            if (err) {
                console.log("Could not create upload folder!", err);
                return;
            }
            let data = fields["imagedata"] || fields["data"];
            if (data && data != "") {
                //Save from base64 data
                data = data.replace(/^data:.*?;base64,/, "");
                console.log(filename, "uploaded");
                const savingPath = path.join(savingDir, filename);
                fs.writeFile(savingPath, data, "base64", function (err) {
                    if (err) {
                        console.log("error", err);
                        callback(err);
                    } else {
                        if (webdavaccess) {
                            //Save image to webdav
                            if (enableWebdav) {
                                saveImageToWebdav(savingPath, filename, webdavaccess, function (
                                    err
                                ) {
                                    if (err) {
                                        console.log("error", err);
                                        callback(err);
                                    } else {
                                        callback();
                                    }
                                });
                            } else {
                                callback("Webdav is not enabled on the server!");
                            }
                        } else {
                            callback();
                        }
                    }
                });
            } else {
                callback("no data!");
                console.log("No data found for this upload!", name);
            }
        });
    }

    function saveImageToWebdav(imagepath, filename, webdavaccess, callback) {
        if (webdavaccess) {
            const webdavserver = webdavaccess["webdavserver"] || "";
            const webdavpath = webdavaccess["webdavpath"] || "/";
            const webdavusername = webdavaccess["webdavusername"] || "";
            const webdavpassword = webdavaccess["webdavpassword"] || "";

            const client = createClient(webdavserver, {
                username: webdavusername,
                password: webdavpassword,
            });
            client
                .getDirectoryContents(webdavpath)
                .then((items) => {
                    const cloudpath = webdavpath + "" + filename;
                    console.log("webdav saving to:", cloudpath);
                    fs.createReadStream(imagepath).pipe(client.createWriteStream(cloudpath));
                    callback();
                })
                .catch((error) => {
                    callback("403");
                    console.log("Could not connect to webdav!");
                });
        } else {
            callback("Error: no access data!");
        }
    }

    io.on("connection", function (socket) {
        let whiteboardId = null;
        socket.on("disconnect", function () {
            WhiteboardInfoBackendService.leave(socket.id, whiteboardId);
            socket.compress(false).broadcast.to(whiteboardId).emit("refreshUserBadges", null); //Removes old user Badges
        });

        socket.on("drawToWhiteboard", function (content) {
            if (!whiteboardId || ReadOnlyBackendService.isReadOnly(whiteboardId)) return;

            content = escapeAllContentStrings(content);
            if (accessToken === "" || accessToken == content["at"]) {
                const broadcastTo = (wid) =>
                    socket.compress(false).broadcast.to(wid).emit("drawToWhiteboard", content);
                // broadcast to current whiteboard
                broadcastTo(whiteboardId);
                // broadcast the same content to the associated read-only whiteboard
                const readOnlyId = ReadOnlyBackendService.getReadOnlyId(whiteboardId);
                broadcastTo(readOnlyId);
                s_whiteboard.handleEventsAndData(content); //save whiteboardchanges on the server
            } else {
                socket.emit("wrongAccessToken", true);
            }
        });

        socket.on("joinWhiteboard", function (content) {
            content = escapeAllContentStrings(content);
            if (accessToken === "" || accessToken == content["at"]) {
                whiteboardId = content["wid"];

                socket.emit("whiteboardConfig", {
                    common: config.frontend,
                    whiteboardSpecific: {
                        correspondingReadOnlyWid: ReadOnlyBackendService.getReadOnlyId(
                            whiteboardId
                        ),
                        isReadOnly: ReadOnlyBackendService.isReadOnly(whiteboardId),
                    },
                });

                socket.join(whiteboardId); //Joins room name=wid
                const screenResolution = content["windowWidthHeight"];
                WhiteboardInfoBackendService.join(socket.id, whiteboardId, screenResolution);
            } else {
                socket.emit("wrongAccessToken", true);
            }
        });

        socket.on("updateScreenResolution", function (content) {
            content = escapeAllContentStrings(content);
            if (accessToken === "" || accessToken == content["at"]) {
                const screenResolution = content["windowWidthHeight"];
                WhiteboardInfoBackendService.setScreenResolution(
                    socket.id,
                    whiteboardId,
                    screenResolution
                );
            }
        });

        socket.on("setReadOnly", function (content) {
            content = escapeAllContentStrings(content);
            if (accessToken === "" || accessToken == content["at"]) {
                const isReadOnly = content["isReadOnly"];
                WhiteboardInfoBackendService.setReadOnly(whiteboardId, isReadOnly);
            }
        });

        socket.on("setPresentation", function (content) {
            console.log("CONTENT", content);
            content = escapeAllContentStrings(content);
            if (accessToken === "" || accessToken == content["at"]) {
                WhiteboardInfoBackendService.setPresentation(whiteboardId, content);
            }
        });
    });

    //Prevent cross site scripting (xss)
    function escapeAllContentStrings(content, cnt) {
        if (!cnt) cnt = 0;

        if (typeof content === "string") {
            return DOMPurify.sanitize(content);
        }
        for (var i in content) {
            if (typeof content[i] === "string") {
                content[i] = DOMPurify.sanitize(content[i]);
            }
            if (typeof content[i] === "object" && cnt < 10) {
                content[i] = escapeAllContentStrings(content[i], ++cnt);
            }
        }
        return content;
    }

    process.on("unhandledRejection", (error) => {
        // Will print "unhandledRejection err is not defined"
        console.log("unhandledRejection", error.message);
    });
}

module.exports = startBackendServer;
