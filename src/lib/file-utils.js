import md5 from "js-md5";

export class FileUtils {
    static async getMd5Hash(file) {
        let hash = md5.create();
        return await readChunked(
            file,
            512,
            chunk => hash.update(chunk),
            () => hash.base64());
    }
}

async function readChunked(file, chunkSizeInKB, chunkCallback, endCallback) {
    let fileSize = file.size;
    let chunkSize = chunkSizeInKB * 1024;
    let reader = new FileReader();

    return await new Promise((resolve, reject) => {
        var offset = 0;
        reader.onload = () => {
            if (reader.error) {
                reject(reader.error || {});
            } else {
                offset += reader.result.byteLength;
                chunkCallback(reader.result, offset, fileSize); 
                if (offset >= fileSize) {
                    resolve(endCallback());
                } else {
                    readNext();
                }
            }
        };

        reader.onerror = reject;

        function readNext() {
            let fileSlice = file.slice(offset, offset + chunkSize);
            reader.readAsArrayBuffer(fileSlice);
        }

        readNext();
    });
}