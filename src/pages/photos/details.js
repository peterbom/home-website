import {inject, NewInstance} from "aurelia-framework";
import moment from "moment";

@inject("image-service")
export class Details {

    constructor (imageService) {
        this._imageService = imageService;

        this.cameras = [];
        this.resizedImageContainerUri = null;
        this.videosForWebContainerUri = null;

        this.image = null;
        this.isVideo = false;
        this.exifData = [];
        this.videoData = [];
    }

    async activate (params) {
        this.resizedImageContainerUri = await this._imageService.getResizedImageContainerUri();
        this.videosForWebContainerUri = await this._imageService.getVideosForWebContainerUri();
        this.cameras = await this._imageService.getCameras();

        let includes = {
            takenDateTime: true,
            owner: true,
            tags: true,
            position: true,
            sizes: true,
            fileInfo: true,
            exifData: true,
            videoData: true
        };

        let results = await this._imageService.retrieve([params.id], includes);

        this.image = (results && results.length) ? results[0] : { 
            name: params.id,
            exifData: {}
        };

        let takenDateTime = this.image.takenLocal || this.image.takenUtc;
        this.image.takenDateTime = takenDateTime ? moment(takenDateTime).toDate() : null;
        let camera = this.cameras.find(c => c.id === this.image.cameraId);
        this.image.cameraMake = camera && camera.make;
        this.image.cameraModel = camera && camera.model;

        for (let property in this.image.exifData) {
            this.exifData.push({
                property: property,
                value: this.image.exifData[property]
            });
        }
    }
}