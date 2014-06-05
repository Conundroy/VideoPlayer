function UMVideoPlayer(divId, onReady, onLoadError, onRenderObjectTimeUpdate, onVideoFinish, transition) {

    var self = this;

    this.videoStyle = videoId.style;
    this.placeholderHeight = 0;
    this.placeholderWidth = 0;

    this.onReady = onReady;
    this.onLoadError = onLoadError;
    this.onRenderObjectTimeUpdate = onRenderObjectTimeUpdate;
    this.onVideoFinish = onVideoFinish;

    this.renderObj = null;
    this.currentVideo = 0;
    this.isVideoReady = false;
    this.videoObjects = [];
    this.renderObjectTime = 0;
    this.contentTime = [];
    this.isVideoPlaying = false;

    this.transitionTime = 300;
    if (transition != null && typeof transition == "number") {
        this.transitionTime = transition;
    }

    this.setRenderObject = function(obj) {

        this.renderObj = obj;

        var res = this.getMediaUrl();
        //console.log(res);
        if (!res) {
            this.onLoadError("Invalid Render Object");
        }

    }

    this.play = function () {
        if (this.isVideoReady) {
            var videoElement = document.querySelector("#video-" + self.videoUuid + "-" + self.currentVideo);
            videoElement.style.webkitTransition = "opacity .3s";
            videoElement.style.opacity = "1";
            this.videoObjects[self.currentVideo].play();
            this.isVideoPlaying = true;
        } else {
            this.onLoadError("video not ready");
        }
    }

    this.pause = function () {
        if (this.videoObjects[self.currentVideo] != null) {
            if (!this.videoObjects[self.currentVideo].paused()) {
                this.videoObjects[self.currentVideo].pause();
            }
            if (!this.videoObjects[self.currentVideo + 1].paused()) {
                this.videoObjects[self.currentVideo + 1].pause();
            }

            this.isVideoPlaying = false;
        }
    }

    this.currentTime = function (newTime) {

        if (typeof newTime === 'number') {
            return "SKIMMING NOT YET IMPLEMENTED";
        } else {
            return this.renderObjectTime;
        }

    }

    this.getMediaUrl = function() {
        
        if (this.renderObj == null) {
            //console.log("RenderObject not set");
            return false;
        }

        this.loadInitialVideo();

        return true;

    }

    this.generateId = function(num) {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for( var i=0; i < num; i++ ) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }

        return text;
    }

    this.loadInitialVideo = function () {

        //console.log("loadInitialVideo");

        this.currentVideo = 0;
        this.videoObjects = new Array(this.renderObj.contentURLs.length);
        this.isVideoReady = false;
        this.videoUuid = self.generateId(10);
        this.renderObjectTime = 0;
        this.contentTime = new Array(this.renderObj.contentURLs.length);
        this.placeholderWidth = document.querySelector('#'+this.placeholderDiv).clientWidth();
        this.placeholderHeight = document.querySelector('#'+this.placeholderDiv).clientHeight();

        this.loadVideoElement(0);
    }

    this.loadVideoElement = function (id) {
        
        var content = this.renderObj.contentURLs[id];
        this.appendVideo(id, content.url, content.startTime, content.endTime);

        if (this.renderObj.contentURLs.length > id + 1) {
            content = null;
            content = this.renderObj.contentURLs[id + 1];
            this.appendVideo(id + 1, content.url, content.startTime, content.endTime);
        }
    }

    this.appendVideo = function (id) {

        var content = this.renderObj.contentURLs[id];
        var classTag = null;

        //console.log("APPENDING VIDEO");

        var videoObj = videojs("video-" + self.videoUuid + "-" + id, { 
            "controls": false, 
            "autoplay": false, 
            "preload": "auto", 
        }, function() {

            //console.log("VID OBJ READY");

            var videoElement = document.querySelector("#video-" + self.videoUuid + "-" + id);
            videoElement.style.position = "absolute";
            videoElement.style.left = "0px";
            videoElement.style.top = "0px";
            videoElement.style.visibility = "hidden";

            this.on("loadedmetadata", self.onMetadataLoaded);
            this.on("loadeddata", self.onVideoReady);
            this.on("play", self.onPlay);
            this.on("pause", self.onPause);
            this.on("timeupdate", self.onTimeUpdate);

            this.src(content.url);
        
        });

        this.videoObjects[id] = videoObj;
        this.contentTime[id] = 0;
    }    

    this.onMetadataLoaded = function() {
        
        //console.log("onMetadataLoaded");
        
        var elementId = this.id_;
        var videoId = parseInt(elementId.replace("video-" + self.videoUuid + "-", ""));

        if (videoId == null || videoId < 0) {
            self.onLoadError("Something wrong with video element...");
            return;
        }

        //console.log("CONTENT TIME", self.contentTime[videoId], videoId);

        this.currentTime(self.renderObj.contentURLs[videoId].startTime);
        self.contentTime[videoId] = self.renderObj.contentURLs[videoId].startTime;

    }

    this.onVideoReady = function() {
        //console.log("onVideoReady");

        var elementId = this.id_;
        var videoId = parseInt(elementId.replace("video-" + self.videoUuid + "-", ""));

        if (videoId == null || videoId < 0) {
            self.onLoadError("Something wrong with video element...");
            return;
        }

        if (videoId == 0) {
            self.isVideoReady = true;
            self.onReady();
        }
    }

    this.onPlay = function() {
        //console.log("onPlay");

    }

    this.onPause = function() {
        //console.log("onPause");

        if (self.currentVideo == self.renderObj.contentURLs.length && (self.renderObj.contentURLs[self.currentVideo - 1].endTime*1000) - (this.currentTime()*1000) < self.transitionTime) {
            self.onVideoFinish();    
            self.loadInitialVideo();
            self.isVideoPlaying = false;
            //console.log("");
        }
    }

    this.onTimeUpdate = function() {

        var elementId = this.id_;
        var videoId = parseInt(elementId.replace("video-" + self.videoUuid + "-", ""));

        if (self.currentVideo == videoId) {

            //console.log("FUCK HERE!!!", this.currentTime(), (self.contentTime[videoId]))

            if (self.isVideoPlaying) {
                self.renderObjectTime += this.currentTime() - (self.contentTime[videoId]);
                self.contentTime[videoId] = this.currentTime();
                self.onRenderObjectTimeUpdate(self.renderObjectTime);
            }

            if ((self.renderObj.contentURLs[videoId].endTime*1000) - (this.currentTime()*1000) < self.transitionTime) {

                self.currentVideo++;

                var videoElement = document.querySelector("#video-"+self.videoUuid+"-"+videoId)
                videoElement.style.webkitTransition = "opacity .3s";
                videoElement.addEventListener( 'webkitTransitionEnd', function() {
                    if (self.currentVideo - 1 >= 0) {
                            //console.log("video being paused", self.currentVideo - 1);
                            if (self.videoObjects[self.currentVideo - 1] != null) {
                                self.videoObjects[self.currentVideo - 1].pause();
                            }
                            self.videoObjects[self.currentVideo - 1] = null;
                        }

                        this.remove();
                    });
                videoElement.style.opacity = "0"; 


                if (self.renderObj.contentURLs.length > self.currentVideo) {
                    var videoElement2 = document.querySelector("#video-" + self.videoUuid + "-" + self.currentVideo);
                    videoElement.style.webkitTransition = "opacity .3s";
                    videoElement.style.opacity = "1";
                    self.videoObjects[self.currentVideo].play();

                    if (self.renderObj.contentURLs.length > self.currentVideo + 1) {
                        var content = self.renderObj.contentURLs[self.currentVideo + 1];
                        self.appendVideo(self.currentVideo + 1, content.url, content.startTime, content.endTime);
                    }

                }
            } 
        }
    }
}
