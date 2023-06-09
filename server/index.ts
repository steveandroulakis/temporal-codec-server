import { config } from 'dotenv';
import { resolve } from 'path';
import express from 'express';
import * as proto from '@temporalio/proto';
import { EncryptionCodec } from './encryption-codec';
import cors from 'cors';

// most of this code is from the Temporal samples repo
// https://github.com/temporalio/samples-typescript/blob/main/encryption/src/codec-server.ts

type Payload = proto.temporal.api.common.v1.IPayload;

interface JSONPayload {
    metadata?: Record<string, string> | null;
    data?: string | null;
}

interface Body {
    payloads: JSONPayload[];
}

const path = process.env.NODE_ENV === 'production'
    ? resolve(__dirname, './.env.production')
    : resolve(__dirname, './.env.development');

config({ path });

console.log(process.env.NODE_ENV);

const port = process.env.PORT || 3000;

/**
 * Helper function to convert a valid proto JSON to a payload object.
 *
 * This method will be part of the SDK when it supports proto JSON serialization.
 */
function fromJSON({ metadata, data }: JSONPayload): Payload {
    return {
        metadata:
            metadata &&
            Object.fromEntries(Object.entries(metadata).map(([k, v]): [string, Uint8Array] => [k, Buffer.from(v, 'base64')])),
        data: data ? Buffer.from(data, 'base64') : undefined,
    };
}

/**
 * Helper function to convert a payload object to a valid proto JSON.
 *
 * This method will be part of the SDK when it supports proto JSON serialization.
 */
function toJSON({ metadata, data }: proto.temporal.api.common.v1.IPayload): JSONPayload {
    return {
        metadata:
            metadata &&
            Object.fromEntries(
                Object.entries(metadata).map(([k, v]): [string, string] => [k, Buffer.from(v).toString('base64')])
            ),
        data: data ? Buffer.from(data).toString('base64') : undefined,
    };
}

async function main() {

    const codec = await EncryptionCodec.create('c2EtZGVtby1rZXk=');

    const app = express();
    app.use(cors({ allowedHeaders: ['x-namespace', 'content-type'] }));
    app.use(express.json());

    app.post('/decode', async (req, res) => {
        try {
            const { payloads: raw } = req.body as Body;
            const encoded = raw.map(fromJSON);
            const decoded = await codec.decode(encoded);
            const payloads = decoded.map(toJSON);
            res.json({ payloads }).end();
        } catch (err) {
            console.error('Error in /decode', err);
            res.status(500).end('Internal server error');
        }
    });

    app.post('/encode', async (req, res) => {
        try {
            const { payloads: raw } = req.body as Body;
            const decoded = raw.map(fromJSON);
            const encoded = await codec.encode(decoded);
            const payloads = encoded.map(toJSON);
            res.json({ payloads }).end();
        } catch (err) {
            console.error('Error in /encode', err);
            res.status(500).end('Internal server error');
        }
    });

    app.get('/', (req, res) => {
        res.send(`Hi from the Temporal Codec Server`);
    });

    await new Promise<void>((resolve, reject) => {
        app.listen(port, () => {
            console.log(`Codec Server listening at http://localhost:${port}`);
        });
        app.on('error', reject);
    });

}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});