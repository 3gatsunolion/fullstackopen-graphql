const { GraphQLError } = require("graphql");

const formatMongooseError = (error, invalidArgs = null) => {
  // Validation errors
  if (error.name === "ValidationError") {
    const validationErrors = Object.values(error.errors).map((err) => ({
      field: err.path,
      message: err.message,
    }));

    return new GraphQLError("Validation failed.", {
      extensions: {
        code: "BAD_USER_INPUT",
        invalidArgs,
        validationErrors,
      },
    });
  }

  // Duplicate field error
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue || {})[0];
    const value = error.keyValue?.[field];

    return new GraphQLError(`Duplicate value for ${field}.`, {
      extensions: {
        code: "BAD_USER_INPUT",
        invalidArgs: { [field]: value },
        duplicateField: field,
        message: `${field} "${value}" already exists.`,
      },
    });
  }

  // Fallback
  return new GraphQLError("Something wrong happened.", {
    extensions: {
      code: "INTERNAL_SERVER_ERROR",
    },
  });
};

module.exports = { formatMongooseError };
