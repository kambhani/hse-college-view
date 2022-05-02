import mongoose from "mongoose";
const { Schema } = mongoose;

const College = new Schema ({
  _id: String,
  name: String,
  pictureId: Number,
  applicationsByYear: [{
    year: Number,
    totalApplied: Number,
    totalAccepted: Number,
    totalEnrolled: Number
  }]
});

export default mongoose.model("College", College);