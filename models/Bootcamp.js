const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const slugify = require("slugify");
const geocoder = require("../utils/geocoder");

const BootcampSchema = new Schema({
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
});

// Use mongoose pre middleware to add a slug from the name field before saving the document
BootcampSchema.pre("save", function (next) {
  this.slug = slugify(this.name, { lower: true }); // Inside a mongoose middleware, "this" refers to the current document
  next();
});

// Use mongoose pre middleware to geocode and create location field
BootcampSchema.pre("save", async function (next) {
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
});

module.exports = mongoose.model("Bootcamp", BootcampSchema, "bootcamps");
