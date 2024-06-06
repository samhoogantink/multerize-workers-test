import { Hono } from 'hono';
import { Multerize, MulterizeHonoBindings, R2StorageProvider, FileResult, FilesResultObject } from 'multerize';

const upload = new Multerize({
	storage: new R2StorageProvider<Env>({
		// r2Client: env.R2_BUCKET, // You can import the bucket via this way
		envBucketKey: 'R2_BUCKET', // Or you can use the env key, and we'll automatically import the bucket for you from the env
		destination: async (c, file) => {
			const randomFolders = ['folder1', 'folder2', 'folder3'];

			// Select random folder
			const randomFolder = randomFolders[Math.floor(Math.random() * randomFolders.length)];

			return `${randomFolder}/`;
		},
		fileName: async (c, file) => {
			const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
			return uniqueSuffix + '-' + file.originalName;
		}
	})
});

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const app = new Hono<{ Variables: MulterizeHonoBindings; }>();

		app.post('/profile', upload.single('avatar'), async (c) => {
			const file = c.get('file');

			return c.json({
				fieldName: file.fieldName,
				originalName: file.originalName,
				mimetype: file.mimetype,
				size: file.size,
				destination: file.destination,
				fileName: file.fileName,
				path: file.path
			});
		});
		  
		app.post('/photos/upload', upload.array('photos', 12), async (c) => {
			const files = c.get('files') as FileResult[];

			return c.json({
				files: files.map(file => ({
					fieldName: file.fieldName,
					originalName: file.originalName,
					mimetype: file.mimetype,
					size: file.size,
					destination: file.destination,
					fileName: file.fileName,
					path: file.path
				}))
			});
		});

		const cpUpload = upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'gallery', maxCount: 8 }])
		app.post('/cool-profile', cpUpload, async (c) => {
			const files = c.get('files') as FilesResultObject;

			return c.json({
				files
			});
		});

		return app.fetch(request, env, ctx);
	},
};
