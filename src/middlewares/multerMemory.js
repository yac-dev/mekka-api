import multer from 'multer';
import path from 'path';

export const multerParserInMemory = multer({ storage: multer.memoryStorage() });
