const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CourseSchema = new Schema({
  title: {
    type: String,
    trim: true,
    required: [true, "Please add a course title"],
  },
  description: {
    type: String,
    required: [true, "Please add a description"],
  },
  weeks: {
    type: String,
    required: [true, "Please add number of weeks"],
  },
  tuition: {
    type: Number,
    required: [true, "Please add a tuition cost"],
  },
  minimumSkill: {
    type: String,
    required: [true, "Please add a minimum skill"],
    enum: ["beginner", "intermediate", "advanced"], // Ensure that minimumSkill only takes on these values
  },
  scholarshipAvailable: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  bootcamp: {
    type: Schema.Types.ObjectId, // Create a reference to bootcamp => bootcamp has a one-to-many r/s with course
    required: true,
    ref: "Bootcamp",
  },
});

// Define a static schema method to calculate average cost of courses for a bootcamp through aggregation
// NOTE: static schema method is called by directly accessing the model, while schema method is called from an instance of schema
// NOTE: we use function key to allow "this" keyword to refer to the schema
CourseSchema.statics.getAverageCost = async function (bootcampID) {

  // Create an aggregation pipeline to calculate average cost
  // Data passed through this aggregation pipeline gets transformed by each stage, eventually producing a new document at the end of pipeline
  // https://www.mongodb.com/docs/manual/reference/method/db.collection.aggregate/
  const obj = await this.aggregate([
    // First stage of aggregation uses $match, which filters data to match bootcampID
    {
      $match: { bootcamp: bootcampID },
    },
    // Second stage of aggregation uses $group, which groups data based on bootcamp
    // https://www.mongodb.com/docs/manual/reference/operator/aggregation/group/
    {
      $group: {
        _id: "$bootcamp", // Specify field to group by, each _id must be unique, so if there are multiple documents with same bootcamp, mongoDB will
        averageCost: { $avg: "$tuition" }, // Use $avg to get average cost of courses for each group (bootcamp) and store into averageCost field
      },
    },
  ]);

  // Store our averageCost data of courses from the aggregation pipeline into the specific bootcamp model in our database
  try {
    await mongoose.model("Bootcamp").findByIdAndUpdate(bootcampID, {
      $set: { averageCost: Math.ceil(obj[0].averageCost / 10) * 10 }, // Data will be stored into averageCost field
    });
  } catch (e) {
    console.log(e);
  }
};

// Use post hook middleware to calculate average cost of courses after saving a course
// NOTE: For post hooks, we don't need to call next(). It will be called automatically by mongoose
CourseSchema.post("save", async function () {
  // Call static method to get average cost with this.constructor.static_method_name()
  await this.constructor.getAverageCost(this.bootcamp);
});

// Use pre middleware to calculate average cost of courses before removing a course
CourseSchema.post(
  "deleteOne",
  { document: true, query: false },
  async function () {
    await this.constructor.getAverageCost(this.bootcamp);
  }
);

module.exports = mongoose.model("Course", CourseSchema, "courses");
