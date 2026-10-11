export interface Journal {
  _id?: string;
  title: string;
  content: string;
  category?: string;
  date: Date | string;
  imageUrl?: string;
  tags?: string[];
  relatedLinks?: string[];
  notes?: string;
  status?: 'draft' | 'published';
  createdAt?: Date;
  updatedAt?: Date;
}
