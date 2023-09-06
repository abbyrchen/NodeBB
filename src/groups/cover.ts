import path = require('path');

import nconf = require('nconf');

import db = require('../database');
import image = require('../image');
import file = require('../file');

interface GroupData {
    groupName: string;
    imageData?: string;
    position?: number;
    file?: {
        path: string;
        type: string;
    }
}

interface UploadData {
    path: string;
    uid: string;
    name: string;
    url?: string;
}

interface Groups {
    updateCoverPosition(groupName: string, position: number): Promise<void>;
    updateCover(uid: string, data: GroupData): Promise<{ url: string }>;
    removeCover(data: { groupName: string }): Promise<void>;
    setGroupField(groupName: string, field: string, value: number | string): Promise<void>;
    getGroupFields(groupName: string, fields: string[]): Promise<{ [key: string]: string }>;
}

export default function (Groups: Groups) {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/bmp'];

    Groups.updateCoverPosition = async function (groupName: string, position: number): Promise<void> {
        if (!groupName) {
            throw new Error('[[error:invalid-data]]');
        }
        await Groups.setGroupField(groupName, 'cover:position', position);
    };

    Groups.updateCover = async function (uid: string, data: GroupData): Promise<{ url: string }> {
        let tempPath = data.file ? data.file.path : '';
        try {
            // Position only? That's fine
            if (!data.imageData && !data.file && data.position) {
                await Groups.updateCoverPosition(data.groupName, data.position);
                return { url: '' }; // Return an empty object
            }
            const type: string = data.file ? data.file.type : image.mimeFromBase64(data.imageData);
            if (!type || !allowedTypes.includes(type)) {
                throw new Error('[[error:invalid-image]]');
            }

            if (!tempPath) {
                tempPath = await image.writeImageDataToTempFile(data.imageData);
            }

            const filename = `groupCover-${data.groupName}${path.extname(tempPath)}`;

            // The next line calls a function in a module that has not been updated to TS yet
            /* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,
            @typescript-eslint/no-unsafe-call */
            const uploadData: UploadData = await image.uploadImage(filename, 'files', {
                path: tempPath,
                uid: uid,
                name: 'groupCover',
            });
            // The next line calls a function in a module that has not been updated to TS yet
            /* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,
            @typescript-eslint/no-unsafe-call */
            const { url } = uploadData;
            await Groups.setGroupField(data.groupName, 'cover:url', url);

            await image.resizeImage({
                path: tempPath,
                width: 358,
            });

            // The next line calls a function in a module that has not been updated to TS yet
            /* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,
            @typescript-eslint/no-unsafe-call */
            const thumbUploadData = await image.uploadImage(`groupCoverThumb-${data.groupName}${path.extname(tempPath)}`, 'files', {
                path: tempPath,
                uid: uid,
                name: 'groupCover',
            });
            // The next line calls a function in a module that has not been updated to TS yet
            /* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,
            @typescript-eslint/no-unsafe-call */
            await Groups.setGroupField(data.groupName, 'cover:thumb:url', thumbUploadData.url);

            if (data.position) {
                await Groups.updateCoverPosition(data.groupName, data.position);
            }
            return { url: url };
        } finally {
            file.delete(tempPath);
        }
    };

    // The next line calls a function in a module that has not been updated to TS yet
    /* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,
    @typescript-eslint/no-unsafe-call */
    Groups.removeCover = async function (data: { groupName: string }): Promise<void> {
        // The next line calls a function in a module that has not been updated to TS yet
        /* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,
        @typescript-eslint/no-unsafe-call */
        const fields = ['cover:url', 'cover:thumb:url'];
        const values = await Groups.getGroupFields(data.groupName, fields);
        // The next line calls a function in a module that has not been updated to TS yet
        /* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,
        @typescript-eslint/no-unsafe-call */
        await Promise.all(fields.map((field) => {
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
        await db.deleteObjectFields(`group:${data.groupName}`, ['cover:url', 'cover:thumb:url', 'cover:position']);
    };
}
