const sendErrorDev = (error, request, response) => {
  return response.status(error.statusCode).json({
    status: error.status,
    error: error,
    message: error.message,
    stack: error.stack,
  });
};

// dev用とproduction用で分ける。
export const handleErrors = (error, request, response, next) => {
  error.statusCode = error.statusCode || 500;
  error.status = error.status || 'error';
  if (process.env.NODE_ENV === 'dev') {
    return response.status(error.statusCode).json({
      status: error.status,
      message: error.message,
      stack: error.stack,
    });
  }
};
