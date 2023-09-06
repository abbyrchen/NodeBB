"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const nconf = require("nconf");
const db = require("../database");
const image = require("../image");
const file = require("../file");
function default_1(Groups) {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/bmp'];
    Groups.updateCoverPosition = function (groupName, position) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!groupName) {
                throw new Error('[[error:invalid-data]]');
            }
            yield Groups.setGroupField(groupName, 'cover:position', position);
        });
    };
    Groups.updateCover = function (uid, data) {
        return __awaiter(this, void 0, void 0, function* () {
            let tempPath = data.file ? data.file.path : '';
            try {
                // Position only? That's fine
                if (!data.imageData && !data.file && data.position) {
                    yield Groups.updateCoverPosition(data.groupName, data.position);
                    return { url: '' }; // Return an empty object
                }
                // The next line calls a function in a module that has not been updated to TS yet
                /* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,
                @typescript-eslint/no-unsafe-call */
                const type = data.file ? data.file.type : image.mimeFromBase64(data.imageData);
                if (!type || !allowedTypes.includes(type)) {
                    throw new Error('[[error:invalid-image]]');
                }
                if (!tempPath) {
                    tempPath = yield image.writeImageDataToTempFile(data.imageData);
                }
                const filename = `groupCover-${data.groupName}${path.extname(tempPath)}`;
                // The next line calls a function in a module that has not been updated to TS yet
                /* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,
                @typescript-eslint/no-unsafe-call */
                const uploadData = yield image.uploadImage(filename, 'files', {
                    path: tempPath,
                    uid: uid,
                    name: 'groupCover',
                });
                // The next line calls a function in a module that has not been updated to TS yet
                /* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,
                @typescript-eslint/no-unsafe-call */
                const { url } = uploadData;
                yield Groups.setGroupField(data.groupName, 'cover:url', url);
                yield image.resizeImage({
                    path: tempPath,
                    width: 358,
                });
                // The next line calls a function in a module that has not been updated to TS yet
                /* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,
                @typescript-eslint/no-unsafe-call */
                const thumbUploadData = yield image.uploadImage(`groupCoverThumb-${data.groupName}${path.extname(tempPath)}`, 'files', {
                    path: tempPath,
                    uid: uid,
                    name: 'groupCover',
                });
                // The next line calls a function in a module that has not been updated to TS yet
                /* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,
                @typescript-eslint/no-unsafe-call */
                yield Groups.setGroupField(data.groupName, 'cover:thumb:url', thumbUploadData.url);
                if (data.position) {
                    yield Groups.updateCoverPosition(data.groupName, data.position);
                }
                return { url: url };
            }
            finally {
                file.delete(tempPath);
            }
        });
    };
    // The next line calls a function in a module that has not been updated to TS yet
    /* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,
    @typescript-eslint/no-unsafe-call */
    Groups.removeCover = function (data) {
        return __awaiter(this, void 0, void 0, function* () {
            // The next line calls a function in a module that has not been updated to TS yet
            /* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,
            @typescript-eslint/no-unsafe-call */
            const fields = ['cover:url', 'cover:thumb:url'];
            const values = yield Groups.getGroupFields(data.groupName, fields);
            // The next line calls a function in a module that has not been updated to TS yet
            /* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,
            @typescript-eslint/no-unsafe-call */
            yield Promise.all(fields.map((field) => {
                // The next line calls a function in a module that has not been updated to TS yet
                /* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,
                @typescript-eslint/no-unsafe-call */
                if (!values[field] || !values[field].startsWith(`${nconf.get('relative_path')}/assets/uploads/files/`)) {
                    return;
                }
                // The next line calls a function in a module that has not been updated to TS yet
                /* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,
                @typescript-eslint/no-unsafe-call */
                const filename = values[field].split('/').pop();
                // The next line calls a function in a module that has not been updated to TS yet
                /* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,
                @typescript-eslint/no-unsafe-call */
                const filePath = path.join(nconf.get('upload_path'), 'files', filename);
                return file.delete(filePath);
            }));
            // The next line calls a function in a module that has not been updated to TS yet
            /* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,
            @typescript-eslint/no-unsafe-call */
            yield db.deleteObjectFields(`group:${data.groupName}`, ['cover:url', 'cover:thumb:url', 'cover:position']);
        });
    };
}
exports.default = default_1;
