import { STATIC_FILE_URI } from '../../../config.js';

export class ImagesCache {
    constructor() {
        this._images = {}
    };

    getImage = (url) => {
        const cachedImage = this._images[url];
        if (cachedImage) return cachedImage;
    
        const img = this._images[url] = new Image();
        img.src = STATIC_FILE_URI + url;
        return img;
    }
}
