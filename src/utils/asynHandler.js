// In this we use Promise and then

const asyncHandler = (func) => {
  (req, res, next) => {
    Promise.resolve(func(req, res, next)).catch((err) => {
      res.status(err.code || 500).json({
        success: false,
        message: err.message,
      });
    });
  };
};

// this is one way to wrappe any function in async and await

/*
const asyncHandler = (func) => async (req, res, next) => {
  try {
    await func(req, res, next);
  } catch (err) {
    res.status(err.code || 500).json({
      success: true,
      message: err.message,
    });
  }
};
*/
export default asyncHandler;
