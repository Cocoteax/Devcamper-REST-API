const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ReviewSchema = new Schema({
  title: {
    type: String,
    trim: true,
    required: [true, "Please add a title for the review"],
    maxLength: 100,
  },
  text: {
    type: String,
    required: [true, "Please add some text"],
  },
  rating: {
    type: Number,
    min: 1,
    max: 10,
    required: [true, "Please add a rating between 1-10"],
  },
  bootcamp: {
    type: Schema.Types.ObjectId,
    ref: "Bootcamp",
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

// // Add an index on the schema to ensure users can only create 1 review for each unique bootcamp
// // NOTE: We did a manual check in createReview controller instead
// ReviewSchema.index({ bootcamp: 1, user: 1 }, { unique: true });

// Static schema method to calculate average ratings for each bootcamp and save
// "This" refers to the review schema since its a static method
ReviewSchema.statics.getAverageRating = async function (bootcampID) {
  // Create an aggregation pipeline to calculate average ratings
  const obj = await this.aggregate([
    // First stage of aggregation uses $match, which filters data to match bootcampID
    { $match: { bootcamp: bootcampID } },
    // Second stage of aggregation uses $group, which groups data based on bootcamp
    {
      $group: {
        _id: "$bootcamp", // Specify "group-by field" to group by. The output is one document for each "group-by field"
        averageRating: { $avg: "$rating" }, // Use $avg to get average rating of reviews for each group (bootcamp) and store into averageRating field
      },
    },
  ]);
  try {
    await mongoose.model("Bootcamp").findByIdAndUpdate(bootcampID, {
      $set: { averageRating: obj[0].averageRating },
    });
  } catch (e) {
    console.log(e);
  }
};

// Mongoose post hook middleware to calculate average ratings for a bootcamp after saving a review
// NOTE: For post hooks, next() will be automatically called by mongoose
ReviewSchema.post("save", async function () {
  // Call static method to get average cost with this.constructor.static_method_name()
  await this.constructor.getAverageRating(this.bootcamp);
});

// Use pre middleware to calculate average ratings for a bootcmap after removing a review
ReviewSchema.post(
  "deleteOne",
  { document: true, query: false },
  async function () {
    await this.constructor.getAverageRating(this.bootcamp);
  }
);

module.exports = mongoose.model("Review", ReviewSchema, "reviews");
