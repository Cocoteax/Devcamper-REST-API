const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const slugify = require("slugify");
const geocoder = require("../utils/geocoder");

const BootcampSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a name"], // This is how to add a custom message when attribute is not satisfied
      unique: true,
      trim: true, // Remove whitespace
      maxLength: [50, "Name cannot be more than 50 characters"],
    },
    slug: String, // Last part of the URL
    description: {
      type: String,
      required: [true, "Please add a description"],
      maxlength: [500, "Description cannot be more than 500 characters"],
    },
    website: {
      type: String,
      match: [
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
        "Please use a valid URL with HTTP or HTTPS",
      ], // match is the attribute for field validation (I.e., URL Regex)
    },
    phone: {
      type: String,
      maxlength: [20, "Phone number can not be longer than 20 characters"],
    },
    email: {
      type: String,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please add a valid email",
      ],
    },
    address: {
      type: String,
      required: [true, "Please add an address"],
    },
    location: {
      // GeoJSON Point for searching location via a map API
      type: {
        type: String,
        enum: ["Point"], // Ensure that location can only take on "Point" and nothing else
      },
      coordinates: {
        type: [Number], // type is an array of numbers
        index: "2dsphere",
      },
      formattedAddress: String,
      street: String,
      city: String,
      state: String,
      zipcode: String,
      country: String,
    },
    careers: {
      // Array of strings
      type: [String],
      required: true,
      enum: [
        "Web Development",
        "Mobile Development",
        "UI/UX",
        "Data Science",
        "Business",
        "Other",
      ], // Ensure that career can only take on these values,
    },
    averageRating: {
      type: Number,
      min: [1, "Rating must be at least 1"],
      max: [10, "Rating must can not be more than 10"],
    },
    averageCost: Number,
    photo: {
      type: String,
      default: "no-photo.jpg",
    },
    housing: {
      type: Boolean,
      default: false,
    },
    jobAssistance: {
      type: Boolean,
      default: false,
    },
    jobGuarantee: {
      type: Boolean,
      default: false,
    },
    acceptGi: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  // Setting up virtuals, which is used by mongoose to create a field in the Bootcamp schema that can be manipulated dynamically and not be persisted in the database
  // This is needed to get all courses in a bootcamp when we search for a bootcamp document
  // NOTE: Course model has a reference to bootcamp, but not the other way around. Hence, we need to rely on virtuals to dynamically get courses when we search for bootcamps
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Use mongoose pre middleware to add a slug from the name field before saving the document
BootcampSchema.pre("save", function (next) {
  this.slug = slugify(this.name, { lower: true }); // Inside a mongoose middleware, "this" refers to the current document
  next();
});

// Use mongoose pre middleware to geocode and create location field
BootcampSchema.pre("save", async function (next) {
  try {
    const loc = await geocoder.geocode(this.address); // See node-geocoder documentation on how to use geocoder
    this.location = {
      type: "Point",
      coordinates: [loc[0].longitude, loc[0].latitude], // Get lng and lat from loc
      formattedAddress: loc[0].formattedAddress,
      street: loc[0].streetName,
      city: loc[0].city,
      state: loc[0].stateCode,
      zipcode: loc[0].zipcode,
      country: loc[0].countryCode,
    };
    // Do not save address in DB since we have formattedAddress now
    this.address = undefined;
    next();
  } catch (e) {
    next(e);
  }
});

// Use mongoose pre middleware to cascade delete courses when a bootcamp is deleted (bootcamps has a 1-to-many r/s with courses)
// NOTE: "deleteOne" is registered as a query middleware by default, hence this refers to the query and not the document
// NOTE: To register "deleteOne" as a document middleware so that we can access the bootcamp document using "this", we pass in the second argument
BootcampSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (next) {
    console.log(`Courses being removed from bootcamp ${this._id}`);
    await mongoose.model("Course").deleteMany({ bootcamp: this._id }); // Remove all courses from this bootcamp
    next();
  }
);

// Reverse populating courses into bootcamps with virtuals
// Bootcamp will have a dynamically calculated field called "courses" populated with the Course fields if we use .populate() when finding a bootcamp document
BootcampSchema.virtual("courses", {
  ref: "Course", // Reference model
  localField: "_id", // Foreign key of this model that we want to use to reference the other model
  foreignField: "bootcamp", // Field in the reference model that is the same as our foreign key
  justOne: false, // Return populated fields as an arrray
});

module.exports = mongoose.model("Bootcamp", BootcampSchema, "bootcamps");
