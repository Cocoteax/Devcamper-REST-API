const { modelNames } = require("mongoose");

// advancedResults accepts a model and populate field, and returns a middleware function
// The purpose of this middleware is to get pagination, filter, select fields, etc
const advancedResults = (model, populate) => {
  return async (req, res, next) => {
    try {
      let query; // Used to hold the actual mongodb operation

      // Copy req.query
      const reqQuery = { ...req.query };

      // Fields to exclude from reqQuery for special operations
      // E.g.: If we don't exclude "select", then it'll be used as a value for filtering in .find() below
      const removeFields = ["select", "sort", "page", "limit"];
      removeFields.forEach((param) => delete reqQuery[param]);

      // If reqQuery has mongodb operators, then we create mongodb operators by appending $
      let queryStr = JSON.stringify(reqQuery);
      queryStr = queryStr.replace(
        /\b(gt|gte|lt|lte|in)\b/g,
        (match) => `$${match}`
      );

      // Use the passed in model to call .find() and pass req.query object into find() to automatically filter for us
      // NOTE: query is just a promise that hasn't been executed yet => This allows us to chain on other methods if needed before executing query
      query = model.find(JSON.parse(queryStr));

      // Select fields
      if (req.query.select) {
        const fields = req.query.select.split(",").join(" ");
        query = query.select(fields); // Chain on .select() to query to include only required fields
      }

      // Sort fields
      if (req.query.sort) {
        const sortBy = req.query.sort.split(",").join(" ");
        query.sort(sortBy);
      } else {
        // Default sort by creation date and name
        query = query.sort({ createdAt: -1, name: -1 });
      }

      // Set up pagination => page specifies what page to navigate to, limit specifies how many results gets returned
      // E.g.: page=2&limit=30 means each page has 30 resource, and we want to navigate to page 2
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 25;
      const startIndex = (page - 1) * limit; // Overall index of the starting document in that specified page
      const endIndex = page * limit; // Ending index of document in the specified page
      const total = await model.find(JSON.parse(queryStr)).countDocuments();
      query = query.skip(startIndex).limit(limit); // .skip() specifies number of documents to skip, .limit() specifies max number of documents to return

      // If there is a populate argument passed into the middleware, populate accordingly
      if (populate) {
        query = query.populate(populate);
      }

      // Execute query
      const results = await query;

      // Pagination result
      let pagination = {};
      // If there are still results in next page
      if (endIndex < total) {
        pagination.next = {
          page: page + 1,
          limit: limit,
        };
      }
      // If there is a previous page
      if (page > 1) {
        pagination.prev = {
          page: page - 1,
          limit: limit,
        };
      }

      // Store the advanced results into res object, which can then be accessed by other middlewares through res object (See bootcamp.js controller)
      res.advancedResults = {
        success: true,
        count: results.length,
        pagination: pagination,
        data: results,
      };
      next();
    } catch (e) {
      next(e);
    }
  };
};

module.exports = advancedResults;
