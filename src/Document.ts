import { Schema, model, Model, Document as mDocument } from 'mongoose';

interface IDocument extends mDocument {
    _id: string;
    data: object;
}

const DocumentSchema: Schema = new Schema<IDocument>({
    _id: String,
    data: Object
});

const Document: Model<IDocument> = model<IDocument>("Document", DocumentSchema);
Document.createIndexes();
export default Document;
