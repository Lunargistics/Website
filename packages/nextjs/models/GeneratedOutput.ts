import mongoose, { Document, Schema } from "mongoose";

export interface IGeneratedOutput extends Document {
  userId: string;
  type: "mission_plan" | "icd_driver" | "test_case" | "orbital_analysis";
  prompt: string;
  output: string;
  metadata?: {
    protocol?: string;
    spacecraft?: string;
    missionType?: string;
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

const GeneratedOutputSchema = new Schema<IGeneratedOutput>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["mission_plan", "icd_driver", "test_case", "orbital_analysis"],
    },
    prompt: {
      type: String,
      required: true,
    },
    output: {
      type: String,
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

// Compound index for user-specific queries
GeneratedOutputSchema.index({ userId: 1, createdAt: -1 });
GeneratedOutputSchema.index({ userId: 1, type: 1, createdAt: -1 });

const GeneratedOutput =
  mongoose.models.GeneratedOutput || mongoose.model<IGeneratedOutput>("GeneratedOutput", GeneratedOutputSchema);

export default GeneratedOutput;
