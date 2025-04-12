const { httpRequestHandler, events } = require('./lib/handle-request');

/**
 * This is the entry point for the Freshworks FDK serverless app.
 * We're using client-side API calls to Claude, so this is minimal.
 */
exports = {
  events: events,
  
  // Request handler for serverless invocation
  requestHandler: async function(args) {
    const { type } = args;
    
    // Handle the HTTP request
    if (type === 'httpRequest') {
      return await httpRequestHandler(args.data);
    }
    
    // Default response for unsupported request types
    return {
      status: 400,
      response: JSON.stringify({
        message: 'Unsupported request type'
      })
    };
  }
}; 