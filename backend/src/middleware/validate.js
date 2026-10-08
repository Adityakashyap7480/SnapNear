import ApiError from '../utils/ApiError.js';

const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const fieldErrors = result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    return next(ApiError.badRequest(fieldErrors[0]?.message || 'Invalid request', fieldErrors));
  }
  req[source === 'body' ? 'body' : 'validatedQuery'] = result.data;
  return next();
};

export default validate;
