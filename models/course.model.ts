import mongoose, { Document, Model, Schema } from "mongoose";
import { IUser } from "./user.model";

interface IComment extends Document {
  user: IUser;
  comment: string;
  commentReplies?: IComment[];
}

interface IReview extends Document {
  user: IUser;
  rating: number;
  comment: string;
  commentReplies: IComment[];
}

interface ILink extends Document {
  title: string;
  url: string;
}

interface ICourseData extends Document {
  title: string;
  description: string;
  videoUrl: string;
  videoThumbnail: string;
  videoSection: string;
  videoLength: string;
  videoPlayer: string;
  links: ILink[];
  suggestion: string;
  comments: IComment[];
}

export interface ICourse extends Document {
  name: string;
  description?: string;
  price: number;
  estimatedPrice?: number;
  thumbnail: IThumbnail;
  tags: string;
  level: string;
  demoUrl: string;
  benefit: { title: string }[];
  prerequistites: { title: string }[];
  reviews: IReview[];
  courseData: ICourseData[];
  ratings?: number;
  purschase?: number;
}

export interface IThumbnail extends Document {
  public_id: string,
  image_url: string
}

const reviewSchema = new Schema<IReview>({
  user: Object,
  rating: {
    type: Number,
    default: 0,
  },
  comment: String,
  commentReplies: [Object]
});

const linkSchema = new Schema<ILink>({
  title: String,
  url: String,
});

const commentSchema = new Schema<IComment>({
  user: Object,
  comment: String,
  commentReplies: [Object],
});

const courseDataSchema = new Schema<ICourseData>({
  title: String,
  description: String,
  videoUrl: String,
  videoSection: String,
  videoLength: String,
  videoPlayer: String,
  links: [linkSchema],
  suggestion: String,
  comments: [commentSchema],
});

const courseSchema = new Schema<ICourse>({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  estimatedPrice: {
    type: Number,
  },
  thumbnail: {
    public_id: {
      type: String,
    },
    url: {
      type: String,
    },
  },
  tags: {
    type: String,
    required: true,
  },
  level: {
    type: String,
    required: true,
  },
  demoUrl: {
    type: String,
    required: true,
  },
  benefit: [{ title: String }],
  prerequistites: [{ title: String }],
  reviews: [reviewSchema],
  courseData: [courseDataSchema],
  ratings: {
    type: Number,
    default: 0,
  },
  purschase: {
    type: Number,
    default: 0,
  },
});


const courseModel : Model<ICourse> = mongoose.model("Course", courseSchema)
export default courseModel;