// 'use strict';
import path = require('path');
// const path = require('path');

import nconf = require('nconf');
// const nconf = require('nconf');

import db = require('../database');
import image = require('../image');
import file = require('../file');
/* const db = require('../database');
const image = require('../image');
const file = require('../file');*/

interface GroupData {
    groupName: string;
    imageData?: string;
    position?: number;
    file?: {
        path: string;
        type: string;
    }
}

/* interface Groups {
    updateCover: (uid: string, data: GroupData) => Promise<{ url: string; }>;
    updateCoverPosition: (groupName: string, position: number) => Promise<void>;
    setGroupField(groupName: string, field: string, value: any): Promise<void>;
    getGroupFields(groupName: string, fields: string[]): Promise<{ [key: string]: any }>;
} */


export default function(Groups: any): void {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/bmp'];
    Groups.updateCoverPosition = async function (groupName: string, position: number): Promise<void> {
        if (!groupName) {
            throw new Error('[[error:invalid-data]]');
        }
        await Groups.setGroupField(groupName, 'cover:position', position);
    };

    Groups.updateCover = async function (uid: string, data: GroupData): Promise<{ url: string}> {
        let tempPath = data.file ? data.file.path : '';
        try {
            // Position only? That's fine
            if (!data.imageData && !data.file && data.position) {
                return await Groups.updateCoverPosition(data.groupName, data.position);
            }
            const type = data.file ? data.file.type : image.mimeFromBase64(data.imageData);
            if (!type || !allowedTypes.includes(type)) {
                throw new Error('[[error:invalid-image]]');
            }

            if (!tempPath) {
                tempPath = await image.writeImageDataToTempFile(data.imageData);
            }

            const filename = `groupCover-${data.groupName}${path.extname(tempPath)}`;
            const uploadData = await image.uploadImage(filename, 'files', {
                path: tempPath,
                uid: uid,
                name: 'groupCover',
            });
            const { url } = uploadData;
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            await Groups.setGroupField(data.groupName, 'cover:url', url);

            await image.resizeImage({
                path: tempPath,
                // The next line calls a function in a module that has not been updated to TS yet
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                width: 358,
            });
            const thumbUploadData = await image.uploadImage(`groupCoverThumb-${data.groupName}${path.extname(tempPath)}`, 'files', {
                // The next line calls a function in a module that has not been updated to TS yet
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                path: tempPath,
                uid: uid,
                name: 'groupCover',
            });
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call   
    Groups.removeCover = async function (data: { groupName: string }): Promise<void> {
        const fields = ['cover:url', 'cover:thumb:url'];
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const values = await Groups.getGroupFields(data.groupName, fields);
        await Promise.all(fields.map((field) => {
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            if (!values[field] || !values[field].startsWith(`${nconf.get('relative_path')}/assets/uploads/files/`)) {
                return;
            }
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            const filename = values[field].split('/').pop();
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            const filePath = path.join(nconf.get('upload_path'), 'files', filename);
            return file.delete(filePath);
        }));

        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        await db.deleteObjectFields(`group:${data.groupName}`, ['cover:url', 'cover:thumb:url', 'cover:position']);
    };
}
